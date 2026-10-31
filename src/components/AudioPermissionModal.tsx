import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, Check, Music, ShieldCheck, Film } from 'lucide-react';
import { Og3DLogo } from './Og3DLogo';

interface AudioPermissionModalProps {
  onChoice: (allowed: boolean) => void;
}

export const STORAGE_KEY_AUDIO_PERMISSION = 'ogoo_audio_permission_choice';

export const AudioPermissionModal: React.FC<AudioPermissionModalProps> = ({ onChoice }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  useEffect(() => {
    try {
      const savedChoice = localStorage.getItem(STORAGE_KEY_AUDIO_PERMISSION);
      if (!savedChoice) {
        // Small delay so page renders gracefully before modal opens
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleSelect = (allowed: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY_AUDIO_PERMISSION, allowed ? 'allowed' : 'muted');
    } catch {}

    setAnimatingOut(true);
    setTimeout(() => {
      setIsOpen(false);
      onChoice(allowed);
    }, 280);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${animatingOut ? 'opacity-0' : 'opacity-100'}`}>
      <div
        className={`relative w-full max-w-md rounded-3xl bg-[#090d18]/95 border border-cyan-500/40 p-6 md:p-8 shadow-[0_0_50px_rgba(6,182,212,0.35)] overflow-hidden transition-all duration-300 transform ${
          animatingOut ? 'scale-95 translate-y-2' : 'scale-100 translate-y-0'
        }`}
      >
        {/* Ambient Top Radiant Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-48 bg-gradient-to-b from-cyan-500/30 via-purple-500/20 to-transparent blur-3xl pointer-events-none" />

        {/* Header with 3D Logo */}
        <div className="flex flex-col items-center text-center space-y-3 relative z-10">
          <div className="relative mb-2">
            <Og3DLogo size="xl" glow={true} animated={true} />
            <span className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/40 border border-[#090d18]">
              <Music className="w-3.5 h-3.5" />
            </span>
          </div>

          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Immersive Sound Architecture
          </span>

          <h3 className="font-display font-black text-xl md:text-2xl text-white tracking-tight">
            Enable Sound & Music Experience
          </h3>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans max-w-sm">
            OG AI synthesizes high-fidelity ambient music, cinematic audio tracks, and voice. Allow audio to enjoy automatic sound playback for AI-generated videos.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-2.5 my-6 relative z-10 text-left">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-300 shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-white">Auto Video Audio</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Plays motion clips with clear sound</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-300 shrink-0">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-white">Audio Synthesis</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Natural voice & synth generation</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 relative z-10">
          <button
            type="button"
            id="audio-permission-allow-btn"
            onClick={() => handleSelect(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-98"
          >
            <Volume2 className="w-4 h-4" />
            <span>Allow Sound & Auto-Play Audio</span>
          </button>

          <button
            type="button"
            id="audio-permission-mute-btn"
            onClick={() => handleSelect(false)}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 font-mono text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Keep Muted for Now</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[10px] text-slate-500 font-mono">
            Your preference is saved locally. You will not be asked again.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AudioPermissionModal;
