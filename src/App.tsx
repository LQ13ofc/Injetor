import React, { useState, useCallback, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ScriptEditor from './components/ScriptEditor';
import SecuritySuite from './components/SecuritySuite';
import PluginsPanel from './components/PluginsPanel';
import ConsoleLogs from './components/ConsoleLogs';
import ScriptHub from './components/ScriptHub';
import SettingsPanel from './components/SettingsPanel';
import WindowControls from './components/WindowControls';
import { AppView, SystemStats, LogEntry, PluginModule, GamePack, AppSettings } from './types';

// --- ROBLOX GOD MODE SCRIPT (LUA) ---
const ROBLOX_GOD_SCRIPT = `
--[[ 
   FLUX CORE NEXUS - GOD MODE SUITE 
   Stream Proof | Undetected | High Performance
]]

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local LocalPlayer = Players.LocalPlayer

-- // SECURE GUI CONTAINER // --
local function get_secure_gui()
    local gui = Instance.new("ScreenGui")
    pcall(function() gui.Parent = game:GetService("CoreGui") end)
    if not gui.Parent then gui.Parent = LocalPlayer:WaitForChild("PlayerGui") end
    gui.Name = math.random(100000, 999999) .. "_Flux"
    return gui
end

local Screen = get_secure_gui()

-- // STATE // --
local Config = {
    Fly = false,
    Speed = false,
    Jump = false,
    ESP = false,
    SpeedVal = 100
}

-- 1. FLIGHT
local FlyBody, FlyGyro
UserInputService.InputBegan:Connect(function(input, gp)
    if gp then return end
    if input.KeyCode == Enum.KeyCode.X then
        Config.Fly = not Config.Fly
        if Config.Fly then
            local root = LocalPlayer.Character:WaitForChild("HumanoidRootPart")
            FlyBody = Instance.new("BodyVelocity", root)
            FlyBody.Velocity = Vector3.zero
            FlyBody.MaxForce = Vector3.one * 9e9
            FlyGyro = Instance.new("BodyGyro", root)
            FlyGyro.MaxTorque = Vector3.one * 9e9
            FlyGyro.CFrame = root.CFrame
        else
            if FlyBody then FlyBody:Destroy() end
            if FlyGyro then FlyGyro:Destroy() end
        end
    end
end)

RunService.RenderStepped:Connect(function()
    if Config.Fly and LocalPlayer.Character then
        local root = LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
        local cam = workspace.CurrentCamera
        if root and FlyBody and FlyGyro then
            FlyGyro.CFrame = cam.CFrame
            local vel = Vector3.zero
            local speed = Config.SpeedVal
            if UserInputService:IsKeyDown(Enum.KeyCode.W) then vel = vel + cam.CFrame.LookVector * speed end
            if UserInputService:IsKeyDown(Enum.KeyCode.S) then vel = vel - cam.CFrame.LookVector * speed end
            if UserInputService:IsKeyDown(Enum.KeyCode.A) then vel = vel - cam.CFrame.RightVector * speed end
            if UserInputService:IsKeyDown(Enum.KeyCode.D) then vel = vel + cam.CFrame.RightVector * speed end
            if UserInputService:IsKeyDown(Enum.KeyCode.Space) then vel = vel + Vector3.new(0, speed/2, 0) end
            if UserInputService:IsKeyDown(Enum.KeyCode.LeftControl) then vel = vel - Vector3.new(0, speed/2, 0) end
            FlyBody.Velocity = vel
        end
    end
end)

-- 2. ESP
local ESP_Folder = Instance.new("Folder", Screen)
RunService.Stepped:Connect(function()
    if not Config.ESP then ESP_Folder:ClearAllChildren() return end
    for _, plr in pairs(Players:GetPlayers()) do
        if plr ~= LocalPlayer and plr.Character and plr.Character:FindFirstChild("HumanoidRootPart") then
            if not ESP_Folder:FindFirstChild(plr.Name) then
                local hl = Instance.new("Highlight", ESP_Folder)
                hl.Name = plr.Name
                hl.Adornee = plr.Character
                hl.FillColor = Color3.fromRGB(255, 0, 0)
                hl.FillTransparency = 0.5
            end
        end
    end
end)

-- 3. TELEPORT TOOL
local Tool = Instance.new("Tool")
Tool.RequiresHandle = false
Tool.Name = "Teleport [Flux]"
Tool.Activated:Connect(function()
    local mouse = LocalPlayer:GetMouse()
    if mouse.Hit and LocalPlayer.Character then
        LocalPlayer.Character:MoveTo(mouse.Hit.Position)
    end
end)
Tool.Parent = LocalPlayer.Backpack
`;

const INITIAL_GAME_LIBRARY: GamePack[] = [
  { 
      id: 'roblox_god', 
      name: 'Roblox God Mode', 
      processName: 'RobloxPlayerBeta.exe', 
      installed: true,
      engine: 'Luau',
      bypassMethod: 'Hyperion Thread Hijack',
      scripts: [
          { id: 'god_main', name: 'Enable God Suite (Fly/ESP)', enabled: false, code: ROBLOX_GOD_SCRIPT },
          { id: 'inf_jump', name: 'Infinite Jump', enabled: false, code: 'game:GetService("UserInputService").JumpRequest:Connect(function() game.Players.LocalPlayer.Character:FindFirstChildOfClass("Humanoid"):ChangeState(3) end)' },
          { id: 'invis', name: 'Ghost Mode', enabled: false, code: 'local char = game.Players.LocalPlayer.Character; if char then char.Parent = game.Lighting end' }
      ]
  }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [plugins, setPlugins] = useState<PluginModule[]>([
    { id: 'lua', name: 'Luau (Flux)', description: 'Roblox Optimized Engine.', enabled: true, version: '5.1.4', type: 'Scripting' },
    { id: 'asm', name: 'x64 Assembly', description: 'Direct shellcode execution.', enabled: true, version: 'NASM', type: 'Machine Code' },
  ]);
  const [gameLibrary, setGameLibrary] = useState<GamePack[]>(INITIAL_GAME_LIBRARY);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showScriptHub, setShowScriptHub] = useState(false);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

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
    memoryBuffer: 2048,
    network: { packetEncryption: true, latencySimulation: 0 },
    dma: { enabled: false, device: 'LeetDMA', firmwareType: 'Custom' },
    antiOBS: true,
    kernelPriority: true,
    executionStrategy: 'INTERNAL',
    theme: 'dark'
  });

  const [stats, setStats] = useState<SystemStats>({
    processStatus: 'INACTIVE',
    injectionPhase: 0,
    target: { process: null, dllPath: null },
    currentPlatform: 'win32',
    pipeConnected: false,
    complexity: 'COMPLEX',
    autoRefreshProcess: true,
    isAdmin: false
  });

  const addLog = useCallback((msg: string, level: any = 'INFO', cat: string = 'SYSTEM') => {
    setLogs(prev => [{
      id: Math.random().toString(36),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message: msg,
      category: cat
    }, ...prev].slice(0, 100));
  }, []);

  const handleToggleScript = async (gameId: string, scriptId: string) => {
      if (stats.processStatus !== 'INJECTED') {
          addLog("Injection Required.", 'ERROR', 'EXEC');
          return;
      }
      setGameLibrary(prev => prev.map(g => {
          if (g.id === gameId) {
              return {
                  ...g,
                  scripts: g.scripts.map(s => {
                      if (s.id === scriptId) {
                          if (!s.enabled && s.code) {
                            if (window.fluxAPI) window.fluxAPI.executeScript(s.code);
                            addLog(`Executed: ${s.name}`, 'SUCCESS', 'LUA');
                          }
                          return { ...s, enabled: !s.enabled };
                      }
                      return s;
                  })
              };
          }
          return g;
      }));
  };

  return (
    <div className="flex h-screen bg-[#0d0d0f] text-zinc-100 font-sans overflow-hidden select-none border border-white/5 rounded-xl shadow-2xl">
      <div className="absolute top-0 left-0 w-full h-8 titlebar-drag z-50 flex justify-end pr-4 pt-2">
         <WindowControls />
      </div>

      <Sidebar currentView={currentView} setView={setCurrentView} />
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar pt-8">
        {currentView === AppView.DASHBOARD && (
          <Dashboard 
            stats={stats} 
            setStats={setStats} 
            addLog={addLog} 
            onOpenHub={() => {
                const roblox = gameLibrary.find(g => g.id === 'roblox_god');
                if (roblox) {
                    setActiveGameId('roblox_god');
                    setShowScriptHub(true);
                }
            }} 
            settings={settings}
            setSettings={setSettings}
          />
        )}
        {currentView === AppView.EDITOR && <ScriptEditor addLog={addLog} enabledPlugins={plugins} />}
        {currentView === AppView.SECURITY && <SecuritySuite addLog={addLog} enabledPlugins={plugins} />}
        {currentView === AppView.PLUGINS && <PluginsPanel addLog={addLog} plugins={plugins} setPlugins={setPlugins} gameLibrary={gameLibrary} onToggleGame={() => {}} />}
        {currentView === AppView.LOGS && <ConsoleLogs logs={logs} clearLogs={() => setLogs([])} />}
        {currentView === AppView.SETTINGS && <SettingsPanel settings={settings} setSettings={setSettings} stats={stats} addLog={addLog} />}
      </main>

      {showScriptHub && activeGameId && (
        <ScriptHub 
            game={gameLibrary.find(g => g.id === activeGameId)!} 
            currentPlatform="win32"
            onClose={() => setShowScriptHub(false)}
            onToggleScript={handleToggleScript}
            onUpdateParam={() => {}}
        />
      )}
    </div>
  );
};

export default App;