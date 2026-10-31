import { GeneratedImage, GeneratedVideo, HistoryItem, UserProfile, AppSettings, ChatMessage, ToolPricing } from '../types';

export const defaultToolPricing: ToolPricing = {
  image_standard: 10,
  image_8k: 15,
  video_standard: 25,
  video_4k: 40,
  photo_inpaint: 8,
  photo_upscale: 12,
  chat_message: 2,
  audio_voice: 5,
  music_gen: 15,
  image: 15,
  video: 40,
  chat: 2,
  photoEditor: 10,
  tools: 10
};

export const defaultSettings: AppSettings = {
  theme: 'dark',
  defaultModel: 'OG AI Quantum 4.5 Omni',
  temperature: 0.7,
  maxTokens: 4096,
  streamSpeed: 'fast',
  autoSpeech: false,
  systemPrompt: 'You are OG AI, the most advanced multimodal AI intelligence in the universe. Respond with precision, futuristic creativity, and technical depth.',
  apiKeys: {
    gemini: '',
    pixazo: '97dfc610d4ff4bb4a4070eaf51893b64',
    openai: '',
    anthropic: '',
    elevenlabs: ''
  },
  cloudSyncEnabled: true,
  autoSaveDrafts: true,
  hapticsEnabled: true,
  soundEffects: true,
  hwAcceleration: true,
  defaultPhotoFormat: 'png',
  defaultExportRes: '1080p'
};

export const defaultProfile: UserProfile = {
  name: 'Alex Vance',
  handle: '@vance_cyber',
  email: 'gautammaheshwari225@gmail.com',
  avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="avGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2306B6D4"/><stop offset="50%" stop-color="%233B82F6"/><stop offset="100%" stop-color="%238B5CF6"/></linearGradient></defs><rect width="100" height="100" rx="28" fill="url(%23avGrad)"/><circle cx="50" cy="50" r="44" stroke="rgba(255,255,255,0.2)" stroke-width="2" fill="none"/><text x="50" y="58" font-family="system-ui,-apple-system,sans-serif" font-weight="900" font-size="34" fill="white" text-anchor="middle" dominant-baseline="middle" letter-spacing="1">AV</text></svg>',
  tier: 'OG AI Neural Pro (Tier X)',
  stars: 385,
  credits: 385,
  computeHours: 142.6,
  creationsCount: 384,
  storageMb: 1240,
  joinedDate: 'November 2024',
  isAdmin: true
};

export const initialChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'ai',
    text: `OG AI Quantum Core active
Direct high intelligence reasoning neural generation and multimodal synthesis ready
Ask any technical scientific analytical or creative question for immediate powerful answers`,
    timestamp: 'Just now',
    modelUsed: 'OG AI Quantum 4.5 Omni',
    tokenCount: 84
  }
];

export const sampleImages: GeneratedImage[] = [];

export const sampleVideos: GeneratedVideo[] = [];

export const sampleHistory: HistoryItem[] = [
  {
    id: 'hist-1',
    type: 'chat',
    title: 'Distributed Consensus & Raft Architecture',
    summary: 'Analyzed leader election algorithms, log replication pipelines, and Byzantine fault tolerance.',
    timestamp: 'Today at 09:40',
    data: { messagesCount: 14 }
  },
  {
    id: 'hist-4',
    type: 'code',
    title: 'FastAPI Webhook Verifier in Python',
    summary: 'Generated HMAC-SHA256 signature validation with asynchronous event queues.',
    timestamp: 'Yesterday at 17:30',
    data: { language: 'Python', lines: 78 }
  },
  {
    id: 'hist-5',
    type: 'audio',
    title: 'Cyberpunk Synthwave Beat 140 BPM',
    summary: 'AI generative music track with arpeggiated bass and gated reverb drums.',
    timestamp: 'Sep 16 at 14:12',
    data: { genre: 'Synthwave', duration: '2m 14s' }
  }
];

export const AI_MODELS = [
  {
    id: 'OG AI Quantum 4.5 Omni',
    name: 'OG AI Quantum 4.5 Omni',
    desc: 'Flagship multimodal reasoning engine for text, vision, audio & code',
    badge: 'FASTEST',
    speed: '180 tps',
    context: '1M tokens'
  },
  {
    id: 'OG AI Neural GPT-Ultra',
    name: 'OG AI Neural GPT-Ultra',
    desc: 'Deep analytical and long-form intellectual reasoning model',
    badge: 'SMART',
    speed: '120 tps',
    context: '2M tokens'
  },
  {
    id: 'OG AI Vision Matrix 3.0',
    name: 'OG AI Vision Matrix 3.0',
    desc: 'Specialized for photorealistic imagery, spatial inspection & visual math',
    badge: 'VISION',
    speed: '95 tps',
    context: '512K tokens'
  },
  {
    id: 'OG AI CodeForge Prime',
    name: 'OG AI CodeForge Prime',
    desc: 'Specialized low-latency coding engine for full-stack & systems architecture',
    badge: 'DEV',
    speed: '220 tps',
    context: '1M tokens'
  }
];
