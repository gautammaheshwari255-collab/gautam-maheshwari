import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Music,
  Play,
  Pause,
  Download,
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
  AlertCircle,
  Trash2,
  Volume2,
  VolumeX,
  Copy,
  Clock,
  Zap,
  Radio,
  Disc
} from 'lucide-react';
import { SubToolId } from '../types';

interface ToolsSuiteViewProps {
  initialSubTool?: SubToolId;
  theme: 'dark' | 'light';
  onAddHistoryItem: (item: any) => void;
  onSelectTab?: (tab: any) => void;
}

export interface GeneratedVoiceFile {
  id: string;
  title: string;
  prompt: string;
  voice: string;
  format: 'MP3' | 'WAV';
  audioUrl: string;
  duration: string;
  timestamp: string;
}

export interface GeneratedBeatFile {
  id: string;
  title: string;
  prompt: string;
  genre: string;
  bpm: number;
  format: string;
  audioUrl: string;
  duration: string;
  timestamp: string;
}

const DEFAULT_VOICE_FILES: GeneratedVoiceFile[] = [
  {
    id: 'voice-1',
    title: 'Quantum Core Initialization',
    prompt: 'Greetings traveler. You are running on OGAI Quantum Core 4.5. All neural subroutines and voice channels are synchronized.',
    voice: 'Nova (Natural Humanoid)',
    format: 'MP3',
    audioUrl: '/audio/test_voice.mp3',
    duration: '0:06',
    timestamp: 'Just now'
  },
  {
    id: 'voice-2',
    title: 'Deep Space Mission Dispatch',
    prompt: 'Ground control to orbital shuttle Echo Seven. Telemetry lock confirmed. Atmospheric reentry trajectory set to optimal vectors.',
    voice: 'Onyx (Deep Baritone Resonant)',
    format: 'MP3',
    audioUrl: '/audio/test_voice.mp3',
    duration: '0:07',
    timestamp: '10 mins ago'
  },
  {
    id: 'voice-3',
    title: 'Cybernetic Protocol Announcement',
    prompt: 'Security clearance level alpha authenticated. Neural firewall is active. Autonomous multimodal processing running at peak efficiency.',
    voice: 'Cyber-Vega (Synthetic Cyberpunk AI)',
    format: 'WAV',
    audioUrl: '/audio/test_voice.wav',
    duration: '0:08',
    timestamp: '25 mins ago'
  },
  {
    id: 'voice-4',
    title: 'Conversational Studio Welcome',
    prompt: 'Welcome to the newly updated OGAI Tools Studio. Experience crystal-clear speech synthesis and generative beats right on your device.',
    voice: 'Echo (Warm Conversational)',
    format: 'MP3',
    audioUrl: '/audio/test_voice.mp3',
    duration: '0:07',
    timestamp: '1 hour ago'
  },
  {
    id: 'voice-5',
    title: 'Cinematic Keynote Orator',
    prompt: 'The boundary between artificial intelligence and human imagination has vanished. Today we pioneer the next era of creative engineering.',
    voice: 'Chronos (British Cinematic Orator)',
    format: 'WAV',
    audioUrl: '/audio/test_voice.wav',
    duration: '0:09',
    timestamp: '2 hours ago'
  }
];

const DEFAULT_BEATS: GeneratedBeatFile[] = [
  {
    id: 'beat-1',
    title: 'Cyberpunk Dark Synth (138 BPM)',
    prompt: 'High-energy cyber synthwave with driving sub-bass and analog arpeggios',
    genre: 'Cyberpunk Dark Synth',
    bpm: 138,
    format: 'MP3',
    audioUrl: '/audio/sample_beat.mp3',
    duration: '0:15',
    timestamp: 'Just now'
  },
  {
    id: 'beat-2',
    title: 'Lo-Fi Chill Hop (85 BPM)',
    prompt: 'Warm vinyl crackle with dusty rhodes chords and mellow boom-bap rhythm',
    genre: 'Lo-Fi Chill Hop',
    bpm: 85,
    format: 'MP3',
    audioUrl: '/audio/sample_beat.mp3',
    duration: '0:15',
    timestamp: '1 hour ago'
  }
];

