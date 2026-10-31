import React, { useState, useEffect } from 'react';
import {
  Key,
  Image as ImageIcon,
  Film,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  Lock,
  ExternalLink,
  Zap,
  Info,
  Server,
  Terminal,
  Cpu
} from 'lucide-react';
import { UserProfile, NavTab } from '../types';
import { Og3DLogo } from './Og3DLogo';

interface MyApiViewProps {
  theme?: 'dark' | 'light';
  profile: UserProfile;
  onSelectTab: (tab: NavTab) => void;
}

interface KeyStatus {
  isConfigured: boolean;
  isCustom: boolean;
  maskedKey: string;
  provider: string;
  endpoint?: string;
  lastTested?: string;
}

export const MyApiView: React.FC<MyApiViewProps> = ({
  theme = 'dark',
  profile,
  onSelectTab
}) => {
  const isDark = theme === 'dark';

  // API Status State
  const [photoStatus, setPhotoStatus] = useState<KeyStatus>({
    isConfigured: false,
    isCustom: false,
    maskedKey: 'Not configured',
    provider: 'AI Image Engine'
  });

  const [videoStatus, setVideoStatus] = useState<KeyStatus>({
    isConfigured: false,
    isCustom: false,
    maskedKey: 'Not configured',
    provider: 'OG AI Cinema Video Studio'
  });

  // Photo Key Form
  const [photoApiKey, setPhotoApiKey] = useState('');
  const [photoProvider, setPhotoProvider] = useState('Magic Hour AI');
  const [showPhotoKey, setShowPhotoKey] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [isTestingPhoto, setIsTestingPhoto] = useState(false);
  const [photoFeedback, setPhotoFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Video Key Form
  const [videoApiKey, setVideoApiKey] = useState('');
  const [videoProvider, setVideoProvider] = useState('OG AI Cinema Video Studio');
  const [videoEndpoint, setVideoEndpoint] = useState('');
  const [showVideoKey, setShowVideoKey] = useState(false);
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [isTestingVideo, setIsTestingVideo] = useState(false);
  const [videoFeedback, setVideoFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Fetch status on load
  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/keys/status');
      if (res.ok) {
        const data = await res.json();
        if (data.image) setPhotoStatus(data.image);
        if (data.video) setVideoStatus(data.video);
      }
    } catch (err) {
      console.error('Error fetching key status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Save Photo API Key
  const handleSavePhotoKey = async () => {
    if (!photoApiKey.trim()) {
      setPhotoFeedback({ type: 'error', message: 'Please enter a valid Photo (Image Generation) API key.' });
      return;
    }

    setIsSavingPhoto(true);
    setPhotoFeedback(null);

    try {
      const res = await fetch('/api/keys/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          apiKey: photoApiKey.trim(),
          provider: photoProvider
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPhotoFeedback({ type: 'success', message: '✓ Photo API key saved and activated!' });
        setPhotoApiKey('');
        fetchStatus();
      } else {
        setPhotoFeedback({ type: 'error', message: data.error || 'Failed to save Photo API key.' });
      }
    } catch (err: any) {
      setPhotoFeedback({ type: 'error', message: err.message || 'Network error saving key.' });
    } finally {
      setIsSavingPhoto(false);
    }
  };

  // Test Photo API Key
  const handleTestPhotoKey = async () => {
    setIsTestingPhoto(true);
    setPhotoFeedback(null);

    try {
      const res = await fetch('/api/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          apiKey: photoApiKey.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPhotoFeedback({ type: 'success', message: data.message || '✓ Photo API key tested and operational!' });
        fetchStatus();
      } else {
        setPhotoFeedback({ type: 'error', message: data.error || 'Photo API key test failed.' });
      }
    } catch (err: any) {
      setPhotoFeedback({ type: 'error', message: err.message || 'Network error testing key.' });
    } finally {
      setIsTestingPhoto(false);
    }
  };

  // Reset Photo Key
  const handleResetPhotoKey = async () => {
    try {
      const res = await fetch('/api/keys/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'image' })
      });
      if (res.ok) {
        setPhotoFeedback({ type: 'success', message: 'Photo API key has been cleared.' });
        fetchStatus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Video API Key
  const handleSaveVideoKey = async () => {
    if (!videoApiKey.trim()) {
      setVideoFeedback({ type: 'error', message: 'Please enter a valid Video Generation API key.' });
      return;
    }

    setIsSavingVideo(true);
    setVideoFeedback(null);

    try {
      const res = await fetch('/api/keys/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          apiKey: videoApiKey.trim(),
          provider: videoProvider,
          endpoint: videoEndpoint.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setVideoFeedback({ type: 'success', message: '✓ Video API key saved and activated!' });
        setVideoApiKey('');
        fetchStatus();
      } else {
        setVideoFeedback({ type: 'error', message: data.error || 'Failed to save Video API key.' });
      }
    } catch (err: any) {
      setVideoFeedback({ type: 'error', message: err.message || 'Network error saving key.' });
    } finally {
      setIsSavingVideo(false);
    }
  };

  // Test Video API Key
  const handleTestVideoKey = async () => {
    setIsTestingVideo(true);
    setVideoFeedback(null);

    try {
      const res = await fetch('/api/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          apiKey: videoApiKey.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setVideoFeedback({ type: 'success', message: data.message || '✓ Video API key verified and operational!' });
        fetchStatus();
      } else {
        setVideoFeedback({ type: 'error', message: data.error || 'Video API key test failed.' });
      }
    } catch (err: any) {
      setVideoFeedback({ type: 'error', message: err.message || 'Network error testing key.' });
    } finally {
      setIsTestingVideo(false);
    }
  };

  // Reset Video Key
  const handleResetVideoKey = async () => {
    try {
      const res = await fetch('/api/keys/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'video' })
      });
      if (res.ok) {
        setVideoFeedback({ type: 'success', message: 'Video API key has been cleared.' });
        fetchStatus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200 ${
      isDark ? 'text-slate-100' : 'text-slate-800'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-[#0b121e]/80 to-[#07090e] border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Key className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">
                My API Engine
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Self-Serve
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl">
              Connect your own personal API credentials for <strong className="text-emerald-300">Photo</strong> and <strong className="text-cyan-300">Video</strong> generation pipelines.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 relative z-10">
          <button
            type="button"
            onClick={fetchStatus}
            disabled={isLoadingStatus}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* STRICT POLICY & CHAT API EXCLUSION NOTICE */}
      <div className="p-4 rounded-2xl bg-amber-950/25 border border-amber-500/35 flex items-start gap-3 shadow-lg">
        <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1 grow min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase font-mono text-amber-300 tracking-wider">
              Specific Policy: Photo & Video API Only
            </span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              No Chat API Here
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            As requested by system architecture, regular users can connect their custom API keys for <strong>Photo (Image Generation)</strong> and <strong>Video</strong> only. 
            The <strong>Quantum Chat API & n8n AI Agent Webhook</strong> are restricted to the <strong>Secret Owner Portal</strong> accessible exclusively to the owner.
          </p>
          <div className="pt-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectTab('owner-secret')}
              className="text-[11px] font-mono text-rose-300 hover:text-rose-200 underline flex items-center gap-1 cursor-pointer"
            >
              <Lock className="w-3 h-3 text-rose-400" />
              <span>Are you the owner? Open Secret Function to configure Chat API →</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ======================================================== */}
        {/* 1. PHOTO (IMAGE GENERATION) API CONFIGURATION             */}
        {/* ======================================================== */}
        <div className="p-6 rounded-3xl bg-[#0b0f19]/90 border border-purple-500/30 shadow-xl space-y-5 relative">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-white">
                  Photo API (Image Studio)
                </h2>
                <span className="text-[11px] font-mono text-purple-300/80">
                  8K Photo, Concept Art & Flux Schnell
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {photoStatus.isConfigured ? (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-slate-800 text-slate-400 border border-white/5">
                  Default Core
                </span>
              )}
            </div>
          </div>

          {/* Current Status Box */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">Current Engine:</span>
              <span className="font-mono font-bold text-purple-300">{photoStatus.provider}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">Key Status:</span>
              <span className="font-mono text-slate-300">{photoStatus.maskedKey}</span>
            </div>
            {photoStatus.lastTested && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">Verified:</span>
                <span className="font-mono text-emerald-400">{photoStatus.lastTested}</span>
              </div>
            )}
          </div>

          {/* Configuration Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 font-bold mb-1.5">
                Select Photo API Provider
              </label>
              <select
                value={photoProvider}
                onChange={(e) => setPhotoProvider(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white font-mono focus:outline-hidden focus:border-purple-400"
              >
                <option value="Magic Hour AI">Magic Hour AI Studio (mhk_...)</option>
                <option value="fal.ai FLUX">fal.ai FLUX Schnell / Dev (API Key)</option>
                <option value="Stability AI">Stability AI (SDXL / Ultra)</option>
                <option value="Custom Image API">Custom REST Image Engine</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 font-bold mb-1.5">
                Photo API Key
              </label>
              <div className="relative">
                <input
                  type={showPhotoKey ? 'text' : 'password'}
                  placeholder="Paste your photo API key (e.g. mhk_... or fal_...)"
                  value={photoApiKey}
                  onChange={(e) => setPhotoApiKey(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white font-mono focus:outline-hidden focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPhotoKey(!showPhotoKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPhotoKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {photoFeedback && (
              <div className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 ${
                photoFeedback.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              }`}>
                {photoFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{photoFeedback.message}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSavePhotoKey}
                disabled={isSavingPhoto}
                className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer disabled:opacity-50"
              >
                {isSavingPhoto ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Save Photo Key</span>
              </button>

              <button
                type="button"
                onClick={handleTestPhotoKey}
                disabled={isTestingPhoto}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-200 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              >
                {isTestingPhoto ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                )}
                <span>Test Live</span>
              </button>

              {photoStatus.isCustom && (
                <button
                  type="button"
                  onClick={handleResetPhotoKey}
                  className="px-3 py-2.5 rounded-xl text-xs font-mono text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Reset to default system key"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="pt-2 text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>Need an Image API Key?</span>
              <a
                href="https://magichour.ai"
                target="_blank"
                rel="noreferrer"
                className="text-purple-400 hover:text-purple-300 underline flex items-center gap-1"
              >
                <span>Get Magic Hour Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. VIDEO GENERATOR API CONFIGURATION                     */}
        {/* ======================================================== */}
        <div className="p-6 rounded-3xl bg-[#0b0f19]/90 border border-cyan-500/30 shadow-xl space-y-5 relative">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                <Film className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-white">
                  Video API (Video Generator)
                </h2>
                <span className="text-[11px] font-mono text-cyan-300/80">
                  Cinema Video, Neural Motion & Veo 3
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {videoStatus.isConfigured ? (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-slate-800 text-slate-400 border border-white/5">
                  Default Core
                </span>
              )}
            </div>
          </div>

          {/* Current Status Box */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">Current Engine:</span>
              <span className="font-mono font-bold text-cyan-300">{videoStatus.provider}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">Key Status:</span>
              <span className="font-mono text-slate-300">{videoStatus.maskedKey}</span>
            </div>
            {videoStatus.endpoint && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">Custom Endpoint:</span>
                <span className="font-mono text-cyan-400 truncate max-w-[200px]">{videoStatus.endpoint}</span>
              </div>
            )}
            {videoStatus.lastTested && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">Verified:</span>
                <span className="font-mono text-emerald-400">{videoStatus.lastTested}</span>
              </div>
            )}
          </div>

          {/* Configuration Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 font-bold mb-1.5">
                Select Video API Provider
              </label>
              <select
                value={videoProvider}
                onChange={(e) => setVideoProvider(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white font-mono focus:outline-hidden focus:border-cyan-400"
              >
                <option value="OG AI Cinema Video Studio">OG AI Cinema Video Studio (mhk_...)</option>
                <option value="Runway Gen-3 Alpha">Runway Gen-3 Alpha API</option>
                <option value="Luma Ray">Luma Dream Machine (Ray API)</option>
                <option value="Custom Video Webhook">Custom Video REST Endpoint</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 font-bold mb-1.5">
                Video API Key
              </label>
              <div className="relative">
                <input
                  type={showVideoKey ? 'text' : 'password'}
                  placeholder="Paste your video API key (e.g. mhk_... or runway_...)"
                  value={videoApiKey}
                  onChange={(e) => setVideoApiKey(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white font-mono focus:outline-hidden focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setShowVideoKey(!showVideoKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showVideoKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 font-bold mb-1.5">
                Custom Endpoint / Webhook URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://api.yourdomain.com/v1/generate-video"
                value={videoEndpoint}
                onChange={(e) => setVideoEndpoint(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white font-mono focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            {videoFeedback && (
              <div className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 ${
                videoFeedback.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              }`}>
                {videoFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{videoFeedback.message}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveVideoKey}
                disabled={isSavingVideo}
                className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer disabled:opacity-50"
              >
                {isSavingVideo ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Save Video Key</span>
              </button>

              <button
                type="button"
                onClick={handleTestVideoKey}
                disabled={isTestingVideo}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-200 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              >
                {isTestingVideo ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>Test Live</span>
              </button>

              {videoStatus.isCustom && (
                <button
                  type="button"
                  onClick={handleResetVideoKey}
                  className="px-3 py-2.5 rounded-xl text-xs font-mono text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Reset to default system key"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="pt-2 text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>Ready to generate video?</span>
              <button
                type="button"
                onClick={() => onSelectTab('video')}
                className="text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1 cursor-pointer"
              >
                <span>Open Video Generator →</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Secret Owner Function Banner Footnote */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/20 via-[#0b0f19] to-purple-950/20 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
              Secret Function: Quantum Chat API Portal
            </span>
            <span className="text-[11px] text-slate-400 font-mono block">
              Only the system owner (gautammaheshwari225@gmail.com) can enter to manage Chat API and n8n webhooks.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelectTab('owner-secret')}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-xs font-mono text-rose-300 font-bold transition-all cursor-pointer whitespace-nowrap"
        >
          <Lock className="w-3.5 h-3.5 text-rose-400" />
          <span>Enter Owner Portal</span>
        </button>
      </div>
    </div>
  );
};

export default MyApiView;
