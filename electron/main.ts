import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { InjectorService } from './services/injector.service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow | null = null;
const injector = new InjectorService();

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

  // Watchdog: Monitora o processo alvo
  // Fix: Use any type to avoid "Cannot find namespace 'NodeJS'" error
  let watchdogInterval: any;
  ipcMain.on('start-watchdog', (event, pid: number) => {
    if (watchdogInterval) clearInterval(watchdogInterval);
    watchdogInterval = setInterval(async () => {
      const isAlive = await injector.checkProcessAlive(pid);
      if (!isAlive) {
        clearInterval(watchdogInterval);
        mainWindow?.webContents.send('target-died', pid);
      }
    }, 2000);
  });

  mainWindow.on('closed', () => {
    clearInterval(watchdogInterval);
    mainWindow = null;
  });
}

// IPC Handlers Unificados
ipcMain.on('window-control', (e, action) => {
  if (!mainWindow) return;
  if (action === 'minimize') mainWindow.minimize();
  if (action === 'maximize') mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  if (action === 'close') app.quit();
});

ipcMain.handle('get-processes', () => injector.getProcessList());
ipcMain.handle('inject-dll', (e, { pid, dllPath, settings }) => injector.inject(pid, dllPath, settings));
ipcMain.handle('execute-script', (e, code) => injector.executeScript(code));
ipcMain.handle('get-bundled-dll', () => {
  // Fix: Cast process to any to access Electron-specific resourcesPath property
  return app.isPackaged 
    ? path.join((process as any).resourcesPath, 'assets', 'flux-core-engine.dll')
    : path.join(__dirname, '../../resources/assets/flux-core-engine.dll');
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Fix: Cast process to any to access platform property
  if ((process as any).platform !== 'darwin') app.quit();
});
