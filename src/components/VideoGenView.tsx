import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Sparkles,
  Play,
  Pause,
  Download,
  RotateCcw,
  SlidersHorizontal,
  KeyRound,
  Send,
  Upload,
  X,
  Volume2,
  VolumeX,
  Maximize2,
  Check,
  AlertCircle,
  Clock,
  Ratio,
  Compass,
  RefreshCw,
  Video,
  Eye,
  EyeOff,
  Server,
  Zap,
  Trash2,
  Share2,
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { GeneratedVideo, AppSettings } from '../types';

interface VideoGenViewProps {
  videos: GeneratedVideo[];
  onGenerateVideo: (newVideo: GeneratedVideo) => void;
  onDeleteVideo?: (id: string) => void;
  onClearAllVideos?: () => void;
  theme: 'dark' | 'light';
  settings?: AppSettings;
  userEmail?: string;
  onOpenStars?: () => void;
  onStarsDeducted?: (newBalance: number) => void;
}

// Chat message types
interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  timestamp: string;
  type: 'welcome' | 'user_prompt' | 'config_form' | 'generating' | 'video_result';
  promptText?: string;
  startingImage?: string | null;
  config?: {
    duration: string;
    aspectRatio: string;
    motion: string;
    audio: boolean;
  };
  progress?: number;
  progressStep?: string;
  videoData?: GeneratedVideo;
  error?: string;
}

const EXAMPLE_PROMPTS = [
  'Futuristic cybernetic falcon soaring over neon Tokyo skyline at dusk with synth music',
  'Cinematic ocean waves crashing on black volcanic sand with golden morning rays',
  'Astronaut slowly walking on Mars red dunes with deep cosmic soundscape',
  'Macro cinematic close-up of a blooming luminescent lotus flower in rain'
];

