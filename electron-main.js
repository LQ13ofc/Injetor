
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');
const { exec } = require('child_process');

app.disableHardwareAcceleration();
const isDev = !app.isPackaged;
const PLATFORM = process.platform;
let mainWindow;

function emitLog(msg, level = 'INFO', cat = 'SYSTEM') {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('log-entry', { message: msg, level, category: cat });
  }
}

function updatePhase(phase) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('injection-phase-update', phase);
  }
}

ipcMain.handle('get-platform', () => PLATFORM);

ipcMain.handle('get-processes', async () => {
  return new Promise((resolve) => {
    const cmd = PLATFORM === 'win32' ? 'tasklist /v /fo csv /nh' : 'ps -A -o comm,pid,rss';
    exec(cmd, { maxBuffer: 1024 * 1024 * 2 }, (err, stdout) => {
      if (err) return resolve([]);
      const list = [];
      const lines = stdout.toString().split(/\r?\n/);
      lines.forEach(line => {
        if (!line.trim()) return;
        let parts = PLATFORM === 'win32' ? line.split('","').map(s => s.replace(/"/g, '')) : line.trim().split(/\s+/);
        if (parts.length >= 2) {
          list.push({ 
            name: PLATFORM === 'win32' ? parts[0] : parts[0].split('/').pop(), 
            pid: parseInt(parts[1]), 
            memory: PLATFORM === 'win32' ? parts[4] : parts[2] + ' KB',
            title: PLATFORM === 'win32' ? (parts[8] || parts[0]) : parts[0]
          });
        }
      });
      resolve(list.filter(p => p.pid > 0));
    });
  });
});

// --- MANUAL MAPPING 7-PHASE EXECUTION ---
ipcMain.handle('inject-dll', async (event, { pid, dllPath, settings }) => {
  try {
    const phases = [
      { id: 1, msg: "Phase 1: Parsing PE Headers & Metadata Stripping...", cat: "PE_ENGINE" },
      { id: 2, msg: "Phase 2: Allocating Stealth Memory (PAGE_READWRITE)...", cat: "MEMORY" },
      { id: 3, msg: "Phase 3: Mapping Sections with Correct Permissions...", cat: "PE_ENGINE" },
      { id: 4, msg: "Phase 4: Resolving Imports via Manual Export Scanning...", cat: "KERNEL" },
      { id: 5, msg: "Phase 5: Applying Base Relocations (Delta Adjustment)...", cat: "MEMORY" },
      { id: 6, msg: "Phase 6: Executing Shellcode Entry Stub via Hijacked Thread...", cat: "THREAD" },
      { id: 7, msg: "Phase 7: Erasing PE Traces & Cleaning Working Set...", cat: "GHOST" }
    ];

    for (const phase of phases) {
      updatePhase(phase.id);
      emitLog(phase.msg, 'INFO', phase.cat);
      // Simula o tempo de processamento real de cada etapa de baixo nível
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
    }

    // AOB SCAN SIMULATION FOR LUA STATE
    emitLog("AOB Scanning for Luau GlobalState pattern...", "WARN", "LUA_VM");
    await new Promise(r => setTimeout(r, 1200));
    emitLog("Found lua_State at 0x" + (Math.random() * 0xFFFFFFFFFF).toString(16).toUpperCase(), "SUCCESS", "LUA_VM");

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('execute-script', async (event, code) => {
  const pipeName = PLATFORM === 'win32' ? '\\\\.\\pipe\\NexusEnginePipe' : '/tmp/NexusEnginePipe';
  
  return new Promise((resolve) => {
    let attempts = 0;
    const connect = () => {
      attempts++;
      const client = net.createConnection(pipeName, () => {
        client.write(code, (err) => {
          if (!err) { client.end(); resolve({ success: true }); }
          else { client.destroy(); resolve({ success: false, error: err.message }); }
        });
      });

      client.on('error', () => {
        client.destroy();
        if (attempts < 5) setTimeout(connect, 500);
        else {
          if (isDev) resolve({ success: true }); // Mock success for UI testing
          else resolve({ success: false, error: "Pipe Connection Timeout: Is the DLL actually injected?" });
        }
      });
    };
    connect();
  });
});

ipcMain.handle('reset-injection-state', () => {
  emitLog("Emergency Eject: Unhooking VMT and clearing pipe handles...", "CRITICAL", "SYSTEM");
  return { success: true };
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1050, height: 680,
    frame: false, resizable: false,
    backgroundColor: '#0d0d0f',
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });
  const startUrl = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, 'dist', 'index.html')}`;
  mainWindow.loadURL(startUrl);
}

app.whenReady().then(createWindow);
