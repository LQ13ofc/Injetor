import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import crypto from 'crypto';
import './ipc-handlers';

// Fix TS errors for __dirname
declare const __dirname: string;

const isDev = process.env.NODE_ENV === 'development';

const randomProcessName = () => {
  const names = ['ServiceHost', 'RuntimeBroker', 'TaskHostW', 'ApplicationFrameHost', 'Discord', 'Chrome'];
  return names[Math.floor(Math.random() * names.length)];
};

app.setName(randomProcessName());
// Set user data to random path to avoid detection traces
app.setPath('userData', path.join(app.getPath('appData'), `.${crypto.randomBytes(8).toString('hex')}`));

app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('no-sandbox');

let mainWindow: BrowserWindow | null = null;

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
      // Point to the compiled preload script relative to dist/main/
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true, // CRITICAL: Security Fix
      sandbox: true,
      devTools: isDev
    }
  });

  mainWindow.setContentProtection(true);

  // CRITICAL SECURITY: Prevent navigation to external sites
  mainWindow.webContents.on('will-navigate', (event, url) => {
      if (url !== mainWindow?.webContents.getURL()) {
          event.preventDefault();
          console.warn(`Blocked navigation to: ${url}`);
      }
  });

  // CRITICAL SECURITY: Block new window creation
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      console.warn(`Blocked new window: ${url}`);
      return { action: 'deny' };
  });

  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Point to the compiled renderer output
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Window Controls
  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-maximize', () => {
      if (mainWindow?.isMaximized()) mainWindow.unmaximize();
      else mainWindow?.maximize();
  });
  ipcMain.on('window-close', () => mainWindow?.close());
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if ((process as any).platform !== 'darwin') app.quit();
});

export { mainWindow };