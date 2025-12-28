import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import './services/injector.service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  (process as any).exit(0);
}

// Global configurations
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0a0a',
    icon: path.join(__dirname, '../../resources/icon.ico'),
    
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      devTools: isDev,
      preload: path.join(__dirname, 'preload.js')
    },
    
    show: false
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Security: Block Navigation
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (isDev) {
      if (!url.startsWith('http://localhost:5173')) {
        e.preventDefault();
      }
    } else {
      if (!url.startsWith('file://')) {
        e.preventDefault();
      }
    }
  });

  // Security: Prevent new windows
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  // Security: Prevent downloads
  mainWindow.webContents.session.on('will-download', (e) => {
    e.preventDefault();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Window Controls IPC
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('window-close', () => app.quit());

// Platform IPC
ipcMain.handle('get-platform', () => (process as any).platform);

// Lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if ((process as any).platform !== 'darwin') {
    app.quit();
  }
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Error Handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  if (!isDev) {
    dialog.showErrorBox('Fatal Error', `Application crashed: ${error.message}`);
    app.quit();
  }
});

export { mainWindow };