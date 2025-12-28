
import { contextBridge, ipcRenderer } from 'electron';
import { AppSettings, LogEntry } from '../types';

contextBridge.exposeInMainWorld('fluxAPI', {
    getPlatform: () => ipcRenderer.invoke('get-platform'),
    getProcesses: () => ipcRenderer.invoke('get-processes'),
    getBundledDLL: () => ipcRenderer.invoke('get-bundled-dll'),
    
    // Window Controls
    minimize: () => ipcRenderer.send('window-minimize'),
    toggleMaximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),

    // Operations
    inject: async (pid: number, dllPath: string, settings: AppSettings) => {
        const payload = JSON.stringify({ pid, dllPath, settings });
        return ipcRenderer.invoke('inject-dll', payload);
    },
    
    executeScript: async (script: string) => {
        const payload = JSON.stringify({ script });
        return ipcRenderer.invoke('execute-script', payload);
    },
    
    // Settings Persistence
    saveSettings: async (settings: AppSettings) => {
        return ipcRenderer.invoke('save-settings', settings);
    },
    loadSettings: async () => {
        return ipcRenderer.invoke('load-settings');
    },

    // Listeners
    onLog: (callback: (data: LogEntry) => void) => {
        ipcRenderer.on('log-entry', (_, data) => callback(data));
    },
    onPhaseUpdate: (callback: (phase: number) => void) => {
        ipcRenderer.on('injection-phase-update', (_, phase) => callback(phase));
    },
    
    version: '5.0.0-SECURE'
});
