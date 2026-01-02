import React from 'react';
import { PluginModule } from '../../types';

interface ScriptEditorProps {
  addLog: (msg: string, level?: any, cat?: string) => void;
  enabledPlugins: PluginModule[];
}

const ScriptEditor: React.FC<ScriptEditorProps> = () => {
  return (
    <div className="p-8 text-center text-muted">
      <h2 className="text-xl font-bold">Script Editor</h2>
      <p>Component loaded successfully.</p>
    </div>
  );
};

export default ScriptEditor;