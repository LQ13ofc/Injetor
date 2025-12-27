
import React from 'react';
import { Package, CheckCircle2, Info, Gamepad2, Download } from 'lucide-react';
import { PluginModule, GamePack } from '../types';

interface PluginsPanelProps {
  addLog: (msg: string, level?: any, cat?: string) => void;
  plugins: PluginModule[];
  setPlugins: React.Dispatch<React.SetStateAction<PluginModule[]>>;
  gameLibrary: GamePack[];
  setGameLibrary: React.Dispatch<React.SetStateAction<GamePack[]>>;
}

const PluginsPanel: React.FC<PluginsPanelProps> = ({ addLog, plugins, setPlugins, gameLibrary, setGameLibrary }) => {
  const togglePlugin = (id: string) => {
    setPlugins(prev => prev.map(p => {
      if (p.id === id) {
        const newState = !p.enabled;
        addLog(`${newState ? 'Enabling' : 'Disabling'} ${p.name}...`, newState ? 'INFO' : 'WARN', 'PLUGINS');
        return { ...p, enabled: newState };
      }
      return p;
    }));
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-10">
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 italic">
            <Package className="text-blue-500" size={20} />
            Language Runtimes
          </h2>
          <p className="text-zinc-500 text-xs">Essential engines for script processing.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {plugins.map((plugin) => (
            <div key={plugin.id} onClick={() => togglePlugin(plugin.id)} className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${plugin.enabled ? 'bg-blue-600/5 border-blue-600/30' : 'bg-[#141417] border-white/5'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold ${plugin.enabled ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-600'}`}>
                  {plugin.id.toUpperCase()}
                </div>
                <span className="text-xs font-bold text-zinc-300">{plugin.name}</span>
              </div>
              <div className={`w-8 h-4 rounded-full relative ${plugin.enabled ? 'bg-blue-600' : 'bg-zinc-800'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${plugin.enabled ? 'left-4.5' : 'left-0.5'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 italic">
            <Gamepad2 className="text-purple-500" size={20} />
            Nexus Game Packs
          </h2>
          <p className="text-zinc-500 text-xs">Predefined script libraries and automated bypass profiles.</p>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {gameLibrary.map((game) => (
            <div key={game.id} className="bg-[#141417] border border-white/5 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-zinc-800 to-black border border-white/5 rounded-lg flex items-center justify-center">
                  <Gamepad2 size={16} className="text-zinc-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{game.name} Library</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-zinc-500 font-bold uppercase">{game.engine}</span>
                    <span className="text-[8px] bg-purple-500/10 px-1.5 py-0.5 rounded text-purple-400 font-bold uppercase">{game.scripts.length} SCRIPTS</span>
                  </div>
                </div>
              </div>
              <button className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold rounded flex items-center gap-2 transition-all">
                <CheckCircle2 size={12} className="text-green-500" />
                INSTALLED
              </button>
            </div>
          ))}
          <div className="p-4 border border-dashed border-white/10 rounded-xl flex items-center justify-center gap-3 text-zinc-600 hover:text-zinc-400 cursor-pointer transition-colors">
            <Download size={14} />
            <span className="text-xs font-bold">Import Custom Game Profile</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PluginsPanel;