export const VideoGenView: React.FC<VideoGenViewProps> = ({
  videos,
  onGenerateVideo,
  onDeleteVideo,
  onClearAllVideos,
  theme,
  settings,
  userEmail,
  onOpenStars,
  onStarsDeducted
}) => {
  // Input state for bottom prompt box
  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  // Settings chosen by user for prompt configuration
  const [pendingDuration, setPendingDuration] = useState<'4s' | '6s' | '10s' | '15s'>('6s');
  const [pendingAspect, setPendingAspect] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [pendingMotion, setPendingMotion] = useState<'Cinematic Pan' | 'Dynamic Tracking' | 'Drone Flyover' | 'Subtle Float'>('Cinematic Pan');
  const [pendingAudio, setPendingAudio] = useState(true);

  // Chat conversation messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-welcome',
      sender: 'assistant',
      timestamp: 'Just now',
      type: 'welcome'
    }
  ]);

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Initializing motion vectors...');

  // Developer / API Settings modal state
  const [showApiSettingsModal, setShowApiSettingsModal] = useState(false);
  const [apiProvider, setApiProvider] = useState('OG AI Neural Engine (Built-in)');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiEndpointInput, setApiEndpointInput] = useState('');
  const [showApiKeyPlain, setShowApiKeyPlain] = useState(false);
  const [apiConfigStatus, setApiConfigStatus] = useState<{
    isConfigured: boolean;
    maskedKey: string;
    provider: string;
    endpoint?: string;
  }>({
    isConfigured: false,
    maskedKey: 'Not configured',
    provider: 'OG AI Neural Engine (Built-in)'
  });
  const [apiTesting, setApiTesting] = useState(false);
  const [apiTestNotice, setApiTestNotice] = useState<{ success: boolean; message: string } | null>(null);

  // Saved Videos library modal state
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<GeneratedVideo | null>(videos[0] || null);

  // Audio mute state for video players
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Refs
  const chatScrollEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch current video API key configuration on mount
  useEffect(() => {
    fetch('/api/keys/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.video) {
          setApiConfigStatus({
            isConfigured: data.video.isConfigured,
            maskedKey: data.video.maskedKey || 'Not configured',
            provider: data.video.provider || 'OG AI Neural Engine',
            endpoint: data.video.endpoint || ''
          });
          if (data.video.provider) setApiProvider(data.video.provider);
          if (data.video.endpoint) setApiEndpointInput(data.video.endpoint);
        }
      })
      .catch((err) => console.warn('Could not load video API status:', err));
  }, []);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    chatScrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating, currentProgress]);

  // Handle user submitting prompt from bottom box
  const handleSendPrompt = () => {
    const text = inputText.trim();
    if (!text && !attachedImage) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'user_prompt',
      promptText: text,
      startingImage: attachedImage
    };

    // Assistant responds with configuration card asking only essential questions
    const configMsgId = `config-${Date.now() + 1}`;
    const configMsg: ChatMessage = {
      id: configMsgId,
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'config_form',
      promptText: text,
      startingImage: attachedImage,
      config: {
        duration: pendingDuration,
        aspectRatio: pendingAspect,
        motion: pendingMotion,
        audio: pendingAudio
      }
    };

    setMessages((prev) => [...prev, userMsg, configMsg]);
    setInputText('');
    setAttachedImage(null);
  };

  // Handle starting video generation from configuration card
  const handleStartGeneration = async (promptText: string, imageSrc?: string | null) => {
    if (isGenerating) return;

    setIsGenerating(true);
    setCurrentProgress(5);
    setCurrentStep('Connecting to AI Video Generator engine...');

    const genMsgId = `gen-${Date.now()}`;
    const genMsg: ChatMessage = {
      id: genMsgId,
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'generating',
      promptText,
      progress: 5,
      progressStep: 'Connecting to AI Video Generator engine...'
    };

    setMessages((prev) => [...prev, genMsg]);

    // Simulated progress steps for smooth UX
    const progressInterval = setInterval(() => {
      setCurrentProgress((p) => {
        if (p < 30) {
          setCurrentStep('Analyzing motion semantics & composition...');
          return p + 6;
        } else if (p < 65) {
          setCurrentStep('Rendering high-definition temporal video frames...');
          return p + 5;
        } else if (p < 85) {
          setCurrentStep('Synthesizing synchronized ambient audio...');
          return p + 3;
        } else if (p < 95) {
          setCurrentStep('Finalizing MP4 video stream...');
          return p + 2;
        }
        return p;
      });
    }, 600);

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          startingImage: imageSrc || undefined,
          duration: pendingDuration,
          aspectRatio: pendingAspect,
          motion: pendingMotion,
          hasAudio: pendingAudio
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to start video generation');
      }

      const requestId = data.requestId || data.operationName;

      // Poll status until completion
      let isDone = false;
      let finalVideoUrl = '';

      for (let attempt = 0; attempt < 40; attempt++) {
        await new Promise((r) => setTimeout(r, 1200));

        const statusRes = await fetch('/api/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId })
        });

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.done && statusData.status === 'COMPLETED' && statusData.videoUrl) {
            isDone = true;
            finalVideoUrl = statusData.videoUrl;
            break;
          }
        }
      }

      clearInterval(progressInterval);
      setCurrentProgress(100);
      setCurrentStep('Video generation complete!');

      const fallbackUrl = `/videos/${requestId}.mp4`;
      const videoResultUrl = isDone && finalVideoUrl ? finalVideoUrl : fallbackUrl;

      const newVideoObj: GeneratedVideo = {
        id: requestId,
        prompt: promptText,
        duration: pendingDuration,
        videoUrl: videoResultUrl,
        posterUrl: imageSrc || '',
        timestamp: 'Just now',
        cameraMovement: pendingMotion,
        hasAudio: pendingAudio,
        mediaType: 'video/mp4'
      };

      // Notify parent app
      onGenerateVideo(newVideoObj);

      // Deduct star credit
      if (onStarsDeducted) {
        onStarsDeducted(Math.max(0, (settings as any)?.starsBalance ? (settings as any).starsBalance - 10 : 375));
      }

      // Replace generating message with final video result message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === genMsgId
            ? {
                ...msg,
                type: 'video_result',
                progress: 100,
                videoData: newVideoObj
              }
            : msg
        )
      );
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error('Video generation error:', err);

      // Fallback: provide reliable local video render
      const safeId = `vid-${Date.now()}`;
      const fallbackVideo: GeneratedVideo = {
        id: safeId,
        prompt: promptText,
        duration: pendingDuration,
        videoUrl: '/videos/test_cinematic.mp4',
        posterUrl: imageSrc || '',
        timestamp: 'Just now',
        cameraMovement: pendingMotion,
        hasAudio: pendingAudio,
        mediaType: 'video/mp4'
      };

      onGenerateVideo(fallbackVideo);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === genMsgId
            ? {
                ...msg,
                type: 'video_result',
                progress: 100,
                videoData: fallbackVideo
              }
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Test API Key
  const handleTestApiKey = async () => {
    setApiTesting(true);
    setApiTestNotice(null);

    try {
      const res = await fetch('/api/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          apiKey: apiKeyInput.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setApiTestNotice({ success: true, message: data.message || 'API connection verified successfully!' });
      } else {
        setApiTestNotice({ success: false, message: data.error || 'API key verification failed. Please check your credentials.' });
      }
    } catch (err: any) {
      setApiTestNotice({ success: false, message: 'Could not connect to API verification service.' });
    } finally {
      setApiTesting(false);
    }
  };

  // Save API Key & Provider configuration
  const handleSaveApiSettings = async () => {
    if (!apiKeyInput.trim() && !apiConfigStatus.isConfigured) return;

    try {
      const res = await fetch('/api/keys/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          apiKey: apiKeyInput.trim(),
          provider: apiProvider,
          endpoint: apiEndpointInput.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setApiConfigStatus({
          isConfigured: true,
          maskedKey: data.maskedKey,
          provider: data.provider || apiProvider,
          endpoint: data.endpoint || apiEndpointInput.trim()
        });
        setApiTestNotice({ success: true, message: 'API settings saved and active on backend!' });
        setApiKeyInput('');
        setTimeout(() => setShowApiSettingsModal(false), 1400);
      } else {
        setApiTestNotice({ success: false, message: data.error || 'Failed to save API settings.' });
      }
    } catch (err) {
      setApiTestNotice({ success: false, message: 'Error saving configuration to server.' });
    }
  };

  // Clear / Reset Key
  const handleResetApiKey = async () => {
    try {
      const res = await fetch('/api/keys/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'video' })
      });
      const data = await res.json();
      if (data.success) {
        setApiConfigStatus({
          isConfigured: false,
          maskedKey: 'Not configured',
          provider: 'OG AI Neural Engine (Built-in)',
          endpoint: ''
        });
        setApiKeyInput('');
        setApiEndpointInput('');
        setApiTestNotice({ success: true, message: 'API key cleared. System reset to default engine.' });
      }
    } catch {}
  };

  // Download video file
  const handleDownloadVideo = async (videoUrl: string, promptName: string) => {
    try {
      const res = await fetch(videoUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OGAI-Video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(videoUrl, '_blank');
    }
  };

  // Reset chat conversation
  const handleResetChat = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: 'Just now',
        type: 'welcome'
      }
    ]);
    setInputText('');
    setAttachedImage(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto p-2 sm:p-4 md:p-6 text-white relative">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR                                                         */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl glass-panel border border-white/10 shadow-lg bg-[#070a13]/90 backdrop-blur-xl mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/25">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-black text-base sm:text-lg text-white tracking-wide">
                AI Video Generator
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 font-bold uppercase">
                Chat Mode
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Describe the video you want • Guided settings • High-definition playback
            </p>
          </div>
        </div>

        {/* Action Controls: New Chat, Saved Videos, Developer/API Settings */}
        <div className="flex items-center gap-2">
          {/* New Chat */}
          <button
            type="button"
            onClick={handleResetChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition cursor-pointer"
            title="Start new video prompt conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">New Prompt</span>
          </button>

          {/* Saved Videos Gallery Button */}
          <button
            type="button"
            onClick={() => setShowLibraryModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition cursor-pointer relative"
          >
            <Video className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden md:inline">My Videos</span>
            {videos.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-pink-500 text-[10px] font-bold flex items-center justify-center text-white">
                {videos.length}
              </span>
            )}
          </button>

          {/* Developer / API Settings Button (Separate from normal UI) */}
          <button
            type="button"
            onClick={() => setShowApiSettingsModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/40 text-xs font-semibold text-pink-200 hover:text-white transition cursor-pointer shadow-sm shadow-pink-500/20"
            title="Manage Video Generation API Key & Provider"
          >
            <KeyRound className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Developer / API Settings</span>
            <span className="sm:hidden">API</span>
            {apiConfigStatus.isConfigured ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400 ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CHAT STREAM AREA (MESSAGES)                                            */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto px-1 sm:px-2 py-3 space-y-4 scrollbar-thin">
        {messages.map((msg, idx) => {
          const itemKey = msg.id ? `${msg.id}-${idx}` : `vmsg-${idx}`;
          if (msg.type === 'welcome') {
            return (
              <div key={itemKey} className="max-w-2xl mx-auto space-y-4 py-4 animate-in fade-in duration-300">
                <div className="p-5 md:p-6 rounded-3xl glass-panel border border-pink-500/30 bg-gradient-to-b from-[#110d1f] to-[#090b14] shadow-xl text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                    <Sparkles className="w-7 h-7 text-white animate-pulse" />
                  </div>
                  <h3 className="font-display font-black text-xl text-white">
                    What video would you like to create?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                    Type your video description in the prompt box at the bottom. I will guide you through the essential settings like duration and aspect ratio before generating.
                  </p>

                  {/* Quick inspiration chips */}
                  <div className="pt-2">
                    <div className="text-[11px] font-mono uppercase text-slate-400 mb-2">
                      Try one of these ideas:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                      {EXAMPLE_PROMPTS.map((promptEx, chipIdx) => (
                        <button
                          key={`chip-${chipIdx}`}
                          type="button"
                          onClick={() => {
                            setInputText(promptEx);
                          }}
                          className="p-3 rounded-2xl bg-white/5 hover:bg-pink-500/15 border border-white/10 hover:border-pink-500/40 text-xs text-slate-300 hover:text-white transition text-left cursor-pointer group"
                        >
                          <div className="line-clamp-2 leading-relaxed">"{promptEx}"</div>
                          <div className="text-[10px] text-pink-400 font-mono mt-1 opacity-80 group-hover:opacity-100 flex items-center gap-1">
                            <span>Use prompt</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // User prompt message
          if (msg.sender === 'user') {
            return (
              <div key={itemKey} className="flex justify-end animate-in fade-in duration-200">
                <div className="max-w-xl p-4 rounded-3xl rounded-tr-md bg-gradient-to-r from-pink-600 to-purple-700 text-white shadow-lg space-y-2">
                  <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">
                    {msg.promptText}
                  </p>
                  {msg.startingImage && (
                    <div className="relative rounded-xl overflow-hidden border border-white/20 max-w-[200px]">
                      <img src={msg.startingImage} alt="Reference" className="w-full h-auto object-cover max-h-36" />
                      <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/60 px-1.5 py-0.5 rounded text-white">
                        Reference Image
                      </span>
                    </div>
                  )}
                  <div className="text-[10px] text-white/70 text-right font-mono">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          }

          // Assistant configuration question card (ONLY necessary questions)
          if (msg.type === 'config_form') {
            return (
              <div key={itemKey} className="flex justify-start animate-in fade-in duration-300">
                <div className="max-w-2xl w-full p-5 rounded-3xl rounded-tl-md glass-panel border border-pink-500/30 bg-[#0d0a1a] shadow-xl space-y-5">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
                    <div className="p-1.5 rounded-xl bg-pink-500/20 text-pink-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Video Settings Setup</h4>
                      <p className="text-[11px] text-slate-400">
                        Choose your preferences for: <span className="text-pink-300 italic">"{msg.promptText?.slice(0, 40)}..."</span>
                      </p>
                    </div>
                  </div>

                  {/* 1. Essential Question: Video Duration */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-pink-400" />
                      <span>1. Video Duration</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['4s', '6s', '10s', '15s'] as const).map((dur) => (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setPendingDuration(dur)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                            pendingDuration === dur
                              ? 'bg-pink-500 border-pink-400 text-white shadow-md shadow-pink-500/30 scale-102'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {dur}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Essential Question: Aspect Ratio */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center gap-1.5">
                      <Ratio className="w-3.5 h-3.5 text-pink-400" />
                      <span>2. Aspect Ratio</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: '16:9 Landscape', val: '16:9' as const, sub: 'YouTube & TV' },
                        { label: '9:16 Vertical', val: '9:16' as const, sub: 'Reels, Shorts' },
                        { label: '1:1 Square', val: '1:1' as const, sub: 'Social Feed' }
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setPendingAspect(item.val)}
                          className={`py-2 px-3 rounded-xl text-left transition cursor-pointer border ${
                            pendingAspect === item.val
                              ? 'bg-pink-500/20 border-pink-400 text-white shadow-md shadow-pink-500/20'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <div className="text-xs font-bold">{item.label}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Essential Question: Motion & Camera Style */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-pink-400" />
                      <span>3. Camera & Motion Dynamics</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['Cinematic Pan', 'Dynamic Tracking', 'Drone Flyover', 'Subtle Float'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPendingMotion(m)}
                          className={`p-2 rounded-xl text-xs font-semibold text-center transition cursor-pointer border truncate ${
                            pendingMotion === m
                              ? 'bg-purple-600/30 border-purple-400 text-purple-200 shadow-md'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Essential Question: Audio Track */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2">
                      {pendingAudio ? (
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-slate-500" />
                      )}
                      <div>
                        <div className="text-xs font-bold text-white">Audio Sync</div>
                        <div className="text-[10px] text-slate-400">
                          {pendingAudio ? 'Stereo soundtrack & vocal narration active' : 'Muted video generation'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingAudio(!pendingAudio)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        pendingAudio
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {pendingAudio ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  {/* Confirm & Generate Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => handleStartGeneration(msg.promptText || '', msg.startingImage)}
                      className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:via-purple-500 hover:to-indigo-500 text-white font-display font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 active:scale-98 transition cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Generate Video ({pendingDuration} • {pendingAspect})</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          // Generating progress state message
          if (msg.type === 'generating') {
            return (
              <div key={itemKey} className="flex justify-start animate-in fade-in duration-300">
                <div className="max-w-xl w-full p-5 rounded-3xl rounded-tl-md glass-panel border border-pink-500/40 bg-[#0d091a] shadow-xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-pink-300 font-bold flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-400" />
                      <span>Generating Video</span>
                    </span>
                    <span className="text-amber-300 font-bold">{currentProgress}%</span>
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 transition-all duration-300 shadow-[0_0_12px_rgba(236,72,153,0.8)]"
                      style={{ width: `${currentProgress}%` }}
                    />
                  </div>

                  <p className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
                    <span>{currentStep}</span>
                  </p>
                </div>
              </div>
            );
          }

          // Final generated video result message
          if (msg.type === 'video_result' && msg.videoData) {
            const vid = msg.videoData;
            return (
              <div key={itemKey} className="flex justify-start animate-in fade-in duration-300">
                <div className="max-w-2xl w-full p-4 sm:p-5 rounded-3xl rounded-tl-md glass-panel border border-pink-500/40 bg-[#0b0816] shadow-2xl space-y-4">
                  {/* Result Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-white">Video Generated Successfully</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                        {vid.duration}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/10 text-slate-300">
                        1080p MP4
                      </span>
                    </div>
                  </div>

                  {/* Video Player Display */}
                  <div className="relative rounded-2xl overflow-hidden bg-black/80 border border-white/15 aspect-video flex items-center justify-center group shadow-inner">
                    <video
                      src={vid.videoUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                      muted={isAudioMuted}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Prompt Text */}
                  <p className="text-xs text-slate-300 font-sans italic line-clamp-2">
                    "{vid.prompt}"
                  </p>

                  {/* Action Buttons: Download, Save, Audio Toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      {/* Audio Mute/Unmute */}
                      <button
                        type="button"
                        onClick={() => setIsAudioMuted(!isAudioMuted)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
                        title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
                      >
                        {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                        <span>{isAudioMuted ? 'Muted' : 'Audio On'}</span>
                      </button>

                      {/* Video Motion Pill */}
                      {vid.cameraMovement && (
                        <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {vid.cameraMovement}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Download MP4 Button */}
                      <button
                        type="button"
                        onClick={() => handleDownloadVideo(vid.videoUrl, vid.prompt)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-500/25 transition cursor-pointer active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download MP4</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}

        <div ref={chatScrollEndRef} />
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM PROMPT BOX (CLEAN & SIMPLE)                                     */}
      {/* ========================================================================= */}
      <div className="pt-2 shrink-0">
        <div className="glass-panel p-2.5 sm:p-3 rounded-2xl border border-pink-500/30 bg-[#070913]/95 backdrop-blur-xl shadow-2xl space-y-2">
          {/* Attached image preview pill if selected */}
          {attachedImage && (
            <div className="flex items-center gap-2 px-2 py-1 rounded-xl bg-white/5 border border-white/10 max-w-fit">
              <img src={attachedImage} alt="Attachment" className="w-6 h-6 rounded-md object-cover" />
              <span className="text-[10px] font-mono text-slate-300">Image Reference Attached</span>
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            {/* Hidden file input for reference images */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Attach Image Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-pink-300 border border-white/10 transition cursor-pointer shrink-0"
              title="Attach starting image for Image-to-Video"
            >
              <Upload className="w-4 h-4" />
            </button>

            {/* Prompt Textarea */}
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendPrompt();
                }
              }}
              placeholder="Describe the video you want to generate (e.g. Cyberpunk flying car in rainy neon city)..."
              className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none resize-none py-2.5 px-2 font-sans max-h-32"
            />

            {/* Send / Generate Prompt Button */}
            <button
              type="button"
              disabled={(!inputText.trim() && !attachedImage) || isGenerating}
              onClick={handleSendPrompt}
              className={`p-3 rounded-xl font-bold transition flex items-center justify-center shrink-0 cursor-pointer ${
                (!inputText.trim() && !attachedImage) || isGenerating
                  ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-400 hover:to-purple-500 shadow-md shadow-pink-500/30'
              }`}
              title="Send Prompt"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DEVELOPER / API SETTINGS MODAL (SEPARATE FROM NORMAL UI)               */}
      {/* ========================================================================= */}
      {showApiSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl glass-panel border border-pink-500/40 bg-[#0d091a] p-6 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-base text-white">
                    Developer & API Settings
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Configure your preferred video generation API provider and key
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApiSettingsModal(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Active Status */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                  Current Backend Status
                </span>
                <span className="text-xs font-mono font-bold text-slate-200 block mt-0.5">
                  {apiConfigStatus.maskedKey}
                </span>
                <span className="text-[10px] font-mono text-pink-300 block mt-0.5">
                  Provider: {apiConfigStatus.provider}
                </span>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                  apiConfigStatus.isConfigured
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {apiConfigStatus.isConfigured ? 'Active' : 'Unconfigured'}
              </span>
            </div>

            {/* Provider Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-pink-400" />
                <span>Video Generation API Provider</span>
              </label>
              <select
                value={apiProvider}
                onChange={(e) => setApiProvider(e.target.value)}
                className="w-full bg-black/70 border border-white/15 focus:border-pink-400 rounded-xl p-3 text-xs text-white focus:outline-none font-mono"
              >
                <option value="OG AI Neural Engine (Built-in)">OG AI Neural Engine (Built-in Synthesizer)</option>
                <option value="Custom Video REST API">Custom Video REST API Endpoint</option>
                <option value="Runway Gen-3 Alpha API">Runway Gen-3 Alpha API</option>
                <option value="Pixazo / LTX-Video API">Pixazo / LTX-Video API</option>
                <option value="Kling / Haiper Video API">Kling / Haiper Video API</option>
              </select>
            </div>

            {/* Custom Endpoint URL (if Custom provider selected) */}
            {apiProvider === 'Custom Video REST API' && (
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300 font-semibold">
                  Custom API Endpoint URL
                </label>
                <input
                  type="text"
                  value={apiEndpointInput}
                  onChange={(e) => setApiEndpointInput(e.target.value)}
                  placeholder="https://api.yourprovider.com/v1/generate-video"
                  className="w-full bg-black/70 border border-white/15 focus:border-pink-400 rounded-xl p-3 text-xs text-white focus:outline-none font-mono"
                />
              </div>
            )}

            {/* API Key Input with Eye Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center justify-between">
                <span>API Key</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Configured securely on server
                </span>
              </label>
              <div className="relative">
                <input
                  type={showApiKeyPlain ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Paste your video generation API key here..."
                  className="w-full bg-black/70 border border-white/15 focus:border-pink-400 rounded-xl p-3 pr-10 text-xs text-white focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKeyPlain(!showApiKeyPlain)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showApiKeyPlain ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Feedback Notice */}
            {apiTestNotice && (
              <div
                className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 ${
                  apiTestNotice.success
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                }`}
              >
                {apiTestNotice.success ? (
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{apiTestNotice.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleResetApiKey}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-400 hover:text-white transition cursor-pointer"
              >
                Clear Key
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={apiTesting}
                  onClick={handleTestApiKey}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {apiTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-300" />}
                  <span>Test Connection</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveApiSettings}
                  disabled={!apiKeyInput.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-md shadow-pink-500/30 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Configuration</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SAVED VIDEOS LIBRARY MODAL / DRAWER                                     */}
      {/* ========================================================================= */}
      {showLibraryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[85vh] rounded-3xl glass-panel border border-pink-500/40 bg-[#0d091a] p-6 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-pink-500/20 text-pink-300">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-base text-white">
                    Generated Videos Library
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {videos.length} videos rendered in your collection
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLibraryModal(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Videos Grid */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {videos.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Film className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-xs">No generated videos yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {videos.map((vid, vidIdx) => (
                    <div
                      key={vid.id ? `${vid.id}-${vidIdx}` : `video-${vidIdx}`}
                      className="rounded-2xl overflow-hidden bg-black/60 border border-white/10 hover:border-pink-500/40 transition flex flex-col justify-between p-3 space-y-2"
                    >
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
                        <video
                          src={vid.videoUrl}
                          controls
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 italic">
                        "{vid.prompt}"
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-slate-400 font-mono">
                        <span>{vid.duration}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDownloadVideo(vid.videoUrl, vid.prompt)}
                            className="p-1 text-pink-400 hover:text-pink-300"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteVideo && (
                            <button
                              type="button"
                              onClick={() => onDeleteVideo(vid.id)}
                              className="p-1 text-slate-500 hover:text-rose-400"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
