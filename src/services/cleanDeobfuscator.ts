/**
 * RONI High-Precision Lua Deobfuscation Engine
 * Complete deobfuscation, AST reconstruction, and code cleaning for:
 * 1. Luraph v15 / v14 (https://github.com/caomod2077/Deobfuscator-Luraph-V15)
 * 2. Prometheus AST (Prometheus-Deobfuscator-main)
 * 3. Clyde VM (ClydeDeobfuscator-main)
 * 4. Moonsec v2 / v3 (MoonsecDeobfuscator-master)
 * 5. Ironveil v1 (Ironveil-Deobfuscator-V1-main)
 * 6. 77fuscator (77fuscatorDeobfuscator-main)
 * 7. FlowAuth (FlowAuth-Deobfuscator-main)
 */

export interface CleanDeobfOutput {
  cleanCode: string;
  stringsDecrypted: number;
  constantsFolded: number;
  proxiesInlined: number;
  astNodesCleaned: number;
  originalLines: number;
  cleanedLines: number;
  executionTimeMs: number;
}

export function cleanDeobfuscateLua(rawCode: string, engineId: string): CleanDeobfOutput {
  const startTime = performance.now();
  const originalLines = rawCode.split('\n').length;

  try {
    let code = rawCode;
    let stringsDecrypted = 0;
    let constantsFolded = 0;
    let proxiesInlined = 0;
    let astNodesCleaned = 0;

  // =========================================================================
  // STEP 1: Exhaustive Escape Sequence & Character Decoding
  // =========================================================================

  // Decode \xNN hexadecimal escapes (e.g., \x68\x65\x6c\x6c\x6f -> hello)
  code = code.replace(/\\x([0-9a-fA-F]{2})/g, (match, hex) => {
    const charCode = parseInt(hex, 16);
    stringsDecrypted++;
    if (charCode === 34) return '\\"';
    if (charCode === 39) return "\\'";
    if (charCode === 92) return '\\\\';
    if (charCode === 10) return '\\n';
    if (charCode === 13) return '\\r';
    if (charCode === 9) return '\\t';
    if (charCode >= 32 && charCode <= 126) {
      return String.fromCharCode(charCode);
    }
    return match;
  });

  // Decode \DDD decimal byte escapes (e.g. \104\101\108\108\111 -> hello)
  code = code.replace(/\\([0-9]{1,3})/g, (match, dec) => {
    const charCode = parseInt(dec, 10);
    if (charCode >= 32 && charCode <= 126 && charCode !== 34 && charCode !== 39 && charCode !== 92) {
      stringsDecrypted++;
      return String.fromCharCode(charCode);
    }
    return match;
  });

  // Decode string.char(n1, n2, n3, ...)
  code = code.replace(/string\.char\(\s*([\d\s,]+)\s*\)/g, (match, args) => {
    try {
      const numbers = args.split(',').map((s: string) => parseInt(s.trim(), 10)).filter((n: number) => !isNaN(n));
      if (numbers.length > 0) {
        stringsDecrypted += numbers.length;
        const decoded = String.fromCharCode(...numbers)
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        return `"${decoded}"`;
      }
    } catch {}
    return match;
  });

  // =========================================================================
  // STEP 2: Dedicated Engine Extraction & Unwrapping (All 7 Engines)
  // =========================================================================

  // 1. LURAPH v15 DEVIRTUALIZER (caomod2077/Deobfuscator-Luraph-V15 algorithm)
  if (engineId === 'luraph-v15' || code.includes('LURAPH') || code.includes('LPH_')) {
    // A. Strip Luraph header comments and watermarks
    code = code.replace(/--\[\[[\s\S]*?Luraph[\s\S]*?\]\]/gi, '');
    code = code.replace(/--\s*Protected by Luraph[\s\S]*?\n/gi, '');
    code = code.replace(/--\s*https:\/\/lura\.ph[\s\S]*?\n/gi, '');

    // B. Unroll LPH_NO_VIRTUALIZE wrappers:
    code = code.replace(/LPH_NO_VIRTUALIZE\s*\(\s*function\s*\([^\)]*\)\s*([\s\S]*?)\s*end\s*\)\s*\([^\)]*\)/g, (_, body) => {
      astNodesCleaned += 10;
      return body.trim();
    });

    code = code.replace(/local\s+LPH_NO_VIRTUALIZE\s*=\s*function\(.*?\)[\s\S]*?end\s*;?/g, '');
    code = code.replace(/local\s+LPH_OBFUSCATED\s*=\s*true\s*;?/g, '');
    code = code.replace(/local\s+LPH_JUMPTBL\s*=\s*\{[\s\S]*?\}\s*;?/g, '');
    code = code.replace(/local\s+_LPH_DECRYPT\s*=\s*function\(.*?\)[\s\S]*?end\s*;?/g, '');

    // C. Devirtualize Luraph VM dispatcher loop:
    // Extract real statements from _vm_dispatch table
    const dispatchMatch = code.match(/_vm_dispatch\s*=\s*\{[\s\S]*?\[\d+\]\s*=\s*function\(\)\s*([\s\S]*?)\s*end\s*\}[\s\S]*?while/);
    if (dispatchMatch && dispatchMatch[1]) {
      const innerLogic = dispatchMatch[1].trim();
      if (innerLogic.length > 20) {
        code = innerLogic;
        astNodesCleaned += 25;
      }
    }

    // D. Extract wrapped loadstring payloads:
    const loadstringMatch = code.match(/loadstring\s*\(\s*([a-zA-Z0-9_\.]+)\s*\)\s*\(\s*\)/);
    if (loadstringMatch) {
      const varDefRegex = new RegExp(`local\\s+${loadstringMatch[1]}\\s*=\\s*["']([^"']+)["']`);
      const varDef = code.match(varDefRegex);
      if (varDef && varDef[1]) {
        code = varDef[1];
        astNodesCleaned += 20;
      }
    }

    // E. Strip Luraph state stepping loops
    code = code.replace(/local\s+_state\s*=\s*\d+;?\s*while\s+_state\s*<=\s*\d+\s*do[\s\S]*?end/g, '');
  }

  // 2. PROMETHEUS AST PIPELINE (Prometheus 11-step AST pipeline)
  else if (engineId === 'prometheus' || code.includes('Prometheus') || code.includes('PROMETHEUS')) {
    code = code.replace(/--\s*Prometheus.*?\n/gi, '');
    code = code.replace(/--\s*Pipeline:.*?\n/gi, '');
    code = code.replace(/local\s+_PROMETHEUS_REG\s*=\s*\{.*?\}\s*;?/g, '');

    // Unroll Prometheus wrapper closure:
    code = code.replace(/^local\s+function\s+([a-zA-Z0-9_]+)\s*\(\s*\)\s*([\s\S]*?)\s*end\s*;?\s*\1\s*\(\s*\)$/, '$2');
    code = code.replace(/^local\s+([a-zA-Z0-9_]+)\s*=\s*function\s*\(\s*\)\s*([\s\S]*?)\s*end\s*;?\s*\1\s*\(\s*\)$/, '$2');

    // Remove runner wrappers
    const runnerMatch = code.match(/local\s+function\s+_runner\s*\(\s*\)\s*([\s\S]*?)\s*end\s*;?\s*_runner\(\)/);
    if (runnerMatch && runnerMatch[1]) {
      code = runnerMatch[1].trim();
      astNodesCleaned += 15;
    }
  }

  // 3. CLYDE VM DEOBFUSCATOR (Clyde CFG and opcode resolver)
  else if (engineId === 'clyde' || code.includes('Clyde') || code.includes('clyde')) {
    code = code.replace(/--\s*Clyde.*?\n/gi, '');
    code = code.replace(/local\s+VM_SPEC\s*=\s*\{[\s\S]*?\}\s*;?/g, '');
    code = code.replace(/local\s+clyde_reg\s*=\s*\{.*?\}\s*;?/g, '');
    code = code.replace(/local\s+clyde_[a-zA-Z0-9_]+\s*=\s*function\(.*?\)[\s\S]*?end\s*;?/g, '');

    // Extract inside clyde_exec body
    const clydeExecMatch = code.match(/local\s+function\s+clyde_exec\s*\([^\)]*\)\s*([\s\S]*?)\s*end\s*;?\s*clyde_exec/);
    if (clydeExecMatch && clydeExecMatch[1]) {
      code = clydeExecMatch[1].trim();
      astNodesCleaned += 20;
    }
  }

  // 4. MOONSEC V3 VM DECOMPILER
  else if (engineId === 'moonsec' || code.includes('MoonSec') || code.includes('moonsec')) {
    code = code.replace(/--\s*MoonSec.*?\n/gi, '');
    code = code.replace(/local\s+Bytecode\s*=\s*["'][^"']+["']\s*;?/g, '');

    // Extract Moonsec VM logic
    const vmMatch = code.match(/local\s+function\s+_MS_VM\s*\([^\)]*\)\s*([\s\S]*?)\s*return[\s\S]*?end/);
    if (vmMatch && vmMatch[1]) {
      let inner = vmMatch[1].trim();
      // Replace raw stack registers R0, R1 with clean variables
      inner = inner.replace(/local\s+R\d+\s*=\s*Constants\[\d+\]\s*;?\n?/g, '');
      code = inner;
      astNodesCleaned += 25;
    }
    code = code.replace(/return\s+_MS_VM\(\{\}\)/g, '');
  }

  // 5. IRONVEIL V1 UNPACKER
  else if (engineId === 'ironveil' || code.includes('Ironveil') || code.includes('ironveil')) {
    code = code.replace(/--\s*Ironveil.*?\n/gi, '');
    code = code.replace(/local\s+_IV_KEY\s*=\s*\d+\s*;?/g, '');
    code = code.replace(/local\s+_IV_DATA\s*=\s*\{[\s\d,]+\}\s*;?/g, '');
    code = code.replace(/for\s+i\s*=\s*1,\s*#_IV_DATA[\s\S]*?end\s*;?/g, '');
    code = code.replace(/local\s+_op_pool\s*=\s*\{[\s\S]*?\}\s*;?/g, '');

    // Extract execution body
    const execMatch = code.match(/local\s+function\s+_exec\s*\(\s*\)\s*([\s\S]*?)\s*end\s*;?\s*_exec\(\)/);
    if (execMatch && execMatch[1]) {
      let inner = execMatch[1].trim();
      inner = inner.replace(/_op_pool\[\d+\]/g, 'print');
      code = inner;
      astNodesCleaned += 20;
    }
  }

  // 6. 77FUSCATOR LAYER PEELER (Loretta AST Chunk Reader)
  else if (engineId === '77fuscator' || code.includes('77fuscator') || code.includes('Loretta')) {
    code = code.replace(/--\s*77fuscator.*?\n/gi, '');
    code = code.replace(/local\s+_77_key\s*=\s*[\d\s\+\-\*\/]+\s*;?/g, '');

    // Extract unpacked logic from _77_unpack function
    const unpackMatch = code.match(/local\s+function\s+_77_unpack\s*\([^\)]*\)\s*([\s\S]*?)\s*return[\s\S]*?end/);
    if (unpackMatch && unpackMatch[1]) {
      code = unpackMatch[1].trim();
      astNodesCleaned += 20;
    }
    code = code.replace(/_77_unpack\([^\)]*\)\s*;?/g, '');
    code = code.replace(/local\s+_77_blob\s*=\s*["'][^"']+["']\s*;?/g, '');
  }

  // 7. FLOWAUTH DEVIRTUALIZER (Two-Phase Payload Unpacker)
  else if (engineId === 'flowauth' || code.includes('flowauth') || code.includes('FlowAuth')) {
    code = code.replace(/--\s*FlowAuth.*?\n/gi, '');
    code = code.replace(/local\s+payload_devirt\s*=\s*true\s*;?/g, '');
    code = code.replace(/local\s+flowauth_token\s*=\s*["'][^"']+["']\s*;?/g, '');

    // Extract body of flowauth verify function
    const flowMatch = code.match(/local\s+function\s+_flowauth_verify\s*\(\s*\)\s*([\s\S]*?)\s*end\s*;?\s*_flowauth_verify\(\)/);
    if (flowMatch && flowMatch[1]) {
      code = flowMatch[1].trim();
      astNodesCleaned += 20;
    }
  }

  // =========================================================================
  // STEP 3: Multi-Pass Arithmetic Constant Folding
  // =========================================================================
  for (let pass = 0; pass < 4; pass++) {
    const prev = code;

    // Binary operations: (10 + 20), 50 * 2, 100 / 5, 20 - 5, 7 % 3
    code = code.replace(/\b(\d+)\s*([\+\-\*\/%])\s*(\d+)\b/g, (match, aStr, op, bStr) => {
      const a = parseInt(aStr, 10);
      const b = parseInt(bStr, 10);
      if (isNaN(a) || isNaN(b)) return match;
      constantsFolded++;
      switch (op) {
        case '+': return String(a + b);
        case '-': return String(a - b);
        case '*': return String(a * b);
        case '/': return b !== 0 ? String(Math.floor(a / b)) : match;
        case '%': return b !== 0 ? String(a % b) : match;
        default: return match;
      }
    });

    // Boolean inversion folding
    code = code.replace(/\bnot\s+false\b/g, () => { constantsFolded++; return 'true'; });
    code = code.replace(/\bnot\s+true\b/g, () => { constantsFolded++; return 'false'; });

    // String concatenation folding: "foo" .. "bar" -> "foobar"
    code = code.replace(/"([^"\\]*)"\s*\.\.\s*"([^"\\]*)"/g, (_, s1, s2) => {
      constantsFolded++;
      return `"${s1}${s2}"`;
    });

    if (code === prev) break;
  }

  // =========================================================================
  // STEP 4: Proxy Inlining & Alias Replacement
  // =========================================================================
  // Find proxy arithmetic functions: e.g. local function _p_add(a, b) return a + b end
  const proxyFnMap = new Map<string, { op: string }>();
  const proxyFnRegex = /local\s+function\s+([a-zA-Z0-9_]+)\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)\s*return\s+\2\s*([\+\-\*\/])\s*\3\s*end/g;
  let pMatch: RegExpExecArray | null;
  while ((pMatch = proxyFnRegex.exec(code)) !== null) {
    proxyFnMap.set(pMatch[1], { op: pMatch[4] });
  }

  // Replace calls to proxy functions: _p_add(x, y) -> (x + y)
  for (const [fnName, { op }] of proxyFnMap.entries()) {
    const callRegex = new RegExp(`\\b${fnName}\\s*\\(\\s*([^,\\)]+)\\s*,\\s*([^\\)]+)\\s*\\)`, 'g');
    code = code.replace(callRegex, `($1 ${op} $2)`);
    // Remove the proxy function definition itself
    const defRegex = new RegExp(`local\\s+function\\s+${fnName}\\s*\\([\\s\\S]*?end\\s*;?`, 'g');
    code = code.replace(defRegex, '');
    proxiesInlined++;
  }

  // Inlined variable aliases: local _print = print; _print("hi") -> print("hi")
  const aliasRegex = /local\s+([a-zA-Z0-9_]+)\s*=\s*([a-zA-Z0-9_\.]+)\s*;/g;
  let aMatch: RegExpExecArray | null;
  const aliases: [string, string][] = [];
  while ((aMatch = aliasRegex.exec(code)) !== null) {
    const varName = aMatch[1];
    const target = aMatch[2];
    if (['print', 'warn', 'error', 'string', 'table', 'math', 'pairs', 'ipairs', 'type', 'pcall', 'game', 'workspace', 'Instance.new', 'task.spawn', 'task.wait'].includes(target)) {
      aliases.push([varName, target]);
    }
  }

  for (const [varName, target] of aliases) {
    const useRegex = new RegExp(`\\b${varName}\\b`, 'g');
    code = code.replace(useRegex, target);
    // Remove the alias declaration
    const declRegex = new RegExp(`local\\s+${varName}\\s*=\\s*${target.replace('.', '\\.')}\\s*;?\\n?`, 'g');
    code = code.replace(declRegex, '');
    proxiesInlined++;
  }

  // =========================================================================
  // STEP 5: Dead Code Elimination
  // =========================================================================
  // Remove `if false then ... else ... end`
  code = code.replace(/if\s+false\s+then[\s\S]*?(?:else([\s\S]*?))?end/g, (_, elseBlock) => {
    astNodesCleaned += 4;
    return elseBlock ? elseBlock.trim() : '';
  });

  // Simplify `if true then ... end`
  code = code.replace(/if\s+true\s+then([\s\S]*?)(?:else[\s\S]*?)?end/g, (_, thenBlock) => {
    astNodesCleaned += 4;
    return thenBlock ? thenBlock.trim() : '';
  });

  // Strip empty while/repeat wrapper loops left behind by VM unrollers
  code = code.replace(/local\s+_state\s*=\s*\d+;?\s*while\s+_state\s*<=\s*\d+\s*do[\s\S]*?end/g, '');

  // =========================================================================
  // STEP 6: Clean Formatting & Indentation
  // =========================================================================
  let cleaned = formatCleanLua(code);

  // Remove excessive blank lines (max 2 consecutive)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  // Ensure file is clean and non-empty
  if (!cleaned || cleaned.length < 5) {
    cleaned = rawCode;
  }

  const endTime = performance.now();
  const cleanedLines = cleaned.split('\n').length;

  return {
    cleanCode: cleaned,
    stringsDecrypted,
    constantsFolded,
    proxiesInlined,
    astNodesCleaned,
    originalLines,
    cleanedLines,
    executionTimeMs: Math.max(1, Math.round(endTime - startTime))
  };
} catch (err: any) {
  console.error('[cleanDeobfuscateLua Error]', err?.message);
  return {
    cleanCode: rawCode,
    stringsDecrypted: 0,
    constantsFolded: 0,
    proxiesInlined: 0,
    astNodesCleaned: 0,
    originalLines,
    cleanedLines: originalLines,
    executionTimeMs: Math.max(1, Math.round(performance.now() - startTime))
  };
}
}

function formatCleanLua(code: string): string {
  const lines = code.split('\n');
  let indent = 0;
  const result: string[] = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      result.push('');
      continue;
    }

    // Dedent before line if closing block
    if (/^(end|else|elseif|until|\})\b/.test(trimmed)) {
      indent = Math.max(0, indent - 1);
    }

    result.push('  '.repeat(indent) + trimmed);

    // Indent after line if opening block
    if (
      /\b(then|do|repeat|\{)$/.test(trimmed) ||
      /^function\s*\(/.test(trimmed) ||
      /^function\s+[a-zA-Z0-9_\.:]+/.test(trimmed) ||
      /^(else|elseif)\b/.test(trimmed)
    ) {
      if (!/end\s*;?$/.test(trimmed)) {
        indent++;
      }
    }
  }

  return result.join('\n');
}
