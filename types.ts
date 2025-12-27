
export enum AppView {
  DASHBOARD = 'dashboard',
  EDITOR = 'editor',
  SECURITY = 'security',
  PLUGINS = 'plugins',
  LOGS = 'logs',
  SETTINGS = 'settings'
}

export type LanguageRuntime = 'lua' | 'python' | 'js' | 'csharp' | 'cpp' | 'c' | 'asm' | 'java' | 'auto';
export type Platform = 'win32' | 'linux' | 'darwin' | 'arm64';
export type ComplexityMode = 'SIMPLE' | 'COMPLEX';
// LoadLibraryW é mais seguro contra ganchos básicos que LoadLibraryA
export type InjectionMethodType = 'LoadLibraryA' | 'LoadLibraryW' | 'NtCreateThreadEx';

export interface ProcessInfo {
  name: string;
  pid: number;
  memory: string;
  session: number;
  path?: string;
}

export interface InjectionTarget {
  process: ProcessInfo | null;
  dllPath: string | null;
}

export interface SystemStats {
  processStatus: 'INACTIVE' | 'ATTACHING' | 'INJECTED' | 'ERROR';
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

export interface HWIDProfile {
  smbios: string;
  diskId: string;
  mac: string;
  gpu: string;
  arp: string;
}

export interface SecurityModule {
  id: string;
  label: string;
  desc: string;
  lang: string[];
  active: boolean;
  riskLevel: 'SAFE' | 'RISKY' | 'EXTREME' | 'GOD';
  category: 'MEMORY' | 'KERNEL' | 'NETWORK' | 'HARDWARE';
}

export interface NetworkConfig {
  packetEncryption: boolean;
  latencySimulation: number; // Jitter real
}

export interface DMAConfig {
  enabled: boolean;
  device: string;
  firmwareType: string;
}

export interface AppSettings {
  windowTitleRandomization: boolean;
  autoInject: boolean;
  closeOnInject: boolean;
  debugPrivileges: boolean;
  injectionMethod: InjectionMethodType;
  stealthMode: boolean; // Usa NtCreateThreadEx
  ghostMode: boolean; // Renomeia + Time Stomping
  memoryCleaner: boolean; // Limpa string do path
  threadPriority: 'NORMAL' | 'HIGH' | 'REALTIME'; // Prioridade real do processo
  memoryBuffer: number;
  network: NetworkConfig;
  dma: DMAConfig;
  antiOBS: boolean;
  kernelPriority: boolean;
  executionStrategy: 'INTERNAL' | 'EXTERNAL';
}

export interface ScriptParam {
  id: string;
  label: string;
  type: 'slider' | 'number' | 'text';
  value: any;
  min?: number;
  max?: number;
}

export interface GameScript {
  id: string;
  name: string;
  enabled: boolean;
  params?: ScriptParam[];
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