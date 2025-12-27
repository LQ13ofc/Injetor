
import React, { useState, useEffect, useRef } from 'react';
import { X, Box, Pin, Zap, Terminal, Search, MousePointer2, Settings2, Sliders, ChevronDown, ChevronUp, GripHorizontal } from 'lucide-react';
import { GamePack, GameScript } from '../types';

interface ScriptHubProps {
  game: GamePack;
  onClose: () => void;
  onToggleScript: (gameId: string, scriptId: string) => void;
  onUpdateParam: (gameId: string, scriptId: string, paramId: string, val: any) => void;
}

const ScriptHub: React.FC<ScriptHubProps> = ({ game, onClose, onToggleScript, onUpdateParam }) => {
  const [isPinned, setIsPinned] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedScript, setExpandedScript] = useState<string | null>(null);
  
  // Dragging logic
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 225, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.initialX + dx,
        y: dragRef.current.initialY + dy
      });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const filteredScripts = game.scripts.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div 
      style={{ left: position.x, top: position.y }}
      className={`fixed ${isPinned ? 'z-[9999]' : 'z-[500]'} w-[450px] bg-[#0d0d11]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300`}
    >
      {/* Draggable Header */}
      <div 
        onMouseDown={handleMouseDown}
        className="bg-[#14141a] border-b border-white/5 p-5 flex items-center justify-between cursor-move relative active:cursor-grabbing"
      >
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
            <Box size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-tight uppercase italic flex items-center gap-2">
              {game.name} Nexus Pack
            </h3>
            <div className="flex gap-2">
              <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-widest">{game.engine} / v2.1.0</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsPinned(!isPinned)}
            className={`p-2 rounded-xl transition-all ${isPinned ? 'text-blue-400 bg-blue-400/10' : 'text-zinc-600 hover:text-white hover:bg-white/5'}`}
            title="Force Always on Top"
          >
            <Pin size={18} />
          </button>
          <button onClick={onClose} className="p-2 text-zinc-600 hover:text-white hover:bg-red-500/20 rounded-xl transition-colors">
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Control Strip */}
      <div className="px-5 py-4 bg-black/30 border-b border-white/5 flex items-center gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={14} />
          <input 
            type="text" 
            placeholder="Search script library..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111114] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs font-mono text-zinc-400 outline-none focus:border-blue-500/30 transition-all placeholder:text-zinc-700"
          />
        </div>
      </div>

      {/* Script Window Content */}
      <div className="max-h-[500px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {filteredScripts.map((script) => (
          <div 
            key={script.id}
            className={`rounded-2xl border transition-all ${
              script.enabled 
                ? 'bg-blue-600/5 border-blue-600/30 shadow-[inset_0_0_20px_rgba(37,99,235,0.05)]' 
                : 'bg-black/20 border-white/[0.03] hover:border-white/10'
            }`}
          >
            {/* Script Toggle Row */}
            <div 
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => onToggleScript(game.id, script.id)}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl transition-all ${
                  script.enabled ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30 scale-105' : 'bg-zinc-800 text-zinc-600'
                }`}>
                  <Zap size={14} fill={script.enabled ? "currentColor" : "none"} />
                </div>
                <div>
                  <h4 className={`text-[11px] font-black uppercase tracking-tight ${script.enabled ? 'text-white' : 'text-zinc-500'}`}>
                    {script.name}
                  </h4>
                  <p className="text-[9px] font-bold text-zinc-600 uppercase">Status: {script.enabled ? 'ENABLED' : 'STBY'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {script.params && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedScript(expandedScript === script.id ? null : script.id);
                    }}
                    className="p-2 text-zinc-600 hover:text-white transition-colors"
                  >
                    {expandedScript === script.id ? <ChevronUp size={16}/> : <Settings2 size={16}/>}
                  </button>
                )}
                <div className={`w-9 h-5 rounded-full relative transition-all duration-500 ${script.enabled ? 'bg-blue-600' : 'bg-zinc-800'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${script.enabled ? 'left-5' : 'left-1'}`} />
                </div>
              </div>
            </div>

            {/* Script Parameters Drawer */}
            {expandedScript === script.id && script.params && (
              <div className="px-4 pb-5 pt-1 space-y-4 border-t border-white/5 animate-in slide-in-from-top-1 duration-200">
                {script.params.map((p) => (
                  <div key={p.id} className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-zinc-500 uppercase italic">{p.label}</label>
                      <span className="text-[10px] font-mono text-blue-500 font-bold">{p.value}</span>
                    </div>
                    {p.type === 'slider' ? (
                      <input 
                        type="range" 
                        min={p.min} 
                        max={p.max} 
                        value={p.value}
                        onChange={(e) => onUpdateParam(game.id, script.id, p.id, e.target.value)}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    ) : (
                      <input 
                        type="text"
                        value={p.value}
                        onChange={(e) => onUpdateParam(game.id, script.id, p.id, e.target.value)}
                        placeholder="Enter value..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-xs font-mono text-zinc-300 outline-none focus:border-blue-500/40"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Visual Footer */}
      <div className="p-4 bg-[#14141a]/50 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal size={12} className="text-blue-500" />
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter italic">Bypass: {game.bypassMethod}</span>
        </div>
        <div className="flex items-center gap-2">
          <GripHorizontal size={12} className="text-zinc-800" />
        </div>
      </div>
    </div>
  );
};

export default ScriptHub;
