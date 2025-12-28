import { contextBridge, ipcRenderer } from 'electron';

const api = {
  // Window Controls
  minimize: () => ipcRenderer.send('window-minimize'),
  toggleMaximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // System
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  getProcesses: () => ipcRenderer.invoke('get-processes'),
  selectFile: () => ipcRenderer.invoke('select-file'),
  getBundledDLL: () => ipcRenderer.invoke('get-bundled-dll'),

  // Core
  inject: (pid: number, dllPath: string, settings: any) => 
    ipcRenderer.invoke('inject', { pid, dllPath, settings }),

  executeScript: (script: string) => 
    ipcRenderer.invoke('execute-script', { script }),

  // Events
  onLog: (callback: (data: any) => void) => 
    ipcRenderer.on('log-entry', (_, data) => callback(data)),
  onPhaseUpdate: (callback: (phase: number) => void) => 
    ipcRenderer.on('injection-phase-update', (_, phase) => callback(phase)),
    
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings')
};

contextBridge.exposeInMainWorld('fluxAPI', api);