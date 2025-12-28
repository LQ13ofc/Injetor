const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// IMPORTANT: Ensure the module is required from the correct relative path
// Using try-catch to allow app to start even if bindings fail (fallback simulation)
let RobloxInjector;
try {
    RobloxInjector = require('./injector.js');
} catch (e) {
    console.error("Failed to load injector module:", e);
    // Fallback Mock
    RobloxInjector = {
        isDebuggerPresent: () => false,
        getProcessList: () => Promise.resolve([]),
        inject: () => Promise.resolve({ success: false, error: "Module Load Failed" }),
        executeScript: () => Promise.resolve({ success: false, error: "Module Load Failed" })
    };
}

const randomProcessName = () => {
  const names = ['ServiceHost', 'RuntimeBroker', 'TaskHostW', 'ApplicationFrameHost', 'Discord', 'Chrome'];
  return names[Math.floor(Math.random() * names.length)];
};

app.setName(randomProcessName());
app.setPath('userData', path.join(app.getPath('appData'), `.${crypto.randomBytes(8).toString('hex')}`));

app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('no-sandbox');

let mainWindow;

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
        return null;
    }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    frame: false,
    resizable: true,
    backgroundColor: '#0d0d0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: !app.isPackaged
    }
  });

  mainWindow.setContentProtection(true);

  mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send('init-session', { 
          key: sessionKey.toString('hex'), 
          iv: sessionIV.toString('hex') 
      });
  });

  const startUrl = !app.isPackaged ? 'http://localhost:5173' : `file://${path.join(__dirname, 'dist', 'index.html')}`;
  mainWindow.loadURL(startUrl);
}

app.whenReady().then(async () => {
    if (RobloxInjector.isDebuggerPresent()) {
        app.quit();
        return;
    }
    await createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
});
ipcMain.on('window-close', () => mainWindow?.close());

ipcMain.handle('get-bundled-dll', async () => {
    return path.join(process.resourcesPath, 'assets', 'flux-core-engine.dll');
});

ipcMain.handle('get-processes', async () => {
    return await RobloxInjector.getProcessList();
});

ipcMain.handle('inject-dll', async (event, encryptedPayload) => {
    const data = decryptPayload(encryptedPayload);
    if (!data) return { success: false, error: "Security mismatch" };
    try {
        return await RobloxInjector.inject(data.pid, data.dllPath);
    } catch (e) {
        return { success: false, error: e.message };
    }
});

ipcMain.handle('execute-script', async (event, encryptedPayload) => {
    const data = decryptPayload(encryptedPayload);
    if (!data) return { success: false, error: "Security mismatch" };
    try {
        await RobloxInjector.executeScript(data.script);
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

ipcMain.handle('get-platform', () => process.platform);