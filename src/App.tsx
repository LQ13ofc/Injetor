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
import { INITIAL_GAME_LIBRARY, INITIAL_RUNTIMES } from './data/constants';

const App: React.FC = () => {
  const { view, setView, stats, addLog, logs, clearLogs, settings, setSettings, setStats } = useApp();
  const [showScriptHub, setShowScriptHub] = useState(false);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [plugins, setPlugins] = useState<PluginModule[]>(INITIAL_RUNTIMES);
  const [gameLibrary, setGameLibrary] = useState<GamePack[]>(INITIAL_GAME_LIBRARY);

  const handleToggleScript = async (gameId: string, scriptId: string) => {
    if (stats.processStatus !== 'INJECTED') {
      addLog("Injection Required to execute scripts.", 'ERROR', 'EXEC');
      return;
    }
    
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

  const handleUpdateParam = (gameId: string, scriptId: string, paramId: string, val: any) => {
    setGameLibrary(prev => prev.map(g => {
        if (g.id === gameId) {
            return {
                ...g,
                scripts: g.scripts.map(s => {
                    if (s.id === scriptId && s.params) {
                        return {
                            ...s,
                            params: s.params.map(p => p.id === paramId ? { ...p, value: val } : p)
                        };
                    }
                    return s;
                })
            };
        }
        return g;
    }));
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
             onOpenHub={() => { 
                const roblox = gameLibrary.find(g => g.id === 'roblox');
                if (roblox) {
                    setActiveGameId('roblox');
                    setShowScriptHub(true); 
                }
             }} 
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
            onUpdateParam={handleUpdateParam}
        />
      )}
    </div>
  );
};

export default App;