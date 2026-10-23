export type ObfuscatorType =
  | 'luraph-v15'
  | 'prometheus'
  | 'clyde'
  | 'moonsec'
  | 'ironveil'
  | '77fuscator'
  | 'flowauth'
  | 'generic-lua';

export interface ObfuscationDetection {
  type: ObfuscatorType;
  name: string;
  version: string;
  confidence: number;
  matchedSignatures: string[];
  recommendedEngine: string;
  supportedEngines: {
    id: string;
    name: string;
    description: string;
    icon: string;
    speed: string;
  }[];
}

export interface EngineStatus {
  id: string;
  name: string;
  obfuscatorType: ObfuscatorType;
  version: string;
  status: 'operational' | 'busy' | 'degraded' | 'offline';
  uptime: number; // percentage e.g. 99.8
  processedCount: number;
  avgLatencyMs: number;
  currentLoadPercent: number;
  memoryMb: number;
  description: string;
}

export interface DiscordUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  serverTag: string | null; // e.g. "RONI"
  hasRoniTag: boolean;
  tagColor: string; // e.g. "#9b59b6" (purple as in photo)
}

export interface DiscordMessage {
  id: string;
  author: {
    username: string;
    avatar: string;
    isBot?: boolean;
    tag?: string;
    hasRoniTag?: boolean;
    botBadge?: boolean;
  };
  timestamp: string;
  content: string;
  attachment?: {
    name: string;
    size: number;
    url?: string;
    code: string;
  };
  embed?: DiscordEmbed;
  components?: DiscordComponentRow[];
  loadingState?: {
    step: string;
    progress: number;
  };
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: string; // hex
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
  footer?: {
    text: string;
    iconUrl?: string;
  };
  timestamp?: string;
  author?: {
    name: string;
    iconUrl?: string;
  };
}

export interface DiscordButtonComponent {
  type: 'button';
  id: string;
  label: string;
  style: 'primary' | 'secondary' | 'success' | 'danger';
  icon?: string;
  disabled?: boolean;
}

export interface DiscordComponentRow {
  buttons: DiscordButtonComponent[];
}

export interface DeobfuscationResult {
  success: boolean;
  engineUsed: string;
  originalSize: number;
  cleanedSize: number;
  reductionPercent: number;
  linesReduced: { before: number; after: number };
  executionTimeMs: number;
  deobfuscatedCode: string;
  logs: string[];
  astTransformations: number;
  stringsDecrypted: number;
  constantsFolded: number;
  proxiesInlined: number;
  error?: string;
}
