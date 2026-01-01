import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ScriptEditor from './components/ScriptEditor';
import SecuritySuite from './components/SecuritySuite';
import PluginsPanel from './components/PluginsPanel';
import ConsoleLogs from './components/ConsoleLogs';
import ScriptHub from './components/ScriptHub';
import SettingsPanel from './components/SettingsPanel';
import WindowControls from './components/WindowControls';
import { AppView, GamePack, PluginModule } from './types';
import { useApp } from './context/AppContext';

const INITIAL_GAME_LIBRARY: GamePack[] = [
  { 
      id: 'roblox_god', 
      name: 'Roblox God Mode', 
      processName: 'RobloxPlayerBeta.exe', 
      installed: true,
      engine: 'Luau',
      bypassMethod: 'Hyperion Thread Hijack',
      scripts: [
          { id: 'god_main', name: 'Enable God Suite (Fly/ESP)', enabled: false, code: '-- Lua God Mode code' },
          { id: 'inf_jump', name: 'Infinite Jump', enabled: false, code: 'game:GetService("UserInputService").JumpRequest:Connect(function() game.Players.LocalPlayer.Character:FindFirstChildOfClass("Humanoid"):ChangeState(3) end)' }
      ]
  }
];

const App: React.FC = () => {
  const { view, setView, stats, addLog, logs, clearLogs, settings, setSettings, setStats } = useApp();
  const [showScriptHub, setShowScriptHub] = useState(false);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [plugins, setPlugins] = useState<PluginModule[]>([
    { id: 'lua', name: 'Luau (Flux)', description: 'Roblox Optimized Engine.', enabled: true, version: '5.1.4', type: 'Scripting' },
    { id: 'asm', name: 'x64 Assembly', description: 'Direct shellcode execution.', enabled: true, version: 'NASM', type: 'Machine Code' },
  ]);
  const [gameLibrary, setGameLibrary] = useState<GamePack[]>(INITIAL_GAME_LIBRARY);

  const handleToggleScript = async (gameId: string, scriptId: string) => {
    if (stats.processStatus !== 'INJECTED') {
      addLog("Injection Required to execute scripts.", 'ERROR', 'EXEC');
      return;
    }
    // Lógica simplificada de toggle
    setGameLibrary(prev => prev.map(g => {
        if (g.id === gameId) {
            return {
                ...g,
                scripts: g.scripts.map(s => {
                    if(s.id === scriptId) {
                        const newState = !s.enabled;
                        if(newState && s.code) {
                             if(window.fluxAPI) {
                                 window.fluxAPI.executeScript(s.code).then(res => {
                                     if(res.success) addLog(`Executed module: ${s.name}`, 'SUCCESS', 'LUA');
                                     else addLog(`Module failed: ${res.error}`, 'ERROR', 'LUA');
                                 });
                             }
                        }
                        return {...s, enabled: newState};
                    }
                    return s;
                })
            }
        }
        return g;
    }));
  };

  const handleToggleGame = (id: string) => {
      setGameLibrary(prev => prev.map(g => g.id === id ? { ...g, installed: !g.installed } : g));
  };

  return (
    <div className="flex h-screen bg-[#0d0d0f] text-zinc-100 font-sans overflow-hidden select-none border border-white/5 rounded-xl shadow-2xl">
      <div className="absolute top-0 left-0 w-full h-8 titlebar-drag z-50 flex justify-end pr-4 pt-2">
         <WindowControls />
      </div>

      <Sidebar currentView={view} setView={setView} />
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar pt-8">
        {view === AppView.DASHBOARD && (
          <Dashboard 
             stats={stats} 
             setStats={setStats} 
             addLog={addLog}
             settings={settings}
             setSettings={setSettings}
             onOpenHub={() => { setActiveGameId('roblox_god'); setShowScriptHub(true); }} 
          />
        )}
        {view === AppView.EDITOR && <ScriptEditor addLog={addLog} enabledPlugins={plugins} />}
        {view === AppView.SECURITY && <SecuritySuite addLog={addLog} enabledPlugins={plugins} />}
        {view === AppView.PLUGINS && (
            <PluginsPanel 
                addLog={addLog} 
                plugins={plugins} 
                setPlugins={setPlugins} 
                gameLibrary={gameLibrary} 
                onToggleGame={handleToggleGame} 
            />
        )}
        {view === AppView.LOGS && <ConsoleLogs logs={logs} clearLogs={clearLogs} />}
        {view === AppView.SETTINGS && <SettingsPanel settings={settings} setSettings={setSettings} stats={stats} addLog={addLog} />}
      </main>

      {showScriptHub && activeGameId && (
        <ScriptHub 
            game={gameLibrary.find(g => g.id === activeGameId)!} 
            currentPlatform="win32"
            onClose={() => setShowScriptHub(false)}
            onToggleScript={handleToggleScript}
            onUpdateParam={() => {}}
        />
      )}
    </div>
  );
};

export default App;