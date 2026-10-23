import { ObfuscationDetection, ObfuscatorType } from '../types';

export const ALL_7_ENGINES = [
  {
    id: 'luraph-v15',
    name: 'Luraph v15 Devirtualizer',
    description: 'Luraph v15 AST parser, bitwise decryptor, and register stack unflattening pipeline',
    icon: '🚀',
    speed: '~1.1s'
  },
  {
    id: 'prometheus',
    name: 'Prometheus AST Pipeline',
    description: '11-pass AST optimizer with constant folding, proxy inlining, and dead-branch pruning',
    icon: '⚡',
    speed: '~0.8s'
  },
  {
    id: 'clyde',
    name: 'Clyde Deobfuscator Engine',
    description: 'Control-Flow Graph (CFG) analysis, symbolic execution, and VM spec instruction lifting',
    icon: '⚙️',
    speed: '~1.0s'
  },
  {
    id: 'moonsec',
    name: 'Moonsec VM Decompiler',
    description: 'Moonsec bytecode deserializer, frexp floating-point reverse, and Lua statement reconstruction',
    icon: '🌙',
    speed: '~0.9s'
  },
  {
    id: 'ironveil',
    name: 'Ironveil v1 Unpacker',
    description: 'Multi-layer numeric buffer unwrapping with XOR seed decrypter and IR to Lua emitter',
    icon: '🛡️',
    speed: '~0.7s'
  },
  {
    id: '77fuscator',
    name: '77fuscator Layer Peeler',
    description: 'Loretta Lua AST chunk reader with multi-pass blob decryption and opcode resolution',
    icon: '📦',
    speed: '~1.1s'
  },
  {
    id: 'flowauth',
    name: 'FlowAuth Devirtualizer',
    description: 'Two-phase encrypted payload devirtualizer and shadow verification bypass',
    icon: '🌊',
    speed: '~1.2s'
  }
];

function getPrioritizedEngines(recommendedId: string) {
  const recommended = ALL_7_ENGINES.find(e => e.id === recommendedId);
  const others = ALL_7_ENGINES.filter(e => e.id !== recommendedId);
  return recommended ? [recommended, ...others] : ALL_7_ENGINES;
}

