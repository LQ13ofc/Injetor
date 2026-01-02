import React from 'react';
import { PluginModule } from '../../types';

interface SecuritySuiteProps {
  addLog: (msg: string, level?: any, cat?: string) => void;
  enabledPlugins: PluginModule[];
}

const SecuritySuite: React.FC<SecuritySuiteProps> = () => {
  return (
    <div className="p-8 text-center text-muted">
      <h2 className="text-xl font-bold">Security Suite</h2>
      <p>Component loaded successfully.</p>
    </div>
  );
};

export default SecuritySuite;