import React from 'react';
import { 
  LayoutDashboard, 
  Code2, 
  ShieldAlert, 
  Terminal, 
  Zap,
  Package,
  Settings
} from 'lucide-react';
import { AppView } from '../../types';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.EDITOR, label: 'Editor', icon: Code2 },
    { id: AppView.SECURITY, label: 'Security', icon: ShieldAlert },
    { id: AppView.PLUGINS, label: 'Plugins', icon: Package },
    { id: AppView.LOGS, label: 'Logs', icon: Terminal },
    { id: AppView.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-56 border-r border-border-dim flex flex-col bg-sidebar shrink-0 transition-colors duration-300">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/40">
          <Zap size={16} className="text-white" fill="currentColor" />
        </div>
        <h1 className="font-black text-sm tracking-tight text-content uppercase italic">Flux Core</h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10 shadow-[inset_0_0_10px_rgba(59,130,246,0.05)]' 
                  : 'text-muted hover:text-content hover:bg-main/50'
              }`}
            >
              <Icon size={16} />
              <span className="text-[11px] font-black tracking-tight uppercase">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 m-3 rounded-xl bg-main/50 border border-border-dim space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-black text-muted uppercase tracking-widest">Protection</span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
        </div>
        <div className="text-[9px] text-muted font-mono tracking-tighter truncate">ENCRYPTED_TUNNEL_ACTIVE</div>
      </div>
    </aside>
  );
};

export default Sidebar;