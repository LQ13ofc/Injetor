import React, { useState } from 'react';
import { ShieldCheck, Fingerprint, Search, Cpu, Terminal, Shield, Network, HardDrive, Lock, Code } from 'lucide-react';
import { SecurityModule, PluginModule } from '../types';

interface SecuritySuiteProps {
  addLog: (msg: string, level?: any, cat?: string) => void;
  enabledPlugins: PluginModule[];
}

const SecuritySuite: React.FC<SecuritySuiteProps> = ({ addLog, enabledPlugins }) => {
  const [securityModules, setSecurityModules] = useState<SecurityModule[]>([
    { id: 'p1', label: "Polymorphic Mutation", desc: "Randomizes assembly instructions (MOV -> PUSH/POP) every 60s.", lang: ['asm'], active: true, riskLevel: 'GOD', category: 'KERNEL' },
    { id: 'p2', label: "Call Stack Spoofing", desc: "Hides execution origin by spoofing return addresses.", lang: ['cpp'], active: true, riskLevel: 'GOD', category: 'KERNEL' },
    { id: 'p3', label: "VMT Protection", desc: "Backups and restores VTables after short-lived hooks.", lang: ['cpp'], active: true, riskLevel: 'EXTREME', category: 'MEMORY' },
    { id: 'p4', label: "Watchdog Suspension", desc: "Temporarily suspends Byfron/Hyperion threads during injection.", lang: ['c'], active: true, riskLevel: 'GOD', category: 'KERNEL' },
    { id: 'p5', label: "Direct Syscalls (x64)", desc: "Uses syscall instructions to bypass ntdll hooks.", lang: ['asm'], active: true, riskLevel: 'GOD', category: 'KERNEL' },
    { id: 'p6', label: "HWID Serial Mask", desc: "Dynamic spoofing of SMBIOS and Disk serials.", lang: ['c'], active: true, riskLevel: 'SAFE', category: 'HARDWARE' },
  ]);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-blue-500" size={28} />
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Nexus Protection Core</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {securityModules.map((m) => (
          <div 
            key={m.id}
            onClick={() => setSecurityModules(prev => prev.map(mod => mod.id === m.id ? {...mod, active: !mod.active} : mod))}
            className={`p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
              m.active ? 'bg-[#141417] border-blue-500/20 shadow-xl' : 'bg-transparent border-white/5 opacity-50'
            }`}
          >
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-xl"><Lock size={16} className="text-blue-500" /></div>
                    <h4 className="text-sm font-black text-white uppercase italic">{m.label}</h4>
                </div>
                <div className={`px-2 py-1 text-[8px] font-black rounded-lg ${m.riskLevel === 'GOD' ? 'bg-purple-600' : 'bg-zinc-800'}`}>{m.riskLevel}</div>
             </div>
             <p className="text-[10px] text-zinc-500 leading-relaxed font-bold uppercase tracking-tight">{m.desc}</p>
             <div className={`mt-6 w-10 h-1 rounded-full ${m.active ? 'bg-blue-500 animate-pulse' : 'bg-zinc-800'}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecuritySuite;