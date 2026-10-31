import React, { useState } from 'react';
import {
  Menu,
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Search,
  Bell,
  CheckCircle2,
  Terminal,
  LogOut,
  ShieldCheck,
  Key,
  Lock
} from 'lucide-react';
import { NavTab } from '../types';
import { AI_MODELS } from '../data/mockData';
import { Og3DLogo } from './Og3DLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: NavTab;
  onOpenMobileMenu: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  audioSpeechEnabled: boolean;
  onToggleAudioSpeech: () => void;
  onQuickPrompt: (prompt: string) => void;
  onSelectTab?: (tab: NavTab) => void;
  onLogout?: () => void;
  stars?: number;
  onOpenStars?: () => void;
  onOpenConvertAppModal?: () => void;
  userEmail?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenMobileMenu,
  theme,
  onToggleTheme,
  selectedModel,
  onSelectModel,
  audioSpeechEnabled,
  onToggleAudioSpeech,
  onQuickPrompt,
  onSelectTab,
  onLogout,
  stars = 400,
  onOpenStars,
  onOpenConvertAppModal,
  userEmail
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    chat: { title: 'Quantum AI Chat', subtitle: 'Multimodal text, voice, camera vision & live file ingestion' },
    image: { title: 'AI Image Studio', subtitle: '8K Photorealistic & artistic visual generation with negative prompt engine' },
    fusion: { title: 'AI Fusion Studio', subtitle: 'Multimodal 2+ image blend, Gemini 3.1 Flash Image inpaint editing & style matrix' },
    video: { title: 'AI Video Generator', subtitle: 'Chat-guided generative video creation & neural motion' },
    'photo-editor': { title: 'AI Photo Lab & Inpainting', subtitle: 'Background remover, 4x neural upscaler, relight & object inpaint' },
    tools: { title: 'AI Tools Suite', subtitle: 'Voice, Music, Logo, Thumbnail, Writing, Coding, Translate, PDF & Slides' },
    history: { title: 'Creations & Neural History', subtitle: 'Universal repository of generated media, chats, and documents' },
    stars: { title: 'OG AI Credits Ledger', subtitle: 'User balance, transaction ledger history, tool pricing matrix & admin controls' },
    'my-api': { title: 'My API Engine', subtitle: 'Connect your personal Photo & Video Generation API keys (Chat is managed centrally)' },
    'owner-secret': { title: 'Secret Owner Portal', subtitle: 'Restricted Quantum Chat API, n8n Webhook & Master Engine Controls' },
    settings: { title: 'System & API Settings', subtitle: 'Configure Gemini, OpenAI, Anthropic keys, latency & model prompts' },
    profile: { title: 'Neural Identity & Compute', subtitle: 'Token consumption, GPU minutes, storage metrics & subscription' }
  };

  const quickPrompts = [
    'Design a revolutionary electric aircraft architecture',
    'Generate a 3D isometric cyberpunk laboratory',
    'Write a high-frequency trading bot in Go with WebSocket streams',
    'Compose an atmospheric sci-fi ambient soundtrack',
    'Create an eye-catching YouTube thumbnail for AI breakthrough'
  ];

  const filteredPrompts = quickPrompts.filter((p) =>
    p.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header
        id="ogoo-top-header"
        className={`sticky top-0 z-30 h-16 w-full px-4 md:px-6 flex items-center justify-between border-b transition-colors ${
          theme === 'dark'
            ? 'bg-[#07090e]/80 border-white/5 backdrop-blur-xl text-white'
            : 'bg-white/80 border-slate-200 backdrop-blur-xl text-slate-800'
        }`}
      >
        {/* Left Side: Mobile Menu + Title */}
        <div className="flex items-center gap-3">
          <button
            id="mobile-nav-toggle-btn"
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-sm md:text-base text-white tracking-tight">
                {titles[activeTab].title}
              </h1>
              <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              {titles[activeTab].subtitle}
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Quick Studio Nav Pill Shortcuts */}
          {onSelectTab && (
            <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10">
              <button
                type="button"
                id="header-nav-image-btn"
                onClick={() => onSelectTab('image')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'image'
                    ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>✨</span>
                <span>AI Image</span>
              </button>
              <button
                type="button"
                id="header-nav-video-btn"
                onClick={() => onSelectTab('video')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'video'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>🎬</span>
                <span>AI Video</span>
              </button>
              <button
                type="button"
                id="header-nav-editor-btn"
                onClick={() => onSelectTab('photo-editor')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'photo-editor'
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>✂️</span>
                <span>AI Editor</span>
              </button>
              <button
                type="button"
                id="header-nav-myapi-btn"
                onClick={() => onSelectTab('my-api')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'my-api'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
                title="My API: Configure Custom Photo & Video APIs"
              >
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">My API</span>
              </button>
            </div>
          )}

          {/* Secret Owner Portal shortcut */}
          {onSelectTab && (
            <button
              type="button"
              id="header-secret-owner-btn"
              onClick={() => onSelectTab('owner-secret')}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'owner-secret'
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  : 'bg-white/5 hover:bg-rose-500/10 border-white/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-300'
              }`}
              title="Secret Owner Function (Chat API & Master Access)"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden xl:inline text-[11px] font-mono font-bold uppercase tracking-wider text-rose-300">
                Owner Secret
              </span>
            </button>
          )}

          {/* OG AI Credits Balance in Top Navigation */}
          <button
            id="header-stars-pill"
            type="button"
            onClick={() => {
              if (onOpenStars) onOpenStars();
              else if (onSelectTab) onSelectTab('stars');
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/20 hover:from-amber-500/25 hover:to-amber-500/30 border border-amber-400/40 hover:border-amber-400/80 text-amber-200 transition-all shadow-[0_0_18px_-2px_rgba(245,158,11,0.35)] cursor-pointer group"
            title="View OG AI Credits Balance & Top-Up"
          >
            <Og3DLogo size={20} variant="credit" glow={true} animated={true} />
            <span className="font-mono font-bold text-xs tracking-wide text-amber-300">
              ₹{stars}
            </span>
            <span className="text-[10px] font-bold text-amber-400/90 hidden sm:inline uppercase tracking-wider">
              Credits
            </span>
          </button>

          {/* Convert Full Web to App / PWA Install Button */}
          <PWAInstallButton
            variant="header"
            onOpenConvertModal={onOpenConvertAppModal}
          />

          {/* Quick Command search */}
          <button
            id="quick-command-search-btn"
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>Search or run prompt...</span>
            <kbd className="hidden lg:inline font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-400">
              ⌘K
            </kbd>
          </button>

          {/* Model Selector Dropdown */}
          <div className="relative">
            <button
              id="model-selector-btn"
              type="button"
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-950/60 border border-cyan-500/30 text-xs text-cyan-200 font-medium transition-all shadow-[0_0_15px_-4px_rgba(6,182,212,0.3)] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-xs font-semibold truncate max-w-[130px] sm:max-w-[170px]">
                {selectedModel}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            {modelDropdownOpen && (
              <div
                id="model-selector-dropdown"
                className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0b0f19] border border-cyan-500/30 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="p-2 border-b border-white/5 text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider flex items-center justify-between">
                  <span>Select Neural Architecture</span>
                  <Terminal className="w-3 h-3 text-cyan-400" />
                </div>
                <div className="space-y-1 mt-1">
                  {AI_MODELS.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        onSelectModel(model.name);
                        setModelDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex flex-col gap-1 ${
                        selectedModel === model.name
                          ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-200'
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{model.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300 font-bold">
                          {model.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{model.desc}</p>
                      <div className="flex items-center gap-3 text-[9px] font-mono text-cyan-400/80">
                        <span>Speed: {model.speed}</span>
                        <span>•</span>
                        <span>Ctx: {model.context}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Voice/Audio Output Toggle */}
          <button
            id="audio-speech-toggle-btn"
            type="button"
            onClick={onToggleAudioSpeech}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              audioSpeechEnabled
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
            }`}
            title={audioSpeechEnabled ? 'Neural Voice Output ON' : 'Neural Voice Output OFF'}
          >
            {audioSpeechEnabled ? (
              <Volume2 className="w-4 h-4 text-purple-400 animate-pulse" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Theme Toggle */}
          <button
            id="header-theme-toggle-btn"
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Logout button */}
          {onLogout && (
            <button
              id="header-logout-btn"
              type="button"
              onClick={onLogout}
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="Log Out / Switch User"
              aria-label="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Command Search Modal */}
      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-md"
          onClick={() => setSearchModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#0b0f19] border border-cyan-500/30 rounded-2xl shadow-2xl p-4 overflow-hidden animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search tools, commands, or enter AI prompt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-cyan-400 font-mono"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-2">
                Recommended Prompt Directives
              </span>
              {filteredPrompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onQuickPrompt(prompt);
                    setSearchModalOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-cyan-500/10 text-xs text-slate-200 hover:text-cyan-200 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate">{prompt}</span>
                  <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
