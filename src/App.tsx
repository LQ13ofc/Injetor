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
  const { view, setView, stats, addLog } = useApp();
  const [showScriptHub, setShowScriptHub] = useState(false);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  const handleToggleScript = async (gameId: string, scriptId: string) => {
    if (stats.processStatus !== 'INJECTED') {
      addLog("Injection Required.", 'ERROR', 'EXEC');
      return;
    }
    // Lógica de toggle simplificada aqui...
    addLog(`Script ${scriptId} triggered on ${gameId}`, 'SUCCESS', 'RUNNER');
  };

  return (
    <div className="flex h-screen bg-[#0d0d0f] text-zinc-100 font-sans overflow-hidden select-none border border-white/5 rounded-xl shadow-2xl">
      <div className="absolute top-0 left-0 w-full h-8 titlebar-drag z-50 flex justify-end pr-4 pt-2">
         <WindowControls />
      </div>

      <Sidebar currentView={view} setView={setView} />
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar pt-8">
        {view === AppView.DASHBOARD && (
          <Dashboard onOpenHub={() => { setActiveGameId('roblox_god'); setShowScriptHub(true); }} />
        )}
        {view === AppView.EDITOR && <ScriptEditor />}
        {view === AppView.SECURITY && <SecuritySuite />}
        {view === AppView.PLUGINS && <PluginsPanel />}
        {view === AppView.LOGS && <ConsoleLogs />}
        {view === AppView.SETTINGS && <SettingsPanel />}
      </main>

      {showScriptHub && activeGameId && (
        <ScriptHub 
            game={INITIAL_GAME_LIBRARY[0]} 
            onClose={() => setShowScriptHub(false)}
            onToggleScript={handleToggleScript}
        />
      )}
    </div>
  );
};

export default App;