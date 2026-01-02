import React from 'react';
import { LogEntry } from '../../types';

interface ConsoleLogsProps {
  logs: LogEntry[];
  clearLogs: () => void;
}

const ConsoleLogs: React.FC<ConsoleLogsProps> = ({ logs }) => {
  return (
    <div className="h-full bg-gray-900/40 p-4 font-mono text-xs overflow-y-auto custom-scrollbar">
      {logs.map((log) => (
        <div key={log.id} className="mb-1">
          <span className="text-gray-500">[{log.timestamp}]</span> <span className={log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARN' ? 'text-yellow-400' : 'text-gray-300'}>{log.message}</span>
        </div>
      ))}
    </div>
  );
};

export default ConsoleLogs;