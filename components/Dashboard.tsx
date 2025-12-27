
import React, { useState } from 'react';
import { 
  Zap, 
  Target, 
  ShieldCheck, 
  ChevronRight,
  EyeOff,
  Search,
  RefreshCw,
  Box,
  BrainCircuit
} from 'lucide-react';
import { SystemStats } from '../types';

interface DashboardProps {
  stats: SystemStats;
  onDeploy: () => void;
  isDeploying: boolean;
  onTargetChange: (name: string) => void;
  onOpenHub: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, onDeploy, isDeploying, onTargetChange, onOpenHub }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [showProcessList, setShowProcessList] = useState(false);
  
  const [mockProcesses] = useState([
    'RobloxPlayerBeta.exe',
    'Discord.exe',
    'Chrome.exe',
    'GTA5.exe',
    'RDR2.exe',
    'FiveM_ChromeBrowser',
    'StardewValley.exe',
    'ProjectZomboid64.exe',
    'Peak-Win64-Shipping.exe'
  ]);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setShowProcessList(true);
    }, 800);
  };

  const selectProcess = (name: string) => {
    onTargetChange(name);
    setShowProcessList(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-white tracking-tight italic flex items-center gap-2">
          <BrainCircuit size={20} className="text-blue-500" />
          Nexus Dashboard
        </h2>
        <p className="text-zinc-500 text-xs font-medium">Automatic detection & runtime recommendation engine.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Target Selector with Recommendation */}
        <div className={`bg-[#141417] border p-4 rounded-xl relative group transition-all duration-300 ${
          stats.detectedGame ? 'border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'border-white/5'
        }`}>
          <div className="flex items-center justify-between mb-3 text-zinc-500">
            <div className="flex items-center gap-2">
              <Target size={12} className={stats.detectedGame ? 'text-blue-500' : ''} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Active Target</span>
            </div>
            {stats.detectedGame && (
              <span className="text-[8px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-1.5 py-0.5 rounded font-black uppercase animate-pulse">
                Game Matched
              </span>
            )}
            <button onClick={handleScan} className="p-1 hover:bg-white/5 rounded text-zinc-600 hover:text-blue-500 transition-colors">
              <RefreshCw size={12} className={isScanning ? 'animate-spin' : ''} />
            </button>
          </div>
          
          <div 
            onClick={() => setShowProcessList(!showProcessList)}
            className={`w-full bg-black/40 border rounded-lg p-3 text-sm font-mono flex items-center justify-between cursor-pointer transition-all ${
              stats.detectedGame ? 'border-blue-500/30 text-blue-400' : 'border-white/10 text-zinc-400'
            } hover:border-blue-500/50`}
          >
            <span>{stats.targetProcess || 'Search process...'}</span>
            <Search size={14} className="text-zinc-600" />
          </div>

          {showProcessList && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#1a1a1f] border border-white/10 rounded-lg shadow-2xl z-50 max-h-48 overflow-y-auto backdrop-blur-md">
              {mockProcesses.map((proc) => (
                <button
                  key={proc}
                  onClick={() => selectProcess(proc)}
                  className="w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 hover:bg-blue-600/20 hover:text-blue-400 transition-colors border-b border-white/[0.02] last:border-0"
                >
                  {proc}
                </button>
              ))}
            </div>
          )}

          {stats.detectedGame && (
             <div className="mt-3 p-3 bg-blue-600/5 border border-blue-500/10 rounded-lg space-y-2 animate-in slide-in-from-top-2">
               <div className="flex justify-between items-center text-[9px] font-bold uppercase">
                 <span className="text-zinc-500">Recommended Runtime:</span>
                 <span className="text-blue-400 font-black">{stats.detectedGame.runtime.toUpperCase()} ({stats.detectedGame.engine})</span>
               </div>
               <div className="flex justify-between items-center text-[9px] font-bold uppercase">
                 <span className="text-zinc-500">Suggested Bypass:</span>
                 <span className="text-blue-400 font-black">{stats.detectedGame.bypassMethod}</span>
               </div>
             </div>
          )}
        </div>

        {/* Link Status */}
        <div className="bg-[#141417] border border-white/5 p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Nexus Pipeline Status</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${stats.processStatus === 'ACTIVE' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'} transition-all`} />
              <span className={`text-sm font-black uppercase ${stats.processStatus === 'ACTIVE' ? 'text-green-500' : 'text-zinc-500'}`}>
                {stats.processStatus}
              </span>
            </div>
          </div>
          <ShieldCheck size={24} className={stats.processStatus === 'ACTIVE' ? 'text-green-500' : 'text-zinc-800'} />
        </div>
      </div>

      {/* Main Action Area */}
      <div className={`bg-[#121215] border rounded-2xl p-8 flex flex-col items-center text-center space-y-6 transition-all duration-500 ${
        stats.processStatus === 'ACTIVE' ? 'border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.05)]' : 'border-white/5'
      }`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
          stats.processStatus === 'ACTIVE' ? 'bg-green-600/10 text-green-500' : 'bg-blue-600/10 text-blue-500'
        } ${isDeploying ? 'animate-pulse' : ''}`}>
          <Zap size={28} fill="currentColor" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-black text-white uppercase tracking-tight italic">Nexus Execution Node</h3>
          <p className="text-zinc-500 text-[11px] max-w-xs mx-auto leading-relaxed font-medium">
            Multi-engine execution support with Kernel-level camouflaging for major titles.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3 max-w-xs">
          <button 
            onClick={onDeploy}
            disabled={isDeploying || stats.processStatus === 'ACTIVE' || !stats.targetProcess}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-black transition-all text-xs tracking-[0.2em] uppercase ${
              stats.processStatus === 'ACTIVE' 
              ? 'bg-green-600/10 text-green-500 border border-green-600/30' 
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_20px_rgba(37,99,235,0.2)]'
            } disabled:opacity-30`}
          >
            {isDeploying ? 'Linking Process...' : stats.processStatus === 'ACTIVE' ? 'Nexus Linked' : 'Initiate Bypass'}
          </button>

          {stats.processStatus === 'ACTIVE' && stats.detectedGame && (
            <button 
              onClick={onOpenHub}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-xs tracking-[0.2em] uppercase bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-[0_4px_20px_rgba(147,51,234,0.2)] animate-in zoom-in-95 duration-300"
            >
              <Box size={14} />
              Open Script Hub
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatusPill label="Bypass Integrity" value="Undetected" color="text-green-500" />
        <StatusPill label="Memory Load" value="12.4 MB" />
        <StatusPill label="Execution Sync" value="Verified" color="text-blue-500" />
      </div>
    </div>
  );
};

const StatusPill: React.FC<{ label: string, value: string, color?: string }> = ({ label, value, color }) => (
  <div className="py-3 px-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-center">
    <span className="text-[8px] text-zinc-600 font-bold block uppercase tracking-widest mb-1">{label}</span>
    <span className={`text-[10px] font-black ${color || 'text-zinc-400'}`}>{value}</span>
  </div>
);

export default Dashboard;
