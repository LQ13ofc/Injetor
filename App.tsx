
import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ScriptEditor from './components/ScriptEditor';
import SecuritySuite from './components/SecuritySuite';
import PluginsPanel from './components/PluginsPanel';
import ConsoleLogs from './components/ConsoleLogs';
import ScriptHub from './components/ScriptHub';
import SettingsPanel from './components/SettingsPanel';
import { AppView, SystemStats, LogEntry, PluginModule, GamePack, AppSettings, Platform } from './types';

// --- UNIVERSAL RUNTIME LIST ---
const INITIAL_RUNTIMES: PluginModule[] = [
  { id: 'lua', name: 'Luau/LuaJIT', description: 'Roblox (Luau) & FiveM (Lua 5.4) Optimized Engine.', enabled: true, version: '5.4.2', type: 'Scripting' },
  { id: 'cpp', name: 'C++ Native', description: 'Direct memory access via VMT Hooking (GTA/RDR).', enabled: true, version: 'C++20', type: 'Low Level' },
  { id: 'c', name: 'C Native', description: 'Raw syscalls, eBPF and kernel-mode structures.', enabled: true, version: 'C17', type: 'Low Level' },
  { id: 'csharp', name: 'C# (Mono/Il2Cpp)', description: 'Runtime injection for Unity games (Stardew, Tarkov).', enabled: true, version: '.NET 6', type: 'Managed' },
  { id: 'java', name: 'Java HotSpot', description: 'JNI Bridge for Minecraft & Project Zomboid.', enabled: true, version: 'JDK 17', type: 'VM' },
  { id: 'python', name: 'Python Native', description: 'External automation, data processing & AI Ops.', enabled: true, version: '3.11', type: 'Scripting' },
  { id: 'js', name: 'Node/V8', description: 'JavaScript injection for Electron-based games.', enabled: false, version: 'V8.9', type: 'Web Engine' },
  { id: 'rust', name: 'Rust', description: 'Memory-safe external overlays.', enabled: false, version: '1.75', type: 'System' },
  { id: 'ruby', name: 'Ruby', description: 'Rapid automation scripts.', enabled: false, version: '3.0', type: 'Scripting' },
  { id: 'swift', name: 'Swift', description: 'macOS Native hooking.', enabled: false, version: '5.0', type: 'System' },
  { id: 'asm', name: 'x64 Assembly', description: 'Direct shellcode execution & JMP hooks.', enabled: true, version: 'NASM', type: 'Machine Code' },
];

