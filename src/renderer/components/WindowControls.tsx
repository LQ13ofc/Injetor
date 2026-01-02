import React from 'react';
import { Minus, Square, X } from 'lucide-react';

const WindowControls: React.FC = () => {
  return (
    <div className="flex gap-1 no-drag">
      <button onClick={() => window.fluxAPI.minimize()} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
        <Minus size={12} />
      </button>
      <button onClick={() => window.fluxAPI.toggleMaximize()} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
        <Square size={12} />
      </button>
      <button onClick={() => window.fluxAPI.close()} className="p-1.5 hover:bg-red-500 rounded text-gray-400 hover:text-white transition-colors">
        <X size={12} />
      </button>
    </div>
  );
};

export default WindowControls;