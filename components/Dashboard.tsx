
import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Target, Search, RefreshCw, Box, BrainCircuit, Activity,
  Wifi, CheckCircle2, XCircle, FileCode, FolderOpen, PlayCircle, ShieldAlert, Settings2, Ghost
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

// Mock Data for Browser Preview
const MOCK_PROCESSES: ProcessInfo[] = [
    { name: 'chrome.exe', pid: 1240, memory: '450 MB', session: 1 },
    { name: 'discord.exe', pid: 8821, memory: '120 MB', session: 1 },
    { name: 'explorer.exe', pid: 402, memory: '80 MB', session: 1 },
    { name: 'RobloxPlayerBeta.exe', pid: 1337, memory: '850 MB', session: 1 },
    { name: 'javaw.exe', pid: 2048, memory: '2.1 GB', session: 1 },
    { name: 'steam.exe', pid: 9921, memory: '150 MB', session: 1 },
];

const Dashboard: React.FC<DashboardProps> = ({ stats, setStats, addLog, onOpenHub, settings, setSettings }) => {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showProcessList, setShowProcessList] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  
  const autoRefreshRef = useRef<any>(null);

  const isElectron = !!(window as any).require;

  const fetchProcesses = async (silent = false) => {
    if (!silent) setIsScanning(true);
    
    if (isElectron) {
        try {
            const { ipcRenderer } = (window as any).require('electron');
            const list = await ipcRenderer.invoke('get-processes');
            setProcesses(list);
            if (!silent) addLog(`Process Scan: ${list.length} active tasks found.`, 'INFO', 'SYSTEM');
        } catch (e) {
            if (!silent) addLog('Scan Error: Failed to enumerate tasks.', 'ERROR', 'SYSTEM');
        } finally {
            if (!silent) setIsScanning(false);
        }
    } else {
        // Browser Preview Mode
        setTimeout(() => {
            setProcesses(MOCK_PROCESSES);
            if (!silent) addLog('Preview Mode: Mock processes loaded.', 'WARN', 'SYSTEM');
            setIsScanning(false);
        }, 800);
    }
  };

  useEffect(() => {
    if (stats.autoRefreshProcess) {
      fetchProcesses(true); 
      autoRefreshRef.current = setInterval(() => {
        if (showProcessList) fetchProcesses(true);
      }, 2000);
    } else {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    }
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, [stats.autoRefreshProcess, showProcessList]);

  const toggleAutoRefresh = () => {
      setStats(prev => ({ ...prev, autoRefreshProcess: !prev.autoRefreshProcess }));
  };

  const handleSelectDll = async () => {
    if(isElectron) {
        const { ipcRenderer } = (window as any).require('electron');
        const path = await ipcRenderer.invoke('select-dll');
        if (path) {
            setStats(prev => ({ ...prev, target: { ...prev.target, dllPath: path } }));
            addLog(`Payload Loaded: ${path.split('\\').pop()}`, 'INFO', 'LOADER');
        }
    } else {
        // Browser Simulation
        setStats(prev => ({ ...prev, target: { ...prev.target, dllPath: 'C:\\Users\\Dev\\Bypass_v2.dll' } }));
        addLog('Preview Mode: Mock DLL loaded.', 'INFO', 'LOADER');
    }
  };

  const handleInject = async () => {
    if (!stats.target.process || !stats.target.dllPath) {
      addLog('ABORTED: Select both a target process and a DLL payload.', 'WARN', 'CORE');
      return;
    }

    const procName = stats.target.process.name;
    const method = settings.injectionMethod;

    addLog(`Initiating Injection (${method}) -> ${procName} (PID: ${stats.target.process.pid})`, 'INFO', 'KERNEL');
    if (settings.ghostMode) addLog("OpSec: Ghost Mode & Time Stomping Active", 'INFO', 'STEALTH');
    if (settings.memoryCleaner) addLog("OpSec: Memory String Cleaning Scheduled", 'INFO', 'STEALTH');

    setStats(p => ({ ...p, processStatus: 'ATTACHING' }));

    if (isElectron) {
        try {
            const { ipcRenderer } = (window as any).require('electron');
            const result = await ipcRenderer.invoke('inject-dll', {
                pid: stats.target.process.pid,
                processName: procName,
                dllPath: stats.target.dllPath,
                method: method,
                settings: settings
            });

            if (result.success) {
                addLog(result.message, 'SUCCESS', 'INJECTOR');
                setStats(p => ({ ...p, processStatus: 'INJECTED' }));
            } else {
                const cleanError = result.error.replace("Error: ", "");
                addLog(`Injection FAILED: ${cleanError}`, 'ERROR', 'INJECTOR');
                setStats(p => ({ ...p, processStatus: 'ERROR' }));
            }
        } catch (e: any) {
            addLog(`FATAL EXCEPTION: ${e.message || e}`, 'CRITICAL', 'SYSTEM');
            setStats(p => ({ ...p, processStatus: 'ERROR' }));
        }
    } else {
        // Browser Simulation
        setTimeout(() => {
            addLog('Kernel Handle Obtained (0x7FFF4).', 'SUCCESS', 'KERNEL');
            setTimeout(() => {
                addLog('Thread Hijack Successful.', 'SUCCESS', 'INJECTOR');
                setStats(p => ({ ...p, processStatus: 'INJECTED' }));
            }, 1500);
        }, 1000);
    }
  };

  const selectProcess = (proc: ProcessInfo) => {
    setStats(prev => ({ ...prev, target: { ...prev.target, process: proc } }));
    setShowProcessList(false);
    addLog(`Target Locked: ${proc.name} [PID: ${proc.pid}]`, 'INFO', 'USER');
  };

  const filteredProcesses = processes.filter(p => 
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
    p.pid.toString().includes(searchFilter)
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracking-tight italic flex items-center gap-2">
          <BrainCircuit size={20} className="text-blue-500" />
          Nexus Injection Core
        </h2>
        <div className="flex items-center gap-3">
             <div className={`px-3 py-1 rounded-full border border-white/5 flex items-center gap-2 transition-colors ${stats.pipeConnected ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                <Activity size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest">{stats.pipeConnected ? 'PIPE LINKED' : 'PIPE OFFLINE'}</span>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls */}
        <div className="lg:col-span-2 space-y-4">
            {/* Target Selector */}
            <div className="bg-[#141417] border border-white/5 p-4 rounded-xl relative group hover:border-white/10 transition-colors z-20">
            <div className="flex items-center justify-between mb-3 text-zinc-500">
                <div className="flex items-center gap-2">
                <Target size={14} className="text-blue-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Process Target</span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={toggleAutoRefresh} 
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded transition-all border ${stats.autoRefreshProcess ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-zinc-800 text-zinc-600 border-transparent'}`}
                    >
                        {stats.autoRefreshProcess ? 'Live Monitor' : 'Manual Scan'}
                    </button>
                    <button onClick={() => fetchProcesses(false)} className="p-1 hover:bg-white/5 rounded text-zinc-400 hover:text-white transition-colors">
                        <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>
            
            <div className="relative">
                <div 
                onClick={() => { if(!showProcessList) fetchProcesses(); setShowProcessList(!showProcessList); }}
                className={`w-full bg-black/40 border hover:border-blue-500/50 rounded-lg p-3 text-sm font-mono flex items-center justify-between cursor-pointer transition-all ${showProcessList ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-white/10'}`}
                >
                <div className="flex items-center gap-3 overflow-hidden">
                    {stats.target.process ? (
                        <>
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
                            <span className="text-white truncate">{stats.target.process.name}</span>
                            <span className="text-zinc-600 text-xs px-1.5 py-0.5 bg-zinc-900 rounded border border-white/5">{stats.target.process.pid}</span>
                        </>
                    ) : (
                        <span className="text-zinc-600 italic">Select target process...</span>
                    )}
                </div>
                <Search size={14} className="text-zinc-600 shrink-0" />
                </div>

                {showProcessList && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-[#1a1a1f]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl z-50 max-h-64 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    <input 
                    autoFocus
                    className="w-full bg-[#121215] p-3 text-xs border-b border-white/10 outline-none text-white font-mono placeholder:text-zinc-700"
                    placeholder="Filter processes..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    />
                    <div className="overflow-y-auto custom-scrollbar">
                    {filteredProcesses.map((proc) => (
                        <button
                        key={proc.pid}
                        onClick={() => selectProcess(proc)}
                        className="w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 hover:bg-blue-600/10 hover:text-blue-400 transition-colors border-b border-white/[0.02] flex justify-between group"
                        >
                        <span className="group-hover:translate-x-1 transition-transform">{proc.name}</span>
                        <span className="opacity-40">{proc.pid}</span>
                        </button>
                    ))}
                    {filteredProcesses.length === 0 && (
                        <div className="p-4 text-center text-[10px] text-zinc-600 uppercase font-bold">No matches found</div>
                    )}
                    </div>
                </div>
                )}
            </div>
            </div>

            {/* Method & DLL Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Method Selector */}
                <div className="bg-[#141417] border border-white/5 p-4 rounded-xl hover:border-white/10 transition-colors z-10">
                    <div className="flex items-center gap-2 mb-3 text-zinc-500">
                        <Settings2 size={14} className="text-green-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Injection Method</span>
                    </div>
                    <select 
                        value={settings.injectionMethod}
                        onChange={(e) => setSettings(s => ({...s, injectionMethod: e.target.value as any}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono text-white outline-none focus:border-green-500/30"
                    >
                        <option value="NtCreateThreadEx">Stealth (NtCreateThreadEx)</option>
                        <option value="LoadLibraryW">Unicode (LoadLibraryW)</option>
                        <option value="LoadLibraryA">Standard (LoadLibraryA)</option>
                    </select>
                </div>

                {/* DLL Selector */}
                <div className="bg-[#141417] border border-white/5 p-4 rounded-xl hover:border-white/10 transition-colors z-10">
                <div className="flex items-center gap-2 mb-3 text-zinc-500">
                    <FileCode size={14} className="text-purple-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Payload (DLL)</span>
                    </div>
                    <div className="flex gap-2">
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono text-zinc-400 truncate flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${stats.target.dllPath ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'bg-zinc-700'}`} />
                        {stats.target.dllPath ? stats.target.dllPath : 'No payload'}
                    </div>
                    <button onClick={handleSelectDll} className="px-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors border border-white/5 hover:border-white/20">
                        <FolderOpen size={16} />
                    </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Main Action */}
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
            {stats.processStatus === 'ERROR' ? <ShieldAlert size={40} /> : stats.processStatus === 'INJECTED' ? <Ghost size={40} /> : <Zap size={40} fill="currentColor" />}
            </div>
            
            <div className="space-y-2 relative z-10">
            <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">
                {stats.processStatus === 'INJECTED' ? 'INJECTION SUCCESSFUL' : 
                stats.processStatus === 'ERROR' ? 'INJECTION FAILED' :
                'READY TO INITIALIZE'}
            </h3>
            <p className="text-zinc-500 text-[11px] max-w-xs mx-auto leading-relaxed font-bold uppercase tracking-wide">
                {stats.processStatus === 'INJECTED' 
                ? `OpSec Protocols Active. Ghost Mode & Memory Clean: ${settings.ghostMode ? 'ON' : 'OFF'}` 
                : stats.processStatus === 'ERROR'
                ? 'Check Logs for error codes. Ensure Architecture matches.'
                : `Method: ${settings.injectionMethod} | Time Stomping: ${settings.ghostMode ? 'ACTIVE' : 'OFF'}`}
            </p>
            </div>

            <div className="w-full flex flex-col gap-3 max-w-xs relative z-10">
            <button 
                onClick={handleInject}
                disabled={stats.processStatus === 'INJECTED' || !stats.target.process || stats.processStatus === 'ATTACHING'}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-black transition-all text-xs tracking-[0.2em] uppercase ${
                stats.processStatus === 'INJECTED' 
                ? 'bg-zinc-900 text-green-500 cursor-default border border-green-500/20' 
                : stats.processStatus === 'ERROR'
                ? 'bg-zinc-900 text-red-500 border border-red-500/20 hover:bg-red-500/10'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98]'
                } disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed`}
            >
                {stats.processStatus === 'ATTACHING' ? (
                    <RefreshCw size={14} className="animate-spin" />
                ) : (
                    <PlayCircle size={14} fill="currentColor" />
                )}
                {stats.processStatus === 'INJECTED' ? 'SYSTEM SECURE' : stats.processStatus === 'ATTACHING' ? 'INJECTING...' : stats.processStatus === 'ERROR' ? 'RETRY INJECTION' : 'EXECUTE INJECTION'}
            </button>
            
            {stats.processStatus === 'INJECTED' && (
                <button onClick={onOpenHub} className="w-full py-3 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/20 rounded-xl font-bold text-xs uppercase tracking-widest transition-all animate-in fade-in slide-in-from-bottom-2">
                Open Internal UI
                </button>
            )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
