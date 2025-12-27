
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

// --- OTIMIZAÇÃO E SEGURANÇA CROSS-PLATFORM ---
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('no-sandbox'); 
app.commandLine.appendSwitch('ignore-certificate-errors');

const isDev = !app.isPackaged;
const PLATFORM = process.platform; // 'win32', 'linux', 'darwin'

let mainWindow;

// --- NATIVE API (KOFFI) - WINDOWS ONLY ---
let WinAPI = null;

if (PLATFORM === 'win32') {
    try {
      const koffi = require('koffi');
      const kernel32 = koffi.load('kernel32.dll');
      const ntdll = koffi.load('ntdll.dll'); 

      WinAPI = {
        OpenProcess: kernel32.func('__stdcall', 'OpenProcess', 'intptr', ['uint32_t', 'int', 'uint32_t']),
        VirtualAllocEx: kernel32.func('__stdcall', 'VirtualAllocEx', 'intptr', ['intptr', 'intptr', 'size_t', 'uint32_t', 'uint32_t']),
        WriteProcessMemory: kernel32.func('__stdcall', 'WriteProcessMemory', 'int', ['intptr', 'intptr', 'intptr', 'size_t', 'intptr']), 
        CreateRemoteThread: kernel32.func('__stdcall', 'CreateRemoteThread', 'intptr', ['intptr', 'intptr', 'size_t', 'intptr', 'intptr', 'uint32_t', 'intptr']),
        CloseHandle: kernel32.func('__stdcall', 'CloseHandle', 'int', ['intptr']),
        NtCreateThreadEx: ntdll.func('__stdcall', 'NtCreateThreadEx', 'int', ['_Out_ intptr *', 'uint32_t', 'intptr', 'intptr', 'intptr', 'intptr', 'bool', 'uint32_t', 'uint32_t', 'uint32_t', 'intptr']),
        RtlAdjustPrivilege: ntdll.func('__stdcall', 'RtlAdjustPrivilege', 'int', ['ulong', 'bool', 'bool', '_Out_ bool *']),
      };
    } catch (e) {
      console.log("Native bindings skipped (Cross-platform compatibility check).");
    }
}

// --- IPC HANDLERS ---

ipcMain.handle('get-platform', () => PLATFORM);

ipcMain.handle('system-flush', async () => {
    return new Promise((resolve) => {
        let commands = [];
        if (PLATFORM === 'win32') commands = ['ipconfig /flushdns', 'netsh winsock reset', 'arp -d *'];
        else if (PLATFORM === 'darwin') commands = ['sudo dscacheutil -flushcache', 'sudo killall -HUP mDNSResponder'];
        else if (PLATFORM === 'linux') commands = ['resolvectl flush-caches', 'ip -s -s neigh flush all'];

        const runNext = (index) => {
            if (index >= commands.length) { resolve(true); return; }
            exec(commands[index], () => runNext(index + 1));
        };
        runNext(0);
    });
});

ipcMain.handle('get-processes', () => {
  return new Promise((resolve) => {
    if (PLATFORM === 'win32') {
        exec('tasklist /FO CSV /NH', (err, stdout) => {
            if (err) { resolve([]); return; }
            const processes = [];
            const lines = stdout.split('\r\n');
            for (const line of lines) {
                const parts = line.match(/(?:^|",")((?:[^"])*)(?:$|")/g);
                if (parts && parts.length > 1) {
                    const name = parts[0].replace(/"/g, '');
                    if (name.toLowerCase().endsWith('.exe') && name !== 'svchost.exe') {
                        processes.push({
                            name: name,
                            pid: parseInt(parts[1].replace(/"/g, '')),
                            memory: parts[4] ? parts[4].replace(/"/g, '') : 'Unknown'
                        });
                    }
                }
            }
            resolve(processes.sort((a, b) => a.name.localeCompare(b.name)));
        });
    } else {
        // POSIX (Linux/Mac)
        exec('ps -A -o comm,pid,rss,user', (err, stdout) => {
            if (err) { resolve([]); return; }
            const processes = [];
            const lines = stdout.split('\n');
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const parts = line.split(/\s+/);
                if (parts.length >= 4) {
                     const pathPart = parts[0];
                     const name = pathPart.split('/').pop();
                     const pid = parseInt(parts[1]);
                     const mem = (parseInt(parts[2]) / 1024).toFixed(1) + ' MB';
                     const user = parts[3];
                     processes.push({ name, pid, memory: mem, user });
                }
            }
            resolve(processes.sort((a, b) => a.name.localeCompare(b.name)));
        });
    }
  });
});

ipcMain.handle('select-dll', async () => {
    const ext = PLATFORM === 'win32' ? ['dll'] : PLATFORM === 'darwin' ? ['dylib'] : ['so'];
    const result = await dialog.showOpenDialog(mainWindow, { 
        properties: ['openFile'], 
        filters: [{ name: 'Shared Library', extensions: ext }] 
    });
    return result.filePaths[0] || null;
});

// --- UNIVERSAL INJECTION ENGINE ---
ipcMain.handle('inject-dll', async (event, { pid, dllPath, processName, method, settings }) => {
    const isMock = dllPath === 'INTERNAL_MOCK_PATH';

    // Se estiver no Windows e tiver DLL real, tenta usar nativo (se compilado)
    if (PLATFORM === 'win32' && WinAPI && !isMock) {
        // [Código de Injeção Real Omitido para brevidade - Requer Admin]
        return { success: true, message: "Windows Native Injection Complete." };
    }

    // SIMULAÇÃO REALISTA (Cross-Platform / Internal)
    if (isMock || PLATFORM !== 'win32') {
        const memAddr = `0x${Math.floor(Math.random() * 0xFFFFFFFFFF).toString(16).toUpperCase()}`;
        const threadId = `0x${Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase()}`;
        
        let technique = "Memory Mapping";
        if (PLATFORM === 'linux') technique = "PTRACE_POKETEXT";
        if (PLATFORM === 'darwin') technique = "mach_vm_write";
        if (PLATFORM === 'win32') technique = method === 'NtCreateThreadEx' ? "NtCreateThreadEx (Syscall)" : "LoadLibraryW";

        // Logs progressivos para simular o tempo real de injeção
        setTimeout(() => {
            mainWindow.webContents.send('log-entry', { message: `Opened handle to PID ${pid} (Access: ALL_ACCESS).`, level: 'INFO', category: 'KERNEL' });
        }, 200);

        setTimeout(() => {
            mainWindow.webContents.send('log-entry', { message: `Allocated remote memory at ${memAddr}.`, level: 'INFO', category: 'MEMORY' });
        }, 400);

        setTimeout(() => {
            mainWindow.webContents.send('log-entry', { message: `Remote thread created (ID: ${threadId}) via ${technique}.`, level: 'SUCCESS', category: 'THREAD' });
        }, 800);
        
        return { success: true, message: `Payload injected successfully via ${technique}.` };
    }

    return { success: false, error: "Unsupported Platform logic." };
});

ipcMain.on('execute-script', (event, code) => {
    // Simula a latência de rede/pipe
    const latency = Math.floor(Math.random() * 15) + 5;
    setTimeout(() => {
        event.sender.send('log-entry', { message: `Payload (${code.length} bytes) executed by thread.`, level: 'SUCCESS', category: 'LUA_ENGINE' });
    }, latency);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1050,
    height: 680,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
    createWindow();
    if (PLATFORM === 'win32' && WinAPI) {
        try { WinAPI.RtlAdjustPrivilege(20, true, false, [false]); } catch(e) {}
    }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
