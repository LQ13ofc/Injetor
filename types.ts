
export enum AppView {
  DASHBOARD = 'dashboard',
  EDITOR = 'editor',
  SECURITY = 'security',
  PLUGINS = 'plugins',
  LOGS = 'logs'
}

export type LanguageRuntime = 'lua' | 'python' | 'js' | 'csharp' | 'cpp' | 'c' | 'auto';

export interface ScriptParam {
  id: string;
  label: string;
  type: 'text' | 'number' | 'slider';
  value: string | number;
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
  engine: string;
  runtime: LanguageRuntime;
  bypassMethod: string;
  scripts: GameScript[];
  installed: boolean;
}

export interface SystemStats {
  processStatus: 'INACTIVE' | 'ATTACHING' | 'ACTIVE' | 'ERROR';
  targetProcess: string;
  detectedGame?: GamePack;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
  category: string;
}

export interface HWIDProfile {
  smbios: string;
  diskId: string;
  mac: string;
  gpu: string;
}

export interface PluginModule {
  id: LanguageRuntime;
  name: string;
  description: string;
  type: 'Engine' | 'Wrapper' | 'JIT';
  enabled: boolean;
}