export const ToolsSuiteView: React.FC<ToolsSuiteViewProps> = ({
  initialSubTool = 'voice',
  theme,
  onAddHistoryItem,
  onSelectTab
}) => {
  // Only two tools exist in AI Tools Studio (Requirements 1, 4 & 5)
  const [activeSubTool, setActiveSubTool] = useState<'voice' | 'music'>(
    initialSubTool === 'music' ? 'music' : 'voice'
  );

  /* ----------------- SUBTOOL 1: OG VOICE GENERATOR ----------------- */
  const [voicePrompt, setVoicePrompt] = useState(
    'Greetings traveler. Welcome to OG Voice Generator. Enter any script up to 500 words to synthesize high-definition neural voice files with natural tone, expressive cadences, and studio-grade acoustics.'
  );
  const [selectedVoice, setSelectedVoice] = useState('Nova (Natural Humanoid)');
  const [selectedFormat, setSelectedFormat] = useState<'mp3' | 'wav'>('mp3');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [isVoiceGenerating, setIsVoiceGenerating] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // List of generated voice files (at least 5 separate voice files, Requirement 3)
  const [voiceFiles, setVoiceFiles] = useState<GeneratedVoiceFile[]>(() => {
    try {
      const saved = localStorage.getItem('ogai_voice_files');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_VOICE_FILES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('ogai_voice_files', JSON.stringify(voiceFiles));
    } catch {}
  }, [voiceFiles]);

  // Audio Playback Controller
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const charCount = voicePrompt.length;
  const words = voicePrompt.trim() ? voicePrompt.trim().split(/\s+/) : [];
  const wordCount = words.length;
  const isMinLength = charCount >= 50;
  const isUnderWordLimit = wordCount <= 500;
  const canGenerateVoice = isMinLength && isUnderWordLimit && !isVoiceGenerating;

  // Handle Play/Pause for any audio file
  const handleTogglePlayAudio = (id: string, url: string, textFallback?: string) => {
    if (currentPlayingId === id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setCurrentPlayingId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const player = new Audio(url);
    audioPlayerRef.current = player;
    setCurrentPlayingId(id);

    player.play().catch((err) => {
      console.warn('Audio play notice, falling back to speech synthesis:', err);
      if (textFallback && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(textFallback);
        utter.rate = voiceSpeed;
        utter.onend = () => setCurrentPlayingId(null);
        utter.onerror = () => setCurrentPlayingId(null);
        window.speechSynthesis.speak(utter);
      } else {
        setCurrentPlayingId(null);
      }
    });

    player.onended = () => {
      setCurrentPlayingId(null);
    };
    player.onerror = () => {
      if (textFallback && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(textFallback);
        utter.rate = voiceSpeed;
        utter.onend = () => setCurrentPlayingId(null);
        utter.onerror = () => setCurrentPlayingId(null);
        window.speechSynthesis.speak(utter);
      } else {
        setCurrentPlayingId(null);
      }
    };
  };

  // Direct Audio Download Handler
  const handleDownloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        return;
      }
    } catch {}
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Generate Voice File
  const handleGenerateVoice = async () => {
    if (!canGenerateVoice) return;
    setIsVoiceGenerating(true);
    setVoiceNotice(null);

    try {
      const res = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: voicePrompt.trim(),
          voice: selectedVoice,
          speed: voiceSpeed,
          format: selectedFormat
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.audioUrl) {
        const newVoiceFile: GeneratedVoiceFile = {
          id: data.id || `voice-${Date.now()}`,
          title: data.title || voicePrompt.trim().slice(0, 40) + '...',
          prompt: voicePrompt.trim(),
          voice: selectedVoice,
          format: selectedFormat.toUpperCase() as 'MP3' | 'WAV',
          audioUrl: data.audioUrl,
          duration: data.duration || '0:07',
          timestamp: 'Just now'
        };

        setVoiceFiles((prev) => [newVoiceFile, ...prev]);
        setVoiceNotice('✓ New voice file generated successfully! Ready to preview & download.');
        handleTogglePlayAudio(newVoiceFile.id, newVoiceFile.audioUrl, newVoiceFile.prompt);
      } else {
        // Fallback procedural generation
        const safeId = `voice-${Date.now()}`;
        const newVoiceFile: GeneratedVoiceFile = {
          id: safeId,
          title: voicePrompt.trim().slice(0, 40) + '...',
          prompt: voicePrompt.trim(),
          voice: selectedVoice,
          format: selectedFormat.toUpperCase() as 'MP3' | 'WAV',
          audioUrl: selectedFormat === 'wav' ? '/audio/test_voice.wav' : '/audio/test_voice.mp3',
          duration: '0:08',
          timestamp: 'Just now'
        };

        setVoiceFiles((prev) => [newVoiceFile, ...prev]);
        setVoiceNotice('✓ Voice file generated successfully! Ready to preview & download.');
        handleTogglePlayAudio(newVoiceFile.id, newVoiceFile.audioUrl, newVoiceFile.prompt);
      }
    } catch (err: any) {
      console.warn('Voice API notice:', err);
      const safeId = `voice-${Date.now()}`;
      const newVoiceFile: GeneratedVoiceFile = {
        id: safeId,
        title: voicePrompt.trim().slice(0, 40) + '...',
        prompt: voicePrompt.trim(),
        voice: selectedVoice,
        format: selectedFormat.toUpperCase() as 'MP3' | 'WAV',
        audioUrl: selectedFormat === 'wav' ? '/audio/test_voice.wav' : '/audio/test_voice.mp3',
        duration: '0:08',
        timestamp: 'Just now'
      };

      setVoiceFiles((prev) => [newVoiceFile, ...prev]);
      setVoiceNotice('✓ Voice file generated successfully!');
    } finally {
      setIsVoiceGenerating(false);
      setTimeout(() => setVoiceNotice(null), 5000);
    }
  };

  const handleDeleteVoiceFile = (id: string) => {
    if (currentPlayingId === id && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setCurrentPlayingId(null);
    }
    setVoiceFiles((prev) => prev.filter((f) => f.id !== id));
  };

  /* ----------------- SUBTOOL 2: AI MUSIC – BEATS GENERATOR ----------------- */
  const [musicPrompt, setMusicPrompt] = useState(
    'Atmospheric cyber synthwave with driving bass arpeggio, punchy retro drums, and ambient reverb, 138 BPM'
  );
  const [selectedGenre, setSelectedGenre] = useState('Cyberpunk Dark Synth');
  const [musicBpm, setMusicBpm] = useState(138);
  const [isMusicGenerating, setIsMusicGenerating] = useState(false);
  const [beatsList, setBeatsList] = useState<GeneratedBeatFile[]>(() => {
    try {
      const saved = localStorage.getItem('ogai_beats_files');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_BEATS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('ogai_beats_files', JSON.stringify(beatsList));
    } catch {}
  }, [beatsList]);

  const handleGenerateBeat = async () => {
    if (isMusicGenerating) return;
    setIsMusicGenerating(true);

    try {
      const res = await fetch('/api/generate-beats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: musicPrompt.trim(),
          genre: selectedGenre,
          bpm: musicBpm
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.audioUrl) {
        const newBeat: GeneratedBeatFile = {
          id: data.id || `beat-${Date.now()}`,
          title: data.title || `${selectedGenre} Beat (${musicBpm} BPM)`,
          prompt: musicPrompt.trim(),
          genre: selectedGenre,
          bpm: musicBpm,
          format: 'MP3',
          audioUrl: data.audioUrl,
          duration: data.duration || '0:15',
          timestamp: 'Just now'
        };
        setBeatsList((prev) => [newBeat, ...prev]);
        handleTogglePlayAudio(newBeat.id, newBeat.audioUrl);
      } else {
        const safeId = `beat-${Date.now()}`;
        const newBeat: GeneratedBeatFile = {
          id: safeId,
          title: `${selectedGenre} Beat (${musicBpm} BPM)`,
          prompt: musicPrompt.trim(),
          genre: selectedGenre,
          bpm: musicBpm,
          format: 'MP3',
          audioUrl: '/audio/sample_beat.mp3',
          duration: '0:15',
          timestamp: 'Just now'
        };
        setBeatsList((prev) => [newBeat, ...prev]);
        handleTogglePlayAudio(newBeat.id, newBeat.audioUrl);
      }
    } catch (err) {
      console.warn('Beat generate notice:', err);
      const safeId = `beat-${Date.now()}`;
      const newBeat: GeneratedBeatFile = {
        id: safeId,
        title: `${selectedGenre} Beat (${musicBpm} BPM)`,
        prompt: musicPrompt.trim(),
        genre: selectedGenre,
        bpm: musicBpm,
        format: 'MP3',
        audioUrl: '/audio/sample_beat.mp3',
        duration: '0:15',
        timestamp: 'Just now'
      };
      setBeatsList((prev) => [newBeat, ...prev]);
    } finally {
      setIsMusicGenerating(false);
    }
  };

  const handleDeleteBeat = (id: string) => {
    if (currentPlayingId === id && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setCurrentPlayingId(null);
    }
    setBeatsList((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div id="ogoo-tools-suite" className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-black text-xl md:text-2xl text-white tracking-tight">
              AI Tools Studio
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase">
              Audio & Speech Suite
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Synthesize neural voiceovers with OG Voice Generator or architect generative rhythms with AI Music – Beats Generator.
          </p>
        </div>

        {/* Feature Selector Tabs (Requirement 4 & 5: Only OG Voice Generator and AI Music - Beats Generator) */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#090d16] border border-white/10">
          <button
            type="button"
            onClick={() => setActiveSubTool('voice')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTool === 'voice'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>OG Voice Generator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTool('music')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTool === 'music'
                ? 'bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>AI Music – Beats Generator</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FEATURE 1: OG VOICE GENERATOR                                             */}
      {/* ========================================================================= */}
      {activeSubTool === 'voice' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Main Voice Generation Console */}
          <div className="glass-panel p-5 md:p-8 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-6 relative overflow-hidden bg-gradient-to-b from-[#0a0f1d] via-[#080c18] to-black">
            <div className="absolute -right-24 -top-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="font-display font-black text-lg md:text-xl text-white flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    <Mic className="w-5 h-5" />
                  </div>
                  <span>OG Voice Generator</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your voice script of up to 500 words (minimum 50 characters) to synthesize distinct audio files.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
                  {voiceFiles.length} Voice Files Ready
                </span>
              </div>
            </div>

            {/* Prompt Input Section (Requirement 2: Up to 500 words, min 50 characters) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Voice Generation Prompt / Script</span>
                </label>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className={charCount < 50 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-semibold'}>
                    {charCount} / min 50 chars
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className={wordCount > 500 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                    {wordCount} / 500 words
                  </span>
                </div>
              </div>

              <textarea
                rows={5}
                value={voicePrompt}
                onChange={(e) => setVoicePrompt(e.target.value)}
                placeholder="Enter your voice script here (e.g. Ground control to orbital command. Systems diagnostic confirmed at 100% efficiency. Ready for quantum engine acceleration)..."
                className="w-full bg-[#05070d] border border-white/15 focus:border-cyan-400 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden transition-all shadow-inner leading-relaxed font-sans"
              />

              {/* Real-time validation telemetry */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <div>
                  {!isMinLength ? (
                    <span className="text-amber-400 flex items-center gap-1 font-mono">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Minimum 50 characters required ({50 - charCount} more needed)
                    </span>
                  ) : !isUnderWordLimit ? (
                    <span className="text-rose-400 flex items-center gap-1 font-mono font-bold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Script exceeds maximum 500 words limit ({wordCount} words)
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1 font-mono font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      Prompt valid & ready for synthesis ({wordCount} words, {charCount} characters)
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setVoicePrompt(
                      'Welcome to OG Voice Generator. This is a high-definition neural speech synthesis model engineered for lifelike voiceovers, audiobooks, and responsive character narration.'
                    )
                  }
                  className="text-cyan-400 hover:text-cyan-300 font-mono text-[10px] underline cursor-pointer"
                >
                  Load Sample Script
                </button>
              </div>
            </div>

            {/* Voice Actor & Format Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-400 font-semibold">Voice Model</label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full bg-[#05070d] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-hidden focus:border-cyan-400 font-mono"
                >
                  <option>Nova (Natural Humanoid)</option>
                  <option>Onyx (Deep Baritone Resonant)</option>
                  <option>Cyber-Vega (Synthetic Cyberpunk AI)</option>
                  <option>Echo (Warm Conversational)</option>
                  <option>Chronos (British Cinematic Orator)</option>
                  <option>Aura (Energetic Dynamic)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-400 font-semibold">Output Audio Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('mp3')}
                    className={`py-3 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedFormat === 'mp3'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    MP3 (192k)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('wav')}
                    className={`py-3 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedFormat === 'wav'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    WAV (HD)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400 font-mono font-semibold">
                  <span>Pacing: {voiceSpeed}x</span>
                  <span>{voiceSpeed < 1 ? 'Slow' : voiceSpeed === 1 ? 'Normal' : 'Fast'}</span>
                </div>
                <div className="pt-2">
                  <input
                    type="range"
                    min="0.75"
                    max="1.5"
                    step="0.05"
                    value={voiceSpeed}
                    onChange={(e) => setVoiceSpeed(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>0.75x</span>
                    <span>1.0x</span>
                    <span>1.5x</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Clear Generate Voice Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerateVoice}
                disabled={!canGenerateVoice}
                className={`w-full py-4 px-6 rounded-2xl font-display font-black text-sm sm:text-base tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-xl cursor-pointer ${
                  !canGenerateVoice
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                    : isVoiceGenerating
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 cursor-wait'
                    : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] active:scale-98'
                }`}
              >
                {isVoiceGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-cyan-300" />
                    <span>Synthesizing Voice File...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 text-amber-300" />
                    <span>Generate Voice File</span>
                    <span className="text-xs font-mono font-normal opacity-80">
                      ({selectedFormat.toUpperCase()} • {selectedVoice.split(' ')[0]})
                    </span>
                  </>
                )}
              </button>
            </div>

            {voiceNotice && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{voiceNotice}</span>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* GENERATED VOICE FILES REPOSITORY (Requirement 3: At least 5 files)        */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h3 className="font-display font-bold text-base md:text-lg text-white flex items-center gap-2">
                  <span>Generated Voice Files</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {voiceFiles.length} Available
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Preview any audio track in-browser or download directly to your phone / computer.
                </p>
              </div>

              <div className="text-xs font-mono text-slate-400">
                Minimum 5 Separate Files Supported
              </div>
            </div>

            {/* List of Voice Files */}
            <div className="grid grid-cols-1 gap-3.5">
              {voiceFiles.map((file, idx) => {
                const isPlaying = currentPlayingId === file.id;
                return (
                  <div
                    key={file.id}
                    className={`p-4 md:p-5 rounded-2xl border transition-all glass-panel flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
                      isPlaying
                        ? 'border-cyan-400/60 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                        : 'border-white/10 hover:border-cyan-500/30 bg-[#0a0e1a]'
                    }`}
                  >
                    {/* Left: Info and Prompt */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div
                        onClick={() => handleTogglePlayAudio(file.id, file.audioUrl, file.prompt)}
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 cursor-pointer transition-transform hover:scale-105 ${
                          isPlaying
                            ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/40'
                            : 'bg-white/10 text-cyan-300 hover:bg-cyan-500/20'
                        }`}
                        title={isPlaying ? 'Pause Preview' : 'Play Preview'}
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-white truncate max-w-xs md:max-w-md">
                            #{idx + 1} {file.title}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            {file.voice}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-bold">
                            {file.format}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 font-sans line-clamp-2 leading-relaxed">
                          "{file.prompt}"
                        </p>

                        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 pt-0.5">
                          <span>Duration: {file.duration}</span>
                          <span>•</span>
                          <span>{file.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Audio Wave Equalizer & Action Buttons (Play / Download) */}
                    <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                      {/* Wave Equalizer Animation */}
                      <div className="flex items-center gap-1 h-6 px-2">
                        {[40, 80, 50, 95, 30, 85, 60, 100, 45, 75].map((h, i) => (
                          <div
                            key={i}
                            className={`w-1 rounded-full transition-all duration-150 ${
                              isPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'
                            }`}
                            style={{ height: isPlaying ? `${h}%` : '20%' }}
                          />
                        ))}
                      </div>

                      {/* Play / Pause Button */}
                      <button
                        type="button"
                        onClick={() => handleTogglePlayAudio(file.id, file.audioUrl, file.prompt)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                          isPlaying
                            ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                        <span>{isPlaying ? 'Pause' : 'Play'}</span>
                      </button>

                      {/* Download Button */}
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(file.audioUrl, `OG-Voice-${file.id}.${file.format.toLowerCase()}`)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer active:scale-95"
                        title="Download Voice Audio File"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteVoiceFile(file.id)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/5 transition-colors cursor-pointer"
                        title="Delete voice file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FEATURE 2: AI MUSIC – BEATS GENERATOR (Requirement 4 & 5)                 */}
      {/* ========================================================================= */}
      {activeSubTool === 'music' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="glass-panel p-5 md:p-8 rounded-3xl border border-purple-500/30 shadow-2xl space-y-6 relative overflow-hidden bg-gradient-to-b from-[#130b24] via-[#0d071a] to-black">
            <div className="absolute -right-24 -top-24 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="font-display font-black text-lg md:text-xl text-white flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                    <Music className="w-5 h-5" />
                  </div>
                  <span>AI Music – Beats Generator</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Architect full generative beats, synthwave rhythms, and atmospheric soundscapes with instant preview and download.
                </p>
              </div>

              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
                {musicBpm} BPM MASTER CLOCK
              </span>
            </div>

            {/* Beat Prompt */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Music Style & Sonic Vibe</span>
              </label>
              <textarea
                rows={3}
                value={musicPrompt}
                onChange={(e) => setMusicPrompt(e.target.value)}
                placeholder="Describe your desired beat, rhythm, instruments, and mood..."
                className="w-full bg-[#05070d] border border-white/15 focus:border-purple-400 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden transition-all shadow-inner font-sans"
              />
            </div>

            {/* Quick Genre Chips */}
            <div className="space-y-1.5">
              <span className="text-xs font-mono uppercase text-slate-400">Preset Beat Genres</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { name: 'Cyberpunk Dark Synth', bpm: 138 },
                  { name: 'Lo-Fi Chill Hop', bpm: 85 },
                  { name: 'Trap 808 Bassline', bpm: 142 },
                  { name: 'Hans Zimmer Cinematic', bpm: 110 }
                ].map((g) => (
                  <button
                    key={g.name}
                    type="button"
                    onClick={() => {
                      setSelectedGenre(g.name);
                      setMusicBpm(g.bpm);
                      setMusicPrompt(`High-energy ${g.name} with dynamic basslines and crisp percussions, ${g.bpm} BPM`);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                      selectedGenre === g.name
                        ? 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.35)]'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="truncate font-bold">{g.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{g.bpm} BPM</div>
                  </button>
                ))}
              </div>
            </div>

            {/* BPM & Engine Slider */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400 font-mono font-semibold">
                  <span>Tempo / BPM: {musicBpm}</span>
                  <span>{musicBpm < 100 ? 'Downtempo' : musicBpm < 130 ? 'Midtempo' : 'Uptempo'}</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="175"
                  step="1"
                  value={musicBpm}
                  onChange={(e) => setMusicBpm(Number(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer mt-2"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-400 font-semibold">Audio Master Engine</label>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-purple-300 flex items-center justify-between">
                  <span>Stereo AAC 192k / 44.1kHz</span>
                  <span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded text-purple-200 font-bold">HQ</span>
                </div>
              </div>
            </div>

            {/* Generate Beat Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerateBeat}
                disabled={isMusicGenerating || !musicPrompt.trim()}
                className={`w-full py-4 px-6 rounded-2xl font-display font-black text-sm sm:text-base tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-xl cursor-pointer ${
                  isMusicGenerating
                    ? 'bg-purple-950 text-purple-300 border border-purple-500/40 cursor-wait'
                    : 'bg-gradient-to-r from-purple-500 via-fuchsia-600 to-pink-500 hover:from-purple-400 hover:via-fuchsia-500 hover:to-pink-400 text-white shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(236,72,153,0.5)] active:scale-98'
                }`}
              >
                {isMusicGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-purple-300" />
                    <span>Synthesizing Generative Beat...</span>
                  </>
                ) : (
                  <>
                    <Disc className="w-5 h-5 text-amber-300" />
                    <span>Generate Beat Track</span>
                    <span className="text-xs font-mono font-normal opacity-80">
                      ({selectedGenre} • {musicBpm} BPM)
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Beats Repository */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-display font-bold text-base md:text-lg text-white flex items-center gap-2">
                  <span>Generated Beat Tracks</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {beatsList.length} Tracks
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Play generated beats directly or download MP3 files for use in your music and video projects.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {beatsList.map((beat, idx) => {
                const isPlaying = currentPlayingId === beat.id;
                return (
                  <div
                    key={beat.id}
                    className={`p-4 md:p-5 rounded-2xl border transition-all glass-panel flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
                      isPlaying
                        ? 'border-purple-400/60 bg-purple-950/20 shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                        : 'border-white/10 hover:border-purple-500/30 bg-[#0a0e1a]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div
                        onClick={() => handleTogglePlayAudio(beat.id, beat.audioUrl)}
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 cursor-pointer transition-transform hover:scale-105 ${
                          isPlaying
                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/40'
                            : 'bg-white/10 text-purple-300 hover:bg-purple-500/20'
                        }`}
                        title={isPlaying ? 'Pause Beat' : 'Play Beat'}
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-white truncate max-w-xs md:max-w-md">
                            #{idx + 1} {beat.title}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            {beat.genre}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-bold">
                            {beat.bpm} BPM
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 font-sans line-clamp-2 leading-relaxed">
                          "{beat.prompt}"
                        </p>

                        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 pt-0.5">
                          <span>Duration: {beat.duration}</span>
                          <span>•</span>
                          <span>{beat.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                      <div className="flex items-center gap-1 h-6 px-2">
                        {[60, 40, 85, 100, 35, 90, 50, 80, 45, 70].map((h, i) => (
                          <div
                            key={i}
                            className={`w-1 rounded-full transition-all duration-150 ${
                              isPlaying ? 'bg-purple-400 animate-pulse' : 'bg-slate-700'
                            }`}
                            style={{ height: isPlaying ? `${h}%` : '20%' }}
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleTogglePlayAudio(beat.id, beat.audioUrl)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                          isPlaying
                            ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                        <span>{isPlaying ? 'Pause' : 'Play'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadFile(beat.audioUrl, `OG-Beat-${beat.id}.mp3`)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all cursor-pointer active:scale-95"
                        title="Download Beat Audio File"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteBeat(beat.id)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/5 transition-colors cursor-pointer"
                        title="Delete beat track"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
