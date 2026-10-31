import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Zap, ShieldCheck, Layers, Cpu, Eye, Copy, Check, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { Og3DLogo } from './Og3DLogo';

// =========================================================================
// 1. OG AI 3D CREDITS CURRENCY ICON (Embossed 3D OG Gold-Amber Emblem)
// =========================================================================

export interface OgooStarIconProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  animated?: boolean;
  glow?: boolean;
  className?: string;
  id?: string;
  showCore?: boolean;
}

export const OgooStarIcon: React.FC<OgooStarIconProps> = ({
  size = 'md',
  animated = false,
  glow = true,
  className = '',
  id
}) => {
  return (
    <Og3DLogo
      id={id}
      size={size}
      variant="credit"
      animated={animated}
      glow={glow}
      className={className}
    />
  );
};

export const OgooCreditsIcon = OgooStarIcon;

// =========================================================================
// 2. OG AI 3D CREDIT COIN VERSION (Interactive 3D Tilt + Cyber Rim)
// =========================================================================

export interface OgooStarCoinProps {
  size?: number;
  interactive?: boolean;
  glowing?: boolean;
  className?: string;
  onClick?: () => void;
}

export const OgooStarCoin: React.FC<OgooStarCoinProps> = ({
  size = 140,
  interactive = true,
  glowing = true,
  className = '',
  onClick
}) => {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const maxTilt = 18;
    setRotate({
      x: (-y / (rect.height / 2)) * maxTilt,
      y: (x / (rect.width / 2)) * maxTilt
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center select-none cursor-pointer transition-transform duration-200 ease-out ${className}`}
      style={{
        width: size,
        height: size,
        perspective: 800
      }}
    >
      {/* Dynamic 3D Transform Container */}
      <div
        className="relative w-full h-full rounded-full transition-transform duration-150 ease-out flex items-center justify-center"
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale(${isHovered ? 1.05 : 1})`,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Outer Rotating Cybernetic HUD Ring */}
        <div
          className="absolute -inset-2 rounded-full border border-dashed border-amber-400/40 pointer-events-none animate-ring-slow"
          style={{ opacity: isHovered ? 0.9 : 0.5 }}
        />

        {/* Counter-rotating cyan telemetry ring */}
        <div
          className="absolute -inset-4 rounded-full border border-cyan-400/30 border-t-cyan-400 border-r-transparent pointer-events-none animate-ring-reverse"
          style={{ opacity: isHovered ? 0.8 : 0.3 }}
        />

        {/* Ambient Neon Volumetric Backglow */}
        {glowing && (
          <div
            className="absolute -inset-6 bg-gradient-to-tr from-amber-500/30 via-yellow-400/20 to-cyan-400/30 rounded-full blur-xl pointer-events-none transition-opacity duration-300"
            style={{ opacity: isHovered ? 1 : 0.6 }}
          />
        )}

        {/* The 3D High-Def Coin Render */}
        <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-amber-400/60 shadow-2xl bg-gradient-to-br from-amber-950/80 via-black to-yellow-950/80 flex items-center justify-center">
          <OgooStarIcon size={typeof size === 'number' ? size * 0.7 : 70} animated glow />

          {/* Holographic Specular Sheen Sweep */}
          <div
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent pointer-events-none transform -translate-x-full transition-transform duration-700 ease-in-out"
            style={{
              transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)'
            }}
          />

          {/* Micro AI Currency Brand Watermark */}
          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center pointer-events-none">
            <span className="px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-amber-400/50 text-[9px] font-mono font-extrabold text-amber-300 tracking-wider shadow-lg">
              OG AI 3D CREDIT COIN
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 3. OGOO ⭐ LARGE PREMIUM VERSION (Top Up Page Hero & Energy Crystal)
// =========================================================================

export interface OgooStarHeroCrystalProps {
  balance?: number;
  onTopUpClick?: () => void;
  className?: string;
}

export const OgooStarHeroCrystal: React.FC<OgooStarHeroCrystalProps> = ({
  balance = 400,
  onTopUpClick,
  className = ''
}) => {
  const [soundActive, setSoundActive] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);

  // Play subtle quantum crystallization chime with Web Audio API
  const triggerAudioChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playTone = (freq: number, delay: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + delay + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur);
      };

      playTone(587.33, 0, 0.4); // D5
      playTone(880.0, 0.08, 0.5); // A5
      playTone(1174.66, 0.16, 0.7); // D6
    } catch {}
  };

  const handleCrystalClick = () => {
    setPulseCount((p) => p + 1);
    if (soundActive) {
      triggerAudioChime();
    }
  };

  return (
    <div
      id="ogoo-star-hero-crystal"
      className={`relative w-full max-w-4xl mx-auto glass-panel p-6 md:p-10 rounded-3xl border border-amber-500/30 overflow-hidden shadow-2xl ${className}`}
    >
      {/* Background Volumetric Nebula */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-bl from-amber-500/20 via-yellow-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#f59e0b 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12">
        {/* Left Column: Visual Centerpiece (Floating 3D Crystal Star + Holographic HUD) */}
        <div className="relative flex flex-col items-center justify-center group">
          {/* Ambient Rotating Rings */}
          <div className="absolute w-72 h-72 rounded-full border border-amber-400/20 border-t-amber-400/80 animate-ring-slow pointer-events-none" />
          <div className="absolute w-80 h-80 rounded-full border border-cyan-400/25 border-b-cyan-400/90 animate-ring-reverse pointer-events-none" />
          <div className="absolute w-96 h-96 rounded-full border border-dashed border-amber-500/15 pointer-events-none animate-pulse" />

          {/* Floating Levitation Container */}
          <div
            onClick={handleCrystalClick}
            className="relative cursor-pointer transition-transform active:scale-95 animate-star-levitate"
            title="Click to energize OGOO Star AI Core!"
          >
            {/* The Big 3D Crystal Asset */}
            <div className="relative w-56 h-56 md:w-64 md:h-64 rounded-3xl p-1 bg-gradient-to-tr from-amber-500/40 via-cyan-400/30 to-amber-300/60 shadow-2xl neon-glow-gold">
              <div className="w-full h-full rounded-[22px] overflow-hidden bg-[#07090e] relative flex flex-col items-center justify-center p-4">
                <OgooStarIcon size={110} animated glow />
                <span className="font-mono text-xs font-bold text-amber-300 mt-2 tracking-wider">
                  OGOO QUANTUM CORE
                </span>

                {/* Shimmer sweep overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-200/15 to-transparent pointer-events-none" />

                {/* Floating Micro-Badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-cyan-400/40 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>CORE: 99.98% COHERENCE</span>
                </div>
              </div>
            </div>

            {/* Click ripple pulse effect indicator */}
            {pulseCount > 0 && (
              <span className="absolute -top-3 -right-3 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black animate-bounce shadow-lg shadow-amber-500/50">
                +ENERGY {pulseCount}
              </span>
            )}
          </div>

          {/* Interactive audio & inspection toggle */}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const next = !soundActive;
                setSoundActive(next);
                if (next) triggerAudioChime();
              }}
              className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-all"
            >
              {soundActive ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quantum Resonance: ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sound Chime: OFF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Currency Status & Metrics */}
        <div className="flex-1 space-y-5 text-center lg:text-left">
          {/* Brand Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold tracking-wider uppercase">
            <OgooStarIcon size={16} glow={false} />
            <span>Official OGOO.com AI Currency</span>
          </div>

          <h2 className="font-display font-black text-3xl md:text-4xl text-white tracking-tight leading-tight">
            OGOO <span className="text-amber-400 neon-text-gradient">⭐ Star AI Currency</span>
          </h2>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-xl">
            OGOO Stars are the quantum fuel of the OGOO AI ecosystem. Engineered as an advanced neural energy crystal with
            a photonic AI core, each Star powers multi-modal image synthesis, 4K cinematic video render, voice cloning, and
            infinite creativity.
          </p>

          {/* Balance Spotlight Pill */}
          <div className="p-4 md:p-5 rounded-2xl bg-[#090d18]/90 border border-amber-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40">
                <OgooStarIcon size={32} animated={true} />
              </div>
              <div className="text-left">
                <div className="text-xs font-mono uppercase text-slate-400 font-bold">Your Available Balance</div>
                <div className="font-display font-black text-2xl md:text-3xl text-amber-300 flex items-center gap-2">
                  <span>{balance.toLocaleString()}</span>
                  <span className="text-sm font-mono text-amber-400 font-semibold">⭐ Stars</span>
                </div>
              </div>
            </div>

            {onTopUpClick && (
              <button
                type="button"
                onClick={onTopUpClick}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-500 active:scale-95 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Top Up ⭐ Stars Now</span>
              </button>
            )}
          </div>

          {/* Technical Specs Micro-Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-left">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Currency Symbol</span>
              <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1 mt-0.5">
                <OgooStarIcon size={14} glow={false} />
                <span>OGOO ⭐</span>
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Backing Asset</span>
              <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1 mt-0.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Neural GPU Flops</span>
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Deduction Rule</span>
              <span className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Deduct On Fail</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 4. OGOO ⭐ STAR INTERACTIVE SHOWCASE MODAL / SUITE
// =========================================================================

export interface OgooStarShowcaseProps {
  isOpen: boolean;
  onClose: () => void;
  balance?: number;
}

export const OgooStarShowcaseModal: React.FC<OgooStarShowcaseProps> = ({
  isOpen,
  onClose,
  balance = 400
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'icon' | 'coin' | 'hero'>('all');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const svgSampleCode = `<OgooStarIcon size="md" animated={true} glow={true} />`;

  const copyCode = () => {
    navigator.clipboard.writeText(svgSampleCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div
      id="ogoo-star-showcase-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in"
    >
      <div className="relative w-full max-w-3xl glass-panel p-6 md:p-8 rounded-3xl border border-amber-500/40 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/40">
              <OgooStarIcon size={24} animated={true} />
            </div>
            <div>
              <h3 className="font-display font-black text-xl text-white flex items-center gap-2">
                OGOO ⭐ Star AI Currency Design System
              </h3>
              <p className="text-xs text-slate-400">Official multi-scale asset design specification</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Variations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Small UI Icon Version */}
          <div className="p-5 rounded-2xl bg-[#0a0e19]/90 border border-white/10 space-y-4 flex flex-col items-center text-center">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
              1. UI Icon Version (14px - 32px)
            </span>
            <div className="h-28 flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <OgooStarIcon size={16} glow={true} />
                <span className="text-[10px] font-mono text-slate-400">16px</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <OgooStarIcon size={24} glow={true} animated={true} />
                <span className="text-[10px] font-mono text-slate-400">24px</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <OgooStarIcon size={36} glow={true} />
                <span className="text-[10px] font-mono text-slate-400">36px</span>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Optimized for top header, sidebar navigation, buttons, and transaction tables.
            </p>
          </div>

          {/* Card 2: 3D Star Coin Version */}
          <div className="p-5 rounded-2xl bg-[#0a0e19]/90 border border-amber-500/30 space-y-4 flex flex-col items-center text-center">
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
              2. 3D Star Coin (Interactive)
            </span>
            <div className="h-28 flex items-center justify-center">
              <OgooStarCoin size={90} interactive={true} />
            </div>
            <p className="text-xs text-slate-400">
              Tactile cybernetic coin with physics 3D tilt, metallic bezel, and neon halo.
            </p>
          </div>

          {/* Card 3: Large Premium Energy Crystal */}
          <div className="p-5 rounded-2xl bg-[#0a0e19]/90 border border-yellow-500/30 space-y-4 flex flex-col items-center text-center">
            <span className="text-[10px] font-mono text-yellow-400 font-bold uppercase tracking-wider">
              3. Large Top Up Hero Crystal
            </span>
            <div className="h-28 flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-amber-400/50 shadow-lg shadow-amber-500/30 bg-gradient-to-br from-amber-950/60 to-black flex items-center justify-center">
                <OgooStarIcon size={48} animated glow />
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Centerpiece for Top Up plans, subscription passes, and high-impact hero displays.
            </p>
          </div>
        </div>

        {/* Embed & Usage Row */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-mono text-xs text-slate-300">
            <span className="text-amber-400 font-bold">Standard Component:</span>{' '}
            <code className="bg-white/10 px-2 py-0.5 rounded text-amber-200">{svgSampleCode}</code>
          </div>

          <button
            type="button"
            onClick={copyCode}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Component Code</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-mono text-slate-500">OGOO ⭐ Star Currency v2.0 • Quantum Powered</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-bold transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
