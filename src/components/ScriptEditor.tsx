import React, { useState } from 'react';
import { Play, Trash2, FileCode } from 'lucide-react';
import { PluginModule } from '../types';

interface ScriptEditorProps {
  addLog: (msg: string, level?: any, cat?: string) => void;
  enabledPlugins: PluginModule[];
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({ addLog }) => {
  const [code, setCode] = useState<string>(`print("Hello from Flux Core!")`);

  const handleExecute = async () => {
    if (window.fluxAPI) {
      addLog('Encrypting and sending payload via Secure Bridge...', 'INFO', 'EXEC');
      
      try {
        const result = await window.fluxAPI.executeScript(code);
        if (result.success) {
            addLog('Script execution acknowledged by kernel.', 'SUCCESS', 'EXEC');
        } else {
            addLog(`Execution Error: ${result.error}`, 'ERROR', 'EXEC');
        }
      } catch (e: any) {
        addLog(`Secure Bridge Failure: ${e.message || e}`, 'ERROR', 'EXEC');
      }
    } else {
      addLog('Execution unavailable in web browser mode.', 'ERROR', 'ENV');
    }
  };

  return (
    <div className="h-full flex flex-col p-8 max-w-7xl mx-auto gap-4">
      <div className="flex items-center justify-between mb-2 bg-[#141417] p-4 rounded-2xl border border-white/5 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileCode size={18} className="text-blue-500" />
            </div>
            <div>
                 <span className="block text-[11px] font-black text-white uppercase tracking-tighter italic">script.lua</span>
                 <span className="block text-[9px] text-zinc-500 font-mono">WORKSPACE / LOCAL</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setCode('')} className="p-3 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all" title="Clear Editor">
            <Trash2 size={18} />
          </button>
          <div className="w-[1px] h-6 bg-white/10 mx-2" />
          <button onClick={handleExecute} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[11px] flex items-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 transition-all uppercase tracking-widest">
            <Play size={14} fill="currentColor" />
            Execute
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#09090b] rounded-2xl border border-white/5 flex relative shadow-inner overflow-hidden ring-1 ring-white/[0.02]">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="w-full h-full bg-transparent p-6 text-sm font-mono text-zinc-400 outline-none resize-none leading-relaxed selection:bg-blue-500/20 focus:text-zinc-200 transition-colors custom-scrollbar"
          placeholder="-- Write your Lua script here..."
        />
      </div>
    </div>
  );
};

export default ScriptEditor;