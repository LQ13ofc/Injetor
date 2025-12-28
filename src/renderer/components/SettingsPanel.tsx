
import React, { useState } from 'react';
import { Settings as SettingsIcon, Shield, Monitor, Network, HardDrive, Cpu as Chip, Ghost, Eraser, Save, Upload, Sun, Moon } from 'lucide-react';
import { AppSettings, SystemStats } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  stats: SystemStats;
  addLog: (msg: string, level?: any, cat?: string) => void;
}

type SettingsTab = 'GENERAL' | 'KERNEL' | 'NETWORK' | 'DMA';

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, setSettings, stats, addLog }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('GENERAL');

  const toggleSetting = (key: keyof AppSettings) => {
    setSettings(prev => ({ ...prev, [key]: typeof prev[key] === 'boolean' ? !prev[key] : prev[key] }));
  };

  const updateNested = (section: keyof AppSettings, key: string, value: any) => {
    setSettings(prev => ({
        ...prev,
        [section]: {
            ...(prev[section] as any),
            [key]: value
        }
    }));
  };

  const handleSaveSettings = async () => {
    if (window.fluxAPI) {
        const success = await window.fluxAPI.saveSettings(settings);
        if(success) addLog("Settings saved to disk.", "SUCCESS", "SYSTEM");
        else addLog("Failed to save settings.", "ERROR", "SYSTEM");
    }
  };

  const handleLoadSettings = async () => {
    if (window.fluxAPI) {
        const loaded = await window.fluxAPI.loadSettings();
        if(loaded) {
            setSettings(loaded);
            addLog("Settings reloaded from disk.", "INFO", "SYSTEM");
        } else {
            addLog("No settings file found.", "WARN", "SYSTEM");
        }
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-5xl mx-auto space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                <SettingsIcon size={24} className="text-blue-500" />
                <h2 className="text-2xl font-black text-content uppercase italic tracking-tight">System Configuration</h2>
                </div>
                <p className="text-muted text-xs font-medium uppercase tracking-widest ml-9">Global parameters for {stats.complexity} mode.</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-panel rounded-2xl border border-border-dim sticky top-0 z-10 shadow-xl backdrop-blur-md transition-colors duration-300">
                <TabButton active={activeTab === 'GENERAL'} onClick={() => setActiveTab('GENERAL')} icon={Monitor} label="General" />
                <TabButton active={activeTab === 'KERNEL'} onClick={() => setActiveTab('KERNEL')} icon={Chip} label="Kernel / Thread" />
                <TabButton active={activeTab === 'NETWORK'} onClick={() => setActiveTab('NETWORK')} icon={Network} label="Network" />
                <TabButton active={activeTab === 'DMA'} onClick={() => setActiveTab('DMA')} icon={HardDrive} label="Hardware DMA" />
            </div>

            <div className="space-y-6">
                
                {/* GENERAL TAB */}
                {activeTab === 'GENERAL' && (
                    <SettingsSection title="General Behavior" icon={<Monitor size={16} />}>
                    <div className="p-6 flex items-center justify-between border-b border-border-dim">
                        <div className="flex items-center gap-3">
                            <div className="text-muted">{settings.theme === 'dark' ? <Moon size={16}/> : <Sun size={16}/>}</div>
                            <div>
                                <h4 className="text-xs font-black text-content">Interface Theme</h4>
                                <p className="text-[10px] text-muted font-medium">Toggle between light and dark visual modes.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSettings(p => ({...p, theme: p.theme === 'dark' ? 'light' : 'dark'}))}
                            className="px-4 py-2 bg-sidebar border border-border-dim rounded-lg text-[10px] font-bold uppercase text-content hover:bg-main transition-colors"
                        >
                            {settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </button>
                    </div>

                    <SettingItem 
                        label="Auto-Injection" 
                        desc="Automatically deploy bypass when process is found." 
                        active={settings.autoInject} 
                        onToggle={() => toggleSetting('autoInject')}
                    />
                    <SettingItem 
                        label="Stealth Mode" 
                        desc="Forces NtCreateThreadEx instead of CreateRemoteThread." 
                        active={settings.stealthMode} 
                        onToggle={() => toggleSetting('stealthMode')}
                    />
                    <SettingItem 
                        label="Ghost Injection (File Flux)" 
                        desc="Renames DLL and applies Time Stomping (changes file date) to evade heuristics." 
                        active={settings.ghostMode} 
                        onToggle={() => toggleSetting('ghostMode')}
                        icon={<Ghost size={14} />}
                    />
                    <SettingItem 
                        label="Memory String Cleaner" 
                        desc="Overwrites DLL path in target memory after successful injection." 
                        active={settings.memoryCleaner} 
                        onToggle={() => toggleSetting('memoryCleaner')}
                        icon={<Eraser size={14} />}
                    />
                    </SettingsSection>
                )}

                {/* KERNEL TAB */}
                {activeTab === 'KERNEL' && (
                    <SettingsSection title="Thread Management" icon={<Chip size={16} className="text-purple-500" />}>
                    <SettingItem 
                        label="Realtime Priority Class" 
                        desc="Force Flux Core process to REALTIME_PRIORITY_CLASS." 
                        active={settings.kernelPriority} 
                        onToggle={() => toggleSetting('kernelPriority')}
                    />
                    
                    <div className="p-6 border-b border-border-dim">
                        <span className="text-xs font-bold text-muted uppercase italic block mb-3">Injection Strategy</span>
                        <div className="grid grid-cols-2 gap-3">
                            {['INTERNAL', 'EXTERNAL'].map((strat) => (
                                <button 
                                    key={strat}
                                    onClick={() => setSettings(p => ({...p, executionStrategy: strat as any}))}
                                    className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${settings.executionStrategy === strat ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-main text-muted border border-border-dim hover:bg-border-dim'}`}
                                >
                                    {strat}
                                </button>
                            ))}
                        </div>
                        <p className="mt-3 text-[10px] text-muted">Note: Hypervisor methods require Ring-0 drivers and are not available in user-mode.</p>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-muted uppercase italic">Memory Allocation Buffer</span>
                        <span className="text-[10px] font-mono text-blue-400 font-black">{settings.memoryBuffer} MB</span>
                        </div>
                        <input 
                        type="range" 
                        min="128" 
                        max="4096" 
                        step="128"
                        value={settings.memoryBuffer}
                        onChange={(e) => setSettings(prev => ({...prev, memoryBuffer: parseInt(e.target.value)}))}
                        className="w-full h-1.5 bg-sidebar rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                    </SettingsSection>
                )}

                {/* NETWORK TAB */}
                {activeTab === 'NETWORK' && (
                    <SettingsSection title="Network Tunneling" icon={<Network size={16} className="text-green-500" />}>
                        <SettingItem 
                            label="Packet Encryption (TLS 1.3)" 
                            desc="Encrypt all script traffic to remote servers (if supported by script)." 
                            active={settings.network.packetEncryption} 
                            onToggle={() => updateNested('network', 'packetEncryption', !settings.network.packetEncryption)}
                        />
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-muted uppercase italic">Artificial Latency (Jitter)</span>
                            <span className="text-[10px] font-mono text-green-400 font-black">{settings.network.latencySimulation} ms</span>
                            </div>
                            <input 
                            type="range" 
                            min="0" 
                            max="500" 
                            step="10"
                            value={settings.network.latencySimulation}
                            onChange={(e) => updateNested('network', 'latencySimulation', parseInt(e.target.value))}
                            className="w-full h-1.5 bg-sidebar rounded-lg appearance-none cursor-pointer accent-green-600"
                            />
                            <p className="text-[10px] text-muted">Simulates human-like lag to bypass statistical analysis.</p>
                        </div>
                    </SettingsSection>
                )}

                {/* DMA TAB */}
                {activeTab === 'DMA' && (
                    <SettingsSection title="External Hardware Config Generator" icon={<HardDrive size={16} className="text-orange-500" />}>
                        <SettingItem 
                            label="Enable Config Generation" 
                            desc="Generate JSON configs for external DMA hardware cards." 
                            active={settings.dma.enabled} 
                            onToggle={() => updateNested('dma', 'enabled', !settings.dma.enabled)}
                        />
                        {settings.dma.enabled && (
                            <div className="p-6 space-y-4 bg-orange-500/5">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold text-muted uppercase">Target Device</span>
                                    <select 
                                        value={settings.dma.device}
                                        onChange={(e) => updateNested('dma', 'device', e.target.value)}
                                        className="w-full bg-main border border-border-dim rounded-xl p-3 text-xs text-content outline-none focus:border-orange-500/30 transition-colors"
                                    >
                                        <option value="LeetDMA">LeetDMA PCIe</option>
                                        <option value="RaptorDMA">RaptorDMA</option>
                                        <option value="Squirrel">Squirrel (Lambda)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold text-muted uppercase">Firmware Signature Profile</span>
                                    <select 
                                        value={settings.dma.firmwareType}
                                        onChange={(e) => updateNested('dma', 'firmwareType', e.target.value)}
                                        className="w-full bg-main border border-border-dim rounded-xl p-3 text-xs text-content outline-none focus:border-orange-500/30 transition-colors"
                                    >
                                        <option value="Custom">Custom (1:1 Private)</option>
                                        <option value="Generic">Generic (Detected Risk)</option>
                                        <option value="Pooled">Pooled License</option>
                                    </select>
                                </div>
                                <p className="text-[9px] text-orange-400/80 italic">Warning: This app manages configs only. It does not act as a DMA driver itself.</p>
                            </div>
                        )}
                    </SettingsSection>
                )}
            </div>

            <div className="pt-8 border-t border-border-dim flex items-center justify-between">
                <div className="flex gap-4">
                    <button onClick={handleLoadSettings} className="flex items-center gap-2 px-4 py-3 bg-sidebar border border-border-dim text-muted hover:text-content rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                        <Upload size={14} /> Load Config
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-sidebar border border-border-dim rounded-lg">
                        <Shield size={12} className="text-green-500" />
                        <span className="text-[9px] font-black text-muted uppercase tracking-widest">Config Encrypted</span>
                    </div>
                </div>
                <button onClick={handleSaveSettings} className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-blue-900/20 active:scale-95">
                    <Save size={14} />
                    Save Profile
                </button>
            </div>
        </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string }> = ({ active, onClick, icon: Icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${active ? 'bg-sidebar text-content shadow-sm ring-1 ring-border-dim' : 'text-muted hover:text-content hover:bg-main/50'}`}
    >
        <Icon size={14} />
        {label}
    </button>
);

const SettingsSection: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-panel border border-border-dim rounded-3xl overflow-hidden shadow-lg transition-colors duration-300">
    <div className="p-5 bg-main/30 border-b border-border-dim flex items-center gap-3">
       <span className="text-muted">{icon}</span>
       <h3 className="font-black text-content text-[10px] uppercase tracking-widest">{title}</h3>
    </div>
    <div className="divide-y divide-border-dim">
      {children}
    </div>
  </div>
);

const SettingItem: React.FC<{ label: string, desc: string, active: boolean, onToggle: () => void, icon?: React.ReactNode }> = ({ label, desc, active, onToggle, icon }) => (
  <div className="p-6 flex items-center justify-between hover:bg-main/30 transition-colors cursor-pointer group" onClick={onToggle}>
    <div className="flex items-start gap-3">
        {icon && <div className="text-muted mt-0.5">{icon}</div>}
        <div className="space-y-1">
        <h4 className={`text-xs font-black transition-colors ${active ? 'text-blue-400' : 'text-content group-hover:text-blue-400'}`}>{label}</h4>
        <p className="text-[10px] text-muted font-medium">{desc}</p>
        </div>
    </div>
    <div className={`w-11 h-6 rounded-full relative transition-all ${active ? 'bg-blue-600' : 'bg-sidebar border border-border-dim'}`}>
       <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${active ? 'left-6' : 'left-1'}`} />
    </div>
  </div>
);

export default SettingsPanel;
