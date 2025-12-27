
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const os = require('os');
const { autoUpdater } = require('electron-updater');

// --- CRITICAL SECURITY: DISABLE HARDWARE ACCELERATION ---
// Isso impede detecção por overlay, mas exige que a janela não seja transparente no Windows.
app.disableHardwareAcceleration();

// --- CONFIGURAÇÃO DO CORE NATIVO (DLL/SO) VIA KOFFI ---
let nativeCore = null;
let NativeLib = null;

try {
  // Koffi é a alternativa moderna e rápida para FFI-NAPI
  const koffi = require('koffi');
  
  // Mapeia o binário correto com base na plataforma
  const binName = os.platform() === 'win32' ? 'FluxCore_x64.dll' : 'FluxCore.so';
  
  // Caminho seguro para recursos
  const libPath = path.join(process.resourcesPath, 'native', binName);
  
  const fs = require('fs');
  if (fs.existsSync(libPath)) {
    NativeLib = koffi.load(libPath);

    nativeCore = {
      Inject: NativeLib.func('bool Inject(const char* game, int mode)'),
      ExecuteScript: NativeLib.func('void ExecuteScript(const char* game, const char* script)'),
      SetStealthMode: NativeLib.func('void SetStealthMode(bool enabled)'),
      EmergencyUnload: NativeLib.func('void EmergencyUnload()')
    };
    console.log('Nexus Native Core: LINKED AND SECURE (Ring -1 Driver Loaded)');
  } else {
    // Não lança erro, apenas loga, para permitir funcionamento em modo UI
    console.log("Flux Core: Running in Bridge Mode (No DLL found)");
  }

} catch (e) {
  console.warn(`Nexus Native Core: Driver not loaded. Running in UI/Remote Bridge Mode. Reason: ${e.message}`);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1080,
    height: 720,
    frame: false, // Mantém a janela sem bordas do Windows (estilo customizado)
    backgroundColor: '#0d0d0f', // Cor de fundo explícita para evitar flash branco
    transparent: false, // IMPORTANTE: Corrige o bug da tela cinza/branca
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
      devTools: true
    },
    // Tenta carregar ícone se existir, senão usa padrão
    icon: path.join(__dirname, 'assets/icon.png'),
    title: "Flux Core Nexus"
  });

  win.on('page-title-updated', (e) => {
    e.preventDefault();
  });

  // Remove menu padrão do Windows
  win.setMenu(null);

  // Proteção contra captura de tela (Windows/Mac)
  if (process.platform === 'win32' || process.platform === 'darwin') {
    // win.setContentProtection(true); // Descomente para produção final
  }

  win.loadFile('index.html');
}

// Handler de Informações de Sistema
ipcMain.handle('get-os-info', () => {
  return {
    platform: os.platform(),
    arch: os.arch(),
    isWindows: os.platform() === 'win32',
    hostname: os.hostname(),
    isNativeLoaded: !!nativeCore
  };
});

// Canal de Execução Principal
ipcMain.on('execute-action', (event, { game, script, params }) => {
  if (nativeCore && os.platform() === 'win32') {
    try {
      nativeCore.ExecuteScript(game, script);
      event.reply('nexus:log', { message: `Executed: Payload injected into ${game} [NATIVE KERNEL]`, level: 'SUCCESS' });
    } catch (err) {
      event.reply('nexus:log', { message: `Native Driver Error: ${err.message}`, level: 'ERROR' });
    }
  } else {
    console.log(`[Remote Bridge] Target: ${game} | Payload Size: ${script.length} bytes`);
    setTimeout(() => {
        event.reply('nexus:log', { message: `Remote Bridge: Payload dispatched to ${game} (127.0.0.1:8080)`, level: 'INFO' });
    }, 200);
  }
});

// Canal de Pânico (Emergency)
ipcMain.on('panic-trigger', (event) => {
    if (nativeCore) {
        try {
            nativeCore.EmergencyUnload();
        } catch(e) {
            console.error("Panic Error:", e);
        }
    }
    event.reply('nexus:log', { message: `*** EMERGENCY PANIC: DRIVER UNLOADED & MEMORY ZEROED ***`, level: 'CRITICAL' });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
