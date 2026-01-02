import fs from 'fs';
import net from 'net';
import path from 'path';
import { InjectionErrorCode } from '../../src/types';

// Permissions & Access Masks
const INJECTION_ACCESS_MASK = 0x043A; // PROCESS_CREATE_THREAD | VM_OPERATION | VM_WRITE | VM_READ | QUERY_INFORMATION
const MEM_COMMIT = 0x1000;
const MEM_RESERVE = 0x2000;
const PAGE_READWRITE = 0x04;
const THREAD_ALL_ACCESS = 0x1F0FFF;
const TH32CS_SNAPPROCESS = 0x00000002;

// Privilege Constants
const SE_PRIVILEGE_ENABLED = 2;
const TOKEN_ADJUST_PRIVILEGES = 0x0020;
const TOKEN_QUERY = 0x0008;

// Config Constants
const PIPE_NAME = '\\\\.\\pipe\\NexusEnginePipe';
const IPC_TOKEN = "FLUX_SEC_TOKEN_V1";
const IGNORED_PROCESSES = new Set(['svchost.exe', 'conhost.exe', 'System', 'Idle', 'Registry', 'smss.exe', 'csrss.exe', 'wininit.exe', 'services.exe', 'lsass.exe', 'fontdrvhost.exe', 'Memory Compression']);

export class InjectorService {
  private nativeAvailable = false;
  private koffi: any;
  
  // Libraries
  private user32: any;
  private kernel32: any;
  private ntdll: any;
  private advapi32: any;

  // Native Functions
  private OpenProcess: any;
  private VirtualAllocEx: any;
  private WriteProcessMemory: any;
  private GetModuleHandleA: any;
  private GetProcAddress: any;
  private CloseHandle: any;
  private CreateRemoteThread: any; // Fallback
  private NtCreateThreadEx: any;
  private CreateToolhelp32Snapshot: any;
  private Process32First: any;
  private Process32Next: any;
  
  // Privilege Functions
  private OpenProcessToken: any;
  private LookupPrivilegeValueA: any;
  private AdjustTokenPrivileges: any;
  private GetCurrentProcess: any;
  
  // Types
  private ProcessEntry32Type: any;
  private TokenPrivilegesType: any;
  private LuidType: any;

  constructor() {
    if (process.platform === 'win32') {
      try {
        // @ts-ignore
        this.koffi = require('koffi');
        this.nativeAvailable = true;
        this.loadNativeFunctions();
        this.setDebugPrivilege();
      } catch (e) {
        console.warn("Native components (koffi) failed to load. Injection will fail.", e);
      }
    } else {
      console.warn("InjectorService: Non-Windows platform detected. Native features disabled.");
    }
  }

  private loadNativeFunctions() {
    this.user32 = this.koffi.load('user32.dll');
    this.kernel32 = this.koffi.load('kernel32.dll');
    this.ntdll = this.koffi.load('ntdll.dll');
    this.advapi32 = this.koffi.load('advapi32.dll');

    // Kernel32
    this.OpenProcess = this.kernel32.func('__stdcall', 'OpenProcess', 'int', ['uint32', 'int', 'uint32']);
    this.VirtualAllocEx = this.kernel32.func('__stdcall', 'VirtualAllocEx', 'int', ['int', 'int', 'int', 'int', 'int']);
    this.WriteProcessMemory = this.kernel32.func('__stdcall', 'WriteProcessMemory', 'int', ['int', 'int', 'str', 'int', 'int*']);
    this.GetModuleHandleA = this.kernel32.func('__stdcall', 'GetModuleHandleA', 'int', ['str']);
    this.GetProcAddress = this.kernel32.func('__stdcall', 'GetProcAddress', 'int', ['int', 'str']);
    this.CloseHandle = this.kernel32.func('__stdcall', 'CloseHandle', 'int', ['int']);
    this.GetCurrentProcess = this.kernel32.func('__stdcall', 'GetCurrentProcess', 'int', []);
    
    // Fallback Method
    this.CreateRemoteThread = this.kernel32.func('__stdcall', 'CreateRemoteThread', 'int', ['int', 'ptr', 'int', 'ptr', 'ptr', 'uint32', 'out uint32']);

    // Snapshot
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

    // Ntdll
    this.NtCreateThreadEx = this.ntdll.func('__stdcall', 'NtCreateThreadEx', 'int', [
        'out ptr', 'int', 'ptr', 'int', 'ptr', 'ptr', 'int', 'int', 'int', 'int', 'ptr'
    ]);

    // Advapi32 (Privileges)
    this.LuidType = this.koffi.struct('LUID', { LowPart: 'uint32', HighPart: 'int32' });
    const LuidAndAttributes = this.koffi.struct('LUID_AND_ATTRIBUTES', { Luid: this.LuidType, Attributes: 'uint32' });
    this.TokenPrivilegesType = this.koffi.struct('TOKEN_PRIVILEGES', { PrivilegeCount: 'uint32', Privileges: this.koffi.array(LuidAndAttributes, 1) });

    this.OpenProcessToken = this.advapi32.func('__stdcall', 'OpenProcessToken', 'int', ['int', 'uint32', 'out int']);
    this.LookupPrivilegeValueA = this.advapi32.func('__stdcall', 'LookupPrivilegeValueA', 'int', ['str', 'str', 'ptr']);
    this.AdjustTokenPrivileges = this.advapi32.func('__stdcall', 'AdjustTokenPrivileges', 'int', ['int', 'int', 'TOKEN_PRIVILEGES *', 'int', 'ptr', 'ptr']);
  }

