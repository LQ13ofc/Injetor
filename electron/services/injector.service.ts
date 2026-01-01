import { exec } from 'child_process';
import fs from 'fs';
import net from 'net';

// Constantes Win32 API
const PROCESS_ALL_ACCESS = 0x1F0FFF;
const MEM_COMMIT = 0x1000;
const MEM_RESERVE = 0x2000;
const PAGE_EXECUTE_READWRITE = 0x40;

export class InjectorService {
  private nativeAvailable = false;
  private koffi: any;
  private user32: any;
  private kernel32: any;

  // Definições de Funções Nativas
  private OpenProcess: any;
  private VirtualAllocEx: any;
  private WriteProcessMemory: any;
  private CreateRemoteThread: any;
  private GetModuleHandleA: any;
  private GetProcAddress: any;
  private CloseHandle: any;

  constructor() {
    try {
      // @ts-ignore
      this.koffi = require('koffi');
      if ((process as any).platform === 'win32') {
        this.nativeAvailable = true;
        this.loadNativeFunctions();
      }
    } catch (e) {
      console.warn("Native components (koffi) failed to load. Injection will fail.");
    }
  }

  private loadNativeFunctions() {
    this.user32 = this.koffi.load('user32.dll');
    this.kernel32 = this.koffi.load('kernel32.dll');

    // Mapeamento WinAPI
    this.OpenProcess = this.kernel32.func('__stdcall', 'OpenProcess', 'int', ['int', 'int', 'int']);
    this.VirtualAllocEx = this.kernel32.func('__stdcall', 'VirtualAllocEx', 'int', ['int', 'int', 'int', 'int', 'int']);
    this.WriteProcessMemory = this.kernel32.func('__stdcall', 'WriteProcessMemory', 'int', ['int', 'int', 'str', 'int', 'int*']);
    this.CreateRemoteThread = this.kernel32.func('__stdcall', 'CreateRemoteThread', 'int', ['int', 'int', 'int', 'int', 'int', 'int', 'int']);
    this.GetModuleHandleA = this.kernel32.func('__stdcall', 'GetModuleHandleA', 'int', ['str']);
    this.GetProcAddress = this.kernel32.func('__stdcall', 'GetProcAddress', 'int', ['int', 'str']);
    this.CloseHandle = this.kernel32.func('__stdcall', 'CloseHandle', 'int', ['int']);
  }

  async checkProcessAlive(pid: number): Promise<boolean> {
    try {
      (process as any).kill(pid, 0);
      return true;
    } catch (e) {
      return false;
    }
  }

  async getProcessList(): Promise<any[]> {
    return new Promise((resolve) => {
      const cmd = (process as any).platform === 'win32' 
        ? 'tasklist /v /fo csv /NH' 
        : 'ps -A -o comm,pid';
      
      exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
        const list: any[] = [];
        if (!err && stdout) {
          const lines = stdout.toString().split(/\r?\n/);
          for (const line of lines) {
            try {
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

  /**
   * INJEÇÃO REAL (LoadLibraryA Technique)
   * Esta função aloca memória no processo alvo, escreve o caminho da DLL
   * e cria uma thread remota chamando LoadLibraryA.
   */
  async inject(pid: number, dllPath: string, settings: any) {
    if (!fs.existsSync(dllPath)) return { success: false, error: "DLL not found on disk." };
    if (!this.nativeAvailable) return { success: false, error: "Native engine unavailable. Install Build Tools." };

    try {
        // 1. Abrir Processo
        const hProcess = this.OpenProcess(PROCESS_ALL_ACCESS, 0, pid);
        if (!hProcess) return { success: false, error: "Failed to OpenProcess (Access Denied?)" };

        // 2. Alocar Memória para o Caminho da DLL
        const pathLen = dllPath.length + 1;
        const pRemoteMem = this.VirtualAllocEx(hProcess, 0, pathLen, MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
        
        if (!pRemoteMem) {
            this.CloseHandle(hProcess);
            return { success: false, error: "VirtualAllocEx failed" };
        }

        // 3. Escrever o Caminho na Memória Alocada
        const written = [0];
        const writeResult = this.WriteProcessMemory(hProcess, pRemoteMem, dllPath, pathLen, written);
        
        if (!writeResult) {
            this.CloseHandle(hProcess);
            return { success: false, error: "WriteProcessMemory failed" };
        }

        // 4. Obter endereço de LoadLibraryA em kernel32.dll
        const hKernel32 = this.GetModuleHandleA("kernel32.dll");
        const pLoadLibrary = this.GetProcAddress(hKernel32, "LoadLibraryA");

        if (!pLoadLibrary) {
             this.CloseHandle(hProcess);
             return { success: false, error: "Failed to find LoadLibraryA address" };
        }

        // 5. Criar Thread Remota
        const hThread = this.CreateRemoteThread(hProcess, 0, 0, pLoadLibrary, pRemoteMem, 0, 0);

        if (!hThread) {
            this.CloseHandle(hProcess);
            return { success: false, error: "CreateRemoteThread failed (Blocked by Anti-Cheat?)" };
        }

        // Limpeza
        this.CloseHandle(hThread);
        this.CloseHandle(hProcess);

        return { success: true };

    } catch (e: any) {
        return { success: false, error: `Exception: ${e.message}` };
    }
  }

  async executeScript(code: string) {
    const pipeName = (process as any).platform === 'win32' ? '\\\\.\\pipe\\NexusEnginePipe' : '/tmp/NexusEnginePipe';
    return new Promise((resolve) => {
      const client = net.createConnection(pipeName, () => {
        client.write(code, (err) => {
          client.end();
          resolve({ success: !err, error: err?.message });
        });
      });
      client.on('error', (e) => resolve({ success: false, error: "Pipe error. DLL likely not injected or rejected." }));
    });
  }
}