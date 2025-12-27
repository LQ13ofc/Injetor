
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const net = require('net');

// OTIMIZAÇÃO: Desativa aceleração para evitar detecção por overlay hooks de GPU
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('no-sandbox'); 

const isDev = !app.isPackaged;
let mainWindow;
let pipeServer;
let connectedSocket = null;
let titleInterval = null;

// --- STEALTH: TÍTULOS FALSIFICADOS ---
const FAKE_TITLES = [
  "Service Host: Local System",
  "NVIDIA Container",
  "Runtime Broker",
  "Desktop Window Manager",
  "Windows Audio Endpoint Builder",
  "Antimalware Service Executable"
];

const DISGUISE_NAMES = [
    "DirectX_Overlay.dll",
    "NVIDIA_Share.dll",
    "DiscordHook64.dll",
    "Steam_Overlay_x64.dll",
    "msvcp140_code.dll"
];

// --- NATIVE API (KOFFI) ---
let WinAPI = null;

try {
  const koffi = require('koffi');
  
  // Bibliotecas
  const kernel32 = koffi.load('kernel32.dll');
  const advapi32 = koffi.load('advapi32.dll');
  const ntdll = koffi.load('ntdll.dll'); 

  // Structs
  const LUID = koffi.struct('LUID', { LowPart: 'uint32_t', HighPart: 'int32_t' });
  const LUID_AND_ATTRIBUTES = koffi.struct('LUID_AND_ATTRIBUTES', { Luid: LUID, Attributes: 'uint32_t' });
  const TOKEN_PRIVILEGES = koffi.struct('TOKEN_PRIVILEGES', { PrivilegeCount: 'uint32_t', Privileges: [LUID_AND_ATTRIBUTES, 1] });

  WinAPI = {
    // Process Management
    OpenProcess: kernel32.func('__stdcall', 'OpenProcess', 'intptr', ['uint32_t', 'int', 'uint32_t']),
    VirtualAllocEx: kernel32.func('__stdcall', 'VirtualAllocEx', 'intptr', ['intptr', 'intptr', 'size_t', 'uint32_t', 'uint32_t']),
    VirtualFreeEx: kernel32.func('__stdcall', 'VirtualFreeEx', 'int', ['intptr', 'intptr', 'size_t', 'uint32_t']),
    WriteProcessMemory: kernel32.func('__stdcall', 'WriteProcessMemory', 'int', ['intptr', 'intptr', 'intptr', 'size_t', 'intptr']), 
    CreateRemoteThread: kernel32.func('__stdcall', 'CreateRemoteThread', 'intptr', ['intptr', 'intptr', 'size_t', 'intptr', 'intptr', 'uint32_t', 'intptr']),
    
    // Module Management
    GetModuleHandleA: kernel32.func('__stdcall', 'GetModuleHandleA', 'intptr', ['str']),
    GetProcAddress: kernel32.func('__stdcall', 'GetProcAddress', 'intptr', ['intptr', 'str']),
    CloseHandle: kernel32.func('__stdcall', 'CloseHandle', 'int', ['intptr']),
    IsWow64Process: kernel32.func('__stdcall', 'IsWow64Process', 'int', ['intptr', '_Out_ int *']),
    GetCurrentProcess: kernel32.func('__stdcall', 'GetCurrentProcess', 'intptr', []),
    GetLastError: kernel32.func('__stdcall', 'GetLastError', 'uint32_t', []),

    // Privilege & Tokens
    OpenProcessToken: advapi32.func('__stdcall', 'OpenProcessToken', 'int', ['intptr', 'uint32_t', '_Out_ intptr *']),
    LookupPrivilegeValueA: advapi32.func('__stdcall', 'LookupPrivilegeValueA', 'int', ['str', 'str', '_Out_ LUID *']),
    AdjustTokenPrivileges: advapi32.func('__stdcall', 'AdjustTokenPrivileges', 'int', ['intptr', 'int', '_In_ TOKEN_PRIVILEGES *', 'uint32_t', 'intptr', 'intptr']),
    
    // NT Internal (Stealth)
    RtlAdjustPrivilege: ntdll.func('__stdcall', 'RtlAdjustPrivilege', 'int', ['ulong', 'bool', 'bool', '_Out_ bool *']),
    NtCreateThreadEx: ntdll.func('__stdcall', 'NtCreateThreadEx', 'int', ['_Out_ intptr *', 'uint32_t', 'intptr', 'intptr', 'intptr', 'intptr', 'bool', 'uint32_t', 'uint32_t', 'uint32_t', 'intptr']),
  };
} catch (e) {
  console.error("FATAL: Koffi Native Bindings failed to load. Ensure Visual C++ Redistributable is installed.", e);
}

// --- PRIVILEGE ESCALATION ---
const enableDebugPrivilege = () => {
    if (!WinAPI) return false;
    try {
        let enabled = [false];
        // 20 = SeDebugPrivilege (Permite abrir processos de outros usuários/sistema)
        const status = WinAPI.RtlAdjustPrivilege(20, true, false, enabled);
        return status === 0;
    } catch (e) { return false; }
};

