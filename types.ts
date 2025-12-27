
export enum AppView {
  DASHBOARD = 'dashboard',
  EDITOR = 'editor',
  SECURITY = 'security',
  PLUGINS = 'plugins',
  LOGS = 'logs',
  SETTINGS = 'settings'
}

export type LanguageRuntime = 'lua' | 'python' | 'js' | 'csharp' | 'cpp' | 'c' | 'asm' | 'java' | 'rust' | 'ruby' | 'swift' | 'auto';
export type Platform = 'win32' | 'linux' | 'darwin' | 'aix' | 'freebsd' | 'openbsd' | 'sunos'; 
export type ComplexityMode = 'SIMPLE' | 'COMPLEX';

export type InjectionMethodType = 
  | 'ManualMap'           // Ghost Manual Mapper (7 Phases)
  | 'NtCreateThreadEx'    // Syscall Injection
  | 'ThreadHijack'        // Stealth Thread Hijacking
  | 'LoadLibraryA'        // Standard (High Risk)
  | 'LD_PRELOAD'          // Linux Standard;

export interface ProcessInfo {
  name: string;
  pid: number;
  memory: string;
  session: number;
  path?: string;
  user?: string;
  title?: string;
}

export interface InjectionTarget {
  process: ProcessInfo | null;
  dllPath: string | null;
}

export interface SystemStats {
  processStatus: 'INACTIVE' | 'ATTACHING' | 'INJECTED' | 'ERROR';
  injectionPhase: number; // 0 to 7
  target: InjectionTarget;
  currentPlatform: Platform;
  pipeConnected: boolean;
  complexity: ComplexityMode;
  autoRefreshProcess: boolean;
  isAdmin: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'CRITICAL';
  message: string;
  category: string;
}

export interface PluginModule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  version: string;
  type?: string;
}

export interface SecurityModule {
  id: string;
  label: string;
  desc: string;
  lang: string[];
  active: boolean;
  riskLevel: 'SAFE' | 'RISKY' | 'EXTREME' | 'GOD';
  category: 'MEMORY' | 'KERNEL' | 'NETWORK' | 'HARDWARE';
  platform?: Platform[]; 
}

export interface AppSettings {
  windowTitleRandomization: boolean;
  autoInject: boolean;
  closeOnInject: boolean;
  debugPrivileges: boolean;
  injectionMethod: InjectionMethodType;
  stealthMode: boolean;
  ghostMode: boolean;
  memoryCleaner: boolean;
  threadPriority: string;
  memoryBuffer: number;
  network: {
    packetEncryption: boolean;
    latencySimulation: number;
  };
  dma: {
    enabled: boolean;
    device: string;
    firmwareType: string;
  };
  antiOBS: boolean;
  kernelPriority: boolean;
  executionStrategy: 'INTERNAL' | 'EXTERNAL';
  manualMapping?: {
    stripPE: boolean;
    eraseTraces: boolean;
    resolveImports: boolean;
    shellcodeStub: boolean;
  };
  bypasses?: {
    directSyscalls: boolean;
    vmtHooking: boolean;
    threadSpoofing: boolean;
    watchdogSuspend: boolean;
  };
  luaEngine?: {
    aobScan: boolean;
    bytecodeInjection: boolean;
    cClosureWrapper: boolean;
  };
}

export interface GameScript {
  id: string;
  name: string;
  enabled: boolean;
  params?: any[];
  code?: string;
}

export interface GamePack {
  id: string;
  name: string;
  processName: string;
  installed: boolean;
  engine: string;
  scripts: GameScript[];
  bypassMethod: string;
}

// Global API Definition
declare global {
  interface Window {
    fluxAPI: {
      getPlatform: () => Promise<Platform>;
      getProcesses: () => Promise<ProcessInfo[]>;
      selectFile: () => Promise<{ path: string, name: string, size: string } | null>;
      getBundledDLL: () => Promise<string>;
      
      // Controls
      minimize: () => void;
      toggleMaximize: () => void;
      close: () => void;

      inject: (pid: number, dllPath: string, settings: AppSettings) => Promise<{ success: boolean; error?: string }>;
      executeScript: (script: string) => Promise<{ success: boolean; error?: string }>;
      onLog: (callback: (data: LogEntry) => void) => void;
      onPhaseUpdate: (callback: (phase: number) => void) => void;
      version: string;
    };
  }
}
