
import React, { useState, useEffect } from 'react';
import { 
  Zap, Target, Search, RefreshCw, Activity,
  PlayCircle, Ghost, FileCheck, Power, ShieldCheck
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

const Dashboard: React.FC<DashboardProps> = ({ stats, setStats, addLog, onOpenHub, settings }) => {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [processSearch, setProcessSearch] = useState('');
  const [showProcessSelector, setShowProcessSelector] = useState(false);
  
  const fetchProcesses = async () => {
    setIsScanning(true);
    
    if (window.fluxAPI) {
      try {
        const list = await window.fluxAPI.getProcesses();
        if (Array.isArray(list)) {
            setProcesses(list);
            // If the user hasn't selected a process yet and we found some, prompt selection
            if(processes.length === 0 && list.length > 0 && !stats.target.process) {
                // Optional: Don't force open, let user click
                // setShowProcessSelector(true); 
            }
        }
      } catch (e) {
          addLog("Failed to fetch processes from kernel.", "ERROR", "SYSTEM");
          setProcesses([]);
      }
    } else {
        // We are in browser mode, show nothing or a warning
        addLog("Browser Mode Detected: Cannot scan real processes.", "WARN", "SYSTEM");
        setProcesses([]);
    }
    
    setIsScanning(false);
  };

  // Auto-load internal DLL on mount
  useEffect(() => {
    if (window.fluxAPI) {
        window.fluxAPI.getBundledDLL().then(path => {
            setStats(prev => ({ ...prev, target: { ...prev.target, dllPath: path } }));
            addLog("Internal Engine (flux-core.dll) mounted successfully.", "INFO", "SYSTEM");
        });
        
        window.fluxAPI.onPhaseUpdate((phase) => {
            setStats(prev => ({ ...prev, injectionPhase: phase }));
        });
    } else {
        // Web Browser Fallback
        setStats(prev => ({ ...prev, target: { ...prev.target, dllPath: "C:\\Windows\\System32\\flux-core.dll" } }));
    }
    fetchProcesses();
  }, []);

  const handleInject = async () => {
    if (!stats.target.process) {
      addLog('Error: Select a target process first.', 'WARN', 'CORE');
      setShowProcessSelector(true);
      return;
    }
    if (!stats.target.dllPath) {
        addLog('Error: Internal Engine not loaded. Restart App.', 'CRITICAL', 'CORE');
        return;
    }

    setStats(p => ({ ...p, processStatus: 'ATTACHING', injectionPhase: 0 }));
    
    if (window.fluxAPI) {
        addLog('Initiating Syscall Injection...', 'INFO', 'KERNEL');
        
        const result = await window.fluxAPI.inject(
            stats.target.process.pid,
            stats.target.dllPath,
            settings
        );

        if (result.success) {
            setStats(p => ({ ...p, processStatus: 'INJECTED', pipeConnected: true }));
            addLog('Injection Successful. Engine Ready.', 'SUCCESS', 'KERNEL');
            setTimeout(onOpenHub, 800);
        } else {
            setStats(p => ({ ...p, processStatus: 'ERROR' }));
            addLog(`Injection Failed: ${result.error}`, 'ERROR', 'INJECTOR');
        }
    } else {
        // Browser Simulation
        setTimeout(() => {
             setStats(p => ({ ...p, processStatus: 'INJECTED', pipeConnected: true, injectionPhase: 7 }));
             addLog('Injection Successful (Simulation).', 'SUCCESS', 'KERNEL');
             setTimeout(onOpenHub, 800);
        }, 2000);
    }
  };

  const getPhaseName = (p: number) => ["Idle", "PE Header", "Allocation", "Mapping", "Imports", "Relocation", "Shellcode", "Ghosting"][p] || "Working";

  const filteredProcesses = processes.filter(p => 
      p.name.toLowerCase().includes(processSearch.toLowerCase()) || 
      (p.title && p.title.toLowerCase().includes(processSearch.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-[#141417] p-6 rounded-3xl border border-white/5 shadow-xl shrink-0">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-600/20">
                <Zap size={24} className="text-blue-500" fill="currentColor" />
            </div>
            <div>
                <h2 className="text-xl font-black text-white italic tracking-tight">FLUX CORE NEXUS</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold uppercase">v4.3 Stable</span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Syscall Engine</span>
                </div>
            </div>
        </div>
        <div className="flex gap-3">
             <StatusIndicator active={stats.processStatus === 'INJECTED'} label="Kernel Access" />
             <StatusIndicator active={stats.pipeConnected} label="IPC Bridge" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full overflow-hidden">
        
        {/* Left Column: Configuration */}
        <div className="lg:col-span-8 space-y-6 flex flex-col">
            
            {/* 1. PROCESS SELECTOR */}
            <div className={`bg-[#141417] border ${showProcessSelector ? 'border-blue-500/30 ring-1 ring-blue-500/20' : 'border-white/5'} p-1 rounded-3xl transition-all shadow-lg shrink-0`}>
                <div 
                    onClick={() => setShowProcessSelector(!showProcessSelector)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] rounded-2xl transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${stats.target.process ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>
                            <Target size={20} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-0.5">Target Process</span>
                            {stats.target.process ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-black italic text-sm">{stats.target.process.name}</span>
                                    <span className="text-[10px] font-mono text-zinc-600 bg-black/40 px-1.5 rounded">PID: {stats.target.process.pid}</span>
                                </div>
                            ) : (
                                <span className="text-zinc-400 italic text-sm">Click to select process...</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); fetchProcesses(); }} 
                            className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-all"
                            title="Refresh List"
                        >
                            <RefreshCw size={18} className={isScanning ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* EXPANDABLE PROCESS LIST */}
                {showProcessSelector && (
                    <div className="border-t border-white/5 p-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                            <input 
                                type="text" 
                                placeholder="Filter processes..." 
                                value={processSearch}
                                onChange={(e) => setProcessSearch(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white outline-none focus:border-blue-500/40"
                                autoFocus
                            />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-1">
                            {filteredProcesses.length === 0 ? (
                                <div className="text-center py-8 text-zinc-600 text-xs italic">
                                    {isScanning ? 'Scanning system...' : 'No active windows found.'}
                                </div>
                            ) : (
                                filteredProcesses.map(proc => (
                                    <button 
                                        key={proc.pid}
                                        onClick={() => {
                                            setStats(s => ({...s, target: {...s.target, process: proc}}));
                                            setShowProcessSelector(false);
                                        }}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${stats.target.process?.pid === proc.pid ? 'bg-blue-600/10 border border-blue-500/20' : 'hover:bg-white/[0.03] border border-transparent'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-xs font-bold text-zinc-500 uppercase">
                                                {proc.name.charAt(0)}
                                            </div>
                                            <div className="text-left">
                                                <div className="text-xs font-bold text-zinc-200 group-hover:text-blue-400 transition-colors">{proc.name}</div>
                                                <div className="text-[10px] text-zinc-600 truncate max-w-[200px]">{proc.title || 'Unknown Window'}</div>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-mono text-zinc-600">{proc.pid}</div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 2. ENGINE STATUS (AUTO LOADED) */}
            <div className="bg-[#141417] border border-white/5 p-5 rounded-3xl shadow-lg flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-0.5">Core Engine</span>
                        <div className="flex items-center gap-2">
                             <span className="text-white font-black italic text-sm">flux-core-engine.dll</span>
                             <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded font-bold uppercase">PRE-LOADED</span>
                        </div>
                    </div>
                </div>
                <div className="px-3 py-1.5 bg-zinc-900 rounded-lg border border-white/5">
                    <span className="text-[10px] text-zinc-400 font-mono">v4.3.0-STABLE</span>
                </div>
            </div>

            {/* 3. INJECTION PROGRESS */}
            <div className="bg-[#141417] border border-white/5 p-6 rounded-3xl space-y-4 shadow-lg shrink-0">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Injection Sequence</span>
                    <span className="text-xs font-mono text-blue-400 font-bold">{getPhaseName(stats.injectionPhase)}</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden flex gap-0.5">
                    {[1,2,3,4,5,6,7].map(i => (
                        <div 
                            key={i} 
                            className={`flex-1 transition-all duration-300 ${stats.injectionPhase >= i ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 'bg-zinc-800'}`} 
                        />
                    ))}
                </div>
            </div>
        </div>

        {/* Right Column: Execute */}
        <div className="lg:col-span-4 flex flex-col gap-4 h-full">
            <div className="flex-1 bg-gradient-to-b from-[#1a1a20] to-[#141417] border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl group min-h-[300px]">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                
                <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-all duration-500 ${stats.processStatus === 'INJECTED' ? 'bg-green-500/10 text-green-400 shadow-[0_0_60px_rgba(34,197,94,0.2)] scale-110' : 'bg-blue-600/10 text-blue-500 group-hover:scale-105'}`}>
                    {stats.processStatus === 'INJECTED' ? <Ghost size={64} /> : <Power size={64} />}
                </div>

                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2 relative z-10">
                    {stats.processStatus === 'INJECTED' ? 'SYSTEM ACTIVE' : 'READY TO INJECT'}
                </h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-12 relative z-10">
                    {stats.processStatus === 'INJECTED' ? 'Bridge Established' : 'Awaiting Command'}
                </p>

                <button 
                    onClick={handleInject}
                    disabled={stats.processStatus === 'ATTACHING'}
                    className={`w-full py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 relative z-10 ${
                        stats.processStatus === 'INJECTED' 
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20 active:scale-95'
                    }`}
                >
                    {stats.processStatus === 'ATTACHING' ? <RefreshCw className="animate-spin" /> : <PlayCircle size={20} fill="currentColor" />}
                    {stats.processStatus === 'ATTACHING' ? 'INJECTING...' : stats.processStatus === 'INJECTED' ? 'INJECTED' : 'EXECUTE'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const StatusIndicator = ({ active, label }: { active: boolean, label: string }) => (
    <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all ${active ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-zinc-900 border-white/5 text-zinc-600'}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-400 animate-pulse' : 'bg-zinc-600'}`} />
        <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
    </div>
);

export default Dashboard;
