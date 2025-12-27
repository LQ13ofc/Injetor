
import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ScriptEditor from './components/ScriptEditor';
import SecuritySuite from './components/SecuritySuite';
import PluginsPanel from './components/PluginsPanel';
import ConsoleLogs from './components/ConsoleLogs';
import ScriptHub from './components/ScriptHub';
import SettingsPanel from './components/SettingsPanel';
import { AppView, SystemStats, LogEntry, PluginModule, GamePack, AppSettings } from './types';

const INITIAL_RUNTIMES: PluginModule[] = [
  { id: 'lua', name: 'Luau Engine', description: 'Standard Lua environment.', enabled: true, version: '5.1', type: 'Scripting' },
  { id: 'js', name: 'NodeJS Bridge', description: 'JS runtime for UI scripts.', enabled: true, version: 'V8', type: 'Runtime' },
];

const INITIAL_GAME_LIBRARY: GamePack[] = [
  { 
      id: 'roblox', 
      name: 'Roblox', 
      processName: 'RobloxPlayerBeta.exe', 
      installed: true,
      engine: 'Luau',
      scripts: [
          { id: 'script1', name: 'Universal Aimbot', enabled: false, params: [{ id: 'fov', label: 'FOV Circle', type: 'slider', value: 120, min: 0, max: 360 }] },
          { id: 'script2', name: 'ESP Visuals', enabled: true }
      ],
      bypassMethod: 'Hyperion V4'
  },
  { 
      id: 'minecraft', 
      name: 'Minecraft', 
      processName: 'javaw.exe', 
      installed: true,
      engine: 'Java',
      scripts: [],
      bypassMethod: 'Native'
  },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  const [stats, setStats] = useState<SystemStats>({
    processStatus: 'INACTIVE',
    target: { process: null, dllPath: null },
    currentPlatform: 'win32',
    pipeConnected: false,
    complexity: 'SIMPLE',
    autoRefreshProcess: true,
    isAdmin: false
  });

  const [settings, setSettings] = useState<AppSettings>({
    windowTitleRandomization: true,
    autoInject: false,
    closeOnInject: false,
    debugPrivileges: true,
    injectionMethod: 'NtCreateThreadEx', // Método mais furtivo por padrão
    stealthMode: true,
    ghostMode: true,
    memoryCleaner: true,
    threadPriority: 'NORMAL',
    antiOBS: false, // Desativado pois não é possível em user-mode puro sem hooks
    kernelPriority: false,
    executionStrategy: 'INTERNAL',
    memoryBuffer: 512,
    network: { packetEncryption: true, latencySimulation: 0 },
    dma: { enabled: false, device: 'LeetDMA', firmwareType: 'Custom' }
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showScriptHub, setShowScriptHub] = useState(false);
  const [plugins, setPlugins] = useState<PluginModule[]>(INITIAL_RUNTIMES);
  const [gameLibrary, setGameLibrary] = useState<GamePack[]>(INITIAL_GAME_LIBRARY);

  const addLog = useCallback((message: string, level: LogEntry['level'] = 'INFO', category: string = 'SYSTEM') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      category
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    if ((window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      
      ipcRenderer.send('update-settings', settings);

      ipcRenderer.invoke('check-admin').then((isAdmin: boolean) => {
        setStats(prev => ({ ...prev, isAdmin }));
        if (!isAdmin) {
            addLog("Warning: Running without Admin Privileges. Injection capabilities restricted.", "WARN", "KERNEL");
        } else {
            addLog("System Privileges: ADMINISTRATOR (Full Access Granted)", "SUCCESS", "KERNEL");
        }
      });
      
      const logHandler = (_: any, data: { message: string, level: LogEntry['level'] }) => {
        addLog(data.message, data.level, 'NATIVE');
      };
      
      const pipeHandler = (_: any, status: boolean) => {
        setStats(prev => ({ ...prev, pipeConnected: status }));
        addLog(`Pipe Connection: ${status ? 'ESTABLISHED' : 'LOST'}`, status ? 'SUCCESS' : 'WARN', 'IPC');
      };

      ipcRenderer.on('nexus:log', logHandler);
      ipcRenderer.on('pipe-status', pipeHandler);

      return () => {
        ipcRenderer.removeListener('nexus:log', logHandler);
        ipcRenderer.removeListener('pipe-status', pipeHandler);
      };
    }
  }, []); 

  useEffect(() => {
    if ((window as any).require) {
        const { ipcRenderer } = (window as any).require('electron');
        ipcRenderer.send('update-settings', settings);
    }
  }, [settings]);

  return (
    <div className="flex h-screen w-full bg-[#0d0d0f] text-zinc-300 font-sans selection:bg-blue-500/30 overflow-hidden relative">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent">
        <header className="h-10 border-b border-white/5 flex items-center justify-between px-6 bg-[#111114]/90 backdrop-blur-md shrink-0 select-none" style={{ WebkitAppRegion: "drag" } as any}>
          <div className="flex items-center gap-4">
            <div className={`w-1.5 h-1.5 rounded-full ${stats.pipeConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`} />
            <span className="text-[9px] font-bold tracking-widest text-zinc-600 uppercase">
               Status: {stats.processStatus}
            </span>
            {!stats.isAdmin && (
                <span className="text-[9px] font-bold tracking-widest text-orange-500 uppercase flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded">
                    ⚠️ ADMIN REQUIRED
                </span>
            )}
          </div>
          <div className="flex items-center gap-6" style={{ WebkitAppRegion: "no-drag" } as any}>
             <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-tighter">Flux Core v11.0 (Singularity)</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-[#0d0d0f] relative">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
          
          <div className="relative z-10 h-full">
            {currentView === AppView.DASHBOARD && (
              <Dashboard 
                stats={stats} 
                setStats={setStats} 
                addLog={addLog} 
                onOpenHub={() => setShowScriptHub(true)}
                settings={settings}
                setSettings={setSettings}
              />
            )}
            {currentView === AppView.EDITOR && (
               <ScriptEditor addLog={addLog} enabledPlugins={plugins} />
            )}
            {currentView === AppView.SECURITY && <SecuritySuite addLog={addLog} enabledPlugins={plugins} />}
            {currentView === AppView.PLUGINS && <PluginsPanel addLog={addLog} plugins={plugins} setPlugins={setPlugins} gameLibrary={gameLibrary} onToggleGame={() => {}} />}
            {currentView === AppView.LOGS && <ConsoleLogs logs={logs} clearLogs={() => setLogs([])} />}
            {currentView === AppView.SETTINGS && <SettingsPanel settings={settings} setSettings={setSettings} stats={stats as any} />}
          </div>
        </div>
      </main>

      {showScriptHub && stats.target.process && (
        <ScriptHub 
          game={gameLibrary[0]} 
          currentPlatform={stats.currentPlatform}
          onClose={() => setShowScriptHub(false)} 
          onToggleScript={() => {}}
          onUpdateParam={() => {}}
        />
      )}
    </div>
  );
};

export default App;
