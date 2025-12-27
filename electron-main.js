
const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const crypto = require('crypto');
const RobloxInjector = require('./injector');

// --- SECURITY & STEALTH CONFIGURATION ---

// Generate random process name to look like a system process
const randomProcessName = () => {
  const names = ['ServiceHost', 'RuntimeBroker', 'TaskHostW', 'ApplicationFrameHost', 'Discord', 'Chrome'];
  return names[Math.floor(Math.random() * names.length)];
};

// 1. Process Hiding & Anti-Detection Switches
app.setName(randomProcessName());
app.setPath('userData', path.join(app.getPath('appData'), `.${crypto.randomBytes(8).toString('hex')}`));

app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('no-sandbox'); // Required for some native deps in main, but renderer is sandboxed
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-metrics');
app.commandLine.appendSwitch('disable-dev-tools');

if (process.platform === 'win32') {
    app.commandLine.appendSwitch('high-dpi-support', '1');
    app.commandLine.appendSwitch('force-device-scale-factor', '1');
}

let mainWindow;

// --- ENCRYPTION HELPERS ---
const sessionKey = crypto.randomBytes(32);
const sessionIV = crypto.randomBytes(16);

function decryptPayload(encryptedHex) {
    try {
        const split = encryptedHex.split(':');
        if(split.length !== 2) return null;
        const iv = Buffer.from(split[0], 'hex');
        const content = split[1];
        const decipher = crypto.createDecipheriv('aes-256-cbc', sessionKey, iv);
        let decrypted = decipher.update(content, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    } catch (e) {
        console.error("Decryption failed:", e);
        return null;
    }
}

// --- MAIN WINDOW CREATION ---
async function createWindow() {
  await session.defaultSession.clearCache();
  
  mainWindow = new BrowserWindow({
    width: 1280, // Increased size
    height: 800, // Increased size
    minWidth: 960, // Minimum prevent breaking layout
    minHeight: 600,
    frame: false,
    resizable: true, // Enabled resizing
    backgroundColor: '#0d0d0f',
    title: "Roblox Player", // Fake Title
    icon: path.join(__dirname, 'assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,    // CRITICAL SECURITY: Disable Node in Renderer
      contextIsolation: true,    // CRITICAL SECURITY: Isolate Context
      sandbox: true,             // CRITICAL SECURITY: Enable Sandbox
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: !app.isPackaged
    }
  });

  // Anti-Screenshot (Content Protection)
  mainWindow.setContentProtection(true);

  // Send encryption keys to preload (In production, use a more secure handshake)
  mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send('init-session', { 
          key: sessionKey.toString('hex'), 
          iv: sessionIV.toString('hex') 
      });
  });

  const startUrl = !app.isPackaged ? 'http://localhost:5173' : `file://${path.join(__dirname, 'dist', 'index.html')}`;
  mainWindow.loadURL(startUrl);

  // Clean exit
  mainWindow.on('closed', () => { mainWindow = null; });
}

// --- APP LIFECYCLE ---
app.whenReady().then(async () => {
    // Basic Anti-Debug Check
    if (RobloxInjector.isDebuggerPresent()) {
        console.error("Debugger detected. Terminating...");
        app.quit();
        return;
    }
    await createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- SECURE IPC HANDLERS ---

// Window Controls
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow?.maximize();
    }
});
ipcMain.on('window-close', () => mainWindow?.close());

// Cache mechanism for processes
let processCache = [];
let lastProcessFetch = 0;

// 1. Get Bundled DLL Path (Internal)
ipcMain.handle('get-bundled-dll', async () => {
    // Simulate an internal path. In production, this file should exist in resources.
    return path.join(__dirname, 'assets', 'flux-core-engine.dll');
});

// 2. Select File (Deprecated for user, kept for advanced dev mode)
ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'DLL Files', extensions: ['dll'] }]
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    
    const fs = require('fs');
    const stat = fs.statSync(result.filePaths[0]);
    return {
        path: result.filePaths[0],
        name: path.basename(result.filePaths[0]),
        size: (stat.size / 1024).toFixed(2) + ' KB'
    };
});

// 3. Get Processes (With Caching)
ipcMain.handle('get-processes', async () => {
    const now = Date.now();
    // Return cache if requested within 2 seconds and we have data
    if (now - lastProcessFetch < 2000 && processCache.length > 0) {
        return processCache;
    }
    
    const processes = await RobloxInjector.getProcessList();
    
    // Only update cache if we got results, otherwise keep old cache to prevent empty UI
    if (processes.length > 0) {
        processCache = processes;
        lastProcessFetch = now;
    } else if (processCache.length === 0) {
        // If cache is empty and we got nothing (e.g. startup), return a fallback
        return []; 
    }
    
    return processCache;
});

// 4. Inject DLL (Encrypted Payload)
ipcMain.handle('inject-dll', async (event, encryptedPayload) => {
    const data = decryptPayload(encryptedPayload);
    if (!data || !data.pid || !data.dllPath) return { success: false, error: "Invalid Payload or Decryption Failed" };
    
    // Simulate randomness to evade heuristics
    await new Promise(r => setTimeout(r, Math.random() * 2000 + 500));

    try {
        const result = await RobloxInjector.inject(data.pid, data.dllPath);
        return result;
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// 5. Execute Script (Encrypted Payload)
ipcMain.handle('execute-script', async (event, encryptedPayload) => {
    const data = decryptPayload(encryptedPayload);
    if (!data || !data.script) return { success: false, error: "Invalid Payload or Decryption Failed" };

    try {
        await RobloxInjector.executeScript(data.script);
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// 6. Get Platform
ipcMain.handle('get-platform', () => process.platform);
