import { exec } from 'child_process';
import fs from 'fs';
import net from 'net';

// Constantes Win32 API
const PROCESS_ALL_ACCESS = 0x1F0FFF;
const MEM_COMMIT = 0x1000;
const MEM_RESERVE = 0x2000;
const PAGE_EXECUTE_READWRITE = 0x40;
const THREAD_ALL_ACCESS = 0x1F0FFF;

export class InjectorService {
  private nativeAvailable = false;
  private koffi: any;
  private user32: any;
  private kernel32: any;
  private ntdll: any;

  // Definições de Funções Nativas
  private OpenProcess: any;
  private VirtualAllocEx: any;
  private WriteProcessMemory: any;
  private GetModuleHandleA: any;
  private GetProcAddress: any;
  private CloseHandle: any;
  private NtCreateThreadEx: any;

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
    this.ntdll = this.koffi.load('ntdll.dll');

    // Mapeamento WinAPI - Kernel32
    this.OpenProcess = this.kernel32.func('__stdcall', 'OpenProcess', 'int', ['int', 'int', 'int']);
    this.VirtualAllocEx = this.kernel32.func('__stdcall', 'VirtualAllocEx', 'int', ['int', 'int', 'int', 'int', 'int']);
    this.WriteProcessMemory = this.kernel32.func('__stdcall', 'WriteProcessMemory', 'int', ['int', 'int', 'str', 'int', 'int*']);
    this.GetModuleHandleA = this.kernel32.func('__stdcall', 'GetModuleHandleA', 'int', ['str']);
    this.GetProcAddress = this.kernel32.func('__stdcall', 'GetProcAddress', 'int', ['int', 'str']);
    this.CloseHandle = this.kernel32.func('__stdcall', 'CloseHandle', 'int', ['int']);

    // Mapeamento Native API - Ntdll (Undocumented)
    this.NtCreateThreadEx = this.ntdll.func('__stdcall', 'NtCreateThreadEx', 'int', [
        'out ptr', // ThreadHandle (PHANDLE)
        'int',     // DesiredAccess (ACCESS_MASK)
        'ptr',     // ObjectAttributes (POBJECT_ATTRIBUTES)
        'int',     // ProcessHandle (HANDLE)
        'ptr',     // StartRoutine (PVOID)
        'ptr',     // Argument (PVOID)
        'int',     // CreateFlags (ULONG)
        'int',     // ZeroBits (ULONG_PTR)
        'int',     // StackSize (SIZE_T)
        'int',     // MaximumStackSize (SIZE_T)
        'ptr'      // AttributeList (PPS_ATTRIBUTE_LIST)
    ]);
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
   * INJEÇÃO VIA NTCREATETHREADEX
   * Técnica avançada que invoca diretamente o kernel via ntdll.dll,
   * ignorando hooks comuns na kernel32.dll (CreateRemoteThread).
   */
  async inject(pid: number, dllPath: string, settings: any) {
    if (!fs.existsSync(dllPath)) return { success: false, error: "DLL not found on disk." };
    if (!this.nativeAvailable) return { success: false, error: "Native engine unavailable. Install Build Tools." };

    try {
        // 1. Abrir Processo
        const hProcess = this.OpenProcess(PROCESS_ALL_ACCESS, 0, pid);
        if (!hProcess) return { success: false, error: "Failed to OpenProcess (Access Denied / Anti-Cheat Active)" };

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

        // 5. Executar via NtCreateThreadEx (Bypass)
        const hThreadBuffer = [0]; // Buffer para receber o handle da thread
        
        const status = this.NtCreateThreadEx(
            hThreadBuffer,
            THREAD_ALL_ACCESS, // DesiredAccess
            null,              // ObjectAttributes
            hProcess,          // ProcessHandle
            pLoadLibrary,      // StartRoutine (LoadLibraryA)
            pRemoteMem,        // Argument (DLL Path Address)
            0,                 // CreateFlags (0 = Run Immediately)
            0,                 // ZeroBits
            0,                 // StackSize
            0,                 // MaxStackSize
            null               // AttributeList
        );

        // NT_SUCCESS (0x00000000) e status positivos indicam sucesso
        if (status >= 0) {
            if (hThreadBuffer[0]) this.CloseHandle(hThreadBuffer[0]);
            this.CloseHandle(hProcess);
            return { success: true };
        } else {
            this.CloseHandle(hProcess);
            // Converter código NTSTATUS para hex para facilitar debug
            const hexStatus = (status >>> 0).toString(16).toUpperCase();
            return { success: false, error: `NtCreateThreadEx failed. NTSTATUS: 0x${hexStatus}` };
        }

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