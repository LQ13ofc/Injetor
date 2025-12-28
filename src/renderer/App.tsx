
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ScriptEditor from './components/ScriptEditor';
import SecuritySuite from './components/SecuritySuite';
import PluginsPanel from './components/PluginsPanel';
import ConsoleLogs from './components/ConsoleLogs';
import ScriptHub from './components/ScriptHub';
import SettingsPanel from './components/SettingsPanel';
import WindowControls from './components/WindowControls';
import { AppView, SystemStats, LogEntry, PluginModule, GamePack, AppSettings } from '../types';

// Initial Data Definitions
const INITIAL_RUNTIMES: PluginModule[] = [
  { id: 'lua', name: 'Luau/LuaJIT', description: 'Roblox (Luau) & FiveM (Lua 5.4) Optimized Engine.', enabled: true, version: '5.4.2', type: 'Scripting' },
  { id: 'cpp', name: 'C++ Native', description: 'Direct memory access via VMT Hooking (GTA/RDR).', enabled: true, version: 'C++20', type: 'Low Level' },
];

const INITIAL_GAME_LIBRARY: GamePack[] = [
  { 
      id: 'roblox', 
      name: 'Roblox', 
      processName: 'RobloxPlayerBeta.exe', 
      installed: true,
      engine: 'Luau',
      bypassMethod: 'Hyperion V4 Bypass',
      scripts: [
          { id: 'r1', name: 'Invisibility', enabled: false, code: 'game.Players.LocalPlayer.Character.Parent = game.Lighting' },
          { id: 'r3', name: 'Infinite Jump', enabled: true, code: 'game:GetService("UserInputService").JumpRequest:Connect(function() end)' },
      ]
  }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [plugins, setPlugins] = useState<PluginModule[]>(INITIAL_RUNTIMES);
  const [gameLibrary, setGameLibrary] = useState<GamePack[]>(INITIAL_GAME_LIBRARY);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showScriptHub, setShowScriptHub] = useState(false);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    windowTitleRandomization: true,
    autoInject: false,
    closeOnInject: false,
    debugPrivileges: true,
    injectionMethod: 'NtCreateThreadEx',
    stealthMode: true,
    ghostMode: true,
    memoryCleaner: false,
    threadPriority: 'REALTIME',
    memoryBuffer: 1024,
    network: { packetEncryption: true, latencySimulation: 15 },
    dma: { enabled: false, device: 'LeetDMA', firmwareType: 'Custom' },
    antiOBS: true,
    kernelPriority: true,
    executionStrategy: 'INTERNAL'
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

  const statsRef = useRef(stats);
  useEffect(() => { statsRef.current = stats; }, [stats]);

  // Load Settings on Start
  useEffect(() => {
    if (window.fluxAPI) {
      window.fluxAPI.loadSettings().then((saved) => {
        if (saved) {
          setSettings(saved);
          addLog('Configuration loaded from disk.', 'INFO', 'SYSTEM');
        }
      });
    }
  }, []);

  // Theme Application
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  const addLog = useCallback((msg: string, level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'CRITICAL' = 'INFO', cat: string = 'SYSTEM') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message: msg,
      category: cat
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100));
  }, []);

  useEffect(() => {
    let interval: any;

    const checkProcessHealth = async () => {
      const currentTarget = statsRef.current.target.process;
      if (!currentTarget || statsRef.current.processStatus === 'INACTIVE') return;

      if (window.fluxAPI) {
        try {
          const list = await window.fluxAPI.getProcesses();
          const stillAlive = list.find(p => p.pid === currentTarget.pid);

          if (!stillAlive) {
            addLog(`WATCHDOG: Target PID ${currentTarget.pid} died.`, 'WARN', 'KERNEL');
            setStats(prev => ({
              ...prev,
              processStatus: 'INACTIVE',
              target: { ...prev.target, process: null },
              pipeConnected: false
            }));
            setShowScriptHub(false);
          }
        } catch (e) {}
      }
    };

    interval = setInterval(checkProcessHealth, 2000);

    if (window.fluxAPI) {
      window.fluxAPI.getPlatform().then((p) => setStats(prev => ({ ...prev, currentPlatform: p })));
      window.fluxAPI.onLog((data) => addLog(data.message, data.level, data.category));
    }

    return () => clearInterval(interval);
  }, [addLog]);

  return (
    <div className="flex h-screen bg-main text-content font-sans overflow-hidden select-none border border-border-dim rounded-xl shadow-2xl transition-colors duration-300">
      <div className="absolute top-0 left-0 w-full h-8 titlebar-drag z-50 flex justify-end pr-4 pt-2">
         <WindowControls />
      </div>

      <Sidebar currentView={currentView} setView={setCurrentView} />
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar pt-8">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-50" />
        
        {currentView === AppView.DASHBOARD && (
          <Dashboard 
            stats={stats} 
            setStats={setStats} 
            addLog={addLog} 
            onOpenHub={() => {
                const roblox = gameLibrary.find(g => g.id === 'roblox');
                if (roblox) { setActiveGameId('roblox'); setShowScriptHub(true); }
            }} 
            settings={settings}
            setSettings={setSettings}
          />
        )}
        {currentView === AppView.EDITOR && (
          <ScriptEditor addLog={addLog} enabledPlugins={plugins.filter(p => p.enabled)} />
        )}
        {currentView === AppView.SECURITY && (
          <SecuritySuite addLog={addLog} enabledPlugins={plugins} />
        )}
        {currentView === AppView.PLUGINS && (
          <PluginsPanel 
            addLog={addLog} 
            plugins={plugins} 
            setPlugins={setPlugins} 
            gameLibrary={gameLibrary}
            onToggleGame={(id) => setGameLibrary(p => p.map(g => g.id === id ? {...g, installed: !g.installed} : g))}
          />
        )}
        {currentView === AppView.LOGS && (
          <ConsoleLogs logs={logs} clearLogs={() => setLogs([])} />
        )}
        {currentView === AppView.SETTINGS && (
          <SettingsPanel settings={settings} setSettings={setSettings} stats={stats} addLog={addLog} />
        )}
      </main>

      {showScriptHub && stats.processStatus === 'INJECTED' && activeGameId && (
        <ScriptHub 
            game={gameLibrary.find(g => g.id === activeGameId)!} 
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
