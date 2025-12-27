
import React from 'react';
import { Minus, Square, X } from 'lucide-react';

const WindowControls: React.FC = () => {
  const handleMinimize = () => {
    if (window.fluxAPI) window.fluxAPI.minimize();
  };

  const handleMaximize = () => {
    if (window.fluxAPI) window.fluxAPI.toggleMaximize();
  };

  const handleClose = () => {
    if (window.fluxAPI) window.fluxAPI.close();
  };

  return (
    <div className="flex items-center gap-1 no-drag relative z-[9999]">
      <button 
        onClick={handleMinimize} 
        className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
        title="Minimize"
      >
        <Minus size={14} strokeWidth={3} />
      </button>
      <button 
        onClick={handleMaximize} 
        className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
        title="Maximize"
      >
        <Square size={12} strokeWidth={3} />
      </button>
      <button 
        onClick={handleClose} 
        className="p-2 text-zinc-500 hover:text-white hover:bg-red-500 rounded-lg transition-all"
        title="Close"
      >
        <X size={14} strokeWidth={3} />
      </button>
    </div>
  );
};

export default WindowControls;
