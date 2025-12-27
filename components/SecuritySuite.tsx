
import React, { useState, useMemo } from 'react';
import { ShieldCheck, RefreshCcw, Lock, Search, ShieldAlert, Cpu, Zap, EyeOff, Terminal, Shield, Fingerprint, Network, Radio } from 'lucide-react';
import { HWIDProfile, PluginModule } from '../types';

interface SecuritySuiteProps {
  addLog: (msg: string, level?: any, cat?: string) => void;
  enabledPlugins: PluginModule[];
}

const SecuritySuite: React.FC<SecuritySuiteProps> = ({ addLog, enabledPlugins }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hwid, setHwid] = useState<HWIDProfile>({
    smbios: 'FLUX-HW-7712',
    diskId: 'SSD-SATA-8801',
    mac: '0A:11:BB:CC:DD:EE',
    gpu: 'VIRTUAL-FLUX-GPU'
  });
  
  const [isSpoofing, setIsSpoofing] = useState(false);

  const allMethods = useMemo(() => [
    // KERNEL LEVEL
    { label: "CR3 Protection Bypass", desc: "Prevents anti-cheats from reading game process memory using CR3 register swapping.", lang: ['c', 'cpp'] },
    { label: "PTE Remapping Stealth", desc: "Remaps page table entries to non-executable memory, bypassing hardware scans.", lang: ['c', 'cpp'] },
    { label: "APC Hijack Detection Bypass", desc: "Avoids detection when using Asynchronous Procedure Calls to execute code.", lang: ['c', 'cpp'] },
    { label: "IDT Hooking Detection Bypass", desc: "Hides modifications to the Interrupt Descriptor Table from watchdog drivers.", lang: ['c', 'cpp'] },
    { label: "KPP (PatchGuard) Bypass", desc: "Disables kernel patch protection heartbeats to allow driver-level modifications.", lang: ['c', 'cpp'] },
    { label: "Driver Object Unlinking", desc: "Removes the Nexus driver from the system's driver list (PsLoadedModuleList).", lang: ['c', 'cpp'] },
    
    // RAGE ENGINE (GTA/RDR)
    { label: "Native Table Scrambler", desc: "Randomizes the address of game native functions every frame to confuse pattern scanners.", lang: ['cpp', 'c'] },
    { label: "Script Thread Masking", desc: "Disguises the malicious execution thread as a legitimate game script thread (main.lua).", lang: ['lua', 'cpp'] },
    { label: "Cross-Process Isolation", desc: "Executes logic in a surrogate process and communicates via encrypted shared memory.", lang: ['cpp', 'c'] },
    { label: "Native Call Table Cloak", desc: "Wraps all native invocations in an obfuscated junk-code shell.", lang: ['cpp'] },
    
    // ROBLOX / LUAU
    { label: "GetNilInstances Cloaking", desc: "Hides malicious scripts attached to the Nil parent, invisible to standard explorers.", lang: ['lua'] },
    { label: "Memory Viewport Randomization", desc: "Randomizes internal Luau memory layouts to break scanner offsets.", lang: ['lua'] },
    { label: "Metatable Protection v3", desc: "Strict read-only metatable locking to prevent game-side hook detection.", lang: ['lua'] },
    { label: "Luau Bridge Obfuscation", desc: "Encrypts communication between the C++ engine and Luau runtime.", lang: ['lua', 'cpp'] },

    // UNIVERSAL EVASION
    { label: "Heartbeat Spoofing", desc: "Sends fake 'all-clear' signals to the anti-cheat server even while active.", lang: ['c', 'cpp', 'csharp'] },
    { label: "Object Property Hiding", desc: "Prevents reflection-based scanners from seeing modified game objects.", lang: ['csharp', 'lua'] },
    { label: "TLS Callback Hijack", desc: "Executes code before the game entry point to establish early persistence.", lang: ['c', 'cpp'] },
    { label: "Manual Map Stripping", desc: "Removes PE headers and string references from memory after injection.", lang: ['cpp', 'c'] },
    { label: "Virtual Memory Hook Hider", desc: "Hides inline JMP hooks from page-guard and integrity checks.", lang: ['c', 'cpp', 'csharp'] },
    { label: "Hardware Breakpoint Virtualizer", desc: "Intercepts hardware breakpoint reads to return original CPU states.", lang: ['c', 'cpp'] }
  ], []);

  const visibleMethods = useMemo(() => {
    const enabledIds = enabledPlugins.map(p => p.id);
    return allMethods.filter(m => {
      const langMatch = m.lang.some(l => enabledIds.includes(l as any));
      const searchMatch = m.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return langMatch && searchMatch;
    });
  }, [enabledPlugins, allMethods, searchQuery]);

  const handleSpoof = () => {
    setIsSpoofing(true);
    addLog('Refreshing Virtual Identifiers...', 'INFO', 'SECURITY');
    setTimeout(() => {
      setHwid({
        smbios: `FLUX-HW-${Math.floor(Math.random() * 9000 + 1000)}`,
        diskId: `DISK-${Math.floor(Math.random() * 9000 + 1000)}`,
        mac: `0A:${Math.floor(Math.random() * 90).toString(16).toUpperCase()}:BB:CC:DD:EE`,
        gpu: 'VIRTUAL-FLUX-GPU'
      });
      setIsSpoofing(false);
      addLog('Identities randomized.', 'SUCCESS', 'SECURITY');
    }, 1000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-blue-500" size={24} />
          <h2 className="text-xl font-black text-white tracking-tight uppercase italic">Nexus Security Protocol</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-[#141417] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Fingerprint className="text-zinc-500" size={18} />
              <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Active Identity Shield</span>
            </div>
            <button onClick={handleSpoof} disabled={isSpoofing} className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black px-4 py-2 rounded-lg transition-all shadow-lg shadow-blue-900/20">
              {isSpoofing ? 'RANDOMIZING...' : 'SPOOF SYSTEM ID'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 font-mono">
            <div className="space-y-1">
              <span className="text-[9px] text-zinc-600 uppercase">SMBIOS Serial</span>
              <div className="bg-black/40 border border-white/5 p-3 rounded-xl text-blue-400 text-xs truncate">{hwid.smbios}</div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-zinc-600 uppercase">Hardware MAC</span>
              <div className="bg-black/40 border border-white/5 p-3 rounded-xl text-blue-400 text-xs truncate">{hwid.mac}</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-white/5 rounded-2xl p-6 flex flex-col justify-center items-center text-center space-y-2">
          <Radio size={24} className="text-blue-500 animate-pulse" />
          <h3 className="text-xs font-black text-white uppercase italic">Undetected Status</h3>
          <p className="text-[9px] text-zinc-500 uppercase tracking-tighter">Verified against: EAC, BE, Byfron, Ricochet</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-1">
           <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Bypass Modules ({visibleMethods.length})</h3>
           <div className="relative group w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Filter modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111114] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-zinc-400 outline-none focus:border-blue-500/40 transition-all"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visibleMethods.length > 0 ? (
            visibleMethods.map((m, i) => (
              <ToggleItem key={i} label={m.label} desc={m.desc} />
            ))
          ) : (
            <div className="col-span-full p-20 bg-[#141417]/30 border border-dashed border-white/10 rounded-3xl flex flex-col items-center text-center gap-4">
              <ShieldAlert size={32} className="text-orange-500 opacity-50" />
              <div className="space-y-1">
                <p className="text-sm font-black text-zinc-400 uppercase italic">No modules match criteria</p>
                <p className="text-[10px] text-zinc-600">Ensure relevant Language Runtimes are enabled in the Plugins tab.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ToggleItem: React.FC<{ label: string, desc: string }> = ({ label, desc }) => {
  const [val, setVal] = useState(true);
  return (
    <div 
      className={`flex items-start justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${
        val ? 'bg-[#141417] border-white/10 hover:border-blue-500/20' : 'bg-transparent border-white/5 opacity-40 grayscale'
      }`} 
      onClick={() => setVal(!val)}
    >
      <div className="space-y-1">
        <h4 className={`text-xs font-black transition-colors ${val ? 'text-blue-400' : 'text-zinc-600'}`}>{label}</h4>
        <p className="text-[10px] text-zinc-500 leading-tight max-w-[220px]">{desc}</p>
      </div>
      <div className={`w-9 h-5 rounded-full relative transition-all shrink-0 ml-4 ${val ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-zinc-800'}`}>
        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${val ? 'left-5 shadow-sm' : 'left-1'}`} />
      </div>
    </div>
  );
};

export default SecuritySuite;
