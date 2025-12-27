
import React, { useState, useEffect } from 'react';
import { 
  Zap, Target, Search, RefreshCw, Activity,
  FileCode, FolderOpen, PlayCircle, Ghost, ShieldAlert, AlertTriangle
} from 'lucide-react';
import { SystemStats, ProcessInfo, AppSettings } from '../types';

interface DashboardProps {
  stats: SystemStats;
  setStats: React.Dispatch<React.SetStateAction<SystemStats>>;
  addLog: (msg: string, level?: any, cat?: string) => void;
  onOpenHub: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, setStats, addLog, onOpenHub, settings, setSettings }) => {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showProcessList, setShowProcessList] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  
  // Função para buscar processos REAIS
  const fetchProcesses = async () => {
    setIsScanning(true);
    
    if ((window as any).require) {
        try {
            const { ipcRenderer } = (window as any).require('electron');
            const list = await ipcRenderer.invoke('get-processes');
            
            if (Array.isArray(list)) {
                setProcesses(list);
            } else {
                addLog('System Scan returned invalid data structure.', 'ERROR', 'SYSTEM');
            }
        } catch (e: any) {
            // Error string is now robustly passed from main process
            const errorMsg = e.message || e.toString();
            if (!errorMsg.includes("Tasklist failed") && !errorMsg.includes("PS failed")) {
                 addLog(`Scan Error: ${errorMsg}`, 'ERROR', 'SYSTEM');
            }
            // Keep previous list if failed to prevent flickering, or empty if critical
            if (processes.length === 0) setProcesses([]); 
        }
    } else {
        // Fallback visual apenas para navegador
        setProcesses([
            { name: 'Waiting for Electron Backend...', pid: 0, memory: '0 MB', session: 0, title: 'Simulation Mode' }
        ]);
    }
    
    setIsScanning(false);
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectDll = async () => {
    if ((window as any).require) {
        const { ipcRenderer } = (window as any).require('electron');
        try {
            const path = await ipcRenderer.invoke('select-dll');
            if (path) {
                setStats(prev => ({ ...prev, target: { ...prev.target, dllPath: path } }));
                addLog(`Custom Payload Loaded: ${path.split(/[/\\]/).pop()}`, 'INFO', 'LOADER');
            }
        } catch (e: any) {
            addLog(`Dialog Error: ${e.message}`, 'ERROR', 'UI');
        }
    }
  };

  const handleInject = async () => {
    if (!stats.target.process) {
      addLog('ABORTED: Select a target process first.', 'WARN', 'CORE');
      setShowProcessList(true);
      return;
    }

    const currentDll = stats.target.dllPath || "Nexus_Internal_Bypass.dll";
    const usingInternal = !stats.target.dllPath;

    addLog(`Initiating Injection -> ${stats.target.process.title || stats.target.process.name} (PID: ${stats.target.process.pid})`, 'INFO', 'KERNEL');
    if (usingInternal) addLog('Payload: Internal Universal Bypass (Auto-Selected)', 'INFO', 'LOADER');

    setStats(p => ({ ...p, processStatus: 'ATTACHING' }));

    if ((window as any).require) {
        try {
            const { ipcRenderer } = (window as any).require('electron');
            
            const result = await ipcRenderer.invoke('inject-dll', {
                pid: stats.target.process.pid,
                processName: stats.target.process.name,
                dllPath: usingInternal ? 'INTERNAL_MOCK_PATH' : currentDll,
                method: settings.injectionMethod,
                settings: settings
            });

            if (result.success) {
                addLog(result.message, 'SUCCESS', 'INJECTOR');
                setStats(p => ({ ...p, processStatus: 'INJECTED' }));
                // Delay para abrir o hub visualmente após sucesso
                setTimeout(() => onOpenHub(), 800);
            } else {
                addLog(`Injection Failed: ${result.error}`, 'ERROR', 'INJECTOR');
                setStats(p => ({ ...p, processStatus: 'ERROR' }));
            }
        } catch (e: any) {
            addLog(`Critical Exception: ${e.message}`, 'CRITICAL', 'SYSTEM');
            setStats(p => ({ ...p, processStatus: 'ERROR' }));
        }
    } else {
        // Simulação Browser
        setTimeout(() => {
            addLog('Thread Hijack Successful (Browser Simulation).', 'SUCCESS', 'INJECTOR');
            setStats(p => ({ ...p, processStatus: 'INJECTED' }));
            setTimeout(() => onOpenHub(), 500);
        }, 1000);
    }
  };

  const selectProcess = (proc: ProcessInfo) => {
    setStats(prev => ({ ...prev, target: { ...prev.target, process: proc } }));
    setShowProcessList(false);
    addLog(`Target Locked: ${proc.title || proc.name} [PID: ${proc.pid}]`, 'INFO', 'USER');
  };

  const filteredProcesses = processes.filter(p => 
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
    (p.title && p.title.toLowerCase().includes(searchFilter.toLowerCase())) ||
    p.pid.toString().includes(searchFilter)
  );

  const isOsMismatch = stats.target.process?.name.endsWith('.exe') && stats.currentPlatform !== 'win32';

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracking-tight italic flex items-center gap-2">
          <Zap size={20} className="text-blue-500" />
          Dashboard
        </h2>
        <div className="flex items-center gap-3">
             <div className="px-3 py-1 rounded-full border border-green-500/20 bg-green-500/10 text-green-400 flex items-center gap-2">
                <Activity size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest">SYSTEM READY</span>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
            
            {/* Target Selector */}
            <div className="bg-[#141417] border border-white/5 p-4 rounded-xl relative group hover:border-white/10 transition-colors z-20 shadow-lg shadow-black/20">
                <div className="flex items-center justify-between mb-3 text-zinc-500">
                    <div className="flex items-center gap-2">
                        <Target size={14} className="text-blue-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Target Process</span>
                    </div>
                    <button onClick={fetchProcesses} className="p-1 hover:bg-white/5 rounded text-zinc-400 hover:text-white transition-colors" title="Refresh List">
                        <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
                    </button>
                </div>
                
                <div className="relative">
                    <div 
                    onClick={() => setShowProcessList(!showProcessList)}
                    className={`w-full bg-black/40 border hover:border-blue-500/50 rounded-lg p-3 text-sm font-mono flex items-center justify-between cursor-pointer transition-all ${showProcessList ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-white/10'}`}
                    >
                    <div className="flex items-center gap-3 overflow-hidden">
                        {stats.target.process ? (
                            <>
                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
                                <span className="text-white truncate font-bold">{stats.target.process.title || stats.target.process.name}</span>
                                <span className="text-zinc-500 text-xs ml-2">({stats.target.process.pid})</span>
                                {isOsMismatch && (
                                    <div className="ml-auto flex items-center gap-1 text-orange-500" title="Warning: Target is a Windows executable but you are on Unix. Injection may fail without Wine/Proton.">
                                        <AlertTriangle size={12} />
                                        <span className="text-[9px] font-bold hidden sm:inline">COMPAT RISK</span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <span className="text-zinc-500 italic">Click to select process...</span>
                        )}
                    </div>
                    <Search size={14} className="text-zinc-600 shrink-0" />
                    </div>

                    {showProcessList && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-[#1a1a1f]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl z-50 max-h-64 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                        <input 
                        autoFocus
                        className="w-full bg-[#121215] p-3 text-xs border-b border-white/10 outline-none text-white font-mono placeholder:text-zinc-700"
                        placeholder="Filter processes (Name or Window Title)..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        />
                        <div className="overflow-y-auto custom-scrollbar">
                        {filteredProcesses.length > 0 ? (
                            filteredProcesses.map((proc) => (
                                <button
                                key={proc.pid}
                                onClick={() => selectProcess(proc)}
                                className="w-full text-left px-4 py-3 text-xs font-mono text-zinc-300 hover:bg-blue-600/10 hover:text-blue-400 transition-colors border-b border-white/[0.02] flex justify-between items-center group"
                                >
                                <div className="flex flex-col overflow-hidden">
                                    <span className="group-hover:translate-x-1 transition-transform text-white font-bold truncate">{proc.title || proc.name}</span>
                                    {proc.title && <span className="text-[9px] text-zinc-500 group-hover:translate-x-1 transition-transform truncate">{proc.name}</span>}
                                </div>
                                <span className="opacity-40 ml-2 shrink-0">{proc.pid}</span>
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-[10px] text-zinc-600">
                                {isScanning ? 'Scanning...' : 'No active applications found.'}
                            </div>
                        )}
                        </div>
                    </div>
                    )}
                </div>
            </div>

            {/* DLL Selector */}
            <div className="bg-[#141417] border border-white/5 p-4 rounded-xl hover:border-white/10 transition-colors z-10">
                <div className="flex items-center gap-2 mb-3 text-zinc-500">
                    <FileCode size={14} className="text-purple-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Payload Configuration</span>
                </div>
                <div className="flex gap-2">
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono text-zinc-400 truncate flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${stats.target.dllPath ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]'}`} />
                        {stats.target.dllPath 
                            ? stats.target.dllPath.split(/[/\\]/).pop()
                            : 'Auto-Select: Universal Internal Bypass (v5.0)'}
                    </div>
                    <button 
                        onClick={handleSelectDll} 
                        className="px-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors border border-white/5 hover:border-white/20 flex items-center gap-2"
                        title="Select custom DLL/SO/DYLIB"
                    >
                        <FolderOpen size={16} />
                    </button>
                </div>
                <p className="mt-2 text-[9px] text-zinc-600 ml-1">
                    * Supports .dll (Win), .so (Linux), .dylib (Mac)
                </p>
            </div>
        </div>

        {/* Action Button */}
        <div className={`lg:col-span-1 bg-[#121215] border rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-6 transition-all duration-500 relative overflow-hidden ${
            stats.processStatus === 'INJECTED' ? 'border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.05)]' : 'border-white/5'
        }`}>
            <div className={`absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent transition-opacity duration-500 ${stats.processStatus === 'INJECTED' ? 'opacity-0' : 'opacity-100'}`} />
            <div className={`absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent transition-opacity duration-500 ${stats.processStatus === 'INJECTED' ? 'opacity-100' : 'opacity-0'}`} />

            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all relative z-10 ${
            stats.processStatus === 'INJECTED' ? 'bg-green-500/10 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 
            stats.processStatus === 'ERROR' ? 'bg-red-500/10 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' :
            'bg-blue-600/10 text-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)]'
            }`}>
            {stats.processStatus === 'INJECTED' ? <Ghost size={40} /> : stats.processStatus === 'ERROR' ? <ShieldAlert size={40} /> : <Zap size={40} fill="currentColor" />}
            </div>
            
            <div className="space-y-2 relative z-10">
            <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">
                {stats.processStatus === 'INJECTED' ? 'INJECTED' : 
                 stats.processStatus === 'ERROR' ? 'FAILED' :
                 'READY'}
            </h3>
            <p className="text-zinc-500 text-[11px] max-w-xs mx-auto leading-relaxed font-bold uppercase tracking-wide">
                {stats.processStatus === 'INJECTED' 
                ? 'Internal Engine Active. Press INSERT to toggle Menu.' 
                : 'Stealth Execution Environment Ready.'}
            </p>
            </div>

            <div className="w-full flex flex-col gap-3 max-w-xs relative z-10">
            <button 
                onClick={handleInject}
                disabled={stats.processStatus === 'INJECTED' || stats.processStatus === 'ATTACHING'}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-black transition-all text-xs tracking-[0.2em] uppercase ${
                stats.processStatus === 'INJECTED' 
                ? 'bg-zinc-900 text-green-500 cursor-default border border-green-500/20' 
                : stats.processStatus === 'ERROR' 
                ? 'bg-red-900/20 text-red-500 border border-red-500/20 hover:bg-red-900/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98]'
                } disabled:opacity-50`}
            >
                {stats.processStatus === 'ATTACHING' ? (
                    <RefreshCw size={14} className="animate-spin" />
                ) : (
                    <PlayCircle size={14} fill="currentColor" />
                )}
                {stats.processStatus === 'INJECTED' ? 'ATTACHED' : stats.processStatus === 'ATTACHING' ? 'INJECTING...' : 'EXECUTE'}
            </button>
            
            {stats.processStatus === 'INJECTED' && (
                <button onClick={onOpenHub} className="w-full py-3 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/20 rounded-xl font-bold text-xs uppercase tracking-widest transition-all animate-in fade-in slide-in-from-bottom-2">
                Open Script Menu
                </button>
            )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
