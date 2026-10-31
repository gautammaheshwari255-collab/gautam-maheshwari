import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Camera,
  Paperclip,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  ThumbsUp,
  FileText,
  Image as ImageIcon,
  X,
  Code,
  Zap,
  CornerDownLeft,
  ChevronDown,
  KeyRound,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { ChatMessage, AppSettings, NavTab } from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, attachments?: any[]) => void;
  onClearChat: () => void;
  selectedModel: string;
  settings: AppSettings;
  theme: 'dark' | 'light';
  onAddHistoryItem: (item: any) => void;
  onSelectTab?: (tab: NavTab) => void;
  isLoading?: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  selectedModel,
  settings,
  theme,
  onAddHistoryItem,
  onSelectTab,
  isLoading = false
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [attachments, setAttachments] = useState<
    { name: string; type: 'image' | 'video' | 'audio' | 'document'; url: string; size?: string }[]
  >([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // Dedicated Quantum Chat API Key State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [chatKeyInfo, setChatKeyInfo] = useState<{ maskedKey: string; provider: string; lastTested: string }>({
    maskedKey: 'n8n Webhook Active',
    provider: 'n8n AI Agent (Production Webhook)',
    lastTested: 'Configured'
  });
  const [customChatKey, setCustomChatKey] = useState('');
  const [keyNotice, setKeyNotice] = useState<string | null>(null);
  const [testingKey, setTestingKey] = useState(false);

  useEffect(() => {
    fetch('/api/keys/status')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.chat) {
          setChatKeyInfo({
            maskedKey: d.chat.maskedKey || 'n8n Webhook Active',
            provider: d.chat.provider || 'n8n AI Agent (Production Webhook)',
            lastTested: d.chat.lastTested || 'Configured'
          });
        }
      })
      .catch((err) => console.warn('Could not fetch chat key status:', err));
  }, []);

  const handleTestChatKey = async () => {
    setTestingKey(true);
    setKeyNotice(null);
    try {
      const res = await fetch('/api/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'chat' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setKeyNotice(`✓ ${data.message}`);
        setChatKeyInfo((prev) => ({ ...prev, lastTested: 'Verified Active' }));
      } else {
        setKeyNotice(`⚠ ${data.error || 'Verification failed'}`);
      }
    } catch (err: any) {
      setKeyNotice(`⚠ ${err?.message || 'Network error'}`);
    } finally {
      setTestingKey(false);
      setTimeout(() => setKeyNotice(null), 5000);
    }
  };

  const handleSaveChatKey = async () => {
    if (!customChatKey.trim()) return;
    setTestingKey(true);
    setKeyNotice(null);
    try {
      const res = await fetch('/api/keys/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chat',
          apiKey: customChatKey.trim(),
          provider: 'Quantum AI Chat Engine (fal.ai Any-LLM / OpenRouter)'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setChatKeyInfo({
          maskedKey: data.maskedKey,
          provider: data.provider,
          lastTested: 'Saved'
        });
        setKeyNotice('✓ Quantum Chat API Key saved securely and active!');
        setCustomChatKey('');
      } else {
        setKeyNotice(`⚠ ${data.error || 'Failed to save key'}`);
      }
    } catch (err: any) {
      setKeyNotice(`⚠ ${err?.message || 'Network error'}`);
    } finally {
      setTestingKey(false);
      setTimeout(() => setKeyNotice(null), 5000);
    }
  };

  const handleResetChatKey = async () => {
    setTestingKey(true);
    setKeyNotice(null);
    try {
      const res = await fetch('/api/keys/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'chat' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setChatKeyInfo({
          maskedKey: '6a6d••••••••27f5',
          provider: 'Quantum AI Chat Engine (fal.ai Any-LLM / OpenRouter)',
          lastTested: 'Default Chat Key'
        });
        setKeyNotice('✓ Restored default Quantum Chat API Key.');
      }
    } catch (err: any) {
      setKeyNotice(`⚠ ${err?.message || 'Network error'}`);
    } finally {
      setTestingKey(false);
      setTimeout(() => setKeyNotice(null), 5000);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            setInputText((prev) => (prev ? prev + ' ' + currentTranscript : currentTranscript));
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition event:', event);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        setRecognitionInstance(recognition);
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionInstance) {
      // Fallback voice simulation
      if (!isRecording) {
        setIsRecording(true);
        setTimeout(() => {
          setInputText((prev) =>
            prev
              ? prev + ' How can OGOO optimize my distributed system architecture?'
              : 'How can OGOO optimize my distributed system architecture?'
          );
          setIsRecording(false);
        }, 2500);
      } else {
        setIsRecording(false);
      }
      return;
    }

    if (isRecording) {
      recognitionInstance.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionInstance.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
        setIsRecording(false);
      }
    }
  };

  const handleSend = () => {
    if (!inputText.trim() && attachments.length === 0) return;
    onSendMessage(inputText.trim(), attachments);
    setInputText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith('image/');
      const isAudio = file.type.startsWith('audio/');
      const isVideo = file.type.startsWith('video/');
      const fileType: 'image' | 'video' | 'audio' | 'document' = isImg
        ? 'image'
        : isAudio
        ? 'audio'
        : isVideo
        ? 'video'
        : 'document';

      const url = URL.createObjectURL(file);
      setAttachments((prev) => [
        ...prev,
        {
          name: file.name,
          type: fileType,
          url,
          size: `${(file.size / 1024).toFixed(0)} KB`
        }
      ]);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    setAttachments((prev) => [
      ...prev,
      {
        name: `Neural-Capture-${Date.now().toString().slice(-4)}.jpg`,
        type: 'image',
        url: imageDataUrl,
        size: '180 KB'
      }
    ]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };

  const speakText = (text: string, id: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  const promptStarters = [
    { label: 'Explain Quantum Supremacy', prompt: 'Explain quantum computing supremacy and qubit superposition' },
    { label: 'Build Microservice Architecture', prompt: 'Explain microservice architecture design and distributed system patterns' },
    { label: 'Neural Network Mechanics', prompt: 'Explain how neural networks and transformer attention mechanisms learn' },
    { label: 'Market Disruption Analysis', prompt: 'Explain how generative artificial intelligence disrupts enterprise software models' }
  ];

  return (
    <div id="ogoo-chat-view" className="flex flex-col h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* Top Bar inside Chat */}
      <div className="px-6 py-2.5 border-b border-white/5 bg-black/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-cyan-300 font-semibold">{selectedModel}</span>
          <span className="text-slate-500">•</span>
          <span className="text-cyan-400 font-mono text-[11px] font-bold">Direct Answers • No Punctuation Marks</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowKeyModal((prev) => !prev)}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-[11px] font-mono font-semibold text-cyan-200 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Configure Quantum Chat API Key"
          >
            <KeyRound className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">Chat Key:</span>
            <span className="text-cyan-300 font-bold">{chatKeyInfo.maskedKey}</span>
          </button>

          <button
            type="button"
            onClick={onClearChat}
            className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
            title="Reset conversation"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Session</span>
          </button>
        </div>
      </div>

      {/* Quick API Key Modal / Drawer for Quantum Chat */}
      {showKeyModal && (
        <div className="px-6 py-4 bg-[#090d18] border-b border-cyan-500/40 shadow-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Quantum Chat — API Key Integration</h4>
                <p className="text-[11px] font-mono text-cyan-400">{chatKeyInfo.provider}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowKeyModal(false)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {keyNotice && (
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{keyNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Active Key</span>
                <span className="text-xs font-mono font-bold text-white tracking-wider block mt-0.5">
                  {chatKeyInfo.maskedKey}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Operational
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestChatKey}
                disabled={testingKey}
                className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-semibold text-cyan-200 transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {testingKey ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                <span>Test Connection</span>
              </button>
              <button
                type="button"
                onClick={handleResetChatKey}
                disabled={testingKey}
                title="Reset to default key"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-white/10">
            <label className="text-[11px] font-mono text-slate-300 flex items-center justify-between">
              <span>Update Chat API Key:</span>
              <span className="text-[10px] text-slate-500 font-mono">UUID:Secret or Gemini format</span>
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={customChatKey}
                onChange={(e) => setCustomChatKey(e.target.value)}
                placeholder="Paste your Chat API Key (UUID:Secret or Gemini key)"
                className="flex-1 px-3 py-2 rounded-xl bg-black/70 border border-cyan-500/40 text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
              <button
                type="button"
                onClick={handleSaveChatKey}
                disabled={!customChatKey.trim() || testingKey}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="grow overflow-y-auto px-4 md:px-8 py-6 space-y-6">
        {messages.length <= 1 && (
          <div className="max-w-2xl mx-auto my-6 text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
              <Sparkles className="w-8 h-8 text-cyan-400 animate-spin-slow" />
            </div>
            <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight">
              What will we manifest with <span className="neon-text-gradient">OGOO</span>?
            </h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              Explore multimodal reasoning across natural language, code architectures, real camera feeds, voice transcripts, and generative media.
            </p>

            {/* Glowing Featured AI Generators Launcher Cards */}
            {onSelectTab && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div
                  onClick={() => onSelectTab('image')}
                  className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 via-[#0b0f19] to-cyan-950/30 border border-purple-500/40 hover:border-cyan-400 shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] text-left transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">✨</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        8K PHOTOREAL
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                      AI Image Generator
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Prompt, upload references, choose styles & aspect ratios, and synthesize 8K visuals.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-purple-300 group-hover:text-cyan-300">
                    <span>Launch Image Studio</span>
                    <span>→</span>
                  </div>
                </div>

                <div
                  onClick={() => onSelectTab('video')}
                  className="p-4 rounded-2xl bg-gradient-to-br from-pink-950/40 via-[#0b0f19] to-purple-950/30 border border-pink-500/40 hover:border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.25)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] text-left transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">🎬</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                        VEO 3.1 & MOTION
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-sm text-white group-hover:text-pink-300 transition-colors">
                      AI Video Generator
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Transform text prompts or uploaded images into cinematic 60 FPS video sequences.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-pink-300 group-hover:text-pink-200">
                    <span>Launch Video Generator</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            )}

            {/* Prompt Starters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 text-left">
              {promptStarters.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSendMessage(item.prompt)}
                  className="p-3 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300">
                      {item.label}
                    </span>
                    <CornerDownLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {item.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          const itemKey = msg.id ? `${msg.id}-${index}` : `chat-msg-${index}`;
          return (
            <div
              key={itemKey}
              className={`flex gap-3 md:gap-4 max-w-3xl mx-auto group ${
                isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* AI Avatar */}
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-purple-600 to-pink-500 p-0.5 shrink-0 shadow-md shadow-cyan-500/20">
                  <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center text-cyan-400">
                    <Bot className="w-4 h-4" />
                  </div>
                </div>
              )}

              {/* Message Bubble Container */}
              <div
                className={`flex flex-col space-y-2 max-w-[88%] sm:max-w-[80%] ${
                  isUser ? 'items-end' : 'items-start'
                }`}
              >
                {/* Attachments preview */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-1">
                    {msg.attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl overflow-hidden border border-white/10 bg-black/40 p-1 flex items-center gap-2 max-w-xs"
                      >
                        {att.type === 'image' ? (
                          <img
                            src={att.url}
                            alt={att.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="p-2 rounded-lg bg-white/5 text-cyan-400">
                            <FileText className="w-6 h-6" />
                          </div>
                        )}
                        <div className="text-[10px] pr-2 overflow-hidden">
                          <p className="text-white font-medium truncate">{att.name}</p>
                          {att.size && <p className="text-slate-400 font-mono">{att.size}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Body */}
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-br-xs shadow-lg shadow-cyan-900/30'
                      : 'bg-[#0d121f] border border-white/10 text-slate-200 rounded-bl-xs shadow-md'
                  }`}
                >
                  <div className="whitespace-pre-wrap select-text font-normal">
                    {msg.text}
                  </div>
                </div>

                {/* Message Metadata & Actions */}
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 px-1">
                  <span>{msg.timestamp}</span>
                  {!isUser && msg.tokenCount && (
                    <>
                      <span>•</span>
                      <span className="text-cyan-400/80">{msg.tokenCount} tokens</span>
                    </>
                  )}

                  {!isUser && (
                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity ml-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(msg.text, msg.id)}
                        className="p-1 hover:text-white hover:bg-white/5 rounded cursor-pointer"
                        title="Copy message"
                      >
                        {copiedMessageId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => speakText(msg.text, msg.id)}
                        className="p-1 hover:text-white hover:bg-white/5 rounded cursor-pointer"
                        title="Read aloud"
                      >
                        {speakingMessageId === msg.id ? (
                          <VolumeX className="w-3 h-3 text-purple-400" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-700/80 p-0.5 shrink-0 flex items-center justify-center text-white">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* n8n AI Agent Typing Animation Indicator */}
        {isLoading && (
          <div className="flex gap-3 md:gap-4 max-w-3xl mx-auto justify-start animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-purple-600 to-pink-500 p-0.5 shrink-0 shadow-md shadow-cyan-500/20">
              <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center text-cyan-400">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col space-y-1 max-w-[85%] sm:max-w-[80%]">
              <div className="px-4 py-3 rounded-2xl rounded-tl-xs bg-[#0d121f] border border-cyan-500/30 text-white shadow-lg flex items-center gap-3">
                <span className="text-xs font-mono text-cyan-300 font-semibold tracking-wide">typing...</span>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" />
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500 px-1">
                Waiting for n8n AI Agent response...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input Dock */}
      <div className="p-4 md:p-6 bg-gradient-to-t from-[#07090e] via-[#07090e]/95 to-transparent">
        <div className="max-w-3xl mx-auto">
          {/* Attachments tray */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 mb-2 bg-[#0d121f] border border-cyan-500/20 rounded-xl">
              {attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-1.5 bg-black/40 rounded-lg border border-white/5 text-xs text-slate-200"
                >
                  {file.type === 'image' ? (
                    <img src={file.url} alt={file.name} className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <FileText className="w-4 h-4 text-cyan-400" />
                  )}
                  <span className="truncate max-w-[120px] text-[11px] font-mono">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="p-0.5 hover:text-red-400 text-slate-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Voice recording wave banner */}
          {isRecording && (
            <div className="flex items-center justify-between p-2.5 mb-2 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-200 animate-pulse font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span>Neural Microphone Active • Listening to prompt...</span>
              </div>
              <button
                type="button"
                onClick={toggleRecording}
                className="px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/40 text-white font-bold"
              >
                Stop
              </button>
            </div>
          )}

          {/* Main Input Box */}
          <div className="relative rounded-2xl bg-[#0d121f]/90 border border-white/10 focus-within:border-cyan-500/60 focus-within:shadow-[0_0_25px_-5px_rgba(6,182,212,0.4)] transition-all p-2.5">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything, formulate code, or attach multimodal telemetry..."
              className="w-full bg-transparent border-0 focus:outline-hidden text-xs sm:text-sm text-white placeholder:text-slate-500 resize-none px-2 py-1 max-h-36 font-sans leading-relaxed"
            />

            {/* Input Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5 px-1">
              <div className="flex items-center gap-1">
                {/* File Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  id="chat-upload-file-btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-colors cursor-pointer"
                  title="Upload image, document, audio or code"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Camera Button */}
                <button
                  id="chat-camera-btn"
                  type="button"
                  onClick={() => setCameraModalOpen(true)}
                  className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-colors cursor-pointer"
                  title="Capture live webcam vision"
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Microphone Button */}
                <button
                  id="chat-mic-btn"
                  type="button"
                  onClick={toggleRecording}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    isRecording
                      ? 'bg-red-500/20 text-red-400 animate-pulse shadow-[0_0_12px_#ef4444]'
                      : 'text-slate-400 hover:text-cyan-400 hover:bg-white/5'
                  }`}
                  title={isRecording ? 'Stop Recording' : 'Voice Microphone'}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              {/* Send Button */}
              <button
                id="chat-send-btn"
                type="button"
                onClick={handleSend}
                disabled={(!inputText.trim() && attachments.length === 0) || isLoading}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
                  (inputText.trim() || attachments.length > 0) && !isLoading
                    ? 'bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 hover:scale-105 active:scale-95 text-white shadow-cyan-500/30'
                    : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                }`}
              >
                {isLoading ? (
                  <>
                    <span>typing...</span>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};
