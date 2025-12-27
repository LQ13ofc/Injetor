
import React, { useState, useMemo } from 'react';
import { ShieldCheck, Fingerprint, Search, ShieldAlert, Cpu, Terminal, Shield, Network, Radio, HardDrive, Lock } from 'lucide-react';
import { HWIDProfile, PluginModule, SecurityModule } from '../types';

interface SecuritySuiteProps {
  addLog: (msg: string, level?: any, cat?: string) => void;
  enabledPlugins: PluginModule[];
}

const SecuritySuite: React.FC<SecuritySuiteProps> = ({ addLog, enabledPlugins }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hwid, setHwid] = useState<HWIDProfile>({
    smbios: 'REAL-HW-ID',
    diskId: 'NVMe-SAMSUNG',
    mac: 'ACTIVE-NET-IFACE',
    gpu: 'GPU-PRIMARY',
    arp: 'DYNAMIC'
  });
  
  const [isSpoofing, setIsSpoofing] = useState(false);

  // Módulos que representam o que o app faz ou tenta proteger
  const [securityModules, setSecurityModules] = useState<SecurityModule[]>([
    // Universal
    { id: 'm1', label: "Memory String Cleaner", desc: "Overwrites DLL path in target memory.", lang: ['c', 'cpp'], active: true, riskLevel: 'SAFE', category: 'MEMORY' },
    { id: 'm4', label: "System Trace Cleaner", desc: "Flushes DNS/ARP and reset Winsock.", lang: ['c'], active: true, riskLevel: 'SAFE', category: 'NETWORK' },
    { id: 'm18', label: "TLS Packet Encryption", desc: "Encrypts script data stream.", lang: ['lua'], active: true, riskLevel: 'SAFE', category: 'NETWORK' },
    
    // Windows Specific
    { id: 'm2', label: "Ghost File Flux", desc: "Renames DLL to system file names.", lang: ['c', 'cpp'], active: true, riskLevel: 'SAFE', category: 'HARDWARE', platform: ['win32'] },
    { id: 'm3', label: "NtCreateThreadEx", desc: "Syscall to bypass standard hooks.", lang: ['cpp'], active: true, riskLevel: 'SAFE', category: 'KERNEL', platform: ['win32'] },
    
    // Linux Specific
    { id: 'l1', label: "eBPF Trace Blocker", desc: "Prevents kernel tracing via eBPF.", lang: ['c'], active: true, riskLevel: 'RISKY', category: 'KERNEL', platform: ['linux'] },
    { id: 'l2', label: "ptrace_scope Bypass", desc: "Modifies YAMA ptrace restrictions.", lang: ['c'], active: true, riskLevel: 'EXTREME', category: 'KERNEL', platform: ['linux'] },

    // Mac Specific
    { id: 'mc1', label: "Gatekeeper Evasion", desc: "Removes quarantine attributes.", lang: ['bash'], active: true, riskLevel: 'RISKY', category: 'HARDWARE', platform: ['darwin'] },
    { id: 'mc2', label: "SIP Status Monitor", desc: "Checks System Integrity Protection.", lang: ['swift'], active: true, riskLevel: 'SAFE', category: 'KERNEL', platform: ['darwin'] },
  ] as SecurityModule[]);

  const toggleModule = (id: string) => {
    setSecurityModules(prev => prev.map(m => {
        if (m.id === id) {
            const newState = !m.active;
            addLog(`Module '${m.label}' ${newState ? 'ENGAGED' : 'DISENGAGED'}`, newState ? 'SUCCESS' : 'WARN', 'SECURITY');
            return { ...m, active: newState };
        }
        return m;
    }));
  };

  const visibleMethods = useMemo(() => {
    return securityModules.filter(m => 
        m.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [securityModules, searchQuery]);

  const securityScore = Math.min(100, Math.round((securityModules.filter(m => m.active).length / securityModules.length) * 100));

  const handleSpoof = async () => {
    setIsSpoofing(true);
    addLog('Initiating System Network Trace Cleanup...', 'INFO', 'SECURITY');
    
    if ((window as any).require) {
        const { ipcRenderer } = (window as any).require('electron');
        try {
            await ipcRenderer.invoke('system-flush');
            
            setTimeout(() => {
                setHwid({
                    smbios: `CLEANED-${Math.floor(Math.random() * 9999)}`,
                    diskId: `VIRTUAL-${Math.floor(Math.random() * 9999)}`,
                    mac: `RANDOMIZED-${Math.floor(Math.random() * 99)}`,
                    gpu: 'MASKED',
                    arp: 'FLUSHED'
                });
                setIsSpoofing(false);
                addLog('Network Stack Reset & Cache Flushed Successfully.', 'SUCCESS', 'SECURITY');
            }, 1000);
        } catch (e) {
            setIsSpoofing(false);
            addLog('Failed to execute flush commands. Run as Admin/Root.', 'ERROR', 'SECURITY');
        }
    } else {
        setIsSpoofing(false);
    }
  };

  const getRiskColor = (risk: string) => {
      switch(risk) {
          case 'SAFE': return 'bg-blue-500 text-white';
          case 'RISKY': return 'bg-orange-500 text-black';
          case 'EXTREME': return 'bg-red-500 text-white';
          case 'GOD': return 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]';
          default: return 'bg-zinc-500';
      }
  };

  const getCategoryIcon = (cat: string) => {
      switch(cat) {
          case 'MEMORY': return <Cpu size={14} className="text-zinc-500" />;
          case 'KERNEL': return <Terminal size={14} className="text-purple-500" />;
          case 'NETWORK': return <Network size={14} className="text-green-500" />;
          case 'HARDWARE': return <HardDrive size={14} className="text-orange-500" />;
          default: return <Shield size={14} />;
      }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-blue-500" size={24} />
          <h2 className="text-xl font-black text-white tracking-tight uppercase italic">Universal Security Protocol</h2>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${securityScore}%` }} />
                </div>
                <span className="text-[10px] font-black text-blue-400">{securityScore}% SECURE</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-[#141417] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Fingerprint size={120} className="text-white" />
           </div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <Fingerprint className="text-zinc-500" size={18} />
              <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">OpSec & Trace Cleaner</span>
            </div>
            <button onClick={handleSpoof} disabled={isSpoofing} className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black px-4 py-2 rounded-lg transition-all shadow-lg shadow-blue-900/20">
              {isSpoofing ? 'EXECUTING COMMANDS...' : 'FLUSH TRACES (REAL)'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 font-mono relative z-10">
            <div className="space-y-1">
              <span className="text-[9px] text-zinc-600 uppercase">System ID</span>
              <div className="bg-black/40 border border-white/5 p-3 rounded-xl text-blue-400 text-xs truncate">{hwid.smbios}</div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-zinc-600 uppercase">Interface MAC</span>
              <div className="bg-black/40 border border-white/5 p-3 rounded-xl text-blue-400 text-xs truncate">{hwid.mac}</div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-zinc-600 uppercase">Temp Storage</span>
              <div className="bg-black/40 border border-white/5 p-3 rounded-xl text-zinc-400 text-xs truncate">{hwid.diskId}</div>
            </div>
             <div className="space-y-1">
              <span className="text-[9px] text-zinc-600 uppercase">Route Table</span>
              <div className="bg-black/40 border border-white/5 p-3 rounded-xl text-green-500/80 text-xs truncate">{hwid.arp}</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-white/5 rounded-2xl p-6 flex flex-col justify-center items-center text-center space-y-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <Lock size={24} className="text-blue-500 animate-pulse relative z-10" />
          <h3 className="text-xs font-black text-white uppercase italic relative z-10">Stealth Monitor</h3>
          <p className="text-[9px] text-zinc-500 uppercase tracking-tighter relative z-10">Heuristic analysis of OS signals active.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-1">
           <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Security Modules</h3>
           <div className="relative group w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search bypass..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111114] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-zinc-400 outline-none focus:border-blue-500/40 transition-all"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visibleMethods.map((m) => (
              <div 
                key={m.id}
                className={`flex items-start justify-between p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                  m.active 
                  ? 'bg-[#141417] border-blue-500/20 hover:border-blue-500/40' 
                  : 'bg-transparent border-white/5 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                }`} 
                onClick={() => toggleModule(m.id)}
              >
                 <div className="absolute top-0 right-0 flex">
                     {m.platform && m.platform.map(p => (
                       <div key={p} className={`px-2 py-0.5 text-[8px] font-black uppercase bg-zinc-900 text-zinc-400 border-l border-b border-white/5`}>
                         {p}
                       </div>
                     ))}
                     <div className={`px-2 py-0.5 text-[8px] font-black rounded-bl-lg ${getRiskColor(m.riskLevel)}`}>
                        {m.riskLevel}
                    </div>
                 </div>
                 
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(m.category)}
                    <h4 className={`text-xs font-black transition-colors ${m.active ? 'text-blue-400' : 'text-zinc-500'}`}>{m.label}</h4>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-tight max-w-[220px]">{m.desc}</p>
                </div>
                <div className={`w-9 h-5 rounded-full relative transition-all shrink-0 ml-4 mt-4 ${m.active ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-zinc-800'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${m.active ? 'left-5 shadow-sm' : 'left-1'}`} />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SecuritySuite;
