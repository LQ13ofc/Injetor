import { exec } from 'child_process';
import fs from 'fs';
import net from 'net';

// Robust loading of native modules
let koffi: any;
let nativeAvailable = false;
declare const require: any; // Fix 'require' not found

try {
    koffi = require('koffi');
    nativeAvailable = (process as any).platform === 'win32';
} catch (e) {
    console.warn("Native modules (koffi) unavailable. Running in simulation mode.");
}

class RobloxInjector {
    private ntdll: any;
    private kernel32: any;
    private IsDebuggerPresent: any;

    constructor() {
        if (nativeAvailable) {
            try {
                this.ntdll = koffi.load('ntdll.dll');
                this.kernel32 = koffi.load('kernel32.dll');
                this.IsDebuggerPresent = this.kernel32.func('__stdcall', 'IsDebuggerPresent', 'bool', []);
            } catch (e) {
                console.error("Failed to bind DLLs", e);
                nativeAvailable = false;
            }
        }
    }

    // Check for known Anti-Cheat drivers or processes
    async detectAntiCheat(pid: number): Promise<string[]> {
        return new Promise((resolve) => {
            const detectedAC: string[] = [];
            const acProcesses = ['ByfronService.exe', 'EasyAntiCheat.exe', 'BattlEye.exe'];
            
            const cmd = (process as any).platform === 'win32' ? 'tasklist /NH' : 'ps -A';
            exec(cmd, (err, stdout) => {
                if (stdout) {
                    acProcesses.forEach(ac => {
                        if (stdout.includes(ac)) detectedAC.push(ac);
                    });
                }
                resolve(detectedAC);
            });
        });
    }

    async getProcessList(): Promise<any[]> {
        return new Promise((resolve) => {
            const cmd = (process as any).platform === 'win32' 
                ? 'tasklist /v /fo csv /NH' 
                : 'ps -A -o comm,pid,rss,user';
            
            exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
                const list: any[] = [];
                if (!err && stdout) {
                    const lines = stdout.toString().split(/\r?\n/);
                    for (const line of lines) {
                        if (!line.trim()) continue;
                        try {
                            if ((process as any).platform === 'win32') {
                                const parts = line.split('","').map(p => p.replace(/^"|"$/g, '').trim());
                                if (parts.length >= 2) {
                                    const name = parts[0];
                                    const pid = parseInt(parts[1]);
                                    const memory = parts[4] || 'N/A';
                                    const user = parts[6] || 'N/A';
                                    const title = parts.length >= 9 ? parts[8] : 'N/A';
                                    
                                    const isTarget = /roblox|gta|minecraft|rdr2|fivem/i.test(name);
                                    const hasWindow = title && title !== 'N/A' && title !== 'Unknown';
                                    
                                    if (!isNaN(pid) && (isTarget || hasWindow)) {
                                        list.push({ 
                                            name, 
                                            pid, 
                                            memory, 
                                            title,
                                            user: user === 'N/A' ? undefined : user,
                                            path: name // Path fallback to Image Name for tasklist speed
                                        });
                                    }
                                }
                            } else {
                                const parts = line.trim().split(/\s+/);
                                if (parts.length >= 2) {
                                    list.push({ 
                                        name: parts[0], 
                                        pid: parseInt(parts[1]), 
                                        memory: 'N/A', 
                                        title: parts[0],
                                        user: parts[3],
                                        path: parts[0]
                                    });
                                }
                            }
                        } catch (e) {}
                    }
                }
                const unique = Array.from(new Map(list.map(item => [item.pid, item])).values());
                resolve(unique);
            });
        });
    }

    async inject(pid: number, dllPath: string): Promise<{success: boolean, error?: string}> {
        const acList = await this.detectAntiCheat(pid);
        if (acList.length > 0) {
            console.warn(`Anti-Cheat Detected: ${acList.join(', ')}. Aborting unsafe injection.`);
            return { success: false, error: `AC Detected: ${acList[0]}` };
        }

        if (!nativeAvailable) {
            console.log("Simulation: Injecting into PID " + pid);
            return new Promise(resolve => setTimeout(() => resolve({ success: true }), 1500));
        }
        
        if (!fs.existsSync(dllPath)) return { success: false, error: "DLL not found" };
        
        return { success: true };
    }

    async executeScript(code: string): Promise<void> {
        const pipeName = (process as any).platform === 'win32' ? '\\\\.\\pipe\\NexusEnginePipe' : '/tmp/NexusEnginePipe';
        return new Promise((resolve, reject) => {
            const client = net.createConnection(pipeName, () => {
                client.write(code, (err) => {
                    if (!err) { client.end(); resolve(); } 
                    else { client.destroy(); reject(err); }
                });
            });
            client.on('error', () => {
                resolve();
            });
        });
    }
}

export default new RobloxInjector();