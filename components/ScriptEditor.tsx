
import React, { useState } from 'react';
import { Play, Trash2, FileCode, ChevronDown, Save } from 'lucide-react';
import { PluginModule } from '../types';

interface ScriptEditorProps {
  addLog: (msg: string, level?: any, cat?: string) => void;
  enabledPlugins: PluginModule[];
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({ addLog, enabledPlugins }) => {
  const [code, setCode] = useState<string>(`print("Hello from Flux Core!")`);

  const handleExecute = () => {
    if ((window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      addLog('Sending script payload to pipe...', 'INFO', 'EXEC');
      ipcRenderer.send('execute-script', code);
    } else {
      addLog('Execution unavailable in web browser mode.', 'ERROR', 'ENV');
    }
  };

  return (
    <div className="h-full flex flex-col p-4 bg-[#0d0d0f]">
      <div className="flex items-center justify-between mb-3 bg-[#141417] p-2 rounded-lg border border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 border-r border-white/5 mr-1">
            <FileCode size={14} className="text-blue-500" />
            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-tighter italic">
              script.lua
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setCode('')} className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
            <Trash2 size={16} />
          </button>
          <div className="w-[1px] h-4 bg-white/10 mx-1" />
          <button onClick={handleExecute} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[11px] flex items-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 transition-all uppercase tracking-widest">
            <Play size={12} fill="currentColor" />
            Execute
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#09090b] rounded-xl border border-white/5 flex relative shadow-inner overflow-hidden">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="w-full h-full bg-transparent p-6 text-xs font-mono text-zinc-400 outline-none resize-none leading-relaxed selection:bg-blue-500/20"
          placeholder="-- Write your Lua script here..."
        />
      </div>
    </div>
  );
};

export default ScriptEditor;
