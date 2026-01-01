import { contextBridge, ipcRenderer } from 'electron';

const api = {
  // Controle de Janela
  minimize: () => ipcRenderer.send('window-control', 'minimize'),
  toggleMaximize: () => ipcRenderer.send('window-control', 'maximize'),
  close: () => ipcRenderer.send('window-control', 'close'),

  // Sistema e Injeção
  getProcesses: () => ipcRenderer.invoke('get-processes'),
  getBundledDLL: () => ipcRenderer.invoke('get-bundled-dll'),
  
  // Envia configurações completas para o backend decidir a estratégia
  inject: (pid: number, dllPath: string, settings: any) => 
    ipcRenderer.invoke('inject-dll', { pid, dllPath, settings }),
    
  executeScript: (code: string) => ipcRenderer.invoke('execute-script', code),

  // Watchdog
  startWatchdog: (pid: number) => ipcRenderer.send('start-watchdog', pid),
  onTargetDied: (callback: (pid: number) => void) => 
    ipcRenderer.on('target-died', (_, pid) => callback(pid)),

  // Eventos de Engine
  onPhaseUpdate: (callback: (phase: number) => void) => 
    ipcRenderer.on('injection-phase-update', (_, phase) => callback(phase)),
    
  selectFile: async () => null // Removido dialog nativo por simplicidade, usando lógica automática
};

contextBridge.exposeInMainWorld('fluxAPI', api);