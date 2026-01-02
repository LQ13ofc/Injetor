import React from 'react';
import { Settings, Zap, FolderOpen, Target, Cpu } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InjectionMethod, InjectionErrorCode } from '../../types';

const ConfigurationPanel: React.FC = () => {
  const { stats, setStats, settings, setSettings, addLog } = useApp();
  const [isInjecting, setIsInjecting] = React.useState(false);

  const processName = stats.target.process?.name || "";
  const dllPath = stats.target.dllPath || "";
  const status = stats.processStatus;

  const handleInject = async () => {
    if (!stats.target.process) {
        addLog('No target process selected.', 'WARN');
        return;
    }
    
    setIsInjecting(true);
    setStats(prev => ({...prev, processStatus: 'ATTACHING'}));
    addLog(`Starting injection sequence for ${processName}...`, 'INFO');
    
    try {
        const result = await window.fluxAPI.inject(stats.target.process.pid, dllPath, settings);

        if (result.success) {
            setStats(prev => ({...prev, processStatus: 'INJECTED', pipeConnected: true}));
            addLog(`Injection Successful!`, 'SUCCESS');
        } else {
            setStats(prev => ({...prev, processStatus: 'ERROR'}));
            let userMsg = result.error;
            if(result.code === InjectionErrorCode.ACCESS_DENIED) userMsg = "Access Denied: Try running as Administrator.";
            addLog(`Injection Failed: ${userMsg}`, 'ERROR');
        }
    } catch (e: any) {
        setStats(prev => ({...prev, processStatus: 'ERROR'}));
        addLog(`Critical Failure: ${e.message}`, 'ERROR');
    } finally {
        setIsInjecting(false);
    }
  };

  return (
    <div className="h-full bg-gray-800/30 rounded-xl backdrop-blur-md border border-gray-700/50 flex flex-col p-5 shadow-inner">
      <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
        <Settings className="w-5 h-5 text-gray-400" />
        <h2 className="text-sm font-bold text-gray-200 uppercase tracking-widest">Configuration</h2>
      </div>

      <div className="space-y-6 flex-1">
        {/* Target Process */}
        <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <Target size={12} /> Target Process
            </label>
            <input
                type="text"
                value={processName}
                readOnly
                className="w-full bg-black/40 border border-gray-700/50 rounded-lg px-3 py-2.5 text-xs text-cyan-300 font-mono outline-none"
                placeholder="Select from Dashboard..."
            />
        </div>

        {/* DLL Path */}
        <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <FolderOpen size={12} /> Payload (DLL)
            </label>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={dllPath || "Internal Engine"}
                    readOnly
                    className="flex-1 bg-black/40 border border-gray-700/50 rounded-lg px-3 py-2.5 text-xs text-gray-300 font-mono outline-none truncate"
                />
            </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {/* Status Display */}
        <div className="p-3 bg-black/40 rounded-lg border border-gray-800 flex justify-between items-center">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Engine Status</span>
            <span className={`text-xs font-bold ${
                status === 'INJECTED' ? 'text-green-500' : 
                status === 'ERROR' ? 'text-red-500' : 
                status === 'ATTACHING' ? 'text-yellow-500' : 'text-gray-400'
            }`}>
                {status}
            </span>
        </div>

        {/* Inject Button */}
        <button
            onClick={handleInject}
            disabled={isInjecting || status === 'INJECTED'}
            className={`w-full py-3.5 rounded-lg font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
                isInjecting || status === 'INJECTED'
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-900/20 active:scale-95'
            }`}
        >
            <Zap className={`w-4 h-4 ${isInjecting ? 'animate-pulse' : 'fill-current'}`} />
            {isInjecting ? 'EXECUTING...' : 'INJECT PAYLOAD'}
        </button>
      </div>
    </div>
  );
};

export default ConfigurationPanel;