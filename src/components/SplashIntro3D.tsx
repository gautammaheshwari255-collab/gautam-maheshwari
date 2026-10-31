import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Zap, ShieldCheck, ChevronRight, Play, Volume2, VolumeX } from 'lucide-react';
import { Og3DLogo } from './Og3DLogo';

interface SplashIntro3DProps {
  onComplete: () => void;
}

const TOTAL_DURATION_SECONDS = 5; // 5-second smooth 3D animation experience

export const SplashIntro3D: React.FC<SplashIntro3DProps> = ({ onComplete }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(TOTAL_DURATION_SECONDS);
  const completedRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFinish = () => {
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  // 5-second countdown timer safely decoupled from parent component state updates
  useEffect(() => {
    const finishTimeout = setTimeout(() => {
      handleFinish();
    }, TOTAL_DURATION_SECONDS * 1000);

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearTimeout(finishTimeout);
      clearInterval(interval);
    };
  }, [onComplete]);

  // Derived phase based on elapsed seconds
  const elapsed = TOTAL_DURATION_SECONDS - secondsRemaining;
  const currentPhase: 'igniting' | 'quantum-geometry' | 'neural-synthesis' | 'hologram-assemble' | 'ready' =
    elapsed < 1
      ? 'igniting'
      : elapsed < 2
      ? 'quantum-geometry'
      : elapsed < 3
      ? 'neural-synthesis'
      : elapsed < 4
      ? 'hologram-assemble'
      : 'ready';

  // Interactive 3D WebGL / Canvas Procedural Hologram & Particle Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 3D Point cloud forming the OG monogram & isometric orbital rings
    interface Point3D {
      x: number;
      y: number;
      z: number;
      color: string;
      size: number;
      orbitSpeed: number;
      angle: number;
      radius: number;
      ringIndex: number;
    }

    const colors = ['#06b6d4', '#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#a855f7'];
    const points: Point3D[] = [];

    // Create multi-layer orbital rings & volumetric quantum cage
    const totalPoints = 220;
    for (let i = 0; i < totalPoints; i++) {
      const ringIndex = i % 5;
      const radius = 110 + ringIndex * 38;
      const angle = (i / totalPoints) * Math.PI * 4;
      points.push({
        x: Math.cos(angle) * radius,
        y: (Math.random() - 0.5) * 60,
        z: Math.sin(angle) * radius,
        color: colors[i % colors.length],
        size: Math.random() * 2.5 + 1.2,
        orbitSpeed: (0.008 + ringIndex * 0.003) * (ringIndex % 2 === 0 ? 1 : -1),
        angle,
        radius,
        ringIndex
      });
    }

    let rotX = 0.35;
    let rotY = 0;
    let rotZ = 0;
    let tick = 0;

    const render = () => {
      tick++;
      rotY += 0.012;
      rotX = Math.sin(tick * 0.008) * 0.25 + 0.35;
      rotZ = Math.cos(tick * 0.006) * 0.15;

      // Dark cinematic canvas with motion trail
      ctx.fillStyle = 'rgba(7, 9, 14, 0.22)';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Draw glowing background nebula pulses
      const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.min(width, height) * 0.6);
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.09)');
      grad.addColorStop(0.4, 'rgba(245, 158, 11, 0.04)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Render 3D Wireframe Rings
      for (let r = 0; r < 4; r++) {
        const ringRad = 120 + r * 45;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotY * (r % 2 === 0 ? 0.6 : -0.6) + r * 0.4);
        ctx.scale(1, 0.38);

        ctx.strokeStyle = r === 1 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(6, 182, 212, 0.25)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash(r % 2 === 0 ? [8, 12] : [4, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, ringRad, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Render 3D rotating quantum particle cloud
      const fov = 400;
      points.forEach((p) => {
        p.angle += p.orbitSpeed;
        p.x = Math.cos(p.angle) * p.radius;
        p.z = Math.sin(p.angle) * p.radius;
        p.y += Math.sin(tick * 0.03 + p.angle) * 0.3;

        // 3D rotation matrix
        // Around Y
        let x1 = p.x * Math.cos(rotY) + p.z * Math.sin(rotY);
        let z1 = -p.x * Math.sin(rotY) + p.z * Math.cos(rotY);
        let y1 = p.y;

        // Around X
        let y2 = y1 * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = y1 * Math.sin(rotX) + z1 * Math.cos(rotX);
        let x2 = x1;

        // Perspective projection
        const scale = fov / (fov + z2 + 250);
        const projX = cx + x2 * scale;
        const projY = cy + y2 * scale;

        if (z2 + 250 > 10) {
          const alpha = Math.max(0.15, Math.min(1, (z2 + 200) / 350));
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha;
          ctx.shadowBlur = 12;
          ctx.shadowColor = p.color;

          ctx.beginPath();
          ctx.arc(projX, projY, Math.max(0.8, p.size * scale), 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  const progressPercent = Math.round(((TOTAL_DURATION_SECONDS - secondsRemaining) / TOTAL_DURATION_SECONDS) * 100);

  return (
    <div
      id="og-ai-3d-splash-screen"
      className="fixed inset-0 z-50 bg-[#07090e] text-white flex flex-col items-center justify-between p-6 overflow-hidden select-none"
    >
      {/* Background 3D Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Top Header info */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-mono text-xs tracking-widest text-cyan-400 font-bold uppercase">
            OG AI Quantum Core v4.5
          </span>
        </div>

        {/* Skip to Login button */}
        <button
          type="button"
          onClick={handleFinish}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-mono font-bold tracking-wider text-slate-200 hover:text-white transition-all cursor-pointer backdrop-blur-md"
        >
          <span>Skip Animation</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Central 3D Embossed Hologram Container */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto space-y-6">
        {/* The 3D Logo Artifact with 3D isometric perspective & floating glow */}
        <div className="relative group cursor-pointer" onClick={handleFinish}>
          {/* Volumetric ambient back-glow */}
          <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-cyan-500/30 via-amber-500/30 to-purple-600/30 blur-2xl animate-pulse pointer-events-none" />

          {/* 3D Glass Emblem with the vector OG AI artwork */}
          <div className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-3xl p-1.5 bg-gradient-to-br from-cyan-400 via-amber-400 to-purple-600 shadow-[0_0_60px_rgba(6,182,212,0.4)] transition-transform duration-700 hover:scale-105">
            <div className="w-full h-full rounded-[22px] overflow-hidden bg-[#0a0e19] flex items-center justify-center relative shadow-inner">
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <Og3DLogo size={96} variant="logo" animated glow />
                <span className="font-display font-black text-2xl text-white tracking-widest mt-3 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]">
                  OG AI<span className="text-cyan-400">.pro</span>
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 mt-1">
                  Quantum Core v4.5
                </span>
              </div>
              {/* Shimmer light pass */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-60 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Brand Monogram & Mission */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-amber-300 to-purple-400 drop-shadow-[0_0_25px_rgba(6,182,212,0.5)]">
              OG AI
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-widest">
              3D Quantum
            </span>
          </div>
          <p className="text-xs sm:text-sm font-mono text-slate-300 tracking-wide max-w-md">
            Next-Gen Autonomous Creative & Multimodal Neural Intelligence
          </p>
        </div>

        {/* Phase Badge */}
        <div className="px-4 py-1.5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md flex items-center gap-2 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span className="text-slate-300">Phase:</span>
          <span className="text-cyan-300 font-bold uppercase">
            {currentPhase === 'igniting' && 'Igniting Neural Accelerator'}
            {currentPhase === 'quantum-geometry' && 'Forming 3D Isometric Geometry'}
            {currentPhase === 'neural-synthesis' && 'Calibrating Multimodal Weights'}
            {currentPhase === 'hologram-assemble' && 'Assembling Holographic Core'}
            {currentPhase === 'ready' && 'Ready. Connecting Firebase Email Gateway...'}
          </span>
        </div>
      </div>

      {/* Bottom Progress Bar & 60s Countdown Telemetry */}
      <div className="relative z-10 w-full max-w-xl space-y-3 pb-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">{progressPercent}%</span>
            <span>Synthesized</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-300 font-bold">
            <span>00:{secondsRemaining.toString().padStart(2, '0')}</span>
            <span className="text-[10px] text-slate-400 font-normal">Remaining</span>
          </div>
        </div>

        {/* 3D Glowing Progress Line */}
        <div className="relative w-full h-2 rounded-full bg-white/10 overflow-hidden border border-white/10 p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-amber-400 to-purple-500 transition-all duration-1000 shadow-[0_0_15px_rgba(6,182,212,0.8)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
            Firebase Email + Password + Email OTP Verification
          </span>
          <button
            type="button"
            onClick={handleFinish}
            className="text-cyan-400 hover:text-cyan-300 underline font-mono cursor-pointer"
          >
            Direct Login →
          </button>
        </div>
      </div>
    </div>
  );
};
