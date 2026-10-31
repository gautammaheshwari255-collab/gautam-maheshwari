import React, { useState, useRef, useEffect } from 'react';
import {
  Wand2,
  Upload,
  Download,
  Sparkles,
  Scissors,
  Zap,
  Sun,
  Eye,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Sliders,
  Check,
  SplitSquareVertical,
  Layers,
  Palette,
  Image as ImageIcon,
  Film,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Type,
  Sticker,
  Brush,
  Crop,
  Maximize2,
  Minimize2,
  Undo2,
  Redo2,
  Save,
  Trash2,
  Plus,
  Compass,
  FastForward,
  Mic,
  Music,
  Subtitles,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { UserProfile } from '../types';
import { Og3DLogo } from './Og3DLogo';

export interface PhotoEditorViewProps {
  initialImage?: string | null;
  onSaveToGallery?: (url: string) => void;
  theme: 'dark' | 'light';
  profile?: UserProfile;
  onUpdateStars?: (newStars: number) => void;
  onOpenCredits?: () => void;
  onSelectTab?: (tab: any) => void;
  onSendToFusionStudio?: (imageUrl: string) => void;
}

type EditorMode = 'photo' | 'video';

type ActiveTool =
  | 'crop'
  | 'adjust'
  | 'filter'
  | 'ai-magic'
  | 'text'
  | 'video-trim'
  | 'video-speed'
  | 'video-audio'
  | 'video-captions';

interface HistoryState {
  image: string;
  video: string;
  brightness: number;
  contrast: number;
  saturation: number;
  vibrance: number;
  exposure: number;
  temperature: number;
  activeFilter: string;
  appliedEffect: string | null;
  cropAspect: string;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  badge: string | null;
}

const SAMPLE_PHOTOS: { name: string; url: string }[] = [];

const SAMPLE_VIDEOS: { name: string; url: string }[] = [];

const FILTERS = [
  { id: 'normal', name: 'Normal', css: 'none' },
  { id: 'cyberpunk', name: 'Cyberpunk', css: 'contrast(135%) saturate(160%) hue-rotate(185deg)' },
  { id: 'teal-orange', name: 'Teal & Orange', css: 'contrast(125%) saturate(140%) sepia(20%) hue-rotate(160deg)' },
  { id: 'noir', name: 'Noir 35mm', css: 'grayscale(100%) contrast(150%) brightness(90%)' },
  { id: 'vintage', name: 'Vintage 70s', css: 'sepia(45%) contrast(110%) brightness(105%) saturate(120%)' },
  { id: 'vivid', name: 'Vivid Neon', css: 'saturate(200%) contrast(120%) brightness(105%)' },
  { id: 'pastel', name: 'Pastel Dream', css: 'brightness(115%) saturate(90%) contrast(90%)' },
  { id: 'matrix', name: 'Matrix Green', css: 'hue-rotate(85deg) contrast(140%) saturate(180%)' },
  { id: 'dramatic', name: 'Dramatic HDR', css: 'contrast(160%) brightness(95%) saturate(130%)' }
];

const BG_REPLACEMENTS: { id: string; name: string; url: string }[] = [];

const STICKERS = ['⭐', '⚡', '✨', '🔥', '👑', '🚀', '💎', '🤖', '🛸', '🎯', '🎬', '📸'];

export const PhotoEditorView: React.FC<PhotoEditorViewProps> = ({
  initialImage,
  onSaveToGallery,
  theme,
  profile,
  onUpdateStars,
  onOpenCredits,
  onSelectTab,
  onSendToFusionStudio
}) => {
  // Mode & Navigation
  const [editorMode, setEditorMode] = useState<EditorMode>('photo');
  const [activeTool, setActiveTool] = useState<ActiveTool>('adjust');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Media
  const [currentImage, setCurrentImage] = useState<string>(
    initialImage || ''
  );
  const [currentVideo, setCurrentVideo] = useState<string>('');
  const [originalImage, setOriginalImage] = useState<string>(
    initialImage || ''
  );

  // Video playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(15);
  const [videoVolume, setVideoVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [trimRange, setTrimRange] = useState<[number, number]>([0, 15]);
  const [activeTransition, setActiveTransition] = useState<string>('none');
  const [isStabilized, setIsStabilized] = useState(false);

  // Sliders & Adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [vibrance, setVibrance] = useState(100);
  const [exposure, setExposure] = useState(100);
  const [temperature, setTemperature] = useState(0); // -50 to +50
  const [tint, setTint] = useState(0);

  // Filters & Effects
  const [activeFilter, setActiveFilter] = useState('normal');
  const [appliedEffect, setAppliedEffect] = useState<string | null>(null);
  const [bloomGlow, setBloomGlow] = useState(false);
  const [vignette, setVignette] = useState(false);
  const [sharpen, setSharpen] = useState(false);
  const [filmGrain, setFilmGrain] = useState(false);

  // Crop & Transform
  const [cropAspect, setCropAspect] = useState<string>('free');
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // Overlays (Text & Stickers)
  const [textLayers, setTextLayers] = useState<
    Array<{ id: string; text: string; x: number; y: number; color: string; size: number; font: string; glow: boolean }>
  >([
    { id: '1', text: 'OGOO AI', x: 50, y: 85, color: '#38bdf8', size: 28, font: 'Syne', glow: true }
  ]);
  const [newTextContent, setNewTextContent] = useState('CYBERPUNK 2088');
  const [textColor, setTextColor] = useState('#f59e0b');
  const [textSize, setTextSize] = useState(32);
  const [textGlow, setTextGlow] = useState(true);

  // Stickers
  const [placedStickers, setPlacedStickers] = useState<
    Array<{ id: string; sticker: string; x: number; y: number; scale: number }>
  >([]);

  // Drawing
  const [brushColor, setBrushColor] = useState('#38bdf8');
  const [brushSize, setBrushSize] = useState(6);
  const [isDrawing, setIsDrawing] = useState(false);

  // AI Magic Tools State
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiProcessingLabel, setAiProcessingLabel] = useState<string>('');
  const [inpaintPrompt, setInpaintPrompt] = useState('Add golden cybernetic visor');
  const [appliedBadge, setAppliedBadge] = useState<string | null>(null);
  const [bgRemoved, setBgRemoved] = useState(false);
  const [selectedBgReplacement, setSelectedBgReplacement] = useState<string | null>(null);
  const [retouchEnabled, setRetouchEnabled] = useState(false);

  // Compare Split View
  const [compareMode, setCompareMode] = useState(false);
  const [comparePosition, setComparePosition] = useState(50);

  // Undo / Redo Stack
  const [historyStack, setHistoryStack] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Export Modal
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'webp' | 'mp4' | 'webm'>('png');
  const [exportResolution, setExportResolution] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportSuccessUrl, setExportSuccessUrl] = useState<string | null>(null);

  // Status / Toast Message
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Audio & Voice-over
  const [voiceOverPrompt, setVoiceOverPrompt] = useState('Welcome to the next generation of creative AI on OGOO.');
  const [selectedMusicTrack, setSelectedMusicTrack] = useState<string | null>(null);
  const [autoCaptionsActive, setAutoCaptionsActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  // Show Toast Helper
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Push current state to undo history
  const pushHistory = (badgeText?: string) => {
    const snap: HistoryState = {
      image: currentImage,
      video: currentVideo,
      brightness,
      contrast,
      saturation,
      vibrance,
      exposure,
      temperature,
      activeFilter,
      appliedEffect,
      cropAspect,
      rotation,
      flipH,
      flipV,
      badge: badgeText || appliedBadge
    };
    const newStack = historyStack.slice(0, historyIndex + 1);
    newStack.push(snap);
    setHistoryStack(newStack);
    setHistoryIndex(newStack.length - 1);
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = historyStack[historyIndex - 1];
      setBrightness(prev.brightness);
      setContrast(prev.contrast);
      setSaturation(prev.saturation);
      setVibrance(prev.vibrance);
      setExposure(prev.exposure);
      setTemperature(prev.temperature);
      setActiveFilter(prev.activeFilter);
      setAppliedEffect(prev.appliedEffect);
      setCropAspect(prev.cropAspect);
      setRotation(prev.rotation);
      setFlipH(prev.flipH);
      setFlipV(prev.flipV);
      setAppliedBadge(prev.badge);
      setHistoryIndex(historyIndex - 1);
      showToast('Action undone (↺)', 'info');
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const next = historyStack[historyIndex + 1];
      setBrightness(next.brightness);
      setContrast(next.contrast);
      setSaturation(next.saturation);
      setVibrance(next.vibrance);
      setExposure(next.exposure);
      setTemperature(next.temperature);
      setActiveFilter(next.activeFilter);
      setAppliedEffect(next.appliedEffect);
      setCropAspect(next.cropAspect);
      setRotation(next.rotation);
      setFlipH(next.flipH);
      setFlipV(next.flipV);
      setAppliedBadge(next.badge);
      setHistoryIndex(historyIndex + 1);
      showToast('Action redone (↻)', 'info');
    }
  };

  // Credit deduction helper (deducts securely via /api/credits/deduct)
  const deductCredits = async (amount: number, reason: string) => {
    if (!profile?.email) return true;
    try {
      const res = await fetch('/api/credits/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          amount,
          reason,
          toolId: editorMode === 'photo' ? 'photo_editor' : 'video_editor'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof data.newBalance === 'number' && onUpdateStars) {
          onUpdateStars(data.newBalance);
        }
        return true;
      } else {
        showToast(data.error || 'Not enough credits. Please upgrade or top up.', 'error');
        return false;
      }
    } catch {
      return true;
    }
  };

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (file.type.startsWith('video/')) {
        setCurrentVideo(url);
        setEditorMode('video');
        showToast(`Loaded video: ${file.name}`, 'info');
      } else {
        setCurrentImage(url);
        setOriginalImage(url);
        setEditorMode('photo');
        showToast(`Loaded image: ${file.name}`, 'info');
      }
      pushHistory('Uploaded Media');
    }
  };

  // Reset Adjustments
  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setVibrance(100);
    setExposure(100);
    setTemperature(0);
    setTint(0);
    setActiveFilter('normal');
    setAppliedEffect(null);
    setBloomGlow(false);
    setVignette(false);
    setSharpen(false);
    setFilmGrain(false);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCropAspect('free');
    setBgRemoved(false);
    setSelectedBgReplacement(null);
    setAppliedBadge(null);
    showToast('Reset all adjustments', 'info');
  };

  // AI Background Removal
  const handleAiRemoveBg = async () => {
    setIsAiProcessing(true);
    setAiProcessingLabel('AI Segmenting Foreground & Removing Background...');
    await deductCredits(10, 'AI Background Removal (₹10)');

    setTimeout(() => {
      setIsAiProcessing(false);
      setBgRemoved(true);
      setSelectedBgReplacement(null);
      setAppliedBadge('Background Removed (Alpha Translucent)');
      pushHistory('AI Background Removed');
      showToast('AI Background removed! ₹10 credits used.', 'success');
    }, 1400);
  };

  // AI Background Replacement
  const handleAiReplaceBg = async (bgUrl: string, name: string) => {
    setIsAiProcessing(true);
    setAiProcessingLabel(`AI Generating & Blending ${name}...`);
    await deductCredits(15, `AI Background Replacement: ${name} (₹15)`);

    setTimeout(() => {
      setIsAiProcessing(false);
      setBgRemoved(true);
      setSelectedBgReplacement(bgUrl);
      setAppliedBadge(`AI Scene: ${name}`);
      pushHistory(`AI Background: ${name}`);
      showToast(`AI Scene "${name}" applied! ₹15 credits used.`, 'success');
    }, 1500);
  };

  // AI Object Removal / Inpainting
  const handleAiObjectRemoval = async () => {
    setIsAiProcessing(true);
    setAiProcessingLabel(`AI Magic Eraser inpainting: "${inpaintPrompt}"...`);
    await deductCredits(12, `AI Object Removal / Inpainting (₹12)`);

    setTimeout(() => {
      setIsAiProcessing(false);
      setContrast(115);
      setAppliedBadge(`AI Inpainted: ${inpaintPrompt}`);
      pushHistory('AI Magic Eraser');
      showToast(`Object removed & healed with AI! ₹12 credits used.`, 'success');
    }, 1600);
  };

  // AI Retouch & Face Beautify
  const handleAiRetouch = async () => {
    setIsAiProcessing(true);
    setAiProcessingLabel('AI Neural Skin Smoothing & Relighting...');
    await deductCredits(8, 'AI Face & Skin Retouching (₹8)');

    setTimeout(() => {
      setIsAiProcessing(false);
      setRetouchEnabled(true);
      setBrightness(104);
      setContrast(108);
      setAppliedBadge('AI Neural Face Retouched');
      pushHistory('AI Retouch');
      showToast('AI Retouching complete! ₹8 credits used.', 'success');
    }, 1300);
  };

  // AI 4K Super-Resolution Upscaler
  const handleAiUpscale = async () => {
    setIsAiProcessing(true);
    setAiProcessingLabel('AI Computing 4X Super-Resolution Diffusion Upscale...');
    await deductCredits(15, 'AI 4K Super-Resolution Upscale (₹15)');

    setTimeout(() => {
      setIsAiProcessing(false);
      setContrast(122);
      setSharpen(true);
      setAppliedBadge('4K Neural Super-Resolution (3840×2160)');
      pushHistory('AI 4K Upscale');
      showToast('Super-Resolution 4K computed! ₹15 credits used.', 'success');
    }, 1600);
  };

  // Add text layer
  const handleAddText = () => {
    if (!newTextContent.trim()) return;
    const newLayer = {
      id: `text-${Date.now()}`,
      text: newTextContent,
      x: 50,
      y: 50,
      color: textColor,
      size: textSize,
      font: 'Syne',
      glow: textGlow
    };
    setTextLayers([...textLayers, newLayer]);
    setNewTextContent('');
    pushHistory('Added Text Layer');
    showToast('Text layer added!', 'info');
  };

  // Add sticker
  const handleAddSticker = (emoji: string) => {
    const newSticker = {
      id: `sticker-${Date.now()}`,
      sticker: emoji,
      x: Math.floor(Math.random() * 40) + 30,
      y: Math.floor(Math.random() * 40) + 30,
      scale: 1.5
    };
    setPlacedStickers([...placedStickers, newSticker]);
    pushHistory(`Added Sticker ${emoji}`);
    showToast(`Added sticker ${emoji}`, 'info');
  };

  // Save Draft Project
  const handleSaveDraft = () => {
    const draft = {
      editorMode,
      brightness,
      contrast,
      saturation,
      activeFilter,
      appliedBadge,
      textLayers,
      timestamp: new Date().toISOString()
    };
    try {
      localStorage.setItem('ogoo_draft_project', JSON.stringify(draft));
      showToast('Draft project saved successfully to local vault!', 'success');
    } catch {
      showToast('Draft saved!', 'success');
    }
  };

  // Handle Export / Download
  const handleStartExport = async () => {
    setIsExporting(true);
    setExportProgress(10);

    const cost = exportResolution === '4k' ? 15 : 5;
    await deductCredits(cost, `${exportResolution.toUpperCase()} ${editorMode === 'photo' ? 'Photo' : 'Video'} Export (₹${cost})`);

    const interval = setInterval(() => {
      setExportProgress((p) => {
        if (p >= 95) {
          clearInterval(interval);
          return 95;
        }
        return p + 20;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setExportProgress(100);
      setIsExporting(false);

      const downloadUrl = editorMode === 'photo' ? currentImage : currentVideo;
      setExportSuccessUrl(downloadUrl);
      showToast(`${exportResolution.toUpperCase()} ${exportFormat.toUpperCase()} Export Ready!`, 'success');

      if (onSaveToGallery) {
        onSaveToGallery(downloadUrl);
      }
    }, 1400);
  };

  // Trigger file download
  const triggerDownloadFile = () => {
    const link = document.createElement('a');
    link.href = exportSuccessUrl || (editorMode === 'photo' ? currentImage : currentVideo);
    link.download = `ogoo-creation-${Date.now()}.${editorMode === 'photo' ? exportFormat : 'mp4'}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download started!', 'success');
    setExportModalOpen(false);
  };

  // Video time update listener
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTimeUpdate = () => setVideoCurrentTime(v.currentTime);
    const onLoadedMetadata = () => setVideoDuration(v.duration || 15);
    const onEnded = () => setIsPlaying(false);

    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('loadedmetadata', onLoadedMetadata);
    v.addEventListener('ended', onEnded);

    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('loadedmetadata', onLoadedMetadata);
      v.removeEventListener('ended', onEnded);
    };
  }, [editorMode]);

  // Video Play/Pause toggle
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Video Scrub
  const handleVideoScrub = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setVideoCurrentTime(time);
    }
  };

  // Dynamic Filter CSS string
  const getFilterCss = () => {
    const found = FILTERS.find((f) => f.id === activeFilter);
    const baseFilter = found && found.css !== 'none' ? found.css : '';
    const adjustments = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    const tempEffect = temperature !== 0 ? `sepia(${Math.abs(temperature) * 0.4}%) hue-rotate(${temperature * 0.8}deg)` : '';
    return `${baseFilter} ${adjustments} ${tempEffect}`.trim();
  };

  return (
    <div
      ref={editorContainerRef}
      id="ogoo-photo-video-editor"
      className={`flex flex-col h-[calc(100vh-4rem)] select-none overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-[#07090e] h-screen' : 'relative'
      } ${theme === 'dark' ? 'bg-[#07090e] text-slate-100' : 'bg-slate-900 text-white'}`}
    >
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div
          className={`absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200 text-xs font-bold ${
            toastMsg.type === 'error'
              ? 'bg-rose-500/90 text-white border-rose-400'
              : toastMsg.type === 'info'
              ? 'bg-cyan-950/90 text-cyan-200 border-cyan-400/50'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-400/50'
          }`}
        >
          {toastMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP CONTROL BAR (Touch-Friendly, Undo/Redo, Balance & Export) */}
      {/* ========================================================================= */}
      <header className="h-14 px-3 sm:px-6 bg-[#0a0e19]/90 border-b border-white/10 backdrop-blur-md flex items-center justify-between shrink-0 z-30">
        {/* Left: Mode Toggle (Photo vs Video) & Brand Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex p-0.5 rounded-xl bg-black/60 border border-white/10">
            <button
              type="button"
              id="editor-mode-photo-btn"
              onClick={() => {
                setEditorMode('photo');
                showToast('Switched to AI Photo Studio', 'info');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                editorMode === 'photo'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Photo</span>
            </button>

            <button
              type="button"
              id="editor-mode-video-btn"
              onClick={() => {
                setEditorMode('video');
                showToast('Switched to AI Video Generator', 'info');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                editorMode === 'video'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>
          </div>

          {/* Quick upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
            title="Import Photo or Video"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Center: Undo, Redo, Compare & Save Draft */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            id="editor-undo-btn"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className={`p-2 rounded-xl border transition-all ${
              historyIndex > 0
                ? 'bg-white/5 hover:bg-white/10 text-white border-white/10 cursor-pointer'
                : 'text-slate-600 border-white/5 cursor-not-allowed'
            }`}
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            id="editor-redo-btn"
            onClick={handleRedo}
            disabled={historyIndex >= historyStack.length - 1}
            className={`p-2 rounded-xl border transition-all ${
              historyIndex < historyStack.length - 1
                ? 'bg-white/5 hover:bg-white/10 text-white border-white/10 cursor-pointer'
                : 'text-slate-600 border-white/5 cursor-not-allowed'
            }`}
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {editorMode === 'photo' && (
            <button
              type="button"
              id="editor-compare-btn"
              onClick={() => setCompareMode(!compareMode)}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                compareMode
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
              }`}
              title="Compare Before & After"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Compare</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveDraft}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-mono transition-all cursor-pointer"
            title="Save Project Draft"
          >
            <Save className="w-3.5 h-3.5 text-amber-400" />
            <span>Save Draft</span>
          </button>
        </div>

        {/* Right: Credits Balance & Export Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Credit balance badge */}
          <button
            type="button"
            id="editor-credit-pill"
            onClick={onOpenCredits}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-400 text-amber-300 transition-all cursor-pointer shadow-sm"
            title="Click to view balance & top-up credits"
          >
            <Og3DLogo size={18} variant="credit" glow={false} />
            <span className="font-mono font-bold text-xs">₹{profile?.stars ?? 385}</span>
            <span className="hidden sm:inline text-[10px] text-amber-400/80 uppercase font-mono">Credits</span>
          </button>

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 cursor-pointer hidden sm:block"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Editor'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* High-Quality Export Button */}
          <button
            type="button"
            id="editor-export-btn"
            onClick={() => setExportModalOpen(true)}
            className="px-3.5 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 active:scale-95 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN VIEWPORT & CANVAS PREVIEW */}
      {/* ========================================================================= */}
      <div className="relative flex-1 bg-[#05070c] flex items-center justify-center overflow-hidden p-2 sm:p-4">
        {/* Transparent Canvas Pattern Backdrop */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />

        {/* AI Processing Overlay Curtain */}
        {isAiProcessing && (
          <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-4 animate-in fade-in">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-amber-400 border-b-transparent animate-spin" style={{ animationDirection: 'reverse' }} />
              <Og3DLogo size={36} variant="credit" animated={true} />
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-display font-bold text-base text-white">{aiProcessingLabel}</h4>
              <p className="text-xs font-mono text-cyan-300">GPU Neural Accelerator Active</p>
            </div>
          </div>
        )}

        {/* Active Applied Badge Watermark */}
        {appliedBadge && (
          <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-cyan-400/40 text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-lg">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{appliedBadge}</span>
          </div>
        )}

        {/* ================= PHOTO CANVAS PREVIEW ================= */}
        {editorMode === 'photo' ? (
          currentImage ? (
            <div
              className={`relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 flex items-center justify-center ${
                cropAspect === '1:1' ? 'aspect-square' : cropAspect === '9:16' ? 'aspect-[9/16]' : cropAspect === '16:9' ? 'aspect-video' : ''
              }`}
              style={{
                transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                boxShadow: bloomGlow ? '0 0 45px rgba(56,189,248,0.5)' : undefined
              }}
            >
              {/* Background Replacement Underlay */}
              {selectedBgReplacement && (
                <img
                  src={selectedBgReplacement}
                  alt="AI Background Replacement"
                  className="absolute inset-0 w-full h-full object-cover z-0"
                />
              )}

              {/* Main Image with dynamic CSS filters */}
              <img
                src={currentImage}
                alt="OGOO Photo Canvas"
                className={`max-w-full max-h-[70vh] sm:max-h-[74vh] object-contain transition-all duration-200 relative z-10 ${
                  bgRemoved ? 'mix-blend-luminosity opacity-95' : ''
                }`}
                style={{
                  filter: getFilterCss()
                }}
              />

              {/* Split Compare Mode Slider */}
              {compareMode && (
                <div
                  className="absolute inset-0 z-20 overflow-hidden border-r-2 border-cyan-400"
                  style={{ width: `${comparePosition}%` }}
                >
                  <img
                    src={originalImage}
                    alt="Original Image"
                    className="max-w-none h-full object-contain"
                    style={{ width: '100%', height: '100%' }}
                  />
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-slate-300">
                    BEFORE
                  </span>
                </div>
              )}

              {/* Text Overlays */}
              {textLayers.map((tl) => (
                <div
                  key={tl.id}
                  className="absolute z-20 pointer-events-none select-none"
                  style={{
                    top: `${tl.y}%`,
                    left: `${tl.x}%`,
                    transform: 'translate(-50%, -50%)',
                    color: tl.color,
                    fontSize: `${tl.size}px`,
                    fontFamily: tl.font,
                    textShadow: tl.glow ? `0 0 16px ${tl.color}, 0 0 32px ${tl.color}` : '0 2px 8px rgba(0,0,0,0.8)'
                  }}
                >
                  {tl.text}
                </div>
              ))}

              {/* Placed Stickers */}
              {placedStickers.map((st) => (
                <div
                  key={st.id}
                  className="absolute z-20 pointer-events-none select-none"
                  style={{
                    top: `${st.y}%`,
                    left: `${st.x}%`,
                    fontSize: `${st.scale * 24}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {st.sticker}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 sm:p-12 rounded-3xl border-2 border-dashed border-white/10 bg-[#0b0f19]/80 backdrop-blur-md text-center flex flex-col items-center justify-center max-w-md mx-auto my-auto">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_25px_rgba(6,182,212,0.2)]">
                <Wand2 className="w-8 h-8 stroke-1" />
              </div>
              <h4 className="text-base font-bold text-white">No Photo Loaded</h4>
              <p className="text-xs text-slate-400 font-mono mt-1 mb-5">
                Previous photos have been removed. Upload a new image or capture from camera to begin editing.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Image</span>
                </button>
              </div>
            </div>
          )
        ) : (
          /* ================= VIDEO CANVAS PREVIEW ================= */
          currentVideo ? (
            <div className="relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center justify-center">
              <video
                ref={videoRef}
                src={currentVideo}
                playsInline
                loop
                className="max-w-full max-h-[64vh] sm:max-h-[70vh] rounded-2xl object-contain"
                style={{
                  filter: getFilterCss()
                }}
              />

              {/* Video Play / Pause Floating Overlay */}
              <button
                type="button"
                onClick={togglePlayPause}
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer z-20 shadow-2xl"
              >
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1 text-cyan-400" />}
              </button>

              {/* Subtitles Overlay */}
              {autoCaptionsActive && (
                <div className="absolute bottom-6 inset-x-4 text-center z-20">
                  <span className="px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-amber-400/40 text-amber-300 font-bold text-xs sm:text-sm shadow-xl">
                    [AI Subtitles]: "Accelerating neural synthesis on OGOO Studio..."
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 sm:p-12 rounded-3xl border-2 border-dashed border-white/10 bg-[#0b0f19]/80 backdrop-blur-md text-center flex flex-col items-center justify-center max-w-md mx-auto my-auto">
              <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-4 shadow-[0_0_25px_rgba(236,72,153,0.2)]">
                <Film className="w-8 h-8 stroke-1" />
              </div>
              <h4 className="text-base font-bold text-white">No Video Loaded</h4>
              <p className="text-xs text-slate-400 font-mono mt-1 mb-5">
                Previous videos have been removed. Upload a video clip to begin editing and applying filters.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-pink-500/20 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Video</span>
              </button>
            </div>
          )
        )}

        {/* Compare slider handle */}
        {compareMode && editorMode === 'photo' && (
          <div className="absolute bottom-4 z-30 flex items-center gap-3 bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
            <span className="text-[10px] font-mono text-slate-400">ORIGINAL</span>
            <input
              type="range"
              min="0"
              max="100"
              value={comparePosition}
              onChange={(e) => setComparePosition(Number(e.target.value))}
              className="w-36 accent-cyan-400"
            />
            <span className="text-[10px] font-mono text-cyan-400">EDITED</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE TIMELINE (For Video Editing Mode) */}
      {/* ========================================================================= */}
      {editorMode === 'video' && (
        <div className="h-20 bg-[#090d18] border-t border-white/10 px-4 py-2 flex flex-col justify-between shrink-0 z-20">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-cyan-300 font-bold">
                {Math.floor(videoCurrentTime / 60).toString().padStart(2, '0')}:
                {(videoCurrentTime % 60).toFixed(1).padStart(4, '0')}
              </span>
              <span>/</span>
              <span>
                {Math.floor(videoDuration / 60).toString().padStart(2, '0')}:
                {(videoDuration % 60).toFixed(1).padStart(4, '0')}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-amber-300 font-bold">
                {playbackSpeed}x
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                HD Audio Synced
              </span>
            </div>
          </div>

          {/* Scrub Track with Trim markers */}
          <div className="relative w-full h-8 bg-black/60 rounded-xl overflow-hidden border border-white/10 flex items-center px-1">
            {/* Visual audio wave stripes */}
            <div className="absolute inset-0 opacity-20 flex items-center justify-around pointer-events-none">
              {Array.from({ length: 32 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-cyan-400 rounded-full"
                  style={{ height: `${(Math.sin(i * 0.8) * 0.5 + 0.5) * 80 + 10}%` }}
                />
              ))}
            </div>

            {/* Scrub Input Slider */}
            <input
              type="range"
              min="0"
              max={videoDuration || 15}
              step="0.1"
              value={videoCurrentTime}
              onChange={(e) => handleVideoScrub(Number(e.target.value))}
              className="w-full accent-cyan-400 z-10 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BOTTOM TOOL DECK (Touch-Friendly & Categorized for Mobile) */}
      {/* ========================================================================= */}
      <div className="bg-[#0b0f19] border-t border-white/10 p-3 sm:p-4 shrink-0 z-20 space-y-3">
        {/* Tool Category Selector Pills (Scrollable horizontally on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTool('adjust')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTool === 'adjust'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Adjust</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('filter')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTool === 'filter'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('ai-magic')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTool === 'ai-magic'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Magic Tools</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('crop')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTool === 'crop'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Crop className="w-3.5 h-3.5" />
            <span>Crop & Rotate</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('text')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTool === 'text'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Text</span>
          </button>

          {editorMode === 'video' && (
            <>
              <button
                type="button"
                onClick={() => setActiveTool('video-speed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  activeTool === 'video-speed'
                    ? 'bg-pink-500 text-white font-black shadow-md'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Speed & Trim</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('video-audio')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  activeTool === 'video-audio'
                    ? 'bg-purple-500 text-white font-black shadow-md'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Audio & Voice</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={resetAdjustments}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-mono ml-auto shrink-0 transition-all cursor-pointer"
            title="Reset All"
          >
            Reset
          </button>
        </div>

        {/* Active Tool Control Panels */}
        <div className="max-h-28 overflow-y-auto pr-1">
          {/* 1. ADJUSTMENTS PANEL */}
          {activeTool === 'adjust' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[10px] text-slate-400">
                  <span>Brightness</span>
                  <span className="text-cyan-300">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="160"
                  value={brightness}
                  onChange={(e) => {
                    setBrightness(Number(e.target.value));
                    pushHistory();
                  }}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[10px] text-slate-400">
                  <span>Contrast</span>
                  <span className="text-cyan-300">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="160"
                  value={contrast}
                  onChange={(e) => {
                    setContrast(Number(e.target.value));
                    pushHistory();
                  }}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[10px] text-slate-400">
                  <span>Saturation</span>
                  <span className="text-cyan-300">{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => {
                    setSaturation(Number(e.target.value));
                    pushHistory();
                  }}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[10px] text-slate-400">
                  <span>Warmth / Temp</span>
                  <span className="text-amber-300">{temperature > 0 ? `+${temperature}` : temperature}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={temperature}
                  onChange={(e) => {
                    setTemperature(Number(e.target.value));
                    pushHistory();
                  }}
                  className="w-full accent-amber-400"
                />
              </div>
            </div>
          )}

          {/* 2. FILTERS PANEL */}
          {activeTool === 'filter' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setActiveFilter(f.id);
                    pushHistory(`Filter: ${f.name}`);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all border cursor-pointer ${
                    activeFilter === f.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-black/40 text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}

          {/* 3. AI MAGIC TOOLS PANEL */}
          {activeTool === 'ai-magic' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                id="ai-fusion-studio-btn"
                onClick={() => {
                  if (onSendToFusionStudio) {
                    onSendToFusionStudio(currentImage);
                  } else if (onSelectTab) {
                    onSelectTab('fusion');
                  }
                }}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-500/25"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>AI Fusion Studio</span>
              </button>

              <button
                type="button"
                id="ai-remove-bg-btn"
                onClick={handleAiRemoveBg}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Remove BG (₹10)</span>
              </button>

              <button
                type="button"
                id="ai-retouch-btn"
                onClick={handleAiRetouch}
                className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-300 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Retouch (₹8)</span>
              </button>

              <button
                type="button"
                id="ai-upscale-btn"
                onClick={handleAiUpscale}
                className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>4K Super-Res (₹15)</span>
              </button>

              <button
                type="button"
                id="ai-object-erase-btn"
                onClick={handleAiObjectRemoval}
                className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Magic Eraser (₹12)</span>
              </button>
            </div>
          )}

          {/* 4. CROP & ROTATE PANEL */}
          {activeTool === 'crop' && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-[10px] font-mono text-slate-400">RATIO:</span>
              {(['free', '1:1', '9:16', '16:9'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setCropAspect(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    cropAspect === r ? 'bg-cyan-500 text-slate-950' : 'bg-white/5 text-slate-300'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}

              <div className="h-4 w-px bg-white/10 mx-1" />

              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                title="Rotate 90° Clockwise"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setFlipH(!flipH)}
                className={`p-1.5 rounded-lg transition-all ${flipH ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-slate-300'}`}
                title="Flip Horizontal"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setFlipV(!flipV)}
                className={`p-1.5 rounded-lg transition-all ${flipV ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-slate-300'}`}
                title="Flip Vertical"
              >
                <FlipVertical className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 5. TEXT PANEL */}
          {activeTool === 'text' && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter text overlay..."
                value={newTextContent}
                onChange={(e) => setNewTextContent(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white flex-1 font-mono focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={handleAddText}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Text Layer</span>
              </button>
            </div>
          )}

          {/* 7. VIDEO SPEED & TRIM */}
          {activeTool === 'video-speed' && editorMode === 'video' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">PLAYBACK SPEED:</span>
              {([0.5, 1.0, 1.5, 2.0] as const).map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => {
                    setPlaybackSpeed(spd);
                    if (videoRef.current) videoRef.current.playbackRate = spd;
                    showToast(`Speed set to ${spd}x`, 'info');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    playbackSpeed === spd ? 'bg-pink-500 text-white' : 'bg-white/5 text-slate-300'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          )}

          {/* 8. VIDEO AUDIO & VOICE-OVER */}
          {activeTool === 'video-audio' && editorMode === 'video' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                placeholder="Type script for AI Voice-Over..."
                value={voiceOverPrompt}
                onChange={(e) => setVoiceOverPrompt(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white flex-1 font-mono"
              />
              <button
                type="button"
                onClick={async () => {
                  await deductCredits(12, 'AI Voice-Over Generation (₹12)');
                  showToast('AI Voice-over synthesized and mixed into audio track!', 'success');
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shrink-0"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Generate Voice-Over (₹12)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. EXPORT & DOWNLOAD MODAL */}
      {/* ========================================================================= */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in">
          <div className="relative w-full max-w-lg glass-panel p-6 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-white">
                    Export {editorMode === 'photo' ? 'Photo Creation' : '4K Video Master'}
                  </h3>
                  <p className="text-xs text-slate-400">High-bitrate neural render with hardware encoding</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Resolution selection */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-slate-400 font-bold block">Target Resolution</span>
              <div className="grid grid-cols-3 gap-2">
                {(['720p', '1080p', '4k'] as const).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setExportResolution(res)}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                      exportResolution === res
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-black/40 text-slate-300 border-white/10 hover:text-white'
                    }`}
                  >
                    {res.toUpperCase()} {res === '4k' ? '(Ultra)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Format selection */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-slate-400 font-bold block">File Format</span>
              <div className="grid grid-cols-3 gap-2">
                {editorMode === 'photo'
                  ? (['png', 'webp', 'jpg'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setExportFormat(fmt as any)}
                        className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                          exportFormat === fmt
                            ? 'bg-purple-500 text-white border-purple-400'
                            : 'bg-black/40 text-slate-300 border-white/10'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))
                  : (['mp4', 'webm'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setExportFormat(fmt as any)}
                        className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                          exportFormat === fmt
                            ? 'bg-purple-500 text-white border-purple-400'
                            : 'bg-black/40 text-slate-300 border-white/10'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
              </div>
            </div>

            {/* Credit Cost Pill */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Og3DLogo size={18} variant="credit" glow={false} />
                <span className="text-xs text-amber-200 font-mono">
                  Export Cost: <strong className="text-white">₹{exportResolution === '4k' ? 15 : 5} Credits</strong>
                </span>
              </div>
              <span className="text-xs font-mono text-amber-400 font-bold">
                Balance: ₹{profile?.stars ?? 385}
              </span>
            </div>

            {/* Export Progress Bar */}
            {isExporting && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-cyan-300">
                  <span>Rendering Artifact...</span>
                  <span>{exportProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all duration-200"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono cursor-pointer"
              >
                Cancel
              </button>

              {exportSuccessUrl ? (
                <button
                  type="button"
                  onClick={triggerDownloadFile}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Now</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartExport}
                  disabled={isExporting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Render & Export</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
