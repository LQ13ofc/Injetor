import React from 'react';
import { GamePack } from '../../types';

interface ScriptHubProps {
  game: GamePack;
  currentPlatform: string;
  onClose: () => void;
  onToggleScript: (gameId: string, scriptId: string) => void;
  onUpdateParam: (gameId: string, scriptId: string, paramId: string, val: any) => void;
}

const ScriptHub: React.FC<ScriptHubProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-panel p-8 rounded-xl border border-border-dim">
        <h2 className="text-xl font-bold mb-4">Script Hub</h2>
        <button onClick={onClose} className="px-4 py-2 bg-blue-600 rounded">Close</button>
      </div>
    </div>
  );
};

export default ScriptHub;