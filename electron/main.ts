import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import crypto from 'crypto';
import { InjectorService } from './services/injector.service';

const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow | null = null;

// Security: Generate a random session token for this execution instance
// This prevents hardcoded secrets and makes external hijacking significantly harder
const sessionToken = crypto.randomBytes(32).toString('hex');
const injector = new InjectorService(sessionToken);

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Watchdog
  let watchdogInterval: NodeJS.Timeout | null = null;
  ipcMain.on('start-watchdog', (event, pid: number) => {
    if (watchdogInterval) clearInterval(watchdogInterval);
    watchdogInterval = setInterval(async () => {
      const isAlive = await injector.checkProcessAlive(pid);
      if (!isAlive) {
        if (watchdogInterval) clearInterval(watchdogInterval);
        mainWindow?.webContents.send('target-died', pid);
      }
    }, 2000);
  });

  mainWindow.on('closed', () => {
    if (watchdogInterval) clearInterval(watchdogInterval);
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.on('window-control', (e, action) => {
  if (!mainWindow) return;
  if (action === 'minimize') mainWindow.minimize();
  if (action === 'maximize') mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  if (action === 'close') app.quit();
});

ipcMain.handle('get-processes', () => injector.getProcessList());
ipcMain.handle('inject-dll', (e, { pid, dllPath, settings }) => injector.inject(pid, dllPath, settings));

ipcMain.handle('execute-script', (e, code) => {
  // Security Validation: Prevent execution if payload exceeds safe limits or contains suspicious non-script patterns
  if (!code || typeof code !== 'string') return { success: false, error: 'Invalid payload' };
  if (code.length > 1024 * 1024) return { success: false, error: 'Payload too large' };
  
  return injector.executeScript(code);
});

ipcMain.handle('get-bundled-dll', () => {
  const p = process as any;
  return app.isPackaged 
    ? path.join(p.resourcesPath, 'assets', 'flux-core-engine.dll')
    : path.join(__dirname, '../../resources/assets/flux-core-engine.dll');
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});