import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { AppSettings, SystemStats, LogEntry, AppView } from '../types';

interface AppContextType {
  view: AppView;
  setView: (v: AppView) => void;
  logs: LogEntry[];
  addLog: (msg: string, level?: LogEntry['level'], cat?: string) => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  stats: SystemStats;
  setStats: React.Dispatch<React.SetStateAction<SystemStats>>;
  clearLogs: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    windowTitleRandomization: true,
    autoInject: true,
    closeOnInject: false,
    debugPrivileges: true,
    injectionMethod: 'NtCreateThreadEx',
    stealthMode: true,
    ghostMode: true,
    memoryCleaner: true,
    threadPriority: 'REALTIME',
    memoryBuffer: 2048,
    network: { packetEncryption: true, latencySimulation: 0 },
    dma: { enabled: false, device: 'LeetDMA', firmwareType: 'Custom' },
    antiOBS: true,
    kernelPriority: true,
    executionStrategy: 'INTERNAL',
    theme: 'dark'
  });

  const [stats, setStats] = useState<SystemStats>({
    processStatus: 'INACTIVE',
    injectionPhase: 0,
    target: { process: null, dllPath: null },
    currentPlatform: 'win32',
    pipeConnected: false,
    complexity: 'COMPLEX',
    autoRefreshProcess: true,
    isAdmin: false
  });

  const addLog = useCallback((msg: string, level: LogEntry['level'] = 'INFO', cat: string = 'SYSTEM') => {
    setLogs(prev => [{
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message: msg,
      category: cat
    }, ...prev].slice(0, 100));
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  // Escuta eventos do Main Process
  useEffect(() => {
    if (window.fluxAPI) {
      window.fluxAPI.onTargetDied(() => {
        addLog("WATCHDOG: Target process terminated unexpectedly.", "WARN", "KERNEL");
        setStats(prev => ({ ...prev, processStatus: 'INACTIVE', target: { ...prev.target, process: null } }));
      });
    }
  }, [addLog]);

  const contextValue = useMemo(() => ({
    view,
    setView,
    logs,
    addLog,
    settings,
    setSettings,
    stats,
    setStats,
    clearLogs
  }), [view, logs, settings, stats, addLog, clearLogs]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};