  private setDebugPrivilege() {
      try {
          const hProcess = this.GetCurrentProcess();
          let hToken = [0];
          if (!this.OpenProcessToken(hProcess, TOKEN_ADJUST_PRIVILEGES | TOKEN_QUERY, hToken)) return;

          const luid = {};
          if (!this.LookupPrivilegeValueA(null, "SeDebugPrivilege", luid)) return;

          const tp = {
              PrivilegeCount: 1,
              Privileges: [{ Luid: luid, Attributes: SE_PRIVILEGE_ENABLED }]
          };

          this.AdjustTokenPrivileges(hToken[0], 0, tp, 0, null, null);
          this.CloseHandle(hToken[0]);
      } catch (e) {
          console.error("Failed to set SeDebugPrivilege:", e);
      }
  }

  async checkProcessAlive(pid: number): Promise<boolean> {
    try {
      if (!this.nativeAvailable) return false;
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
        if (hSnapshot === -1) { resolve([]); return; }

        try {
            const entry = { dwSize: this.koffi.sizeof(this.ProcessEntry32Type) };
            let success = this.Process32First(hSnapshot, entry);
            
            while (success) {
                const name = (entry as any).szExeFile; 
                const pid = (entry as any).th32ProcessID;
                
                // Optimized Filtering: Don't push system processes to array
                if (pid > 4 && !IGNORED_PROCESSES.has(name)) {
                     list.push({ name: name, pid: pid, title: name });
                }
                success = this.Process32Next(hSnapshot, entry);
            }
        } finally {
            this.CloseHandle(hSnapshot);
        }
        resolve(list);
    });
  }

  async inject(pid: number, dllPath: string, settings: any) {
    if (process.platform !== 'win32') return { success: false, code: InjectionErrorCode.UNSUPPORTED_PLATFORM, error: "Windows only." };
    if (!fs.existsSync(dllPath)) return { success: false, code: InjectionErrorCode.DLL_NOT_FOUND, error: "DLL not found on disk." };
    if (!this.nativeAvailable) return { success: false, code: InjectionErrorCode.UNKNOWN_ERROR, error: "Native engine unavailable." };

    let hProcess = 0;
    let pRemoteMem = 0;
    let hThreadHandle = 0;

    try {
        hProcess = this.OpenProcess(INJECTION_ACCESS_MASK, 0, pid);
        if (!hProcess) return { success: false, code: InjectionErrorCode.ACCESS_DENIED, error: "Access Denied. Check Anti-Virus." };

        const pathLen = dllPath.length + 1;
        pRemoteMem = this.VirtualAllocEx(hProcess, 0, pathLen, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
        if (!pRemoteMem) return { success: false, code: InjectionErrorCode.MEMORY_ALLOCATION_FAILED, error: "VirtualAllocEx failed" };

        const written = [0];
        if (!this.WriteProcessMemory(hProcess, pRemoteMem, dllPath, pathLen, written)) {
            return { success: false, code: InjectionErrorCode.WRITE_MEMORY_FAILED, error: "WriteProcessMemory failed" };
        }

        const hKernel32 = this.GetModuleHandleA("kernel32.dll");
        const pLoadLibrary = this.GetProcAddress(hKernel32, "LoadLibraryA");
        if (!pLoadLibrary) return { success: false, code: InjectionErrorCode.MODULE_HANDLE_FAILED, error: "GetProcAddress failed" };

        // Strategy: Try NtCreateThreadEx (Stealth), Fallback to CreateRemoteThread
        const hThreadBuffer = [0];
        let status = -1;

        if (settings.stealthMode) {
             status = this.NtCreateThreadEx(hThreadBuffer, THREAD_ALL_ACCESS, null, hProcess, pLoadLibrary, pRemoteMem, 0, 0, 0, 0, null);
             if (status >= 0) hThreadHandle = hThreadBuffer[0];
        }

        // Fallback or explicit standard injection
        if (status < 0 || !settings.stealthMode) {
            hThreadHandle = this.CreateRemoteThread(hProcess, null, 0, pLoadLibrary, pRemoteMem, 0, null);
        }

        if (hThreadHandle) {
            return { success: true, code: InjectionErrorCode.SUCCESS };
        } else {
            return { success: false, code: InjectionErrorCode.THREAD_CREATION_FAILED, error: "All thread creation methods failed." };
        }

    } catch (e: any) {
        return { success: false, code: InjectionErrorCode.UNKNOWN_ERROR, error: `Exception: ${e.message}` };
    } finally {
        if (hThreadHandle) this.CloseHandle(hThreadHandle);
        if (hProcess) this.CloseHandle(hProcess);
        // Note: We deliberately do not free pRemoteMem immediately as LoadLibrary needs to read it. 
        // In a production cheat, you would cleanup after a delay or via a shellcode stub.
    }
  }

  async executeScript(code: string): Promise<{ success: boolean; error?: string }> {
    if (process.platform !== 'win32') return { success: false, error: "Not supported on this OS" };
    
    return new Promise((resolve) => {
      const client = net.createConnection(PIPE_NAME, () => {
        // Send token + code
        const payload = JSON.stringify({ token: IPC_TOKEN, script: code });
        client.write(payload, (err) => {
          client.end();
          if (err) resolve({ success: false, error: err.message });
          else resolve({ success: true });
        });
      });
      client.on('error', () => resolve({ success: false, error: "IPC Connection Failed. DLL not injected?" }));
    });
  }
}