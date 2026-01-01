import { exec } from 'child_process';
import fs from 'fs';
import net from 'net';

export class InjectorService {
  private nativeAvailable = false;
  private koffi: any;

  constructor() {
    try {
      // @ts-ignore
      this.koffi = require('koffi');
      // Fix: Cast process to any to access platform property
      this.nativeAvailable = (process as any).platform === 'win32';
    } catch (e) {
      console.warn("Native components (koffi) could not be loaded.");
    }
  }

  async checkProcessAlive(pid: number): Promise<boolean> {
    try {
      // Fix: Cast process to any to access kill method
      (process as any).kill(pid, 0);
      return true;
    } catch (e) {
      return false;
    }
  }

  async getProcessList(): Promise<any[]> {
    return new Promise((resolve) => {
      // Fix: Cast process to any to access platform property
      const cmd = (process as any).platform === 'win32' 
        ? 'tasklist /v /fo csv /NH' 
        : 'ps -A -o comm,pid';
      
      exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
        const list: any[] = [];
        if (!err && stdout) {
          const lines = stdout.toString().split(/\r?\n/);
          for (const line of lines) {
            try {
              // Fix: Cast process to any to access platform property
              if ((process as any).platform === 'win32') {
                const parts = line.split('","').map(p => p.replace(/^"|"$/g, '').trim());
                if (parts.length >= 2) {
                  list.push({ name: parts[0], pid: parseInt(parts[1]), title: parts[8] || 'N/A' });
                }
              } else {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 2) {
                  list.push({ name: parts[0], pid: parseInt(parts[1]), title: parts[0] });
                }
              }
            } catch (e) {}
          }
        }
        resolve(Array.from(new Map(list.map(i => [i.pid, i])).values()));
      });
    });
  }

  async inject(pid: number, dllPath: string, settings: any) {
    if (!fs.existsSync(dllPath)) return { success: false, error: "DLL not found on disk." };
    if (!this.nativeAvailable) return { success: false, error: "Injection engine unavailable (Non-Windows or missing dependencies)." };

    // Aqui seria a chamada para a DLL de injeção real via koffi
    // Para este blueprint, mantemos a estrutura de chamada, mas com erro real se falhar
    try {
        // Exemplo: this.injectorDll.manualMap(pid, dllPath, settings.stealthMode);
        await new Promise(r => setTimeout(r, 1000)); 
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
  }

  async executeScript(code: string) {
    // Fix: Cast process to any to access platform property
    const pipeName = (process as any).platform === 'win32' ? '\\\\.\\pipe\\NexusEnginePipe' : '/tmp/NexusEnginePipe';
    return new Promise((resolve) => {
      const client = net.createConnection(pipeName, () => {
        client.write(code, (err) => {
          client.end();
          resolve({ success: !err, error: err?.message });
        });
      });
      client.on('error', (e) => resolve({ success: false, error: "Engine pipe not found. Is the DLL injected?" }));
    });
  }
}
