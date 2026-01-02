import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Zap, Target, Search, RefreshCw,
  PlayCircle, Ghost, Power, ShieldCheck,
  Gamepad2
} from 'lucide-react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { SystemStats, ProcessInfo, AppSettings, InjectionErrorCode } from '../../types';

interface DashboardProps {
  stats: SystemStats;
  setStats: React.Dispatch<React.SetStateAction<SystemStats>>;
  addLog: (msg: string, level?: any, cat?: string) => void;
  onOpenHub: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const VERIFIED_TARGETS = [
  'roblox', 'gta5', 'rdr2', 'minecraft', 'projectzomboid', 
  'fivem', 'dota2', 'cs2', 'valorant', 'fortnite', 
  'overwatch', 'apex', 'cod', 'warzone', 'rust', 'tarkov'
];

const Dashboard: React.FC<DashboardProps> = ({ stats, setStats, addLog, onOpenHub, settings }) => {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [processSearch, setProcessSearch] = useState('');
  const [showProcessSelector, setShowProcessSelector] = useState(false);
  
  const prevProcessesHash = useRef<string>('');

  const isGame = (name: string) => VERIFIED_TARGETS.some(t => name.toLowerCase().includes(t));

  const fetchProcesses = async () => {
    if (isScanning) return;
    setIsScanning(true);
    if (window.fluxAPI) {
      try {
        const list = await window.fluxAPI.getProcesses();
        if (Array.isArray(list)) {
            // Priority Sorting
            const sorted = list.sort((a, b) => {
                const aIsGame = isGame(a.name);
                const bIsGame = isGame(b.name);
                if (aIsGame && !bIsGame) return -1;
                if (!aIsGame && bIsGame) return 1;
                return a.name.localeCompare(b.name);
            });
            
            const currentHash = JSON.stringify(sorted.map(p => p.pid));
            if (currentHash !== prevProcessesHash.current) {
                setProcesses(sorted);
                prevProcessesHash.current = currentHash;
                if (sorted.length === 0) {
                    addLog("Scan complete: No relevant processes found.", "WARN", "SYSTEM");
                }
            }
        }
      } catch (e) {
          addLog("Process scanner error.", "ERROR", "SYSTEM");
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (window.fluxAPI) {
        window.fluxAPI.getBundledDLL().then(path => {
            setStats(prev => ({ ...prev, target: { ...prev.target, dllPath: path } }));
            addLog("Internal Engine (flux-core.dll) mounted.", "INFO", "SYSTEM");
        });
        window.fluxAPI.onPhaseUpdate((phase) => {
            setStats(prev => ({ ...prev, injectionPhase: phase }));
        });
    }
    fetchProcesses();
  }, []);

  const handleInject = async () => {
    if (!stats.target.process) {
      addLog('Error: Select a target process first.', 'WARN', 'CORE');
      setShowProcessSelector(true);
      return;
    }
    setStats(p => ({ ...p, processStatus: 'ATTACHING', injectionPhase: 0 }));
    if (window.fluxAPI) {
        addLog(`Attaching to PID ${stats.target.process.pid} (${stats.target.process.name})...`, 'INFO', 'KERNEL');
        const result = await window.fluxAPI.inject(stats.target.process.pid, stats.target.dllPath!, settings);
        
        if (result.success) {
            setStats(p => ({ ...p, processStatus: 'INJECTED', pipeConnected: true }));
            addLog('Injection Successful. Kernel Bridge Established.', 'SUCCESS', 'KERNEL');
            setTimeout(onOpenHub, 800);
        } else {
            setStats(p => ({ ...p, processStatus: 'ERROR' }));
            let errorMsg = result.error;
            if (result.code === InjectionErrorCode.ACCESS_DENIED) errorMsg = "Access Denied. Run as Admin or check Anti-Virus.";
            if (result.code === InjectionErrorCode.DLL_NOT_FOUND) errorMsg = "Core DLL missing from filesystem.";
            addLog(`Injection Failed: ${errorMsg}`, 'ERROR', 'INJECTOR');
        }
    } else {
        setTimeout(() => {
             setStats(p => ({ ...p, processStatus: 'INJECTED', pipeConnected: true, injectionPhase: 7 }));
             addLog('Injection Successful (Simulation).', 'SUCCESS', 'KERNEL');
             setTimeout(onOpenHub, 800);
        }, 1500);
    }
  };

  const filteredProcesses = useMemo(() => {
    return processes.filter(p => 
        p.name.toLowerCase().includes(processSearch.toLowerCase()) || 
        (p.title && p.title.toLowerCase().includes(processSearch.toLowerCase()))
    );
  }, [processes, processSearch]);

  const ProcessRow = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const proc = filteredProcesses[index];
    const verified = isGame(proc.name);
    return (
        <div style={style} className="px-1">
            <div 
                onClick={() => { setStats(s => ({...s, target: {...s.target, process: proc}})); setShowProcessSelector(false); }}
                className={`flex items-center text-xs p-2 rounded-lg cursor-pointer transition-colors group ${stats.target.process?.pid === proc.pid ? 'bg-blue-600/10' : 'hover:bg-main/50'}`}
            >
                <div className="w-[45%] flex items-center gap-2">
                    <div className={`w-6 h-6 rounded flex shrink-0 items-center justify-center text-[10px] font-bold ${verified ? 'bg-green-500/10 text-green-500' : 'bg-sidebar text-muted'}`}>
                        {verified ? <Gamepad2 size={12} /> : proc.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                        <div className={`font-bold truncate ${verified ? 'text-green-400' : 'text-content'}`}>{proc.name}</div>
                        <div className="text-[9px] text-muted truncate">{proc.title}</div>
                    </div>
                </div>
                <div className="w-[15%] font-mono text-muted">{proc.pid}</div>
                <div className="w-[20%] text-muted truncate">{proc.user || '-'}</div>
                <div className="w-[20%] text-[9px] text-muted truncate text-right" title={proc.path}>{proc.path || '-'}</div>
            </div>
        </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col gap-6">
      <div className="flex items-center justify-between bg-panel p-6 rounded-3xl border border-border-dim shadow-xl shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-600/20">
                <Zap size={24} className="text-blue-500" fill="currentColor" />
            </div>
            <div>
                <h2 className="text-xl font-black text-content italic tracking-tight">FLUX CORE NEXUS</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold uppercase">v5.0 Stable</span>
                    <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Syscall Engine</span>
                </div>
            </div>
        </div>
        <div className="flex gap-3">
             <StatusIndicator active={stats.processStatus === 'INJECTED'} label="Kernel Access" />
             <StatusIndicator active={stats.pipeConnected} label="IPC Bridge" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full overflow-hidden">
        <div className="lg:col-span-8 space-y-6 flex flex-col h-full overflow-hidden">
            <div className={`bg-panel border ${showProcessSelector ? 'border-blue-500/30 ring-1 ring-blue-500/20' : 'border-border-dim'} p-1 rounded-3xl transition-all shadow-lg flex flex-col duration-300 max-h-[600px]`}>
                <div 
                    onClick={() => setShowProcessSelector(!showProcessSelector)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-main/50 rounded-2xl transition-colors shrink-0"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${stats.target.process ? 'bg-green-500/10 text-green-500' : 'bg-sidebar text-muted'}`}>
                            <Target size={20} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-0.5">Target Process</span>
                            {stats.target.process ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-content font-black italic text-sm">{stats.target.process.name}</span>
                                    <span className="text-[10px] font-mono text-muted bg-black/20 px-1.5 rounded">PID: {stats.target.process.pid}</span>
                                </div>
                            ) : (
                                <span className="text-muted italic text-sm">Click to select process...</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); fetchProcesses(); }} className="p-2 hover:bg-main rounded-lg text-muted transition-all" title="Refresh List">
                            <RefreshCw size={18} className={isScanning ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {showProcessSelector && (
                    <div className="border-t border-border-dim p-4 animate-in slide-in-from-top-2 duration-200 flex-1 flex flex-col h-[400px]">
                        <div className="relative mb-3 shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                            <input 
                                type="text" placeholder="Filter processes..." value={processSearch}
                                onChange={(e) => setProcessSearch(e.target.value)}
                                className="w-full bg-main/50 border border-border-dim rounded-xl py-2.5 pl-9 pr-4 text-xs text-content outline-none focus:border-blue-500/40"
                                autoFocus
                            />
                        </div>
                        <div className="flex text-[9px] text-muted font-bold uppercase tracking-wider px-3 pb-2 border-b border-border-dim mb-2 shrink-0">
                             <div className="w-[45%] pl-1">Name</div>
                             <div className="w-[15%]">PID</div>
                             <div className="w-[20%]">User</div>
                             <div className="w-[20%] text-right">Path</div>
                        </div>
                        <div className="flex-1">
                            {filteredProcesses.length === 0 ? (
                                <div className="text-center py-8 text-muted text-xs italic">
                                    {isScanning ? 'Scanning...' : 'No matching processes found.'}
                                </div>
                            ) : (
                                <AutoSizer>
                                    {({ height, width }) => (
                                        <List
                                            height={height}
                                            itemCount={filteredProcesses.length}
                                            itemSize={48}
                                            width={width}
                                            className="custom-scrollbar"
                                        >
                                            {ProcessRow}
                                        </List>
                                    )}
                                </AutoSizer>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-panel border border-border-dim p-5 rounded-3xl shadow-lg flex items-center justify-between shrink-0 transition-colors duration-300">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-0.5">Core Engine</span>
                        <div className="flex items-center gap-2">
                             <span className="text-content font-black italic text-sm">flux-core-engine.dll</span>
                             <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded font-bold uppercase">PRE-LOADED</span>
                        </div>
                    </div>
                </div>
                <div className="px-3 py-1.5 bg-sidebar rounded-lg border border-border-dim font-mono text-[10px] text-muted">v5.0.0-STABLE</div>
            </div>

            <div className="bg-panel border border-border-dim p-6 rounded-3xl space-y-4 shadow-lg shrink-0 transition-colors duration-300">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">Injection Status</span>
                    <span className="text-xs font-mono text-blue-400 font-bold">{["Idle", "PE Header", "Allocation", "Mapping", "Imports", "Relocation", "Shellcode", "Active"][stats.injectionPhase] || "Unknown"}</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden flex gap-0.5">
                    {[1,2,3,4,5,6,7].map(i => (
                        <div key={i} className={`flex-1 transition-all duration-300 ${stats.injectionPhase >= i ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 'bg-sidebar'}`} />
                    ))}
                </div>
            </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4 h-full">
            <div className="flex-1 bg-gradient-to-b from-panel to-main border border-border-dim rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl group min-h-[300px]">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-all duration-500 ${stats.processStatus === 'INJECTED' ? 'bg-green-500/10 text-green-400 shadow-[0_0_60px_rgba(34,197,94,0.2)]' : 'bg-blue-600/10 text-blue-500'}`}>
                    {stats.processStatus === 'INJECTED' ? <Ghost size={64} /> : <Power size={64} />}
                </div>
                <h3 className="text-3xl font-black text-content uppercase italic tracking-tighter mb-2">
                    {stats.processStatus === 'INJECTED' ? 'SYSTEM ACTIVE' : 'READY'}
                </h3>
                <button 
                    onClick={handleInject}
                    disabled={stats.processStatus === 'ATTACHING'}
                    className={`w-full py-6 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                        stats.processStatus === 'INJECTED' ? 'bg-sidebar text-muted cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20 active:scale-95'
                    }`}
                >
                    {stats.processStatus === 'ATTACHING' ? <RefreshCw className="animate-spin" /> : <PlayCircle size={20} fill="currentColor" />}
                    {stats.processStatus === 'ATTACHING' ? 'WAITING...' : stats.processStatus === 'INJECTED' ? 'INJECTED' : 'EXECUTE'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const StatusIndicator = ({ active, label }: { active: boolean, label: string }) => (
    <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all ${active ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-sidebar border-border-dim text-muted'}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-400 animate-pulse' : 'bg-zinc-600'}`} />
        <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
    </div>
);

export default Dashboard;