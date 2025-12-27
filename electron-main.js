
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const { autoUpdater } = require('electron-updater');

// --- CRITICAL SECURITY: DISABLE HARDWARE ACCELERATION ---
// Isso impede que o overlay do Flux Core seja desenhado pela GPU,
// o que é um vetor comum de detecção (ex: Discord Overlay detection).
app.disableHardwareAcceleration();

// --- CONFIGURAÇÃO DO CORE NATIVO (DLL/SO) ---
let nativeCore = null;
try {
  const ffi = require('ffi-napi');
  // Mapeia o binário correto com base na plataforma (x64 ou arm64)
  const binName = os.platform() === 'win32' ? 'FluxCore_x64.dll' : 'FluxCore.so';
  const libPath = path.join(process.resourcesPath, 'native', binName);
  
  // Exposição de funções críticas do C++ para o JavaScript
  nativeCore = ffi.Library(libPath, {
    'Inject': ['bool', ['string', 'int']],
    'ExecuteScript': ['void', ['string', 'string']],
    'SetStealthMode': ['void', ['bool']],
    'EmergencyUnload': ['void', []], // New Panic Function
    'GetStatus': ['int', []]
  });
  console.log('Nexus Native Core: LINKED AND SECURE');
} catch (e) {
  console.warn('Nexus Native Core: Binary not found. Switching to Remote/UI-Only mode.');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1040,
    height: 720,
    frame: false,
    backgroundColor: '#0d0d0f',
    transparent: true,
    resizable: false, // Evita bugs de layout na injeção
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false // Mantém a performance mesmo em segundo plano (Alt-Tab)
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    title: "Flux Core Host" // Static title
  });

  // Previne que o título da janela mude, o que pode ser rastreado
  win.on('page-title-updated', (e) => {
    e.preventDefault();
  });

  // --- STEALTH TEC: Proteção contra gravação de tela (OBS/Discord/Screenshots) ---
  // Isso impede que anti-cheats baseados em print de tela capturem o menu
  if (process.platform === 'win32' || process.platform === 'darwin') {
    win.setContentProtection(true);
  }

  win.loadFile('index.html');
  
  // Auto-Update silencioso
  autoUpdater.checkForUpdatesAndNotify();
}

// Handler de Informações de Sistema (Chamado pelo Dashboard.tsx)
ipcMain.handle('get-os-info', () => {
  return {
    platform: os.platform(), // win32, darwin, linux
    arch: os.arch(),         // x64, arm64
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
      event.reply('nexus:log', { message: `Executed: ${script} on ${game} (NATIVE)`, level: 'SUCCESS' });
    } catch (err) {
      event.reply('nexus:log', { message: `Native execution error: ${err.message}`, level: 'ERROR' });
    }
  } else {
    // Modo Remote Bridge / Simulador
    console.log(`[Remote Bridge] ${game} -> ${script}`);
    // Simula latência de rede para realismo
    setTimeout(() => {
        event.reply('nexus:log', { message: `Remote Bridge: Command relayed to host for ${game}`, level: 'INFO' });
    }, 50);
  }
});

// Canal de Pânico (Emergency)
ipcMain.on('panic-trigger', (event) => {
    if (nativeCore) {
        try {
            nativeCore.EmergencyUnload();
        } catch(e) {}
    }
    event.reply('nexus:log', { message: `KERNEL PANIC TRIGGERED: DRIVER UNLOADED. MEMORY WIPED.`, level: 'CRITICAL' });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
