import fs from 'fs';
import net from 'net';
import path from 'path';

// Permissions: PROCESS_CREATE_THREAD (0x0002) | PROCESS_VM_OPERATION (0x0008) | PROCESS_VM_WRITE (0x0020) | PROCESS_VM_READ (0x0010) | PROCESS_QUERY_INFORMATION (0x0400)
// This avoids using PROCESS_ALL_ACCESS (0x1F0FFF) which is heavily monitored.
const INJECTION_ACCESS_MASK = 0x043A;

// Memory Constants
const MEM_COMMIT = 0x1000;
const MEM_RESERVE = 0x2000;
const PAGE_READWRITE = 0x04; // Changed from PAGE_EXECUTE_READWRITE (0x40) for stealth. String path doesn't need execution rights.
const THREAD_ALL_ACCESS = 0x1F0FFF;
const TH32CS_SNAPPROCESS = 0x00000002;

export class InjectorService {
  private nativeAvailable = false;
  private koffi: any;
  private user32: any;
  private kernel32: any;
  private ntdll: any;

  // Native Functions
  private OpenProcess: any;
  private VirtualAllocEx: any;
  private WriteProcessMemory: any;
  private GetModuleHandleA: any;
  private GetProcAddress: any;
  private CloseHandle: any;
  private NtCreateThreadEx: any;
  
  // Process Snapshot Functions
  private CreateToolhelp32Snapshot: any;
  private Process32First: any;
  private Process32Next: any;
  
  // Types
  private ProcessEntry32Type: any;

