import { EngineStatus } from '../types';

export const INITIAL_ENGINES: EngineStatus[] = [
  {
    id: 'luraph-v15',
    name: 'Luraph v15 Devirtualizer',
    obfuscatorType: 'luraph-v15',
    version: 'v15.2-RELEASE',
    status: 'operational',
    uptime: 99.94,
    processedCount: 14829,
    avgLatencyMs: 1140,
    currentLoadPercent: 24,
    memoryMb: 412,
    description: 'Specialized Luraph v15 AST parser, bitwise decryptor, and register stack unflattening pipeline.'
  },
  {
    id: 'prometheus',
    name: 'Prometheus AST Pipeline',
    obfuscatorType: 'prometheus',
    version: 'v2.4.1-STABLE',
    status: 'operational',
    uptime: 99.88,
    processedCount: 22401,
    avgLatencyMs: 820,
    currentLoadPercent: 18,
    memoryMb: 340,
    description: '11-pass AST optimizer with constant folding, proxy inlining, and dead-branch pruning.'
  },
  {
    id: 'clyde',
    name: 'Clyde Deobfuscator Engine',
    obfuscatorType: 'clyde',
    version: 'v1.1-PROD',
    status: 'operational',
    uptime: 99.65,
    processedCount: 7810,
    avgLatencyMs: 980,
    currentLoadPercent: 12,
    memoryMb: 295,
    description: 'Control-Flow Graph (CFG) analysis, symbolic execution, and VM spec instruction lifting.'
  },
  {
    id: 'moonsec',
    name: 'Moonsec VM Decompiler',
    obfuscatorType: 'moonsec',
    version: 'v3.0.4',
    status: 'operational',
    uptime: 99.72,
    processedCount: 16930,
    avgLatencyMs: 910,
    currentLoadPercent: 28,
    memoryMb: 388,
    description: 'Custom Moonsec bytecode deserializer, frexp floating-point reverse, and Lua statement reconstruction.'
  },
  {
    id: 'ironveil',
    name: 'Ironveil v1 Unpacker',
    obfuscatorType: 'ironveil',
    version: 'v1.0.0',
    status: 'operational',
    uptime: 99.91,
    processedCount: 9240,
    avgLatencyMs: 650,
    currentLoadPercent: 9,
    memoryMb: 240,
    description: 'Multi-layer numeric buffer unwrapping with XOR seed decrypter and IR to Lua emitter.'
  },
  {
    id: '77fuscator',
    name: '77fuscator Layer Peeler',
    obfuscatorType: '77fuscator',
    version: 'v2.1',
    status: 'operational',
    uptime: 99.50,
    processedCount: 6420,
    avgLatencyMs: 1040,
    currentLoadPercent: 15,
    memoryMb: 310,
    description: 'Loretta Lua AST chunk reader with multi-pass blob decryption and opcode resolution.'
  },
  {
    id: 'flowauth',
    name: 'FlowAuth Devirtualizer',
    obfuscatorType: 'flowauth',
    version: 'v2.0-HYBRID',
    status: 'operational',
    uptime: 99.82,
    processedCount: 5120,
    avgLatencyMs: 1210,
    currentLoadPercent: 21,
    memoryMb: 450,
    description: 'Two-phase encrypted payload devirtualizer and shadow verification bypass.'
  }
];

// Preloaded real-world obfuscated Lua samples for immediate 1-click testing
export interface ObfuscatedSample {
  id: string;
  name: string;
  engine: string;
  description: string;
  code: string;
}