// --- COMPLETE GAME LIBRARY WITH REAL PAYLOADS ---
const INITIAL_GAME_LIBRARY: GamePack[] = [
  { 
      id: 'roblox', 
      name: 'Roblox', 
      processName: 'RobloxPlayerBeta.exe', 
      installed: true,
      engine: 'Luau (Custom Task Scheduler)',
      bypassMethod: 'Hyperion V4 (Byfron) Bypass',
      scripts: [
          { id: 'r1', name: 'Invisibility', enabled: false, code: 'game.Players.LocalPlayer.Character.Parent = game.Lighting' },
          { id: 'r2', name: 'Fly (Nexus V3)', enabled: false, code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/Nexus/Fly/main.lua"))()' },
          { id: 'r3', name: 'Infinite Jump', enabled: true, code: 'game:GetService("UserInputService").JumpRequest:Connect(function() game.Players.LocalPlayer.Character:FindFirstChildOfClass("Humanoid"):ChangeState(3) end)' },
          { id: 'r4', name: 'Speed (Reactive)', enabled: false, code: 'game.Players.LocalPlayer.Character.Humanoid.WalkSpeed = getgenv().Speed or 100', params: [{id: 'val', label: 'Value', type: 'slider', min: 16, max: 300, value: 100}] },
          { id: 'r5', name: 'Jump Power', enabled: false, code: 'game.Players.LocalPlayer.Character.Humanoid.JumpPower = getgenv().Jump or 150', params: [{id: 'val', label: 'Power', type: 'slider', min: 50, max: 500, value: 150}] },
          { id: 'r6', name: 'NoClip (Safe)', enabled: false, code: 'game:GetService("RunService").Stepped:Connect(function() for _,v in pairs(game.Players.LocalPlayer.Character:GetChildren()) do if v:IsA("BasePart") then v.CanCollide = false end end end)' },
          { id: 'r7', name: 'Fullbright', enabled: true, code: 'game.Lighting.Brightness = 2; game.Lighting.ClockTime = 14; game.Lighting.GlobalShadows = false' },
          { id: 'r8', name: 'ESP Box', enabled: false, code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/Nexus/ESP/main.lua"))()' },
          { id: 'r9', name: 'Auto-Click', enabled: false, code: 'while task.wait() do mouse1click() end' },
          { id: 'r10', name: 'Anti-AFK', enabled: true, code: 'for i,v in pairs(getconnections(game.Players.LocalPlayer.Idled)) do v:Disable() end' },
          { id: 'r11', name: 'Teleport (Target)', enabled: false, code: 'game.Players.LocalPlayer.Character.HumanoidRootPart.CFrame = game.Players[getgenv().Target].Character.HumanoidRootPart.CFrame', params: [{id: 't', label: 'Target', type: 'text', value: ''}] }
      ]
  },
  { 
      id: 'gta', 
      name: 'GTA V (Singleplayer)', 
      processName: 'GTA5.exe', 
      installed: true,
      engine: 'RAGE (C++ Native)',
      bypassMethod: 'Social Club Pattern Scan',
      scripts: [
          { id: 'g1', name: 'God Mode', enabled: true, code: 'PLAYER::SET_PLAYER_INVINCIBLE(PLAYER::PLAYER_ID(), true);' },
          { id: 'g2', name: 'Never Wanted', enabled: true, code: 'PLAYER::CLEAR_PLAYER_WANTED_LEVEL(PLAYER::PLAYER_ID());' },
          { id: 'g3', name: 'Give All Weapons', enabled: false, code: 'for(auto h : weaponHashes) WEAPON::GIVE_DELAYED_WEAPON_TO_PED(PLAYER::PLAYER_PED_ID(), h, 999, true);' },
          { id: 'g4', name: 'Infinite Ammo', enabled: true, code: 'WEAPON::SET_PED_INFINITE_AMMO_CLIP(PLAYER::PLAYER_PED_ID(), true);' },
          { id: 'g5', name: 'Super Jump', enabled: false, code: 'MISC::SET_SUPER_JUMP_THIS_FRAME(PLAYER::PLAYER_ID());' },
          { id: 'g6', name: 'Explosive Melee', enabled: false, code: 'MISC::SET_EXPLOSIVE_MELEE_THIS_FRAME(PLAYER::PLAYER_ID());' },
          { id: 'g7', name: 'Vehicle God Mode', enabled: false, code: 'ENTITY::SET_ENTITY_INVINCIBLE(PED::GET_VEHICLE_PED_IS_IN(PLAYER::PLAYER_PED_ID(), false), true);' },
          { id: 'g8', name: 'Spawn Adder', enabled: false, code: 'VEHICLE::CREATE_VEHICLE(0xB779A091, coords, 0.0, true, false);' },
          { id: 'g9', name: 'Teleport Waypoint', enabled: false, code: 'Vector3 wp = GET_WAYPOINT_COORDS(); ENTITY::SET_ENTITY_COORDS(PLAYER::PLAYER_PED_ID(), wp.x, wp.y, wp.z, 0, 0, 0, false);' },
          { id: 'g10', name: 'Model Changer', enabled: false, code: 'PLAYER::SET_PLAYER_MODEL(PLAYER::PLAYER_ID(), modelHash);' }
      ]
  },
  {
      id: 'fivem',
      name: 'FiveM (Stealth)',
      processName: 'FiveM_GTAProcess.exe',
      installed: true,
      engine: 'Citrix/Lua Wrapper',
      bypassMethod: 'Adhesive Bypass + Trigger Guard',
      scripts: [
          { id: 'fv1', name: 'Invisible', enabled: false, code: 'SetEntityVisible(PlayerPedId(), false)' },
          { id: 'fv2', name: 'No Recoil', enabled: true, code: 'SetWeaponRecoilShakeAmplitude(GetSelectedPedWeapon(PlayerPedId()), 0.0)' },
          { id: 'fv3', name: 'No Reload', enabled: false, code: 'SetPedInfiniteAmmoClip(PlayerPedId(), true)' },
          { id: 'fv4', name: 'Revive Self', enabled: false, code: 'NetworkResurrectLocalPlayer(GetEntityCoords(PlayerPedId()), 0.0, true, false)' },
          { id: 'fv5', name: 'Fast Run (1.49x)', enabled: false, code: 'SetRunSprintMultiplierForPlayer(PlayerId(), 1.49)' },
          { id: 'fv6', name: 'Repair Car', enabled: false, code: 'SetVehicleFixed(GetVehiclePedIsIn(PlayerPedId(), false))' },
          { id: 'fv7', name: 'TP Waypoint', enabled: false, code: 'SetEntityCoords(PlayerPedId(), GetBlipInfoIdCoord(GetFirstBlipInfoId(8)))' },
          { id: 'fv8', name: 'No Water Collision', enabled: false, code: 'SetEntityHasGravity(PlayerPedId(), false)' },
          { id: 'fv9', name: 'Thermal Vision', enabled: false, code: 'SetSeethrough(true)' },
          { id: 'fv10', name: 'Armor 100%', enabled: false, code: 'SetPedArmour(PlayerPedId(), 100)' }
      ]
  },
  { 
      id: 'rdr2', 
      name: 'RDR 2 (Singleplayer)', 
      processName: 'RDR2.exe', 
      installed: false,
      engine: 'RAGE (Native Bridge)',
      bypassMethod: 'Scripthook Proxy',
      scripts: [
          { id: 'rd1', name: 'Inf. Dead Eye', enabled: true, code: 'PLAYER::_SET_PLAYER_DEAD_EYE_POINTS(PLAYER::PLAYER_ID(), 100.0f);' },
          { id: 'rd2', name: 'God Mode', enabled: true, code: 'ENTITY::SET_ENTITY_INVINCIBLE(PLAYER::PLAYER_PED_ID(), true);' },
          { id: 'rd3', name: 'Inf. Stamina', enabled: true, code: 'PLAYER::_RESTORE_PLAYER_STAMINA(PLAYER::PLAYER_ID(), 100.0f);' },
          { id: 'rd4', name: 'No Ragdoll', enabled: false, code: 'PED::SET_PED_CAN_RAGDOLL(PLAYER::PLAYER_PED_ID(), false);' },
          { id: 'rd5', name: 'Add $1000', enabled: false, code: 'CASH::ADD_CASH(100000);' },
          { id: 'rd6', name: 'Horse God Mode', enabled: false, code: 'ENTITY::SET_ENTITY_INVINCIBLE(PED::GET_MOUNT(PLAYER::PLAYER_PED_ID()), true);' },
          { id: 'rd7', name: 'Horse Inf. Stamina', enabled: false, code: 'PED::_RESTORE_HORSE_STAMINA(PED::GET_MOUNT(PLAYER::PLAYER_PED_ID()), 100.0f);' },
          { id: 'rd8', name: 'Set Sunny', enabled: false, code: 'MISC::SET_WEATHER_TYPE_PERSIST(0x310D7033);' },
          { id: 'rd9', name: 'Spawn Bear', enabled: false, code: 'ENTITY::CREATE_PED(0x9484089C, coords, 0.0, true, false);' },
          { id: 'rd10', name: 'Clean Clothes', enabled: false, code: 'PED::CLEAR_PED_BLOOD_DAMAGE(PLAYER::PLAYER_PED_ID());' }
      ]
  },
  { 
      id: 'rdro', 
      name: 'RDR Online', 
      processName: 'RDR2.exe', 
      installed: false,
      engine: 'RAGE (Kernel Syscalls)',
      bypassMethod: 'Kernel Read/Write (Ring 0)',
      scripts: [
          { id: 'rdo1', name: 'Silent Aim', enabled: true, code: '// Internal Memory Write fPitch/fYaw' },
          { id: 'rdo2', name: 'ESP Box (Direct2D)', enabled: true, code: '// External Overlay Draw' },
          { id: 'rdo3', name: 'ESP Animal (Rarity)', enabled: false, code: '// Filter Entity List > 4' },
          { id: 'rdo4', name: 'Anti-Wetness', enabled: true, code: 'PED::CLEAR_PED_WETNESS(PLAYER::PLAYER_PED_ID());' },
          { id: 'rdo5', name: 'Event Blocker', enabled: true, code: 'BLOCK_NETWORK_EVENT(CEventNetworkExplosion);' },
          { id: 'rdo6', name: 'Inf. Ammo (NOP)', enabled: false, code: 'NOP(0x140BD23A1, 2);' },
          { id: 'rdo7', name: 'Horse Speed', enabled: false, code: '*(float*)(horseAddr + 0x4F0) = 25.0f;' },
          { id: 'rdo8', name: 'Auto-Loot', enabled: false, code: 'SIMULATE_KEY_PRESS(0x45);' },
          { id: 'rdo9', name: 'No Gravity', enabled: false, code: 'ENTITY::SET_ENTITY_HAS_GRAVITY(PLAYER::PLAYER_PED_ID(), false);' },
          { id: 'rdo10', name: 'Money Spoofer', enabled: false, code: 'SET_MISSION_REWARD_VALUE(multiplier);' }
      ]
  },
  { 
      id: 'stardew', 
      name: 'Stardew Valley', 
      processName: 'Stardew Valley.exe', 
      installed: true,
      engine: 'Mono (C#)',
      bypassMethod: 'Mono Domain Hook',
      scripts: [
          { id: 'sv1', name: 'Infinite Stamina', enabled: true, code: 'Game1.player.Stamina = Game1.player.MaxStamina;' },
          { id: 'sv2', name: 'Inf. Health', enabled: true, code: 'Game1.player.health = Game1.player.maxHealth;' },
          { id: 'sv3', name: 'Speed Hack', enabled: false, code: 'Game1.player.addedSpeed = 8;' },
          { id: 'sv4', name: 'Freeze Time', enabled: false, code: 'Game1.pauseTime = 100;' },
          { id: 'sv5', name: 'Fish Instacatch', enabled: true, code: 'if(Game1.activeClickableMenu is BobberBar b) b.distanceFromCatching = 1.0f;' },
          { id: 'sv6', name: 'Fast Growth', enabled: false, code: 'foreach(var f in Game1.currentLocation.terrainFeatures.Values) if(f is HoeDirt d) d.crop?.growCompletely();' },
          { id: 'sv7', name: 'Add Money', enabled: false, code: 'Game1.player.Money += 50000;' },
          { id: 'sv8', name: 'Max Hearts', enabled: false, code: 'foreach(var f in Game1.player.friendshipData.Values) f.Points = 2500;' },
          { id: 'sv9', name: 'Water All', enabled: false, code: 'foreach(var d in Game1.currentLocation.terrainFeatures.Values) if(d is HoeDirt h) h.state.Value = 1;' },
          { id: 'sv10', name: 'Item Spawner', enabled: false, code: 'Game1.player.addItemToInventory(new StardewValley.Object(id, 99));' }
      ]
  },
  { 
      id: 'zomboid', 
      name: 'Project Zomboid', 
      processName: 'ProjectZomboid64.exe', 
      installed: true,
      engine: 'Java + Lua',
      bypassMethod: 'JNI Field Manipulation',
      scripts: [
          { id: 'pz1', name: 'Ghost Mode', enabled: true, code: 'getSpecificPlayer(0):setGhostMode(true)' },
          { id: 'pz2', name: 'God Mode', enabled: true, code: 'getSpecificPlayer(0):setGodMod(true)' },
          { id: 'pz3', name: 'No Fatigue', enabled: true, code: 'getSpecificPlayer(0):getStats():setFatigue(0)' },
          { id: 'pz4', name: 'No Hunger', enabled: true, code: 'getSpecificPlayer(0):getStats():setHunger(0)' },
          { id: 'pz5', name: 'Skill Level 10', enabled: false, code: 'for i=0,Perks.getMaxIndex()-1 do getSpecificPlayer(0):getPerkLevel(Perks.fromIndex(i), 10) end' },
          { id: 'pz6', name: 'Insta-Build', enabled: false, code: 'ISBuildMenu.cheat = true' },
          { id: 'pz7', name: 'Reveal Map', enabled: false, code: 'getWorld():setAllExplored(true)' },
          { id: 'pz8', name: 'Spawn Axe', enabled: false, code: 'getSpecificPlayer(0):getInventory():AddItem("Base.Axe")' },
          { id: 'pz9', name: 'Carry Capacity', enabled: false, code: 'getSpecificPlayer(0):setMaxWeight(10000)' },
          { id: 'pz10', name: 'Kill Zombies', enabled: false, code: 'local list = getCell():getZombieList(); for i=0,list:size()-1 do list:get(i):setHealth(0) end' }
      ]
  },
  { 
      id: 'peak', 
      name: 'Peak / Unreal Games', 
      processName: 'ShooterGame.exe', 
      installed: false,
      engine: 'Unreal Engine 4/5',
      bypassMethod: 'Internal ASM JIT Hook',
      scripts: [
          { id: 'ue1', name: 'Chams (Colors)', enabled: false, code: '// Hook SetTexture Renderer' },
          { id: 'ue2', name: 'No Recoil', enabled: true, code: '*(float*)(weapon + 0x2A0) = 0.0f;' },
          { id: 'ue3', name: 'No Spread', enabled: true, code: '*(float*)(weapon + 0x2A4) = 0.0f;' },
          { id: 'ue4', name: 'Rapid Fire', enabled: false, code: '*(float*)(weapon + 0x2B0) = 0.01f;' },
          { id: 'ue5', name: 'Inf. Ammo', enabled: false, code: '*(int*)(weapon + 0x2C8) = 999;' },
          { id: 'ue6', name: 'Speed Hack', enabled: false, code: '*(float*)(movement + 0x140) = 1200.0f;' },
          { id: 'ue7', name: 'Jump Height', enabled: false, code: '*(float*)(movement + 0x148) = 900.0f;' },
          { id: 'ue8', name: 'ESP Line', enabled: false, code: '// WorldToScreen Calculation' },
          { id: 'ue9', name: 'Radar 2D', enabled: false, code: '// LocalMap Transform' },
          { id: 'ue10', name: 'FOV Mod', enabled: false, code: '*(float*)(camera + 0x1F0) = 110.0f;' }
      ]
  }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  const [stats, setStats] = useState<SystemStats>({
    processStatus: 'INACTIVE',
    target: { process: null, dllPath: null },
    currentPlatform: 'win32', // Será atualizado pelo Electron
    pipeConnected: false,
    complexity: 'COMPLEX',
    autoRefreshProcess: true,
    isAdmin: true
  });

  const [settings, setSettings] = useState<AppSettings>({
    windowTitleRandomization: true,
    autoInject: true,
    closeOnInject: false,
    debugPrivileges: true,
    injectionMethod: 'NtCreateThreadEx',
    stealthMode: true,
    ghostMode: true,
    memoryCleaner: true,
    threadPriority: 'REALTIME',
    memoryBuffer: 1024,
    network: { packetEncryption: true, latencySimulation: 0 },
    dma: { enabled: false, device: 'LeetDMA', firmwareType: 'Custom' },
    antiOBS: true,
    kernelPriority: true,
    executionStrategy: 'INTERNAL'
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showScriptHub, setShowScriptHub] = useState(false);
  const [plugins, setPlugins] = useState<PluginModule[]>(INITIAL_RUNTIMES);
  const [gameLibrary, setGameLibrary] = useState<GamePack[]>(INITIAL_GAME_LIBRARY);

  const addLog = useCallback((message: string, level: LogEntry['level'] = 'INFO', category: string = 'SYSTEM') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      category
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, []);

  // Inicialização e Detecção de Plataforma
  useEffect(() => {
    if ((window as any).require) {
       const { ipcRenderer } = (window as any).require('electron');
       
       // Detect Platform
       ipcRenderer.invoke('get-platform').then((plat: Platform) => {
          setStats(s => ({...s, currentPlatform: plat}));
          addLog(`Kernel Context: ${plat.toUpperCase()}`, 'INFO', 'INIT');
          
          if (plat !== 'win32') {
             addLog(`Non-Windows Kernel. Active method: ${plat === 'linux' ? 'LD_PRELOAD/PTRACE' : 'TASK_FOR_PID'}.`, 'WARN', 'COMPAT');
             setSettings(s => ({...s, injectionMethod: plat === 'linux' ? 'LD_PRELOAD' : 'task_for_pid'}));
          }
       });

       ipcRenderer.on('log-entry', (_: any, log: any) => addLog(log.message, log.level, log.category));
    } else {
        addLog("Running in Browser Simulation Mode.", "WARN", "WEB");
    }

    addLog("Flux Core Nexus v5.1 (Universal Stealth) Loaded.", "SUCCESS", "CORE");
    setStats(prev => ({ ...prev, pipeConnected: true }));
  }, []);

  const handleToggleScript = (gameId: string, scriptId: string) => {
    setGameLibrary(prev => prev.map(game => {
      if (game.id === gameId) {
        return {
          ...game,
          scripts: game.scripts.map(s => {
            if (s.id === scriptId) {
              const newState = !s.enabled;
              if (newState && s.code) {
                 addLog(`Execute [${game.name}]: ${s.name}`, 'INFO', 'EXEC');
                 if ((window as any).require) {
                    const { ipcRenderer } = (window as any).require('electron');
                    ipcRenderer.send('execute-script', s.code);
                 }
              }
              return { ...s, enabled: newState };
            }
            return s;
          })
        };
      }
      return game;
    }));
  };

  return (
    <div className="flex h-screen w-full bg-[#0d0d0f] text-zinc-300 font-sans selection:bg-blue-500/30 overflow-hidden relative">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent">
        <header className="h-10 border-b border-white/5 flex items-center justify-between px-6 bg-[#111114]/90 backdrop-blur-md shrink-0 select-none" style={{ WebkitAppRegion: "drag" } as any}>
          <div className="flex items-center gap-4">
            <div className={`w-1.5 h-1.5 rounded-full ${stats.pipeConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`} />
            <span className="text-[9px] font-bold tracking-widest text-zinc-600 uppercase">
               OS: {stats.currentPlatform.toUpperCase()}
            </span>
             <span className="text-[9px] font-bold tracking-widest text-purple-500 uppercase flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                GOD MODE ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-6" style={{ WebkitAppRegion: "no-drag" } as any}>
             <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-tighter">Flux Core v5.1</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-[#0d0d0f] relative">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
          
          <div className="relative z-10 h-full">
            {currentView === AppView.DASHBOARD && (
              <Dashboard 
                stats={stats} 
                setStats={setStats} 
                addLog={addLog} 
                onOpenHub={() => setShowScriptHub(true)}
                settings={settings}
                setSettings={setSettings}
              />
            )}
            {currentView === AppView.EDITOR && (
               <ScriptEditor addLog={addLog} enabledPlugins={plugins} />
            )}
            {currentView === AppView.SECURITY && <SecuritySuite addLog={addLog} enabledPlugins={plugins} />}
            {currentView === AppView.PLUGINS && <PluginsPanel addLog={addLog} plugins={plugins} setPlugins={setPlugins} gameLibrary={gameLibrary} onToggleGame={() => {}} />}
            {currentView === AppView.LOGS && <ConsoleLogs logs={logs} clearLogs={() => setLogs([])} />}
            {currentView === AppView.SETTINGS && <SettingsPanel settings={settings} setSettings={setSettings} stats={stats as any} />}
          </div>
        </div>
      </main>

      {showScriptHub && stats.target.process && (
        <ScriptHub 
          game={gameLibrary.find(g => g.processName === stats.target.process?.name) || gameLibrary[0]} 
          currentPlatform={stats.currentPlatform}
          onClose={() => setShowScriptHub(false)} 
          onToggleScript={handleToggleScript}
          onUpdateParam={() => {}}
        />
      )}
    </div>
  );
};

export default App;
