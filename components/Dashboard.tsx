
import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Target, Search, RefreshCw, Activity,
  FileCode, FolderOpen, PlayCircle, Ghost, ShieldAlert, AlertTriangle, RotateCcw, Power, Shield, Cpu, Binary
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
  const [showProcessList, setShowProcessList] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  
  const fetchProcesses = async () => {
    if (isScanning) return;
    setIsScanning(true);
    if ((window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      const list = await ipcRenderer.invoke('get-processes');
      if (Array.isArray(list)) setProcesses(list);
    }
    setIsScanning(false);
  };

  useEffect(() => {
    fetchProcesses();
    if ((window as any).require) {
        const { ipcRenderer } = (window as any).require('electron');
        ipcRenderer.on('injection-phase-update', (_, phase) => {
            setStats(prev => ({ ...prev, injectionPhase: phase }));
        });
        return () => { ipcRenderer.removeAllListeners('injection-phase-update'); };
    }
  }, []);

  const handleInject = async () => {
    if (!stats.target.process) {
      addLog('Select target process.', 'WARN', 'CORE');
      setShowProcessList(true);
      return;
    }
    setStats(p => ({ ...p, processStatus: 'ATTACHING', injectionPhase: 0 }));
    
    if ((window as any).require) {
        const { ipcRenderer } = (window as any).require('electron');
        const result = await ipcRenderer.invoke('inject-dll', {
            pid: stats.target.process.pid,
            dllPath: stats.target.dllPath,
            settings: settings
        });

        if (result.success) {
            setStats(p => ({ ...p, processStatus: 'INJECTED', pipeConnected: true }));
            addLog('Nexus Engine: Entry Point Executed Successfully.', 'SUCCESS', 'KERNEL');
            setTimeout(onOpenHub, 1000);
        } else {
            setStats(p => ({ ...p, processStatus: 'ERROR' }));
            addLog(`Injection Aborted: ${result.error}`, 'ERROR', 'INJECTOR');
        }
    } else {
        // Web Simulation Mode
        setTimeout(() => {
             setStats(p => ({ ...p, processStatus: 'INJECTED', pipeConnected: true }));
             addLog('WEB MODE: Simulated Injection Successful.', 'SUCCESS', 'KERNEL');
             setTimeout(onOpenHub, 1000);
        }, 2000);
    }
  };

  const getPhaseName = (p: number) => {
      const names = ["Idle", "PE Strip", "Alloc", "Map", "Imports", "Relocs", "Shellcode", "Ghosting"];
      return names[p] || "Processing";
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto pb-24 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tighter italic flex items-center gap-3">
              <Zap size={24} className="text-blue-500 fill-current" />
              GHOST MANUAL MAPPER
            </h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Advanced Bypass Engine v4.5</p>
        </div>
        <div className="flex gap-4">
             <StatusIndicator active={stats.pipeConnected} label="Pipe" />
             <StatusIndicator active={stats.processStatus === 'INJECTED'} label="Kernel" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-6">
            
            {/* Target Select */}
            <div className="bg-[#111114] border border-white/5 p-6 rounded-3xl relative shadow-2xl">
                <div className="flex items-center justify-between mb-4 text-zinc-500">
                    <div className="flex items-center gap-3">
                        <Target size={18} className="text-blue-500" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Target Environment</span>
                    </div>
                    <button onClick={fetchProcesses} className="hover:text-white"><RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} /></button>
                </div>
                
                <div className="relative">
                    <div onClick={() => setShowProcessList(!showProcessList)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-mono flex items-center justify-between cursor-pointer hover:border-blue-500/30 transition-all">
                        <div className="flex items-center gap-4">
                            {stats.target.process ? (
                                <>
                                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="text-white font-black italic">{stats.target.process.title || stats.target.process.name}</span>
                                    <span className="text-zinc-600">PID: {stats.target.process.pid}</span>
                                </>
                            ) : <span className="text-zinc-600 italic">Select Process...</span>}
                        </div>
                        <Search size={18} className="text-zinc-700" />
                    </div>

                    {showProcessList && (
                        <div className="absolute left-0 right-0 top-full mt-3 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto custom-scrollbar">
                            {processes.map((proc) => (
                                <button key={proc.pid} onClick={() => { setStats(s => ({...s, target: {...s.target, process: proc}})); setShowProcessList(false); }} className="w-full text-left px-6 py-4 hover:bg-blue-600/10 border-b border-white/[0.02] flex justify-between items-center group">
                                    <span className="text-white font-black text-xs uppercase italic group-hover:text-blue-400">{proc.title || proc.name}</span>
                                    <span className="text-[10px] font-mono text-zinc-700">{proc.pid}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Phase Tracker */}
            <div className="bg-[#111114] border border-white/5 p-6 rounded-3xl shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Binary size={18} className="text-purple-500" />
                        <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Injection Sequence</span>
                    </div>
                    <span className="text-[10px] font-mono text-purple-500 font-bold">{getPhaseName(stats.injectionPhase)}</span>
                </div>
                <div className="flex justify-between gap-2">
                    {[1,2,3,4,5,6,7].map(i => (
                        <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${stats.injectionPhase >= i ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-zinc-800'}`} />
                    ))}
                </div>
                <div className="mt-4 flex justify-between text-[8px] font-black text-zinc-600 uppercase tracking-tighter italic">
                    <span>Init</span>
                    <span>Mapping</span>
                    <span>Relocs</span>
                    <span>Execution</span>
                </div>
            </div>
        </div>

        {/* Action Center */}
        <div className="col-span-4 flex flex-col gap-6">
            <div className="flex-1 bg-[#111114] border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-6 transition-all ${stats.processStatus === 'INJECTED' ? 'bg-green-500/10 text-green-400 shadow-[0_0_40px_rgba(34,197,94,0.2)]' : 'bg-blue-500/10 text-blue-500'}`}>
                    {stats.processStatus === 'INJECTED' ? <Ghost size={48} /> : <Zap size={48} fill="currentColor" />}
                </div>
                
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-1">
                    {stats.processStatus === 'INJECTED' ? 'ACTIVE' : 'READY'}
                </h3>
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] mb-10">Ghost Manual Mapper</p>

                <button 
                    onClick={handleInject}
                    disabled={stats.processStatus === 'ATTACHING'}
                    className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${
                        stats.processStatus === 'INJECTED' ? 'bg-zinc-800 text-zinc-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/40'
                    }`}
                >
                    {stats.processStatus === 'ATTACHING' ? <RefreshCw className="animate-spin" /> : <PlayCircle size={18} fill="currentColor" />}
                    {stats.processStatus === 'INJECTED' ? 'RE-ATTACH' : 'EXECUTE'}
                </button>
                
                {stats.processStatus === 'INJECTED' && (
                    <button onClick={onOpenHub} className="w-full mt-3 py-4 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                        OPEN MODULE HUB
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

const StatusIndicator = ({ active, label }: { active: boolean, label: string }) => (
    <div className={`px-4 py-2 rounded-xl border flex items-center gap-3 transition-all ${active ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-zinc-900 border-white/5 text-zinc-600'}`}>
        <Activity size={12} className={active ? 'animate-pulse' : ''} />
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </div>
);

export default Dashboard;
