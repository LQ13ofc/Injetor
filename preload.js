
const { contextBridge, ipcRenderer } = require('electron');
const crypto = require('crypto');

let sessionKey = null;
let sessionIV = null;

// Initialize session keys from main process
ipcRenderer.on('init-session', (event, data) => {
    sessionKey = Buffer.from(data.key, 'hex');
    sessionIV = Buffer.from(data.iv, 'hex');
});

function encryptPayload(data) {
    if (!sessionKey || !sessionIV) {
        console.warn("Session not initialized, insecure payload");
        return null; // Or throw error in strict mode
    }
    const json = JSON.stringify(data);
    const cipher = crypto.createCipheriv('aes-256-cbc', sessionKey, sessionIV);
    let encrypted = cipher.update(json, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return sessionIV.toString('hex') + ':' + encrypted;
}

// Secure API exposed to window
contextBridge.exposeInMainWorld('fluxAPI', {
    getPlatform: () => ipcRenderer.invoke('get-platform'),
    getProcesses: () => ipcRenderer.invoke('get-processes'),
    selectFile: () => ipcRenderer.invoke('select-file'),
    
    inject: async (pid, dllPath, settings) => {
        const payload = encryptPayload({ pid, dllPath, settings });
        return ipcRenderer.invoke('inject-dll', payload);
    },
    
    executeScript: async (script) => {
        const payload = encryptPayload({ script });
        return ipcRenderer.invoke('execute-script', payload);
    },
    
    onLog: (callback) => ipcRenderer.on('log-entry', (event, data) => callback(data)),
    onPhaseUpdate: (callback) => ipcRenderer.on('injection-phase-update', (event, phase) => callback(phase)),
    
    // Anti-Tamper check
    version: '4.3.0-SECURE'
});
