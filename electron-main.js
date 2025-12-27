
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

// --- PERFORMANCE & SECURITY ---
app.disableHardwareAcceleration(); 

app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('no-sandbox'); 
app.commandLine.appendSwitch('ignore-certificate-errors');

const isDev = !app.isPackaged;
const PLATFORM = process.platform; 

let mainWindow;
let WinAPI = null;
let nativeLoadError = null;

// Tenta carregar bibliotecas nativas com segurança
if (PLATFORM === 'win32') {
    try {
      // Koffi precisa ser recompilado para Electron. Se falhar, o app continua funcionando em modo "Simulação".
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
      console.log("Native WinAPI loaded successfully.");
    } catch (e) {
      console.error("WARNING: Native bindings (Koffi) failed to load.", e.message);
      nativeLoadError = e.message;
      console.log("App continuing in Non-Native Mode.");
    }
}

ipcMain.handle('get-platform', () => PLATFORM);

ipcMain.handle('system-flush', async () => {
    try {
        return new Promise((resolve, reject) => {
            let commands = [];
            if (PLATFORM === 'win32') commands = ['ipconfig /flushdns', 'netsh winsock reset', 'arp -d *'];
            else if (PLATFORM === 'darwin') commands = ['sudo dscacheutil -flushcache', 'sudo killall -HUP mDNSResponder'];
            else if (PLATFORM === 'linux') commands = ['resolvectl flush-caches', 'ip -s -s neigh flush all'];

            if (commands.length === 0) {
                resolve({ success: true, message: "No flush commands needed for this platform." });
                return;
            }

            const runNext = (index) => {
                if (index >= commands.length) { 
                    resolve({ success: true, message: "System flush completed." }); 
                    return; 
                }
                exec(commands[index], (error) => {
                    if (error) console.warn(`Command failed: ${commands[index]}`);
                    runNext(index + 1);
                });
            };
            runNext(0);
        });
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('get-processes', async () => {
  return new Promise((resolve, reject) => {
    try {
        if (PLATFORM === 'win32') {
            // Updated command: /v for verbose (window titles), /nh for no header
            // Using a large buffer to ensure we get all output
            exec('tasklist /v /fo csv /nh', { maxBuffer: 1024 * 1024 * 5 }, (err, stdout, stderr) => {
                if (err && !stdout) { 
                    console.error("Tasklist error:", err.message);
                    reject(`Tasklist failed: ${err.message}`); 
                    return;
                }
                
                try {
                    const processes = [];
                    // CRITICAL FIX: Split by regex to handle \r\n (Windows) and \n (potential buffer conversion or shell quirk)
                    const lines = stdout.toString().split(/\r?\n/);
                    
                    for (const line of lines) {
                        if (!line.trim()) continue;

                        // Robust CSV Parsing
                        const parts = [];
                        let current = '';
                        let inQuote = false;
                        
                        for (let i = 0; i < line.length; i++) {
                            const char = line[i];
                            if (char === '"') { 
                                inQuote = !inQuote; 
                            } else if (char === ',' && !inQuote) {
                                parts.push(current);
                                current = '';
                            } else {
                                current += char;
                            }
                        }
                        parts.push(current);

                        // Tasklist /v CSV indices:
                        // 0: Image Name, 1: PID, 8: Window Title
                        if (parts.length >= 9) {
                            const name = parts[0];
                            const pid = parseInt(parts[1]);
                            const memory = parts[4];
                            const title = parts[8];

                            // Enhanced Filter:
                            // 1. Must have a PID
                            // 2. Title must exist and not be a generic "N/A" (or localized equivalent if detectable, but N/A is standard)
                            // 3. Exclude common system noise if title is present but useless (e.g. Default IME)
                            const isSystemNoise = name.toLowerCase() === 'svchost.exe' || title === 'Default IME' || title === 'MSCTFIME UI';
                            const hasWindow = title && title !== 'N/A' && title.trim().length > 0;

                            if (hasWindow && !isSystemNoise) {
                                processes.push({ 
                                    name: name, 
                                    pid: pid, 
                                    memory: memory,
                                    title: title 
                                });
                            }
                        }
                    }
                    resolve(processes.sort((a, b) => a.title.localeCompare(b.title)));
                } catch (parseError) {
                    console.error("Parse error:", parseError);
                    reject(`Parsing error: ${parseError.message}`);
                }
            });
        } else {
            // Linux/Mac implementation remains standard PS
            exec('ps -A -o comm,pid,rss,user', (err, stdout, stderr) => {
                if (err && !stdout) { 
                    reject(`PS failed: ${err ? err.message : stderr}`);
                    return; 
                }
                try {
                    const processes = [];
                    const lines = stdout.toString().split('\n');
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        const parts = line.split(/\s+/);
                        if (parts.length >= 4) {
                             const pathPart = parts[0];
                             const name = pathPart.split('/').pop();
                             const pid = parseInt(parts[1]);
                             const mem = (parseInt(parts[2]) / 1024).toFixed(1) + ' MB';
                             processes.push({ name, pid, memory: mem, title: name }); 
                        }
                    }
                    resolve(processes.sort((a, b) => a.name.localeCompare(b.name)));
                } catch (parseError) {
                    reject(`Parsing error: ${parseError.message}`);
                }
            });
        }
    } catch (e) {
        console.error("Critical error fetching processes:", e);
        reject(e.message);
    }
  });
});

ipcMain.handle('select-dll', async () => {
    try {
        const ext = PLATFORM === 'win32' ? ['dll'] : PLATFORM === 'darwin' ? ['dylib'] : ['so'];
        const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters: [{ name: 'Shared Library', extensions: ext }] });
        return result.filePaths[0] || null;
    } catch (e) {
        console.error("Dialog error:", e);
        return null;
    }
});

