
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Terminal, Zap, Shield } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ScriptEditor from './components/ScriptEditor';
import SecuritySuite from './components/SecuritySuite';
import PluginsPanel from './components/PluginsPanel';
import ConsoleLogs from './components/ConsoleLogs';
import ScriptHub from './components/ScriptHub';
import { AppView, SystemStats, LogEntry, PluginModule, GamePack } from './types';

const GAME_LIBRARY: GamePack[] = [
  {
    id: 'roblox',
    name: 'Roblox',
    processName: 'RobloxPlayerBeta.exe',
    engine: 'Luau VM',
    runtime: 'lua',
    bypassMethod: 'Luau VM Hijack',
    installed: true,
    scripts: [
      { id: 'r1', name: 'Fly Hack', enabled: false },
      { id: 'r2', name: 'Speed Hack', enabled: false, params: [{ id: 'spd', label: 'Speed', type: 'slider', value: 16, min: 16, max: 500 }] },
      { id: 'r3', name: 'Jump Power', enabled: false, params: [{ id: 'jmp', label: 'Power', type: 'slider', value: 50, min: 50, max: 1000 }] },
      { id: 'r4', name: 'Teleport to Player', enabled: false, params: [{ id: 'usr', label: 'Player Name', type: 'text', value: '' }] },
      { id: 'r5', name: 'Invisibility', enabled: false },
      { id: 'r6', name: 'NoClip', enabled: false },
      { id: 'r7', name: 'ESP Master', enabled: false },
      { id: 'r8', name: 'Fullbright', enabled: false },
      { id: 'r9', name: 'Infinite Yield Admin', enabled: false },
      { id: 'r10', name: 'Anti-Kick Bypass', enabled: false },
      { id: 'r11', name: 'Remote Spy', enabled: false }
    ]
  },
  {
    id: 'gtav',
    name: 'GTA V',
    processName: 'GTA5.exe',
    engine: 'RAGE Engine',
    runtime: 'cpp',
    bypassMethod: 'Native Hooking',
    installed: true,
    scripts: [
      { id: 'g1', name: 'God Mode', enabled: false },
      { id: 'g2', name: 'Never Wanted', enabled: false },
      { id: 'g3', name: 'Super Jump', enabled: false },
      { id: 'g4', name: 'Vehicle Speed', enabled: false, params: [{ id: 'vspd', label: 'Multiplier', type: 'slider', value: 1, min: 1, max: 20 }] },
      { id: 'g5', name: 'Explosive Bullets', enabled: false },
      { id: 'g6', name: 'Spawn Vehicle', enabled: false, params: [{ id: 'vname', label: 'Model Name', type: 'text', value: 'adder' }] },
      { id: 'g7', name: 'Teleport Waypoint', enabled: false },
      { id: 'g8', name: 'Object Spawner', enabled: false },
      { id: 'g9', name: 'Weather Manipulator', enabled: false },
      { id: 'g10', name: 'No Reload', enabled: false }
    ]
  },
  {
    id: 'fivem',
    name: 'FiveM',
    processName: 'FiveM_ChromeBrowser',
    engine: 'RAGE/Lua',
    runtime: 'lua',
    bypassMethod: 'Resource Spoofing',
    installed: true,
    scripts: [
      { id: 'f1', name: 'Executor Bypass', enabled: false },
      { id: 'f2', name: 'Trigger Event Dumper', enabled: false },
      { id: 'f3', name: 'ESP & Wallhack', enabled: false },
      { id: 'f4', name: 'Armor/HP Max', enabled: false },
      { id: 'f5', name: 'No Recoil', enabled: false },
      { id: 'f6', name: 'Ghost Mode', enabled: false },
      { id: 'f7', name: 'Weapon Spawner', enabled: false },
      { id: 'f8', name: 'Server Event Executor', enabled: false, params: [{ id: 'ev', label: 'Event Name', type: 'text', value: '' }] },
      { id: 'f9', name: 'Vehicle Godmode', enabled: false },
      { id: 'f10', name: 'Spectate Player', enabled: false }
    ]
  }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [stats, setStats] = useState<SystemStats>({
    processStatus: 'INACTIVE',
    targetProcess: ''
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showScriptHub, setShowScriptHub] = useState(false);
  const [gameLibrary, setGameLibrary] = useState<GamePack[]>(GAME_LIBRARY);

  const [plugins, setPlugins] = useState<PluginModule[]>([
    { id: 'lua', name: 'Lua / Luau Runtime', description: 'Native game execution engine.', type: 'Engine', enabled: true },
    { id: 'python', name: 'Python Bridge', description: 'Embedded CPython interpreter.', type: 'Wrapper', enabled: false },
    { id: 'js', name: 'JavaScript V8 Core', description: 'V8 integration layer.', type: 'Engine', enabled: false },
    { id: 'csharp', name: 'C# / Mono Wrapper', description: '.NET execution layer.', type: 'Wrapper', enabled: true },
    { id: 'cpp', name: 'C++ Native Linker', description: 'Direct DLL exports.', type: 'Engine', enabled: true },
    { id: 'c', name: 'C Standard Library', description: 'System calls & memory.', type: 'Wrapper', enabled: false }
  ]);

  const enabledPlugins = useMemo(() => plugins.filter(p => p.enabled), [plugins]);

  const addLog = useCallback((message: string, level: LogEntry['level'] = 'INFO', category: string = 'SYSTEM') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      category
    };
    setLogs(prev => [newLog, ...prev].slice(0, 40));
  }, []);

  const handleDeployStealth = () => {
    if (isDeploying || stats.processStatus === 'ACTIVE' || !stats.targetProcess) return;
    setIsDeploying(true);
    addLog(`Initiating Nexus Pipeline for ${stats.targetProcess}...`, 'INFO', 'CORE');
    setTimeout(() => {
      addLog('Activating Kernel Bridge...', 'INFO', 'STEALTH');
      setTimeout(() => {
        addLog('Nexus link established successfully.', 'SUCCESS', 'KERNEL');
        setStats(prev => ({ ...prev, processStatus: 'ACTIVE' }));
        setIsDeploying(false);
      }, 1200);
    }, 800);
  };

  const updateTarget = (name: string) => {
    const detected = gameLibrary.find(g => name.toLowerCase().includes(g.processName.toLowerCase()) || g.processName.toLowerCase().includes(name.toLowerCase()));
    setStats(prev => ({ ...prev, targetProcess: name, detectedGame: detected }));
    if (name) addLog(`Target set: ${name}${detected ? ` (${detected.name} detected)` : ''}`, 'INFO', 'CONFIG');
  };

  const toggleScript = (gameId: string, scriptId: string) => {
    setGameLibrary(prev => prev.map(g => {
      if (g.id === gameId) {
        return {
          ...g,
          scripts: g.scripts.map(s => s.id === scriptId ? { ...s, enabled: !s.enabled } : s)
        };
      }
      return g;
    }));
    addLog('Script toggled.', 'INFO', 'RUNTIME');
  };

  const updateParam = (gameId: string, scriptId: string, paramId: string, val: any) => {
    setGameLibrary(prev => prev.map(g => {
      if (g.id === gameId) {
        return {
          ...g,
          scripts: g.scripts.map(s => {
            if (s.id === scriptId) {
              return {
                ...s,
                params: s.params?.map(p => p.id === paramId ? { ...p, value: val } : p)
              };
            }
            return s;
          })
        };
      }
      return g;
    }));
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard stats={stats} onDeploy={handleDeployStealth} isDeploying={isDeploying} onTargetChange={updateTarget} onOpenHub={() => setShowScriptHub(true)} />;
      case AppView.EDITOR:
        return <ScriptEditor addLog={addLog} enabledPlugins={enabledPlugins} />;
      case AppView.SECURITY:
        return <SecuritySuite addLog={addLog} enabledPlugins={enabledPlugins} />;
      case AppView.PLUGINS:
        return <PluginsPanel addLog={addLog} plugins={plugins} setPlugins={setPlugins} gameLibrary={gameLibrary} setGameLibrary={setGameLibrary} />;
      case AppView.LOGS:
        return <ConsoleLogs logs={logs} clearLogs={() => setLogs([])} />;
      default:
        return <Dashboard stats={stats} onDeploy={handleDeployStealth} isDeploying={isDeploying} onTargetChange={updateTarget} onOpenHub={() => setShowScriptHub(true)} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0d0d0f] text-zinc-300 font-sans selection:bg-blue-500/30 overflow-hidden relative">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-10 border-b border-white/5 flex items-center justify-between px-6 bg-[#111114] shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-1.5 h-1.5 rounded-full ${stats.processStatus === 'ACTIVE' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'} ${isDeploying ? 'animate-pulse' : ''}`} />
            <span className="text-[9px] font-bold tracking-widest text-zinc-600 uppercase">
              {isDeploying ? 'Pipeline Initializing...' : `Session: ${stats.processStatus}`}
            </span>
          </div>
          <div className="flex items-center gap-3">
             {stats.detectedGame && stats.processStatus === 'ACTIVE' && (
               <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-purple-500/20 bg-purple-500/5">
                 <Zap size={10} className="text-purple-500" fill="currentColor" />
                 <span className="text-[9px] font-bold text-purple-400 uppercase tracking-tighter">Nexus Overclock Active</span>
               </div>
             )}
             <span className="text-[9px] font-mono text-zinc-700 uppercase">Nexus Ultimate</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-[#0d0d0f]">
          {renderView()}
        </div>

        <footer className="h-6 border-t border-white/5 bg-[#09090b] flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Terminal size={10} className="text-blue-500" />
            <span className="text-[8px] font-mono text-zinc-700 truncate">
              {logs[0]?.message || 'Awaiting target selection...'}
            </span>
          </div>
        </footer>
      </main>

      {showScriptHub && stats.detectedGame && (
        <ScriptHub 
          game={stats.detectedGame} 
          onClose={() => setShowScriptHub(false)} 
          onToggleScript={toggleScript}
          onUpdateParam={updateParam}
        />
      )}
    </div>
  );
};

export default App;
