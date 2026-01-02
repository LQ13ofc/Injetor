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
const IGNORED_PROCESSES = new Set(['svchost.exe', 'conhost.exe', 'System', 'Idle', 'Registry', 'smss.exe', 'csrss.exe', 'wininit.exe', 'services.exe', 'lsass.exe', 'fontdrvhost.exe', 'Memory Compression']);

// Strict FFI Interfaces
interface Kernel32 {
  OpenProcess: (dwDesiredAccess: number, bInheritHandle: number, dwProcessId: number) => number;
  VirtualAllocEx: (hProcess: number, lpAddress: number, dwSize: number, flAllocationType: number, flProtect: number) => number;
  WriteProcessMemory: (hProcess: number, lpBaseAddress: number, lpBuffer: string, nSize: number, lpNumberOfBytesWritten: number[]) => number;
  GetModuleHandleA: (lpModuleName: string) => number;
  GetProcAddress: (hModule: number, lpProcName: string) => number;
  CloseHandle: (hObject: number) => number;
  GetCurrentProcess: () => number;
  CreateRemoteThread: (hProcess: number, lpThreadAttributes: any, dwStackSize: number, lpStartAddress: number, lpParameter: number, dwCreationFlags: number, lpThreadId: any) => number;
  CreateToolhelp32Snapshot: (dwFlags: number, th32ProcessID: number) => number;
  Process32First: (hSnapshot: number, lppe: any) => number;
  Process32Next: (hSnapshot: number, lppe: any) => number;
}

interface Ntdll {
  NtCreateThreadEx: (
    ThreadHandle: number[], 
    DesiredAccess: number, 
    ObjectAttributes: any, 
    ProcessHandle: number, 
    StartRoutine: number, 
    Argument: number, 
    CreateFlags: number, 
    ZeroBits: number, 
    StackSize: number, 
    MaximumStackSize: number, 
    AttributeList: any
  ) => number;
}

interface Advapi32 {
  OpenProcessToken: (ProcessHandle: number, DesiredAccess: number, TokenHandle: number[]) => number;
  LookupPrivilegeValueA: (lpSystemName: string | null, lpName: string, lpLuid: any) => number;
  AdjustTokenPrivileges: (TokenHandle: number, DisableAllPrivileges: number, NewState: any, BufferLength: number, PreviousState: any, ReturnLength: any) => number;
}

export class InjectorService {
  private nativeAvailable = false;
  private koffi: any;
  private sessionToken: string;
  
  // Native Function Wrappers
  private kernel32Funcs: Partial<Kernel32> = {};
  private ntdllFuncs: Partial<Ntdll> = {};
  private advapi32Funcs: Partial<Advapi32> = {};
  
  // Types
  private ProcessEntry32Type: any;
  private TokenPrivilegesType: any;
  private LuidType: any;

  constructor(sessionToken: string) {
    this.sessionToken = sessionToken;
    
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
    const user32 = this.koffi.load('user32.dll');
    const kernel32 = this.koffi.load('kernel32.dll');
    const ntdll = this.koffi.load('ntdll.dll');
    const advapi32 = this.koffi.load('advapi32.dll');

    // Kernel32
    this.kernel32Funcs.OpenProcess = kernel32.func('__stdcall', 'OpenProcess', 'int', ['uint32', 'int', 'uint32']);
    this.kernel32Funcs.VirtualAllocEx = kernel32.func('__stdcall', 'VirtualAllocEx', 'int', ['int', 'int', 'int', 'int', 'int']);
    this.kernel32Funcs.WriteProcessMemory = kernel32.func('__stdcall', 'WriteProcessMemory', 'int', ['int', 'int', 'str', 'int', 'int*']);
    this.kernel32Funcs.GetModuleHandleA = kernel32.func('__stdcall', 'GetModuleHandleA', 'int', ['str']);
    this.kernel32Funcs.GetProcAddress = kernel32.func('__stdcall', 'GetProcAddress', 'int', ['int', 'str']);
    this.kernel32Funcs.CloseHandle = kernel32.func('__stdcall', 'CloseHandle', 'int', ['int']);
    this.kernel32Funcs.GetCurrentProcess = kernel32.func('__stdcall', 'GetCurrentProcess', 'int', []);
    
    // Fallback Method
    this.kernel32Funcs.CreateRemoteThread = kernel32.func('__stdcall', 'CreateRemoteThread', 'int', ['int', 'ptr', 'int', 'ptr', 'ptr', 'uint32', 'out uint32']);

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
    this.kernel32Funcs.CreateToolhelp32Snapshot = kernel32.func('__stdcall', 'CreateToolhelp32Snapshot', 'int', ['uint32', 'uint32']);
    this.kernel32Funcs.Process32First = kernel32.func('__stdcall', 'Process32First', 'int', ['int', 'PROCESSENTRY32 *']);
    this.kernel32Funcs.Process32Next = kernel32.func('__stdcall', 'Process32Next', 'int', ['int', 'PROCESSENTRY32 *']);

    // Ntdll
    this.ntdllFuncs.NtCreateThreadEx = ntdll.func('__stdcall', 'NtCreateThreadEx', 'int', [
        'out ptr', 'int', 'ptr', 'int', 'ptr', 'ptr', 'int', 'int', 'int', 'int', 'ptr'
    ]);

    // Advapi32 (Privileges)
    this.LuidType = this.koffi.struct('LUID', { LowPart: 'uint32', HighPart: 'int32' });
    const LuidAndAttributes = this.koffi.struct('LUID_AND_ATTRIBUTES', { Luid: this.LuidType, Attributes: 'uint32' });
    this.TokenPrivilegesType = this.koffi.struct('TOKEN_PRIVILEGES', { PrivilegeCount: 'uint32', Privileges: this.koffi.array(LuidAndAttributes, 1) });

    this.advapi32Funcs.OpenProcessToken = advapi32.func('__stdcall', 'OpenProcessToken', 'int', ['int', 'uint32', 'out int']);
    this.advapi32Funcs.LookupPrivilegeValueA = advapi32.func('__stdcall', 'LookupPrivilegeValueA', 'int', ['str', 'str', 'ptr']);
    this.advapi32Funcs.AdjustTokenPrivileges = advapi32.func('__stdcall', 'AdjustTokenPrivileges', 'int', ['int', 'int', 'TOKEN_PRIVILEGES *', 'int', 'ptr', 'ptr']);
  }