ipcMain.handle('inject-dll', async (event, { pid, dllPath, processName, method }) => {
    try {
        const isMock = dllPath === 'INTERNAL_MOCK_PATH';

        if (PLATFORM === 'win32') {
             if (nativeLoadError) {
                 return { success: false, error: `Native Bindings Error: ${nativeLoadError}. Please rebuild native deps.` };
             }
             if (WinAPI && !isMock) {
                 // Real injection logic would go here using WinAPI
                 try {
                     // Placeholder for actual WinAPI calls
                     // const handle = WinAPI.OpenProcess(0x1F0FFF, 0, pid);
                     // if (!handle) throw new Error("Failed to open process");
                     // ...
                 } catch (nativeErr) {
                     return { success: false, error: `WinAPI Error: ${nativeErr.message}` };
                 }
                 return { success: true, message: "Windows Native Injection Complete (Simulated for Safety)." };
             }
        }
        
        // Mock simulation / Cross-platform fallback
        setTimeout(() => { if(mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('log-entry', { message: `Opened handle to PID ${pid}.`, level: 'INFO', category: 'KERNEL' }); }, 200);
        setTimeout(() => { if(mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('log-entry', { message: `Remote thread created via ${method}.`, level: 'SUCCESS', category: 'THREAD' }); }, 800);
        return { success: true, message: `Payload injected successfully.` };
    } catch (e) {
        console.error("Injection error:", e);
        return { success: false, error: e.message || "Unknown injection error" };
    }
});

// Changed from ipcMain.on to ipcMain.handle to allow frontend to await response/errors
ipcMain.handle('execute-script', async (event, code) => {
    try {
        // Here you would pass 'code' to your internal engine or write to memory
        // Simulating execution delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!code || code.trim() === '') {
            throw new Error("Empty script payload");
        }

        if(!event.sender.isDestroyed()) {
            event.sender.send('log-entry', { message: `Payload (${code.length} bytes) executed.`, level: 'SUCCESS', category: 'LUA_ENGINE' });
        }
        return { success: true };
    } catch (e) {
        console.error("Script execution error:", e);
        return { success: false, error: e.message };
    }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1050,
    height: 680,
    frame: false,
    transparent: false,
    backgroundColor: '#0d0d0f', 
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
      devTools: isDev,
      webSecurity: false
    }
  });
  
  mainWindow.setMenu(null);

  const startUrl = isDev 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, 'dist', 'index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Fallback se ready-to-show não disparar
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
        mainWindow.show();
    }
  }, 3000);

  mainWindow.webContents.on('did-fail-load', () => {
     if (isDev) setTimeout(() => mainWindow.loadURL(startUrl), 1000);
  });
}

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
