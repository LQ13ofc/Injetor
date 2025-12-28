import { app, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import Injector from './injector';
import { InjectionPayload, ScriptPayload, AppSettings } from '../types';

// Mock Encryption for demonstration
const decryptPayload = (data: any) => data; 

ipcMain.handle('get-platform', () => (process as any).platform);

ipcMain.handle('get-bundled-dll', async () => {
    // Handle differences between Dev and Prod paths
    const basePath = process.env.NODE_ENV === 'development' 
        ? path.join((process as any).cwd(), 'assets') 
        : path.join((process as any).resourcesPath, 'assets');
    return path.join(basePath, 'flux-core-engine.dll');
});

ipcMain.handle('get-processes', async () => {
    return await Injector.getProcessList();
});

ipcMain.handle('inject-dll', async (_, encryptedPayload: string) => {
    const data = decryptPayload(JSON.parse(encryptedPayload)) as InjectionPayload;
    if (!data || !data.pid) return { success: false, error: "Invalid payload" };
    
    try {
        return await Injector.inject(data.pid, data.dllPath);
    } catch (e: any) {
        return { success: false, error: e.message };
    }
});

ipcMain.handle('execute-script', async (_, encryptedPayload: string) => {
    const data = decryptPayload(JSON.parse(encryptedPayload)) as ScriptPayload;
    if (!data || !data.script) return { success: false, error: "Invalid payload" };
    
    try {
        await Injector.executeScript(data.script);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
});

ipcMain.handle('save-settings', async (_, settings: AppSettings) => {
    try {
        const userDataPath = app.getPath('userData');
        const settingsPath = path.join(userDataPath, 'settings.json');
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        return true;
    } catch (e) {
        console.error("Failed to save settings:", e);
        return false;
    }
});

ipcMain.handle('load-settings', async () => {
    try {
        const userDataPath = app.getPath('userData');
        const settingsPath = path.join(userDataPath, 'settings.json');
        if (fs.existsSync(settingsPath)) {
            const data = fs.readFileSync(settingsPath, 'utf-8');
            return JSON.parse(data);
        }
        return null;
    } catch (e) {
        console.error("Failed to load settings:", e);
        return null;
    }
});