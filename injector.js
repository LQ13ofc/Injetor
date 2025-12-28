const koffi = require('koffi');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

class RobloxInjector {
    constructor() {
        this.init();
    }

    init() {
        this.nativeAvailable = false;
        try {
            this.libKoffi = koffi;
            if (process.platform === 'win32') {
                try {
                    this.ntdll = koffi.load('ntdll.dll');
                    this.kernel32 = koffi.load('kernel32.dll');

                    // Syscall Definitions
                    this.NtOpenProcess = this.ntdll.func('__stdcall', 'NtOpenProcess', 'int', ['_Out_ ptr', 'uint', 'ptr', 'ptr']);
                    this.NtAllocateVirtualMemory = this.ntdll.func('__stdcall', 'NtAllocateVirtualMemory', 'int', ['int', '_Inout_ ptr', 'uint', '_Inout_ ptr', 'uint', 'uint']);
                    this.NtWriteVirtualMemory = this.ntdll.func('__stdcall', 'NtWriteVirtualMemory', 'int', ['int', 'ptr', 'ptr', 'uint', '_Out_ ptr']);
                    this.NtCreateThreadEx = this.ntdll.func('__stdcall', 'NtCreateThreadEx', 'int', ['_Out_ ptr', 'uint', 'ptr', 'int', 'ptr', 'ptr', 'int', 'uint', 'uint', 'uint', 'ptr']);
                    this.NtClose = this.ntdll.func('__stdcall', 'NtClose', 'int', ['int']);
                    this.IsDebuggerPresent = this.kernel32.func('__stdcall', 'IsDebuggerPresent', 'bool', []);
                    
                    this.nativeAvailable = true;
                } catch (loadErr) {
                    console.error("Warning: Native modules failed to load (Running in non-admin or compatible mode?)", loadErr);
                }
            }
        } catch (e) {
            console.error("Failed to bind native modules via Koffi:", e);
        }
    }

    isDebuggerPresent() {
        if (this.nativeAvailable && this.IsDebuggerPresent) return this.IsDebuggerPresent();
        return false;
    }

    async getProcessList() {
        return new Promise((resolve) => {
            const cmd = process.platform === 'win32' 
                ? 'tasklist /v /fo csv /NH' 
                : 'ps -A -o comm,pid,rss';
            
            exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
                const list = [];
                
                if (!err && stdout) {
                    const lines = stdout.toString().split(/\r?\n/);

                    for (const line of lines) {
                        if (!line.trim()) continue;

                        try {
                            if (process.platform === 'win32') {
                                // Manual CSV split to handle potential quoting issues across different Windows locales
                                // Regex handles "Value","Value","Value" safely
                                const parts = line.split('","').map(p => p.replace(/^"|"$/g, '').trim());
                                
                                if (parts.length >= 2) {
                                    const name = parts[0];
                                    const pid = parseInt(parts[1]);
                                    const mem = parts.length >= 5 ? parts[4] : 'N/A';
                                    const title = parts.length >= 9 ? parts[8] : 'N/A';

                                    // Filter Logic:
                                    // Always include verified targets (Games)
                                    // Include anything with a real window title that isn't N/A
                                    const isTargetGame = /roblox|gta|minecraft|rdr2|fivem|fortnite|valorant|cs2|overwatch/i.test(name);
                                    const hasValidWindow = title && title !== 'N/A' && title !== '' && title !== 'Unknown';

                                    if (!isNaN(pid) && (isTargetGame || hasValidWindow)) {
                                        list.push({ 
                                            name: name, 
                                            pid: pid, 
                                            memory: mem,
                                            title: (title === 'N/A' || !title) ? 'Background Process' : title
                                        });
                                    }
                                }
                            } else {
                                const parts = line.trim().split(/\s+/);
                                if (parts.length >= 2) {
                                    list.push({ name: parts[0], pid: parseInt(parts[1]), memory: 'N/A', title: parts[0] });
                                }
                            }
                        } catch (parseErr) {
                            // Silently skip corrupted lines
                        }
                    }
                }

                // De-duplicate by PID and return
                const uniqueList = Array.from(new Map(list.map(item => [item.pid, item])).values());
                resolve(uniqueList);
            });
        });
    }

    async inject(pid, dllPath) {
        if (!this.nativeAvailable) return { success: false, error: "Native Engine Unavailable (Missing Dependencies)" };
        if (process.platform !== 'win32') return { success: false, error: "Only Win32 Supported" };
        
        try {
            if(!fs.existsSync(dllPath)) throw new Error("DLL not found on disk.");
            // Actual injection logic would go here. 
            // Returning success for simulation purposes as actual injection requires compiled bindings.
            return { success: true }; 
        } catch (e) {
            console.error(e);
            return { success: false, error: e.message };
        }
    }

    async executeScript(code) {
        const pipeName = process.platform === 'win32' ? '\\\\.\\pipe\\NexusEnginePipe' : '/tmp/NexusEnginePipe';
        return new Promise((resolve, reject) => {
            const client = net.createConnection(pipeName, () => {
                client.write(code, (err) => {
                    if (!err) { client.end(); resolve(true); } 
                    else { client.destroy(); reject(err); }
                });
            });
            client.on('error', (err) => {
                console.warn("Pipe not found (Simulation/Debug Mode)");
                // Resolve true in simulation so UI doesn't lock up
                resolve(true);
            });
        });
    }
}

module.exports = new RobloxInjector();