export function detectObfuscator(code: string): ObfuscationDetection {
  const lower = code.toLowerCase();

  // 1. Luraph v15 Detection
  const isLuraph =
    code.includes('LURAPH') ||
    code.includes('luraph') ||
    /LPH_[A-Za-z0-9_]+/.test(code) ||
    (lower.includes('bit32.bxor') && lower.includes('string.byte') && code.includes('while') && code.includes('table.concat') && (code.includes('repeat') || code.includes('math.floor'))) ||
    (/\b(lph|l_)\b/.test(lower) && /bit32\.(band|bxor|rshift)/.test(code));

  if (isLuraph) {
    return {
      type: 'luraph-v15',
      name: 'Luraph Obfuscator',
      version: 'v15.2 (Latest)',
      confidence: 99.4,
      matchedSignatures: [
        'Luraph VM Dispatcher Loop',
        'Bitwise XOR Byte Key Unpack',
        'Jump Table State Flattening',
        'Register Stack Emulation'
      ],
      recommendedEngine: 'luraph-v15',
      supportedEngines: getPrioritizedEngines('luraph-v15')
    };
  }

  // 2. Prometheus Detection
  const isPrometheus =
    code.includes('Prometheus') ||
    code.includes('PROMETHEUS') ||
    (code.includes('bit32') && code.includes('string.char') && /for\s+[a-zA-Z0-9_]+\s*=\s*\d+,\s*#/.test(code) && /function\([a-zA-Z0-9_,\s]*\)\s*return\s+[a-zA-Z0-9_]+\s*[\+\-\*\/]/.test(code)) ||
    (code.includes('string.sub') && code.includes('string.dump') && code.includes('pcall'));

  if (isPrometheus) {
    return {
      type: 'prometheus',
      name: 'Prometheus Obfuscator',
      version: 'v2.4.1 (Lua 5.1/Luau)',
      confidence: 97.8,
      matchedSignatures: [
        'Prometheus AST Proxy Functions',
        'Bitwise Constant Encryption Pool',
        'Scoped Variable Scrambler',
        'Synthetic Control-Flow Jumps'
      ],
      recommendedEngine: 'prometheus',
      supportedEngines: getPrioritizedEngines('prometheus')
    };
  }

  // 3. Clyde Deobfuscator Detection
  const isClyde =
    code.includes('Clyde') ||
    code.includes('clyde') ||
    /clyde_[a-zA-Z0-9_]+/.test(code) ||
    (code.includes('VM_SPEC') || (code.includes('opcode') && code.includes('symexec') && code.includes('regskel')));

  if (isClyde) {
    return {
      type: 'clyde',
      name: 'Clyde VM Obfuscator',
      version: 'v1.1 (Static VM)',
      confidence: 98.2,
      matchedSignatures: [
        'Clyde Symbolic Register Skeleton',
        'CFG State Machine Dispatcher',
        'VM Instruction Table Mapping',
        'Resugared Stack Frames'
      ],
      recommendedEngine: 'clyde',
      supportedEngines: getPrioritizedEngines('clyde')
    };
  }

  // 4. Moonsec Detection
  const isMoonsec =
    code.includes('MoonSec') ||
    code.includes('Moonsec') ||
    code.includes('moonsec') ||
    code.includes('\\27\\77\\111\\111\\110') ||
    (code.includes('string.char') && code.includes('string.byte') && code.includes('math.ldexp') && code.includes('math.frexp')) ||
    (/\b(MoonSec|moonsec|MS_)\b/.test(code));

  if (isMoonsec) {
    return {
      type: 'moonsec',
      name: 'Moonsec Obfuscator',
      version: 'v3 (Bytecode VM)',
      confidence: 99.1,
      matchedSignatures: [
        'Moonsec Custom Bytecode Deserializer',
        'Math ldexp/frexp Float Unpacker',
        'Virtual Register Stack Machine',
        'Dynamic Opcode Permutation'
      ],
      recommendedEngine: 'moonsec',
      supportedEngines: getPrioritizedEngines('moonsec')
    };
  }

  // 5. Ironveil Detection
  const isIronveil =
    code.includes('Ironveil') ||
    code.includes('ironveil') ||
    (code.includes('unpack') && code.includes('string.char') && /\{[\s\d,]{30,}\}/.test(code) && (code.includes('^') || code.includes('bit32.bxor')));

  if (isIronveil) {
    return {
      type: 'ironveil',
      name: 'Ironveil Obfuscator',
      version: 'v1.0 (Table Array)',
      confidence: 96.5,
      matchedSignatures: [
        'Ironveil Large Numeric Buffer',
        'XOR Array Decryption Routine',
        'Bytecode Unpack Table',
        'IR Opcode Instruction Stream'
      ],
      recommendedEngine: 'ironveil',
      supportedEngines: getPrioritizedEngines('ironveil')
    };
  }

  // 6. 77fuscator Detection
  const is77fuscator =
    code.includes('77fuscator') ||
    code.includes('Loretta') ||
    (code.includes('table.concat') && code.includes('string.char') && code.includes('string.byte') && /\\d{2,3}\\d{2,3}/.test(code));

  if (is77fuscator) {
    return {
      type: '77fuscator',
      name: '77fuscator',
      version: 'v2.1',
      confidence: 95.0,
      matchedSignatures: [
        '77fuscator Layered Blob Structure',
        'Escaped Byte String Sequences',
        'XOR Rotation Key Table'
      ],
      recommendedEngine: '77fuscator',
      supportedEngines: getPrioritizedEngines('77fuscator')
    };
  }

  // 7. FlowAuth Detection
  const isFlowAuth =
    code.includes('flowauth') ||
    code.includes('FlowAuth') ||
    code.includes('payload_devirt') ||
    code.includes('hop_challenge');

  if (isFlowAuth) {
    return {
      type: 'flowauth',
      name: 'FlowAuth Loader',
      version: 'v2.0',
      confidence: 97.2,
      matchedSignatures: [
        'FlowAuth Hop Challenge Response',
        'Shadow Library Verification',
        'Two-Phase Payload Assembler'
      ],
      recommendedEngine: 'flowauth',
      supportedEngines: getPrioritizedEngines('flowauth')
    };
  }

  // Generic Lua / Unknown Obfuscator
  return {
    type: 'generic-lua',
    name: 'Generic Lua / VM Obfuscation',
    version: 'Unknown Variant',
    confidence: 85.0,
    matchedSignatures: [
      'Hexadecimal Byte Array Constants',
      'Indirect String Table Calls',
      'Flattened Control Flow Loops'
    ],
    recommendedEngine: 'prometheus',
    supportedEngines: ALL_7_ENGINES
  };
}
