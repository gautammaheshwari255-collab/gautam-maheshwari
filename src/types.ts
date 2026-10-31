export type NavTab =
  | 'chat'
  | 'image'
  | 'fusion'
  | 'video'
  | 'photo-editor'
  | 'tools'
  | 'history'
  | 'stars'
  | 'my-api'
  | 'owner-secret'
  | 'settings'
  | 'profile';

export interface FusedImage {
  id: string;
  title?: string;
  prompt: string;
  fusionMode: 'dual-fusion' | 'text-edit' | 'style-matrix' | 'face-morph' | 'background-swap';
  sourceImages: string[];
  fusedUrl: string;
  aspectRatio: string;
  resolution: string;
  model: string;
  fusionStrength?: number;
  styles?: string[];
  timestamp: string;
  liked?: boolean;
}

export type SubToolId =
  | 'voice'
  | 'music'
  | 'logo'
  | 'thumbnail'
  | 'writing'
  | 'coding'
  | 'translation'
  | 'pdf'
  | 'presentation';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  attachments?: {
    name: string;
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
    size?: string;
  }[];
  modelUsed?: string;
  tokenCount?: number;
  liked?: boolean;
  codeSnippets?: {
    language: string;
    code: string;
  }[];
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  negativePrompt?: string;
  style: string;
  aspectRatio: string;
  url: string;
  timestamp: string;
  resolution: string;
  model: string;
  liked?: boolean;
}

export interface GeneratedVideo {
  id: string;
  prompt: string;
  motion?: string;
  cameraMovement?: string;
  duration: string;
  videoUrl: string;
  posterUrl: string;
  timestamp: string;
  style?: string;
  hasAudio?: boolean;
  audioTrack?: string;
  mediaType?: string;
}

export interface HistoryItem {
  id: string;
  type: 'chat' | 'image' | 'video' | 'audio' | 'doc' | 'code';
  title: string;
  summary: string;
  timestamp: string;
  data: any;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  streamSpeed: 'fast' | 'normal' | 'instant';
  autoSpeech: boolean;
  systemPrompt: string;
  apiKeys: {
    gemini?: string;
    pixazo?: string;
    openai?: string;
    anthropic?: string;
    elevenlabs?: string;
  };
  cloudSyncEnabled?: boolean;
  lastSyncedAt?: string;
  autoSaveDrafts?: boolean;
  hapticsEnabled?: boolean;
  soundEffects?: boolean;
  hwAcceleration?: boolean;
  defaultPhotoFormat?: 'png' | 'webp' | 'jpg';
  defaultExportRes?: '1080p' | '4k';
}

export interface SyncStats {
  historyCount: number;
  messagesCount: number;
  imagesCount: number;
  videosCount: number;
  draftsCount: number;
  lastSyncedAt?: string;
  storageBytes: number;
  latencyMs?: number;
  isOnline: boolean;
}

export interface StarTransaction {
  id: string;
  userEmail: string;
  type: 'credit' | 'debit';
  amount: number;
  balanceAfter: number;
  reason: string;
  toolId?: 'image' | 'video' | 'chat' | 'photo-editor' | 'tools' | 'bonus' | 'admin' | 'topup';
  timestamp: string;
}

export interface ToolPricing {
  image_standard: number;
  image_8k: number;
  video_standard: number;
  video_4k: number;
  photo_inpaint: number;
  photo_upscale: number;
  chat_message: number;
  audio_voice: number;
  music_gen: number;
  image?: number;
  video?: number;
  chat?: number;
  photoEditor?: number;
  tools?: number;
}

export interface UserProfile {
  name: string;
  handle: string;
  email: string;
  avatar: string;
  tier: string;
  stars: number;
  credits: number;
  computeHours: number;
  creationsCount: number;
  storageMb: number;
  joinedDate: string;
  isAdmin?: boolean;
}
