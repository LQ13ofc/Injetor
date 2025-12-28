
import React, { useState } from 'react';
import { Package, CheckCircle2, Gamepad2, Download, ShieldCheck, RefreshCw } from 'lucide-react';
import { PluginModule, GamePack } from '../types';

interface PluginsPanelProps {
  addLog: (msg: string, level?: any, cat?: string) => void;
  plugins: PluginModule[];
  setPlugins: React.Dispatch<React.SetStateAction<PluginModule[]>>;
  gameLibrary: GamePack[];
  onToggleGame: (id: string) => void;
}

const PluginsPanel: React.FC<PluginsPanelProps> = ({ addLog, plugins, setPlugins, gameLibrary, onToggleGame }) => {
  const [isChecking, setIsChecking] = useState(false);

  const togglePlugin = (id: string) => {
    setPlugins(prev => prev.map(p => {
      if (p.id === id) {
        const newState = !p.enabled;
        addLog(`${newState ? 'Enabling' : 'Disabling'} ${p.name}...`, newState ? 'SUCCESS' : 'WARN', 'PLUGINS');
        return { ...p, enabled: newState };
      }
      return p;
    }));
  };

  const checkForUpdates = async () => {
    setIsChecking(true);
    addLog("Checking for GamePack definitions update...", "INFO", "UPDATER");
    try {
        const response = await fetch('https://raw.githubusercontent.com/nexus-team/definitions/main/updates.json');
        if (response.ok) {
            addLog("Definitions are up to date.", "SUCCESS", "UPDATER");
        } else {
            addLog("Failed to fetch remote definitions (404).", "ERROR", "UPDATER");
        }
    } catch (e) {
        addLog("Update check failed: Network Error", "ERROR", "UPDATER");
    } finally {
        setTimeout(() => setIsChecking(false), 1000);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-8">
      <div className="max-w-5xl mx-auto space-y-12 pb-12 animate-in fade-in slide-in-from-bottom-2">
        
        {/* RUNTIMES */}
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
               <Package className="text-blue-500" size={24} />
               <h2 className="text-xl font-black text-content uppercase italic tracking-tight">Nexus Language Runtimes</h2>
            </div>
            <p className="text-muted text-[10px] font-black uppercase tracking-widest ml-9">Active execution layers and JIT compilers.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {plugins.map((plugin) => (
              <div 
                key={plugin.id} 
                onClick={() => togglePlugin(plugin.id)} 
                className={`flex flex-col p-6 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden ${
                  plugin.enabled 
                  ? 'bg-blue-600/5 border-blue-600/30 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]' 
                  : 'bg-panel border-border-dim opacity-50 grayscale hover:grayscale-0 hover:opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black shadow-lg ${plugin.enabled ? 'bg-blue-600 text-white' : 'bg-sidebar text-muted'}`}>
                      {plugin.id.toUpperCase()}
                    </div>
                    <div>
                      <span className={`text-xs font-black uppercase tracking-tight block ${plugin.enabled ? 'text-content' : 'text-muted'}`}>{plugin.name}</span>
                      <span className="text-[9px] font-bold text-muted uppercase tracking-widest">{plugin.type} v{plugin.version}</span>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full relative transition-all ${plugin.enabled ? 'bg-blue-600' : 'bg-sidebar border border-border-dim'}`}>
                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${plugin.enabled ? 'left-6' : 'left-1'}`} />
                  </div>
                </div>
                <p className="text-[11px] text-muted leading-relaxed italic">{plugin.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* GAMES */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                <Gamepad2 className="text-purple-500" size={24} />
                <h2 className="text-xl font-black text-content uppercase italic tracking-tight">Game Execution Packs</h2>
                </div>
                <p className="text-muted text-[10px] font-black uppercase tracking-widest ml-9">Predefined logic libraries and QoL profiles.</p>
            </div>
            <button 
                onClick={checkForUpdates}
                disabled={isChecking}
                className="flex items-center gap-2 px-4 py-2 bg-sidebar hover:bg-main border border-border-dim rounded-xl text-[10px] font-black uppercase text-muted hover:text-content transition-all"
            >
                <RefreshCw size={12} className={isChecking ? 'animate-spin' : ''} />
                Check Updates
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {gameLibrary.map((game) => (
              <div key={game.id} className={`bg-panel border p-6 rounded-3xl flex items-center justify-between transition-all ${game.installed ? 'border-purple-500/20 shadow-xl' : 'border-border-dim opacity-60'}`}>
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 border rounded-2xl flex items-center justify-center transition-all ${game.installed ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' : 'bg-sidebar border-border-dim text-muted'}`}>
                    <Gamepad2 size={28} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className={`text-base font-black uppercase italic tracking-tighter ${game.installed ? 'text-content' : 'text-muted'}`}>{game.name} Elite Pack</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[9px] bg-main/50 px-2.5 py-1 rounded-lg text-muted font-black uppercase tracking-widest border border-border-dim">{game.engine}</span>
                      <span className="text-[9px] bg-purple-500/10 px-2.5 py-1 rounded-lg text-purple-400 font-black uppercase tracking-widest border border-purple-500/10">{game.scripts.length} MODULES</span>
                      {game.installed && (
                        <span className="text-[9px] bg-green-500/10 px-2.5 py-1 rounded-lg text-green-500 font-black uppercase tracking-widest border border-green-500/10 flex items-center gap-1">
                          <ShieldCheck size={10} /> STEALTH VERIFIED
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => onToggleGame(game.id)}
                  className={`px-6 py-3 text-[10px] font-black rounded-2xl flex items-center gap-2 transition-all uppercase tracking-[0.1em] shadow-lg active:scale-95 ${
                    game.installed 
                    ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20 hover:bg-purple-600/20 shadow-purple-900/10' 
                    : 'bg-sidebar hover:bg-main text-muted hover:text-content'
                  }`}
                >
                  {game.installed ? <CheckCircle2 size={16} /> : <Download size={16} />}
                  {game.installed ? 'ACTIVE' : 'INSTALL'}
                </button>
              </div>
            ))}
            <div className="p-8 border-2 border-dashed border-border-dim rounded-3xl flex items-center justify-center gap-3 text-muted hover:text-content hover:border-blue-500/30 hover:bg-main/50 cursor-pointer transition-all group">
              <Download size={20} className="group-hover:translate-y-1 transition-transform" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">Import Remote Game Definition (.json)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PluginsPanel;