  constructor() {
    try {
      // @ts-ignore
      this.koffi = require('koffi');
      if (process.platform === 'win32') {
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

    // WinAPI - Process & Memory
    this.OpenProcess = this.kernel32.func('__stdcall', 'OpenProcess', 'int', ['uint32', 'int', 'uint32']);
    this.VirtualAllocEx = this.kernel32.func('__stdcall', 'VirtualAllocEx', 'int', ['int', 'int', 'int', 'int', 'int']);
    this.WriteProcessMemory = this.kernel32.func('__stdcall', 'WriteProcessMemory', 'int', ['int', 'int', 'str', 'int', 'int*']);
    this.GetModuleHandleA = this.kernel32.func('__stdcall', 'GetModuleHandleA', 'int', ['str']);
    this.GetProcAddress = this.kernel32.func('__stdcall', 'GetProcAddress', 'int', ['int', 'str']);
    this.CloseHandle = this.kernel32.func('__stdcall', 'CloseHandle', 'int', ['int']);

    // WinAPI - Snapshot (Optimization)
    // struct PROCESSENTRY32
    this.ProcessEntry32Type = this.koffi.struct('PROCESSENTRY32', {
        dwSize: 'uint32',
        cntUsage: 'uint32',
        th32ProcessID: 'uint32',
        th32DefaultHeapID: 'uintptr',
        th32ModuleID: 'uint32',
        cntThreads: 'uint32',
        th32ParentProcessID: 'uint32',
        pcPriClassBase: 'int32',
        dwFlags: 'uint32',
        szExeFile: this.koffi.array('char', 260)
    });

    this.CreateToolhelp32Snapshot = this.kernel32.func('__stdcall', 'CreateToolhelp32Snapshot', 'int', ['uint32', 'uint32']);
    this.Process32First = this.kernel32.func('__stdcall', 'Process32First', 'int', ['int', 'PROCESSENTRY32 *']);
    this.Process32Next = this.kernel32.func('__stdcall', 'Process32Next', 'int', ['int', 'PROCESSENTRY32 *']);

    // Native API - Ntdll
    this.NtCreateThreadEx = this.ntdll.func('__stdcall', 'NtCreateThreadEx', 'int', [
        'out ptr', // ThreadHandle
        'int',     // DesiredAccess
        'ptr',     // ObjectAttributes
        'int',     // ProcessHandle
        'ptr',     // StartRoutine
        'ptr',     // Argument
        'int',     // CreateFlags
        'int',     // ZeroBits
        'int',     // StackSize
        'int',     // MaximumStackSize
        'ptr'      // AttributeList
    ]);
  }

  async checkProcessAlive(pid: number): Promise<boolean> {
    try {
      process.kill(pid, 0);
      return true;
    } catch (e) {
      return false;
    }
  }

  async getProcessList(): Promise<any[]> {
    if (!this.nativeAvailable) return [];

    return new Promise((resolve) => {
        const list: any[] = [];
        const hSnapshot = this.CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        
        if (hSnapshot === -1) {
            resolve([]);
            return;
        }

        // CRITICAL FIX: Initialize dwSize. Windows API requires this to be set to the struct size
        // before calling Process32First, otherwise it returns invalid parameter error.
        const entry = {
            dwSize: this.koffi.sizeof(this.ProcessEntry32Type)
        };
        
        let success = this.Process32First(hSnapshot, entry);
        
        while (success) {
            // Koffi automatically decodes the struct into 'entry' object
            const name = (entry as any).szExeFile; 
            const pid = (entry as any).th32ProcessID;
            
            // Basic filtering to reduce noise
            if (pid > 4) {
                 list.push({
                    name: name,
                    pid: pid,
                    title: name // Snapshot doesn't give window titles easily, saving CPU by skipping EnumWindows
                });
            }
            
            success = this.Process32Next(hSnapshot, entry);
        }

        this.CloseHandle(hSnapshot);
        resolve(list);
    });
  }

  async inject(pid: number, dllPath: string, settings: any) {
    if (!fs.existsSync(dllPath)) return { success: false, error: "DLL not found on disk." };
    if (!this.nativeAvailable) return { success: false, error: "Native engine unavailable." };

    try {
        // 1. Open Process with minimal required permissions (Stealth)
        const hProcess = this.OpenProcess(INJECTION_ACCESS_MASK, 0, pid);
        if (!hProcess) return { success: false, error: "OpenProcess Failed (Access Denied)" };

        // 2. Alloc Memory
        // CRITICAL FIX: Use PAGE_READWRITE (0x04) instead of PAGE_EXECUTE_READWRITE (0x40).
        // Writing a string path does not require execution privileges. 
        // RWX memory is a major detection vector.
        const pathLen = dllPath.length + 1;
        const pRemoteMem = this.VirtualAllocEx(hProcess, 0, pathLen, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
        
        if (!pRemoteMem) {
            this.CloseHandle(hProcess);
            return { success: false, error: "VirtualAllocEx failed" };
        }

        // 3. Write DLL Path
        const written = [0];
        const writeResult = this.WriteProcessMemory(hProcess, pRemoteMem, dllPath, pathLen, written);
        
        if (!writeResult) {
            this.CloseHandle(hProcess);
            return { success: false, error: "WriteProcessMemory failed" };
        }

        // 4. Resolve LoadLibraryA
        const hKernel32 = this.GetModuleHandleA("kernel32.dll");
        const pLoadLibrary = this.GetProcAddress(hKernel32, "LoadLibraryA");

        if (!pLoadLibrary) {
             this.CloseHandle(hProcess);
             return { success: false, error: "GetProcAddress failed" };
        }

        // 5. Execute via NtCreateThreadEx
        const hThreadBuffer = [0];
        
        const status = this.NtCreateThreadEx(
            hThreadBuffer,
            THREAD_ALL_ACCESS,
            null,
            hProcess,
            pLoadLibrary,
            pRemoteMem,
            0, 0, 0, 0, null
        );

        if (status >= 0) {
            if (hThreadBuffer[0]) this.CloseHandle(hThreadBuffer[0]);
            this.CloseHandle(hProcess);
            return { success: true };
        } else {
            this.CloseHandle(hProcess);
            const hexStatus = (status >>> 0).toString(16).toUpperCase();
            return { success: false, error: `NtCreateThreadEx failed: 0x${hexStatus}` };
        }

    } catch (e: any) {
        return { success: false, error: `Exception: ${e.message}` };
    }
  }

  async executeScript(code: string): Promise<{ success: boolean; error?: string }> {
    const pipeName = process.platform === 'win32' ? '\\\\.\\pipe\\NexusEnginePipe' : '/tmp/NexusEnginePipe';
    return new Promise((resolve) => {
      const client = net.createConnection(pipeName, () => {
        client.write(code, (err) => {
          client.end();
          if (err) resolve({ success: false, error: err.message });
          else resolve({ success: true });
        });
      });
      
      client.on('error', (e) => {
          resolve({ success: false, error: "IPC Connection Failed. Is the DLL injected?" });
      });
    });
  }
}