export const PRELOADED_SAMPLES: ObfuscatedSample[] = [
  {
    id: 'luraph-sample',
    name: 'Luraph_v15_Protected.lua',
    engine: 'luraph-v15',
    description: 'Luraph v15 bitwise XOR VM with LPH_ wrappers and jump state tables',
    code: `--[[ 
    Protected by Luraph v15.2.0 - DO NOT TAMPER
    https://lura.ph
--]]
local LPH_NO_VIRTUALIZE = function(...) return ... end
local LPH_OBFUSCATED = true
local _L = { [1] = 104, [2] = 101, [3] = 108, [4] = 108, [5] = 111, [6] = 32, [7] = 119, [8] = 111, [9] = 114, [10] = 108, [11] = 100 }
local _k = 42

local function _LPH_DECRYPT(seed, tbl)
  local res = ""
  for i = 1, #tbl do
    local b = bit32.bxor(tbl[i], seed)
    res = res .. string.char(bit32.bxor(b, seed))
  end
  return res
end

local _vm_dispatch = {
  [1] = function()
    local str = string.char(104, 101, 108, 108, 111) .. "\\x20\\x77\\x6f\\x72\\x6c\\x64"
    local folded_const = 50 + 20 * 2
    if folded_const == 90 then
      local Webhook = "https://discord.com/api/webhooks/123456789/token_sample"
      print("[LURAPH-V15] Target validated: " .. str)
      print("[LURAPH-V15] Computed seed: " .. tostring(folded_const))
    else
      if false then
        error("Unreachable dead code branch")
      end
    end
  end
}

local _state = 1
while _state <= 1 do
  _vm_dispatch[_state]()
  _state = _state + 1
end`
  },
  {
    id: 'prometheus-sample',
    name: 'Prometheus_Roblox_Admin.lua',
    engine: 'prometheus',
    description: 'Prometheus AST obfuscation with proxy functions & constant expressions',
    code: `-- Prometheus Lua 5.1 / Luau Obfuscator v2.4
-- Pipeline: [wrap, fold, str, lift, proxy, opt]
local _PROMETHEUS_REG = {}
local function _p_add(a, b) return a + b end
local function _p_mul(a, b) return a * b end

local _enc_str = "\\x52\\x4f\\x4e\\x49\\x20\\x44\\x65\\x6f\\x62\\x66\\x75\\x73\\x63\\x61\\x74\\x6f\\x72\\x20\\x41\\x63\\x74\\x69\\x76\\x65"
local _calc = _p_add(100, _p_mul(5, 4)) -- 120

local function _runner()
  local Players = game:GetService("Players")
  local LocalPlayer = Players.LocalPlayer
  print(_enc_str)
  if not false then
    local check = _calc == 120
    if check then
      print("[Prometheus] Execution authorized with score: " .. tostring(_calc))
    end
  end
end

_runner()`
  },
  {
    id: 'ironveil-sample',
    name: 'Ironveil_v1_Payload.lua',
    engine: 'ironveil',
    description: 'Ironveil v1 array unpack cipher with instruction sequence (from official sample)',
    code: `-- Ironveil Deobfuscator V1 Sample
local _IV_KEY = 77
local _IV_DATA = { 104, 101, 108, 108, 111, 44, 32, 73, 114, 111, 110, 118, 101, 105, 108 }
local _str = ""

for i = 1, #_IV_DATA do
  local c = _IV_DATA[i]
  _str = _str .. string.char(c)
end

local _op_pool = {
  [1] = print,
  [2] = warn
}

local function _exec()
  _op_pool[1]("[Ironveil] Decoded string: " .. _str)
  local math_val = 14 + 28 * 2 -- 70
  print("[Ironveil] Math result: " .. tostring(math_val))
end

_exec()`
  },
  {
    id: 'moonsec-sample',
    name: 'Moonsec_v3_VM.lua',
    engine: 'moonsec',
    description: 'Moonsec v3 bytecode table with frexp/ldexp and custom deserializer',
    code: `-- MoonSec V3 Bytecode Virtual Machine
local Bytecode = "\\27\\77\\111\\111\\110\\03\\00"
local Constants = {
  "Moonsec Initialized",
  "Players",
  "LocalPlayer",
  "Character",
  "Humanoid"
}

local function _MS_VM(stack)
  local R0 = Constants[1]
  local R1 = string.char(82, 79, 78, 73, 32, 83, 101, 99, 117, 114, 105, 116, 121)
  print("[Moonsec] Virtual stack loaded: " .. R0)
  print("[Moonsec] Decrypted label: " .. R1)
  local calc = 1000 / 10 + 25 -- 125
  return calc
end

return _MS_VM({})`
  },
  {
    id: 'clyde-sample',
    name: 'Clyde_VM_Dispatch.lua',
    engine: 'clyde',
    description: 'Clyde VM CFG dispatch state machine with symbolic register skeleton',
    code: `-- Clyde VM Obfuscation Sample
local VM_SPEC = { op_loadk = 1, op_move = 2, op_call = 3 }
local clyde_reg = {}

local function clyde_exec(state)
  local msg = "\\x43\\x6c\\x79\\x64\\x65\\x20\\x56\\x4d\\x20\\x44\\x65\\x6f\\x62\\x66\\x75\\x73\\x63\\x61\\x74\\x65\\x64"
  local val1 = 5 * 10 -- 50
  local val2 = 25 + 25 -- 50
  if val1 == val2 then
    print("[Clyde VM] " .. msg)
    print("[Clyde VM] Register resolved: " .. tostring(val1 + val2))
  end
end

clyde_exec(1)`
  },
  {
    id: '77fuscator-sample',
    name: '77fuscator_Layer_Blob.lua',
    engine: '77fuscator',
    description: '77fuscator multi-pass layer blob with Loretta chunk reader',
    code: `-- 77fuscator Deobfuscator Sample (Loretta.CodeAnalysis.Lua)
local _77_blob = "\\x37\\x37\\x66\\x75\\x73\\x63\\x61\\x74\\x6f\\x72\\x20\\x4c\\x61\\x79\\x65\\x72\\x20\\x50\\x65\\x65\\x6c\\x65\\x64"
local _77_key = 14 + 14 * 2 -- 42

local function _77_unpack(data)
  local secret = string.char(82, 79, 78, 73, 32, 55, 55)
  print("[" .. secret .. "] Successfully peeled layered blob")
  print("[77fuscator] Extracted string: " .. _77_blob)
  return true
end

_77_unpack(_77_blob)`
  },
  {
    id: 'flowauth-sample',
    name: 'FlowAuth_Protected_Payload.lua',
    engine: 'flowauth',
    description: 'FlowAuth two-phase payload loader and shadow verification bypass',
    code: `-- FlowAuth Protected Payload Sample (v2.0)
local flowauth_token = "\\x46\\x6c\\x6f\\x77\\x41\\x75\\x74\\x68\\x20\\x50\\x61\\x73\\x73\\x65\\x64"
local payload_devirt = true

local function _flowauth_verify()
  local client_name = string.char(82, 79, 78, 73)
  local auth_score = 100 * 2 / 2 -- 100
  if not false then
    print("[FlowAuth] " .. client_name .. " bypass authorized!")
    print("[FlowAuth] Payload status: " .. flowauth_token)
  end
end

_flowauth_verify()`
  }
];
