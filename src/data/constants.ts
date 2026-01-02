import { GamePack, PluginModule } from '../types';

export const INITIAL_RUNTIMES: PluginModule[] = [
  { id: 'lua', name: 'Luau/LuaJIT', description: 'Roblox (Luau) & FiveM (Lua 5.4) Optimized Engine.', enabled: true, version: '5.4.2', type: 'Scripting' },
  { id: 'cpp', name: 'C++ Native', description: 'Direct memory access via VMT Hooking (GTA/RDR).', enabled: true, version: 'C++20', type: 'Low Level' },
  { id: 'c', name: 'C Native', description: 'Raw syscalls, eBPF and kernel-mode structures.', enabled: true, version: 'C17', type: 'Low Level' },
  { id: 'csharp', name: 'C# (Mono/Il2Cpp)', description: 'Runtime injection for Unity games (Tarkov).', enabled: true, version: '.NET 6', type: 'Managed' },
  { id: 'java', name: 'Java HotSpot', description: 'JNI Bridge for Minecraft & Project Zomboid.', enabled: true, version: 'JDK 17', type: 'VM' },
  { id: 'python', name: 'Python Native', description: 'External automation, data processing & AI Ops.', enabled: true, version: '3.11', type: 'Scripting' },
  { id: 'asm', name: 'x64 Assembly', description: 'Direct shellcode execution & JMP hooks.', enabled: true, version: 'NASM', type: 'Machine Code' },
];

export const INITIAL_GAME_LIBRARY: GamePack[] = [
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
          { id: 'r4', name: 'NoClip (Safe)', enabled: false, code: 'game:GetService("RunService").Stepped:Connect(function() for _,v in pairs(game.Players.LocalPlayer.Character:GetChildren()) do if v:IsA("BasePart") then v.CanCollide = false end end end)' }
      ]
  },
  {
      id: 'gta5',
      name: 'GTA V Singleplayer',
      processName: 'GTA5.exe',
      installed: true,
      engine: 'RAGE Engine (Native Hook)',
      bypassMethod: 'Scripthook Pattern Bypass',
      scripts: [
          { id: 'g1', name: 'Invisibility', enabled: false, code: 'PLAYER::SET_ENTITY_VISIBLE(PLAYER::PLAYER_PED_ID(), false, false);' },
          { id: 'g2', name: 'God Mode', enabled: false, code: 'PLAYER::SET_PLAYER_INVINCIBLE(PLAYER::PLAYER_ID(), true);' },
          { id: 'g3', name: 'Super Jump', enabled: false, code: 'GAMEPLAY::SET_SUPER_JUMP_THIS_FRAME(PLAYER::PLAYER_ID());' },
          { id: 'g4', name: 'Explosive Ammo', enabled: false, code: 'GAMEPLAY::SET_EXPLOSIVE_AMMO_THIS_FRAME(PLAYER::PLAYER_ID());' },
          { id: 'g5', name: 'Wanted Level 0', enabled: true, code: 'PLAYER::SET_PLAYER_WANTED_LEVEL(PLAYER::PLAYER_ID(), 0, false); PLAYER::SET_PLAYER_WANTED_LEVEL_NOW(PLAYER::PLAYER_ID(), false);' },
          { id: 'g6', name: 'Teleport to Waypoint', enabled: false, code: 'local blip = UI::GET_FIRST_BLIP_INFO_ID(8); if (UI::DOES_BLIP_EXIST(blip)) { local coord = UI::GET_BLIP_COORDS(blip); ENTITY::SET_ENTITY_COORDS(PLAYER::PLAYER_PED_ID(), coord.x, coord.y, coord.z + 1.0, 0, 0, 0, 1); }' },
          { id: 'g7', name: 'Max Health & Armor', enabled: false, code: 'ENTITY::SET_ENTITY_HEALTH(PLAYER::PLAYER_PED_ID(), 200); PED::SET_PED_ARMOUR(PLAYER::PLAYER_PED_ID(), 100);' }
      ]
  },
  {
      id: 'rdr2',
      name: 'RDR 2 Singleplayer',
      processName: 'RDR2.exe',
      installed: true,
      engine: 'RAGE Engine (Native Hook)',
      bypassMethod: 'VMT Shadow Hook',
      scripts: [
          { id: 'rd1', name: 'Infinite Ammo', enabled: false, code: 'WEAPON::SET_PED_INFINITE_AMMO(PLAYER::PLAYER_PED_ID(), true, 0);' },
          { id: 'rd2', name: 'Infinite Dead Eye', enabled: false, code: 'PLAYER::_SET_PLAYER_DEAD_EYE_REGEN_ENABLED(PLAYER::PLAYER_ID(), true); PLAYER::RESTORE_PLAYER_DEAD_EYE(PLAYER::PLAYER_ID(), 100.0);' },
          { id: 'rd3', name: 'Horse Stamina', enabled: true, code: 'PED::_SET_PED_STAMINA(PLAYER::GET_MOUNT(PLAYER::PLAYER_PED_ID()), 100.0);' },
          { id: 'rd4', name: 'Never Wanted', enabled: false, code: 'PLAYER::SET_WANTED_LEVEL_MULTIPLIER(0.0);' },
          { id: 'rd5', name: 'Teleport to Waypoint', enabled: false, code: 'local blip = MAP::GET_WAYPOINT_BLIP_ENUM_ID(); -- Internal TP Logic' },
          { id: 'rd6', name: 'Reveal Map', enabled: false, code: 'MAP::SET_MINIMAP_REVEAL_LOCKED(false); MAP::REVEAL_MINIMAP_FOW(0);' },
          { id: 'rd7', name: 'Add $1000', enabled: false, code: 'MONEY::_MONEY_ADD_CASH(100000);' }
      ]
  },
  {
      id: 'zomboid',
      name: 'Project Zomboid',
      processName: 'ProjectZomboid64.exe',
      installed: true,
      engine: 'Java (JNI Hooks)',
      bypassMethod: 'JVM Memory Patch',
      scripts: [
          { id: 'pz1', name: 'Kill All Zombies', enabled: false, code: 'for i=0, getCell():getZombieList():size()-1 do getCell():getZombieList():get(i):setHealth(0) end' },
          { id: 'pz2', name: 'Ghost Mode', enabled: false, code: 'getPlayer():setGhostMode(true); getPlayer():setInvisible(true);' },
          { id: 'pz3', name: 'No Hunger/Thirst', enabled: true, code: 'getPlayer():getStats():setHunger(0); getPlayer():getStats():setThirst(0);' },
          { id: 'pz4', name: 'Infinite Carry', enabled: false, code: 'getPlayer():setMaxWeight(10000);' },
          { id: 'pz5', name: 'Instant Build', enabled: false, code: 'ISBuildMenu.cheat = true;' },
          { id: 'pz6', name: 'Max Skills', enabled: false, code: 'for i=0, Perks.MAX-1 do getPlayer():getXp():setXPToLevel(Perks.fromIndex(i), 10) end' },
          { id: 'pz7', name: 'Full Repair', enabled: false, code: 'getPlayer():getPrimaryHandItem():setCondition(getPlayer():getPrimaryHandItem():getConditionMax());' }
      ]
  }
];