import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  Maximize2,
  Minimize2,
  Share2,
  Check,
  CheckCircle2,
  Wifi,
  Zap,
  Shield,
  Layers,
  Sparkles,
  X,
  ExternalLink,
  Laptop,
  ArrowRight,
  HardDrive
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { IOSInstallGuideModal } from './PWAInstallButton';

interface ConvertAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const ConvertAppModal: React.FC<ConvertAppModalProps> = ({
  isOpen,
  onClose,
  userEmail
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!isOpen) return null;

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        const ok = await install();
        if (ok) onClose();
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowIOSGuide(true);
    }
  };

  const handleShareApp = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'OG AI - Autonomous Multimodal Studio',
          text: 'Experience OG AI: Next-generation multimodal AI suite with Chat, 8K Images, Veo Motion, and offline tools!',
          url: window.location.origin
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="w-full max-w-2xl rounded-3xl bg-[#090d16] border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] text-white p-5 sm:p-7 relative my-auto">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-white/10">
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-cyan-500 to-indigo-600 p-0.5 shadow-xl shadow-cyan-500/20 shrink-0">
              <div className="w-full h-full bg-[#07090e] rounded-[14px] flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-cyan-400" />
              </div>
              <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[9px] font-black uppercase tracking-wider shadow">
                PWA
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-amber-300">
                  Convert Web to Native App
                </h2>
                {isInstalled && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" /> Installed
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Transform OG AI from a browser tab into a lightweight, high-performance standalone desktop & mobile application.
              </p>
            </div>
          </div>

          {/* Two primary action cards: Install PWA + Fullscreen Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-5">
            {/* 1. Install to Home Screen / Desktop */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono uppercase font-bold tracking-wider">
                    Permanent App
                  </span>
                  <HardDrive className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Install to Device</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Adds OG AI directly to your phone's Home Screen or PC/Mac desktop. Launches instantly without browser address bars.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5">
                {isInstalled ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold py-1">
                    <Check className="w-4 h-4" /> Already Installed
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    disabled={isInstalling}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    {isInstalling ? 'Installing...' : isInstallable ? 'Install Now (1-Tap)' : isIOS ? 'Add to Home Screen (iOS)' : 'Install App Guide'}
                  </button>
                )}
              </div>
            </div>

            {/* 2. Instant Fullscreen App Mode */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-cyan-500/10 to-transparent border border-cyan-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-mono uppercase font-bold tracking-wider">
                    Instant Preview
                  </span>
                  <Maximize2 className="w-4 h-4 text-cyan-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Fullscreen App Shell</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Toggle immersive borderless mode right now. Eliminates browser chrome, toolbars, and tabs for an authentic app feel.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition active:scale-95"
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-4 h-4" /> Exit Fullscreen
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4" /> Launch Fullscreen Mode
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Key Native App Capabilities Grid */}
          <div className="my-5">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
              Included Native App Capabilities
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                <div className="mx-auto w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1.5">
                  <Wifi className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold block text-white">100% Offline</span>
                <span className="text-[9px] text-slate-400">Cached with SW</span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                <div className="mx-auto w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1.5">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold block text-white">Tactile Haptics</span>
                <span className="text-[9px] text-slate-400">12ms vibration</span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                <div className="mx-auto w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-1.5">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold block text-white">Cloud Sync</span>
                <span className="text-[9px] text-slate-400">Firestore parity</span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                <div className="mx-auto w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-1.5">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold block text-white">Ultra Fast</span>
                <span className="text-[9px] text-slate-400">&lt; 3MB footprint</span>
              </div>
            </div>
          </div>

          {/* Footer & Share */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleShareApp}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              {copiedLink ? 'Link Copied to Clipboard!' : 'Share App Link'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {showIOSGuide && (
        <IOSInstallGuideModal onClose={() => setShowIOSGuide(false)} />
      )}
    </>
  );
};