// --- REAL BYPASS FUNCTIONS ---

// 1. Time Stomping (OpSec)
const performTimeStomping = (filePath) => {
    try {
        // Define data para 01/01/2021 para enganar scans de arquivos recentes
        const fakeTime = new Date('2021-01-01T12:00:00Z');
        fs.utimesSync(filePath, fakeTime, fakeTime);
        return true;
    } catch (e) {
        return false;
    }
};

// --- IPC HANDLERS ---

ipcMain.handle('check-admin', () => {
    try {
        exec('net session', { stdio: 'ignore' });
        return true;
    } catch (e) { return false; }
});

ipcMain.handle('system-flush', async () => {
    return new Promise((resolve) => {
        const commands = [
            'ipconfig /flushdns',
            'netsh winsock reset',
            'arp -d *'
        ];
        
        const runNext = (index) => {
            if (index >= commands.length) { resolve(true); return; }
            exec(commands[index], () => runNext(index + 1));
        };
        runNext(0);
    });
});

ipcMain.handle('get-processes', () => {
  return new Promise((resolve) => {
    exec('tasklist /FO CSV /NH', (err, stdout) => {
      if (err) { resolve([]); return; }
      const processes = [];
      const lines = stdout.split('\r\n');
      for (const line of lines) {
         const parts = line.match(/(?:^|",")((?:[^"])*)(?:$|")/g);
         if (parts && parts.length > 1) {
            const name = parts[0].replace(/"/g, '');
            if (name.toLowerCase().endsWith('.exe')) {
                processes.push({
                    name: name,
                    pid: parseInt(parts[1].replace(/"/g, '')),
                    memory: parts[4] ? parts[4].replace(/"/g, '') : '0 K'
                });
            }
         }
      }
      resolve(processes.sort((a, b) => a.name.localeCompare(b.name)));
    });
  });
});

ipcMain.handle('select-dll', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { 
    properties: ['openFile'], 
    filters: [{ name: 'DLL Files', extensions: ['dll'] }] 
  });
  return result.filePaths[0] || null;
});

// --- ENGINE DE INJEÇÃO V11.0 (REAL) ---
ipcMain.handle('inject-dll', async (event, { pid, dllPath, processName, method, settings }) => {
  if (!WinAPI) return { success: false, error: "Drivers nativos não carregados." };
  if (!fs.existsSync(dllPath)) return { success: false, error: "DLL não encontrada." };
  
  const SYSTEM_PROTECTED = ['csrss.exe', 'smss.exe', 'wininit.exe', 'services.exe', 'lsass.exe', 'System'];
  if (SYSTEM_PROTECTED.includes(processName)) return { success: false, error: "Acesso negado: Processo Crítico do Sistema." };

  let hProcess = 0;
  let pRemoteMem = 0;
  let hThread = 0;
  let ghostPath = null;

  try {
    // 1. GHOST MODE & TIME STOMPING (REAL)
    let finalPath = dllPath;
    if (settings && settings.ghostMode) {
        const tempDir = os.tmpdir();
        const disguiseName = DISGUISE_NAMES[Math.floor(Math.random() * DISGUISE_NAMES.length)];
        ghostPath = path.join(tempDir, disguiseName);
        
        try {
            fs.copyFileSync(dllPath, ghostPath);
            performTimeStomping(ghostPath); // Altera data de criação
            finalPath = ghostPath;
            console.log(`[OpSec] DLL Masqueraded as: ${disguiseName}`);
        } catch(e) {
            console.error("Ghost copy failed, using original.");
        }
    }

    // 2. OPEN PROCESS
    // 0x1F0FFF = PROCESS_ALL_ACCESS
    hProcess = WinAPI.OpenProcess(0x1F0FFF, 0, pid);
    if (!hProcess) throw new Error(`Falha ao abrir processo (PID: ${pid}). Tente como Admin.`);

    // 3. ARCHITECTURE CHECK
    let isWow64 = [0];
    if (WinAPI.IsWow64Process(hProcess, isWow64)) {
         if (isWow64[0]) throw new Error("Erro de Arquitetura: Alvo é 32-bit (x86), Injector é 64-bit.");
    }

    // 4. PREPARE PAYLOAD (UNICODE vs ANSI)
    let pathBuffer;
    let loadLibName;
    
    // Se o método for LoadLibraryW (Wide/Unicode) ou se Stealth Mode (NtCreateThreadEx) for usado
    // NtCreateThreadEx com LoadLibraryW é a combinação mais furtiva.
    if (method === 'LoadLibraryW' || settings.stealthMode) {
        // UTF-16LE conversion for Windows Wide Char
        pathBuffer = Buffer.from(finalPath + '\0', 'utf16le');
        loadLibName = "LoadLibraryW";
    } else {
        // ANSI
        pathBuffer = Buffer.from(finalPath + '\0', 'utf8');
        loadLibName = "LoadLibraryA";
    }

    const pathSize = pathBuffer.length;

    // 5. ALLOCATE MEMORY
    pRemoteMem = WinAPI.VirtualAllocEx(hProcess, 0, pathSize, 0x1000 | 0x2000, 0x04); // MEM_COMMIT|RESERVE, PAGE_READWRITE
    if (!pRemoteMem) throw new Error("Falha na alocação de memória remota.");

    // 6. WRITE MEMORY
    if (!WinAPI.WriteProcessMemory(hProcess, pRemoteMem, pathBuffer, pathSize, 0)) {
        throw new Error("Falha na escrita de memória.");
    }

    // 7. GET THREAD START ADDRESS
    const hKernel32 = WinAPI.GetModuleHandleA("kernel32.dll");
    const pLoadLibrary = WinAPI.GetProcAddress(hKernel32, loadLibName);
    
    if (!pLoadLibrary) throw new Error(`Falha ao encontrar endereço de ${loadLibName}`);

    // 8. EXECUTE (BYPASS METHODS)
    if (method === 'NtCreateThreadEx' || settings.stealthMode) {
        // NtCreateThreadEx é uma syscall de baixo nível que muitas vezes passa despercebida por ganchos de UserMode
        let hThreadOut = [0];
        // Flags: 0x1FFFFF (THREAD_ALL_ACCESS)
        const status = WinAPI.NtCreateThreadEx(hThreadOut, 0x1FFFFF, 0, hProcess, pLoadLibrary, pRemoteMem, false, 0, 0, 0, 0);
        if (status !== 0) throw new Error(`NtCreateThreadEx falhou. NTSTATUS: ${status}`);
        hThread = hThreadOut[0];
    } else {
        // Standard (CRT)
        hThread = WinAPI.CreateRemoteThread(hProcess, 0, 0, pLoadLibrary, pRemoteMem, 0, 0);
        if (!hThread) throw new Error(`CreateRemoteThread falhou. Erro: ${WinAPI.GetLastError()}`);
    }

    // 9. MEMORY CLEANER (ANTI-SCAN)
    if (settings && settings.memoryCleaner) {
        // Sobrescreve o path da DLL na memória do jogo com zeros após 2.5s
        // Isso impede que scanners de string encontrem o caminho do arquivo injetado na memória
        setTimeout(() => {
            if (hProcess && pRemoteMem) {
                try {
                    const zeros = Buffer.alloc(pathSize, 0);
                    WinAPI.WriteProcessMemory(hProcess, pRemoteMem, zeros, pathSize, 0);
                    WinAPI.VirtualFreeEx(hProcess, pRemoteMem, 0, 0x8000); // MEM_RELEASE
                    // Só fechamos o handle do processo aqui se o cleaner rodou
                    WinAPI.CloseHandle(hProcess);
                } catch(e) {}
            }
        }, 2500);
        // Evita fechar no finally se o cleaner está agendado
        hProcess = 0; 
    }

    // 10. GHOST CLEANUP
    if (ghostPath) {
        // Deleta arquivo temporário após 5s
        setTimeout(() => {
            try { if (fs.existsSync(ghostPath)) fs.unlinkSync(ghostPath); } catch(e) {}
        }, 5000);
    }

    return { success: true, message: `Injetado via ${loadLibName} com sucesso.` };

  } catch (err) {
    if (pRemoteMem && hProcess) WinAPI.VirtualFreeEx(hProcess, pRemoteMem, 0, 0x8000);
    return { success: false, error: err.message };
  } finally {
    if (hThread) WinAPI.CloseHandle(hThread);
    if (hProcess) WinAPI.CloseHandle(hProcess);
  }
});

ipcMain.on('update-settings', (event, settings) => {
    if (settings.windowTitleRandomization) {
        if (!titleInterval) {
            titleInterval = setInterval(() => {
                if(mainWindow && !mainWindow.isDestroyed()) {
                    const base = FAKE_TITLES[Math.floor(Math.random() * FAKE_TITLES.length)];
                    mainWindow.setTitle(base);
                }
            }, 5000);
        }
    } else {
        if (titleInterval) clearInterval(titleInterval);
        titleInterval = null;
    }
});

function startPipeServer() {
  const PIPE_NAME = '\\\\.\\pipe\\FluxCorePipe';
  if (pipeServer) return;
  try {
    pipeServer = net.createServer((s) => {
        connectedSocket = s;
        if(mainWindow) mainWindow.webContents.send('pipe-status', true);
        s.on('end', () => { connectedSocket = null; if(mainWindow) mainWindow.webContents.send('pipe-status', false); });
    });
    pipeServer.listen(PIPE_NAME);
  } catch (e) {}
}

ipcMain.on('execute-script', (e, script) => { if(connectedSocket) connectedSocket.write(script); });

function createWindow() {
  enableDebugPrivilege();
  mainWindow = new BrowserWindow({
    width: 1080, height: 720, frame: false, transparent: true,
    webPreferences: { nodeIntegration: true, contextIsolation: false, devTools: isDev, backgroundThrottling: false }
  });
  if (isDev) mainWindow.loadURL('http://localhost:5173');
  else mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
  startPipeServer();
}

app.whenReady().then(createWindow);