  private setDebugPrivilege() {
      try {
          const hProcess = this.kernel32Funcs.GetCurrentProcess!();
          let hToken = [0];
          if (!this.advapi32Funcs.OpenProcessToken!(hProcess, TOKEN_ADJUST_PRIVILEGES | TOKEN_QUERY, hToken)) return;

          const luid = {};
          if (!this.advapi32Funcs.LookupPrivilegeValueA!(null, "SeDebugPrivilege", luid)) return;

          const tp = {
              PrivilegeCount: 1,
              Privileges: [{ Luid: luid, Attributes: SE_PRIVILEGE_ENABLED }]
          };

          this.advapi32Funcs.AdjustTokenPrivileges!(hToken[0], 0, tp, 0, null, null);
          this.kernel32Funcs.CloseHandle!(hToken[0]);
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
        const hSnapshot = this.kernel32Funcs.CreateToolhelp32Snapshot!(TH32CS_SNAPPROCESS, 0);
        if (hSnapshot === -1) { resolve([]); return; }

        try {
            const entry = { dwSize: this.koffi.sizeof(this.ProcessEntry32Type) };
            let success = this.kernel32Funcs.Process32First!(hSnapshot, entry);
            
            while (success) {
                const name = (entry as any).szExeFile; 
                const pid = (entry as any).th32ProcessID;
                
                // Optimized Filtering: Don't push system processes to array
                if (pid > 4 && !IGNORED_PROCESSES.has(name)) {
                     list.push({ name: name, pid: pid, title: name });
                }
                success = this.kernel32Funcs.Process32Next!(hSnapshot, entry);
            }
        } finally {
            this.kernel32Funcs.CloseHandle!(hSnapshot);
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
        hProcess = this.kernel32Funcs.OpenProcess!(INJECTION_ACCESS_MASK, 0, pid);
        if (!hProcess) return { success: false, code: InjectionErrorCode.ACCESS_DENIED, error: "Access Denied. Check Anti-Virus." };

        const pathLen = dllPath.length + 1;
        pRemoteMem = this.kernel32Funcs.VirtualAllocEx!(hProcess, 0, pathLen, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
        if (!pRemoteMem) return { success: false, code: InjectionErrorCode.MEMORY_ALLOCATION_FAILED, error: "VirtualAllocEx failed" };

        const written = [0];
        if (!this.kernel32Funcs.WriteProcessMemory!(hProcess, pRemoteMem, dllPath, pathLen, written)) {
            return { success: false, code: InjectionErrorCode.WRITE_MEMORY_FAILED, error: "WriteProcessMemory failed" };
        }

        const hKernel32 = this.kernel32Funcs.GetModuleHandleA!("kernel32.dll");
        const pLoadLibrary = this.kernel32Funcs.GetProcAddress!(hKernel32, "LoadLibraryA");
        if (!pLoadLibrary) return { success: false, code: InjectionErrorCode.MODULE_HANDLE_FAILED, error: "GetProcAddress failed" };

        // Strategy: Try NtCreateThreadEx (Stealth), Fallback to CreateRemoteThread
        const hThreadBuffer = [0];
        let status = -1;

        if (settings.stealthMode) {
             status = this.ntdllFuncs.NtCreateThreadEx!(hThreadBuffer, THREAD_ALL_ACCESS, null, hProcess, pLoadLibrary, pRemoteMem, 0, 0, 0, 0, null);
             if (status >= 0) hThreadHandle = hThreadBuffer[0];
        }

        // Fallback or explicit standard injection
        if (status < 0 || !settings.stealthMode) {
            hThreadHandle = this.kernel32Funcs.CreateRemoteThread!(hProcess, null, 0, pLoadLibrary, pRemoteMem, 0, null);
        }

        if (hThreadHandle) {
            return { success: true, code: InjectionErrorCode.SUCCESS };
        } else {
            return { success: false, code: InjectionErrorCode.THREAD_CREATION_FAILED, error: "All thread creation methods failed." };
        }

    } catch (e: any) {
        return { success: false, code: InjectionErrorCode.UNKNOWN_ERROR, error: `Exception: ${e.message}` };
    } finally {
        if (hThreadHandle) this.kernel32Funcs.CloseHandle!(hThreadHandle);
        if (hProcess) this.kernel32Funcs.CloseHandle!(hProcess);
        // Note: We deliberately do not free pRemoteMem immediately as LoadLibrary needs to read it. 
        // In a production cheat, you would cleanup after a delay or via a shellcode stub.
    }
  }

  async executeScript(code: string): Promise<{ success: boolean; error?: string }> {
    if (process.platform !== 'win32') return { success: false, error: "Not supported on this OS" };
    
    return new Promise((resolve) => {
      const client = net.createConnection(PIPE_NAME, () => {
        // Send session token (generated at runtime) + code
        const payload = JSON.stringify({ token: this.sessionToken, script: code });
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