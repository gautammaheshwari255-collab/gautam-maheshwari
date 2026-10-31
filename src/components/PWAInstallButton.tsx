import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  Sparkles,
  Maximize2,
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'banner' | 'settings' | 'compact';
  onOpenConvertModal?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  onOpenConvertModal
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else if (onOpenConvertModal) {
      onOpenConvertModal();
    } else {
      setShowIOSGuide(true);
    }
  };

  // If already running inside standalone app mode
  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>OG AI is running in Native Standalone App Mode</span>
        </div>
      );
    }
    if (variant === 'header') {
      return (
        <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-1 text-[11px] font-mono text-cyan-400">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>App Mode</span>
        </div>
      );
    }
    return null;
  }

  // Header button style
  if (variant === 'header') {
    return (
      <>
        <button
          id="pwa-header-install-btn"
          type="button"
          onClick={handleInstallClick}
          className="relative group overflow-hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-blue-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 border border-amber-400/40 text-xs font-semibold text-amber-300 hover:text-white transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-95"
          title="Convert Web to App (Install PWA)"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">App</span>
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        </button>

        {showIOSGuide && (
          <IOSInstallGuideModal onClose={() => setShowIOSGuide(false)} />
        )}
      </>
    );
  }

  // Sidebar button style
  if (variant === 'sidebar') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-cyan-500/15 hover:from-amber-500/25 hover:to-cyan-500/25 border border-amber-500/30 text-xs font-medium text-amber-300 transition-all group"
        >
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
            <Download className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-semibold text-white">Convert to App</span>
            <span className="text-[10px] text-slate-400">Install to Home Screen</span>
          </div>
        </button>

        {showIOSGuide && (
          <IOSInstallGuideModal onClose={() => setShowIOSGuide(false)} />
        )}
      </>
    );
  }

  // Settings button style
  if (variant === 'settings') {
    return (
      <>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-500/30 text-amber-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                Convert Web to Native App
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono uppercase tracking-wider">
                  PWA Ready
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Install OG AI on Android, iOS, Windows, Mac or Chromebook for standalone launch & offline access.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            {isInstalling ? 'Installing...' : 'Install OG AI App'}
          </button>
        </div>

        {showIOSGuide && (
          <IOSInstallGuideModal onClose={() => setShowIOSGuide(false)} />
        )}
      </>
    );
  }

  // Banner / Quick action style
  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-black shadow-md hover:bg-amber-400 transition"
      >
        <Download className="w-4 h-4" />
        Convert to App
      </button>

      {showIOSGuide && (
        <IOSInstallGuideModal onClose={() => setShowIOSGuide(false)} />
      )}
    </>
  );
};

// Modal specifically providing iOS Safari / General Add to Home Screen instructions
export const IOSInstallGuideModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-[#0c101c] border border-amber-500/30 p-6 shadow-2xl relative text-left">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-cyan-500 p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-[#07090e] rounded-[14px] flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Convert Web to App</h3>
            <p className="text-xs text-amber-400/90 font-mono">Install OG AI to your Home Screen</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-5">
          Follow these quick steps to install OG AI as a standalone application on your device with full offline capabilities:
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 font-bold text-xs">
              1
            </div>
            <div className="text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                Tap the Share icon <Share className="w-3.5 h-3.5 text-cyan-400 inline" />
              </span>
              <p className="text-slate-400 mt-0.5">
                In Safari (iOS) or browser toolbar, tap the Share or Menu (⋮) button.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-bold text-xs">
              2
            </div>
            <div className="text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                Select "Add to Home Screen" <PlusSquare className="w-3.5 h-3.5 text-amber-400 inline" />
              </span>
              <p className="text-slate-400 mt-0.5">
                Scroll through options and select <strong>Add to Home Screen</strong> or <strong>Install OG AI</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs">
              3
            </div>
            <div className="text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                Launch from Home Screen <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
              </span>
              <p className="text-slate-400 mt-0.5">
                Tap the OG AI icon on your device home screen to run in borderless standalone app mode!
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 active:scale-98 transition"
        >
          Got It, Thanks!
        </button>
      </div>
    </div>
  );
};
