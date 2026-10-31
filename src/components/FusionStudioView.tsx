import React, { useState, useRef } from 'react';
import {
  Layers,
  Wand2,
  Sparkles,
  Upload,
  Download,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sliders,
  Image as ImageIcon,
  Check,
  Copy,
  ArrowRight,
  ArrowLeftRight,
  SplitSquareVertical,
  Zap,
  Eye,
  Trash2,
  Plus,
  Compass,
  Palette,
  Camera,
  Share2,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Film
} from 'lucide-react';
import { FusedImage, UserProfile } from '../types';
import { OgooStarIcon } from './OgooStarCurrency';

export interface FusionStudioViewProps {
  initialImage?: string | null;
  onSaveFusedImage?: (fusedImage: FusedImage) => void;
  onSendToPhotoEditor?: (imageUrl: string) => void;
  onSendToVideoStudio?: (imageUrl: string) => void;
  theme: 'dark' | 'light';
  profile?: UserProfile;
  onUpdateStars?: (newStars: number) => void;
  onOpenCredits?: () => void;
  onSelectTab?: (tab: any) => void;
}

type FusionMode = 'dual-fusion' | 'text-edit' | 'style-matrix' | 'face-morph' | 'background-swap';

const PRESET_SUBJECTS: { name: string; category: string; url: string }[] = [];

const PRESET_WORLDS: { name: string; category: string; url: string }[] = [];

const ART_STYLES = [
  { id: 'cyberpunk', name: 'Cyberpunk 2099', tag: 'Neon & Chrome', color: 'from-cyan-500 to-blue-600' },
  { id: 'ghibli', name: 'Studio Ghibli', tag: 'Lush Anime', color: 'from-emerald-500 to-teal-600' },
  { id: 'photoreal', name: 'Hyperreal 8K', tag: 'Octane Ray-Traced', color: 'from-purple-500 to-indigo-600' },
  { id: 'baroque', name: 'Baroque Oil', tag: 'Renaissance Gold', color: 'from-amber-600 to-yellow-600' },
  { id: 'synthwave', name: 'Synthwave 80s', tag: 'Outrun Magenta', color: 'from-pink-500 to-rose-600' },
  { id: 'dark-fantasy', name: 'Dark Eldritch', tag: 'Moody & Mythic', color: 'from-slate-700 to-red-900' },
  { id: 'watercolor', name: 'Fluid Watercolor', tag: 'Expressive Ink', color: 'from-sky-400 to-indigo-500' },
  { id: 'glass-3d', name: '3D Refraction Glass', tag: 'Prismatic Crystal', color: 'from-teal-400 to-cyan-500' }
];

export const FusionStudioView: React.FC<FusionStudioViewProps> = ({
  initialImage,
  onSaveFusedImage,
  onSendToPhotoEditor,
  onSendToVideoStudio,
  theme,
  profile,
  onUpdateStars,
  onOpenCredits,
  onSelectTab
}) => {
  const isDark = theme === 'dark';

  // Mode Selection
  const [fusionMode, setFusionMode] = useState<FusionMode>('dual-fusion');

  // Input Images (Slots A, B, and optional C)
  const [imageA, setImageA] = useState<string | null>(initialImage || null);
  const [imageB, setImageB] = useState<string | null>(null);
  const [imageC, setImageC] = useState<string | null>(null);
  const [showSlotC, setShowSlotC] = useState<boolean>(false);

  // Fusion settings
  const [prompt, setPrompt] = useState<string>(
    'Seamlessly fuse the cybernetic samurai into the neon cyberpunk metropolis. Harmonize rain reflections, glowing cyan katana lighting, and volumetric mist.'
  );
  const [fusionStrength, setFusionStrength] = useState<number>(55);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [imageSize, setImageSize] = useState<'512px' | '1K' | '2K' | '4K'>('1K');
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['cyberpunk', 'photoreal']);

  // Output and State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<string>('Standby');
  const [fusedResult, setFusedResult] = useState<string | null>(null);
  const [activeCompareMode, setActiveCompareMode] = useState<'split' | 'result' | 'side-by-side'>('split');
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fusedHistory, setFusedHistory] = useState<FusedImage[]>([]);

  // File Inputs
  const fileInputARef = useRef<HTMLInputElement | null>(null);
  const fileInputBRef = useRef<HTMLInputElement | null>(null);
  const fileInputCRef = useRef<HTMLInputElement | null>(null);

  // Mode descriptions & sample prompts
  const modeData: Record<FusionMode, { label: string; badge: string; desc: string; defaultPrompt: string }> = {
    'dual-fusion': {
      label: 'Dual Image Blend',
      badge: 'Multimodal 2x',
      desc: 'Fuse subject from Image A and environment/style from Image B into a single photorealistic artwork.',
      defaultPrompt: 'Seamlessly fuse the subject of Image 1 with the world and atmosphere of Image 2. Match directional lighting, color temperature, and surface reflections.'
    },
    'text-edit': {
      label: 'Text + Image Edit',
      badge: 'Gemini 3.1',
      desc: 'Use natural language instructions to transform, add elements, or inpaint directly into the photo.',
      defaultPrompt: 'Add glowing neon cybernetic visor and energy shield around the subject, keeping everything else photorealistic with ambient rain droplets.'
    },
    'style-matrix': {
      label: 'Style Matrix Fusion',
      badge: 'Multi-Style',
      desc: 'Infuse multiple contrasting artistic traditions into your base image with weighted harmonic blending.',
      defaultPrompt: 'Transform into a fusion of Cyberpunk Neon and Baroque Golden Oil painting with hyper-detailed brush strokes and volumetric radiance.'
    },
    'face-morph': {
      label: 'Character & Face Morph',
      badge: 'Identity Preserve',
      desc: 'Morph facial features and character identity into a secondary avatar, armor, or cinematic universe.',
      defaultPrompt: 'Seamlessly morph the facial identity and expression into the futuristic high-tech armor suit of the secondary image.'
    },
    'background-swap': {
      label: 'Background & World Swap',
      badge: 'Zero Edge Fringe',
      desc: 'Isolate the subject from Image A and composite them naturally into the world of Image B.',
      defaultPrompt: 'Extract the foreground subject from Image 1 and composite cleanly into the alien amethyst nebula background with matching rim lighting.'
    }
  };

  const handleModeChange = (mode: FusionMode) => {
    setFusionMode(mode);
    setPrompt(modeData[mode].defaultPrompt);
    setErrorMessage(null);
  };

  // Image Upload helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'A' | 'B' | 'C') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (target === 'A') setImageA(base64);
      if (target === 'B') setImageB(base64);
      if (target === 'C') setImageC(base64);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Prompt Enhancer
  const handleEnhancePrompt = () => {
    setPrompt((prev) => {
      const trimmed = prev.trim();
      return `${trimmed}, masterpiece quality, volumetric rim lighting, cinematic 8k resolution, octane render, harmonious multimodal synthesis, razor-sharp details`;
    });
  };

  // Style toggle
  const toggleStyle = (styleId: string) => {
    setSelectedStyles((prev) =>
      prev.includes(styleId) ? prev.filter((s) => s !== styleId) : [...prev, styleId]
    );
  };

  // Convert URL to Base64 helper for API request
  const ensureBase64 = async (urlOrData: string): Promise<string> => {
    if (urlOrData.startsWith('data:image')) {
      return urlOrData;
    }
    try {
      const res = await fetch(urlOrData);
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      return urlOrData;
    }
  };

  // Synthesize / Execute Fusion
  const handleRunFusion = async () => {
    if (!imageA && !imageB && !prompt) {
      setErrorMessage('Please provide at least one input image or a detailed prompt.');
      return;
    }

    const cost = imageSize === '4K' ? 20 : 12;
    if (profile?.stars !== undefined && profile.stars < cost) {
      setErrorMessage(`Insufficient ⭐ Credits. This fusion requires ₹${cost}, but you have ₹${profile.stars}.`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setProgressStep('Encoding multimodal visual tensors...');

    try {
      // Prepare images
      const imagesToUpload: string[] = [];
      if (imageA) {
        setProgressStep('Normalizing primary visual subject...');
        const base64A = await ensureBase64(imageA);
        imagesToUpload.push(base64A);
      }
      if (imageB && fusionMode !== 'text-edit') {
        setProgressStep('Normalizing secondary style/environment matrix...');
        const base64B = await ensureBase64(imageB);
        imagesToUpload.push(base64B);
      }
      if (imageC && showSlotC) {
        const base64C = await ensureBase64(imageC);
        imagesToUpload.push(base64C);
      }

      setProgressStep('Connecting to Gemini 3.1 Flash Image synthesis core...');

      const response = await fetch('/api/fuse-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: imagesToUpload,
          prompt,
          mode: fusionMode,
          aspectRatio,
          imageSize,
          fusionStrength,
          styles: selectedStyles.map(
            (id) => ART_STYLES.find((s) => s.id === id)?.name || id
          ),
          email: profile?.email
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete AI Fusion');
      }

      let finalUrl = data.imageUrl;

      // In case of fallback simulation
      if (!finalUrl) {
        setProgressStep('Applying neural procedural composite fusion...');
        // Create an aesthetically pleasing blended result using canvas
        finalUrl = await generateLocalFusedCanvas(imageA, imageB, prompt, fusionStrength);
      }

      setFusedResult(finalUrl);
      setProgressStep('Complete! Masterpiece synthesized.');

      // Deduct client-side stars
      if (profile?.stars !== undefined && onUpdateStars) {
        onUpdateStars(Math.max(0, profile.stars - cost));
      }

      // Add to history
      const newFusedItem: FusedImage = {
        id: `fused-${Date.now()}`,
        prompt,
        fusionMode,
        sourceImages: [imageA || '', imageB || ''].filter(Boolean),
        fusedUrl: finalUrl,
        aspectRatio,
        resolution: imageSize,
        model: data.provider || 'gemini-3.1-flash-image',
        fusionStrength,
        styles: selectedStyles,
        timestamp: 'Just now'
      };

      setFusedHistory((prev) => [newFusedItem, ...prev]);
      if (onSaveFusedImage) {
        onSaveFusedImage(newFusedItem);
      }
    } catch (err: any) {
      console.error('Fusion execution error:', err);
      setErrorMessage(err?.message || 'Synthesis encountered an issue. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Local procedural synthesis fallback if backend API key is unavailable
  const generateLocalFusedCanvas = async (
    imgSrcA: string | null,
    imgSrcB: string | null,
    _textPrompt: string,
    strength: number
  ): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(imgSrcA || imgSrcB || '');

      const imgA = new window.Image();
      imgA.crossOrigin = 'anonymous';

      imgA.onload = () => {
        ctx.drawImage(imgA, 0, 0, 1200, 1200);

        if (imgSrcB) {
          const imgB = new window.Image();
          imgB.crossOrigin = 'anonymous';
          imgB.onload = () => {
            ctx.save();
            ctx.globalAlpha = strength / 100;
            ctx.globalCompositeOperation = 'screen';
            ctx.drawImage(imgB, 0, 0, 1200, 1200);
            ctx.restore();

            // Add futuristic neon ambient overlay
            const grad = ctx.createLinearGradient(0, 0, 1200, 1200);
            grad.addColorStop(0, 'rgba(6, 182, 212, 0.25)'); // cyan
            grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.2)'); // purple
            grad.addColorStop(1, 'rgba(236, 72, 153, 0.3)'); // pink
            ctx.fillStyle = grad;
            ctx.globalCompositeOperation = 'overlay';
            ctx.fillRect(0, 0, 1200, 1200);

            resolve(canvas.toDataURL('image/png'));
          };
          imgB.onerror = () => resolve(canvas.toDataURL('image/png'));
          imgB.src = imgSrcB;
        } else {
          // Add cyber inpainting overlay
          const grad = ctx.createRadialGradient(600, 600, 50, 600, 600, 600);
          grad.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
          grad.addColorStop(1, 'rgba(15, 23, 42, 0.1)');
          ctx.fillStyle = grad;
          ctx.globalCompositeOperation = 'color-dodge';
          ctx.fillRect(0, 0, 1200, 1200);
          resolve(canvas.toDataURL('image/png'));
        }
      };
      imgA.onerror = () => resolve(imgSrcB || '');
      imgA.src = imgSrcA || imgSrcB || '';
    });
  };

  // Download fused master
  const handleDownload = () => {
    if (!fusedResult) return;
    const link = document.createElement('a');
    link.href = fusedResult;
    link.download = `og-ai-fusion-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Use output as new Input A
  const handleReuseAsInputA = () => {
    if (!fusedResult) return;
    setImageA(fusedResult);
    setFusedResult(null);
  };

  return (
    <div className={`min-h-screen p-4 md:p-6 lg:p-8 space-y-6 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputARef}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileUpload(e, 'A')}
      />
      <input
        type="file"
        ref={fileInputBRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileUpload(e, 'B')}
      />
      <input
        type="file"
        ref={fileInputCRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileUpload(e, 'C')}
      />

      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden backdrop-blur-xl ${
        isDark
          ? 'bg-gradient-to-r from-purple-950/40 via-cyan-950/30 to-[#0b101e]/80 border-purple-500/20'
          : 'bg-gradient-to-r from-purple-50 via-cyan-50 to-white border-purple-200'
      }`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 text-xs font-mono font-bold tracking-wider rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/25">
                ALL FUSION 4.0
              </span>
              <span className="px-2.5 py-0.5 text-xs font-mono rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/30">
                Gemini 3.1 Flash Image
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
              OG AI Multimodal Fusion Studio
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Fuse multiple images, execute precision text-guided inpainting & edits, and synthesize complex style matrices with next-gen neural coherence.
            </p>
          </div>

          {/* Credits pill */}
          <div className="flex items-center gap-3">
            <div
              onClick={onOpenCredits}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 cursor-pointer hover:bg-amber-500/20 transition-all shadow-md"
            >
              <OgooStarIcon className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <div className="text-[10px] font-mono text-amber-300/80 uppercase">Balance</div>
                <div className="text-sm font-bold text-amber-400">₹{profile?.stars ?? 385}</div>
              </div>
            </div>

            <button
              onClick={() => onSelectTab && onSelectTab('photo-editor')}
              className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-slate-300 cursor-pointer"
            >
              <Wand2 className="w-4 h-4 text-cyan-400" />
              Photo Lab
            </button>
          </div>
        </div>

        {/* Fusion Mode Selector Bar */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {(Object.keys(modeData) as FusionMode[]).map((m) => {
            const active = fusionMode === m;
            return (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold shadow-lg shadow-purple-600/30 border-transparent'
                    : isDark
                    ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm'
                }`}
              >
                <Layers className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-purple-400'}`} />
                <span>{modeData[m].label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  active ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-400'
                }`}>
                  {modeData[m].badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Workbench & Right Interactive Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT WORKBENCH (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Mode Explanation */}
          <div className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
            isDark ? 'bg-[#0f1422]/70 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <span className="font-bold text-purple-400">{modeData[fusionMode].label}: </span>
              {modeData[fusionMode].desc}
            </div>
          </div>

          {/* Image Input Slots Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Slot A: Primary Image */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
              isDark ? 'bg-[#0c101c]/80 border-cyan-500/20' : 'bg-white border-cyan-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center border border-cyan-500/40">
                    A
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    {fusionMode === 'text-edit' ? 'Base Image to Edit' : 'Primary Subject'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => fileInputARef.current?.click()}
                    className="px-2 py-1 text-[11px] rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    Upload
                  </button>
                  {imageA && (
                    <button
                      onClick={() => setImageA(null)}
                      className="p-1 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Slot A Preview */}
              <div
                onClick={() => !imageA && fileInputARef.current?.click()}
                className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 border-dashed flex flex-col items-center justify-center transition-all group ${
                  imageA
                    ? 'border-cyan-500/30 bg-black'
                    : 'border-white/10 hover:border-cyan-400/50 bg-white/5 cursor-pointer'
                }`}
              >
                {imageA ? (
                  <>
                    <img
                      src={imageA}
                      alt="Input A"
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputARef.current?.click();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black text-xs font-bold cursor-pointer"
                      >
                        Change Image
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <Upload className="w-8 h-8 text-cyan-400/60 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-300">Upload Subject Image</p>
                    <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, WebP</p>
                  </div>
                )}
              </div>

              {/* Quick Preset Selector for Slot A */}
              {PRESET_SUBJECTS.length > 0 && (
                <div className="mt-3">
                  <span className="text-[10px] text-slate-400 block mb-1.5 font-mono">Sample Presets:</span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {PRESET_SUBJECTS.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => setImageA(p.url)}
                        className={`relative w-9 h-9 rounded-lg overflow-hidden shrink-0 border transition-all cursor-pointer ${
                          imageA === p.url ? 'border-cyan-400 ring-2 ring-cyan-400/30' : 'border-white/10 hover:border-white/30'
                        }`}
                        title={p.name}
                      >
                        <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Slot B: Secondary Image / Style / World */}
            {fusionMode !== 'text-edit' ? (
              <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                isDark ? 'bg-[#0c101c]/80 border-purple-500/20' : 'bg-white border-purple-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-mono font-bold flex items-center justify-center border border-purple-500/40">
                      B
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                      {fusionMode === 'background-swap'
                        ? 'Target Environment'
                        : fusionMode === 'face-morph'
                        ? 'Target Outfit / Avatar'
                        : 'Secondary Style / World'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => fileInputBRef.current?.click()}
                      className="px-2 py-1 text-[11px] rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      Upload
                    </button>
                    {imageB && (
                      <button
                        onClick={() => setImageB(null)}
                        className="p-1 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Slot B Preview */}
                <div
                  onClick={() => !imageB && fileInputBRef.current?.click()}
                  className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 border-dashed flex flex-col items-center justify-center transition-all group ${
                    imageB
                      ? 'border-purple-500/30 bg-black'
                      : 'border-white/10 hover:border-purple-400/50 bg-white/5 cursor-pointer'
                  }`}
                >
                  {imageB ? (
                    <>
                      <img
                        src={imageB}
                        alt="Input B"
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputBRef.current?.click();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-purple-500 text-white text-xs font-bold cursor-pointer"
                        >
                          Change Image
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="w-8 h-8 text-purple-400/60 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-300">Upload Target World</p>
                      <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, WebP</p>
                    </div>
                  )}
                </div>

                {/* Quick Presets for Slot B */}
                {PRESET_WORLDS.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[10px] text-slate-400 block mb-1.5 font-mono">Sample Worlds & Styles:</span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {PRESET_WORLDS.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => setImageB(p.url)}
                          className={`relative w-9 h-9 rounded-lg overflow-hidden shrink-0 border transition-all cursor-pointer ${
                            imageB === p.url ? 'border-purple-400 ring-2 ring-purple-400/30' : 'border-white/10 hover:border-white/30'
                          }`}
                          title={p.name}
                        >
                          <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Text Edit Mode: Fast Quick-Action Directives */
              <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                isDark ? 'bg-[#0c101c]/80 border-cyan-500/20' : 'bg-white border-cyan-200 shadow-sm'
              }`}>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      Quick Modification Directives
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Click any quick prompt to modify the base image instantly:
                  </p>
                  <div className="space-y-2">
                    {[
                      'Add holographic cyberpunk sunglasses with neon reflections',
                      'Turn background into a stormy Tokyo rain metropolis with neon billboards',
                      'Change clothing into sleek carbon-fiber cyber armor',
                      'Transform artistic medium into Studio Ghibli lush anime style',
                      'Add glowing golden energy wings radiating from the back',
                      'Add ray-traced glass reflections and prismatic ambient light'
                    ].map((directive, i) => (
                      <button
                        key={i}
                        onClick={() => setPrompt(directive)}
                        className={`w-full text-left p-2 rounded-xl text-xs transition-all border cursor-pointer ${
                          prompt === directive
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold'
                            : isDark
                            ? 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
                            : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        • {directive}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Powered by Gemini 3.1 Flash Image</span>
                  <span className="text-cyan-400 font-mono">Precision Inpaint</span>
                </div>
              </div>
            )}
          </div>

          {/* Fusion Balance Slider (for Dual Fusion / Morph / Swap) */}
          {fusionMode !== 'text-edit' && (
            <div className={`p-4 rounded-2xl border space-y-2 ${
              isDark ? 'bg-[#0c101c]/80 border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  Multimodal Blend Weight Ratio
                </span>
                <span className="font-mono text-purple-400 font-bold">
                  {100 - fusionStrength}% Image A • {fusionStrength}% Image B
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={fusionStrength}
                onChange={(e) => setFusionStrength(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>More Subject (Image A)</span>
                <span>Balanced 50/50</span>
                <span>More Style/World (Image B)</span>
              </div>
            </div>
          )}

          {/* Style Matrix Chips (if mode is style-matrix or dual-fusion) */}
          {(fusionMode === 'style-matrix' || fusionMode === 'dual-fusion') && (
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#0c101c]/80 border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  Artistic Style Fusion Matrix
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {selectedStyles.length} styles active
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ART_STYLES.map((st) => {
                  const active = selectedStyles.includes(st.id);
                  return (
                    <button
                      key={st.id}
                      onClick={() => toggleStyle(st.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden ${
                        active
                          ? 'border-cyan-400 bg-cyan-500/15 text-white font-bold shadow-md shadow-cyan-500/10'
                          : isDark
                          ? 'border-white/5 bg-white/5 hover:bg-white/10 text-slate-400'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs truncate">{st.name}</span>
                        {active && <Check className="w-3 h-3 text-cyan-400 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate">{st.tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Directive Prompt Input Box */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isDark ? 'bg-[#0c101c]/80 border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Fusion & Synthesis Directive
              </label>
              <button
                onClick={handleEnhancePrompt}
                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono transition-colors cursor-pointer"
              >
                <Wand2 className="w-3 h-3" />
                AI Prompt Enhance
              </button>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Describe how to fuse or modify the images..."
              className={`w-full p-3 rounded-xl text-xs outline-none transition-all resize-none ${
                isDark
                  ? 'bg-black/50 border border-white/10 focus:border-purple-400 text-white placeholder-slate-500'
                  : 'bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-900 placeholder-slate-400'
              }`}
            />

            {/* Aspect Ratio & Resolution Configs */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-slate-400">Ratio:</span>
                {['1:1', '16:9', '9:16', '4:3', '4:1'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setAspectRatio(r)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                      aspectRatio === r
                        ? 'bg-purple-500 text-white font-bold'
                        : isDark
                        ? 'bg-white/5 hover:bg-white/10 text-slate-400'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-slate-400">Resolution:</span>
                {(['512px', '1K', '2K', '4K'] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setImageSize(sz)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                      imageSize === sz
                        ? 'bg-cyan-500 text-black font-bold'
                        : isDark
                        ? 'bg-white/5 hover:bg-white/10 text-slate-400'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Message Notice */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Button: Execute Fusion */}
          <button
            onClick={handleRunFusion}
            disabled={isProcessing}
            className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-3 cursor-pointer ${
              isProcessing
                ? 'bg-purple-900/50 text-purple-300 border border-purple-500/40 cursor-wait'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-purple-600/30 hover:scale-[1.01]'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-cyan-300" />
                <span>{progressStep}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-cyan-200" />
                <span>Synthesize AI Fusion</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-black/30 text-cyan-300 border border-cyan-400/30">
                  ₹{imageSize === '4K' ? 20 : 12}
                </span>
              </>
            )}
          </button>
        </div>

        {/* RIGHT INSPECTOR: Live Interactive Comparison & Result (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`p-5 rounded-3xl border ${
            isDark ? 'bg-[#0c101c]/80 border-white/10' : 'bg-white border-slate-200 shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-slate-200">Fusion Inspector</span>
              </div>

              {fusedResult && (
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setActiveCompareMode('split')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                      activeCompareMode === 'split' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Split Slider
                  </button>
                  <button
                    onClick={() => setActiveCompareMode('result')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                      activeCompareMode === 'result' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Master Only
                  </button>
                </div>
              )}
            </div>

            {/* Canvas / Inspector Area */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black flex items-center justify-center select-none">
              {isProcessing ? (
                <div className="text-center p-6 space-y-4">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                    <div className="absolute inset-2 rounded-full border-4 border-purple-500/20 border-b-purple-400 animate-spin animate-reverse" />
                    <Sparkles className="w-8 h-8 text-cyan-300 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Synthesizing Multimodal Fusion</h4>
                    <p className="text-xs text-cyan-300/80 font-mono">{progressStep}</p>
                  </div>
                </div>
              ) : fusedResult ? (
                activeCompareMode === 'split' && imageA ? (
                  /* Interactive Split Slider */
                  <div className="relative w-full h-full cursor-ew-resize overflow-hidden">
                    {/* Background: Fused Output */}
                    <img
                      src={fusedResult}
                      alt="Fused Result"
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Foreground: Original Image A clipped */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${sliderPosition}%` }}
                    >
                      <img
                        src={imageA}
                        alt="Original Subject"
                        className="w-full h-full object-cover max-w-none"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-mono text-cyan-300 backdrop-blur-xs border border-cyan-500/30">
                        ORIGINAL A
                      </div>
                    </div>

                    {/* Fused label right */}
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-mono text-purple-300 backdrop-blur-xs border border-purple-500/30">
                      FUSED RESULT
                    </div>

                    {/* Interactive Slider Divider Line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] cursor-ew-resize flex items-center justify-center"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="w-7 h-7 rounded-full bg-black/90 border-2 border-white shadow-xl flex items-center justify-center text-white">
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Invisible range overlay for dragging */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPosition}
                      onChange={(e) => setSliderPosition(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                    />
                  </div>
                ) : (
                  /* Master Result Full View */
                  <div className="relative w-full h-full group">
                    <img
                      src={fusedResult}
                      alt="Fused Output"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-[10px] font-mono text-purple-300 border border-purple-500/30">
                      {modeData[fusionMode].label} • {imageSize}
                    </div>
                  </div>
                )
              ) : (
                /* Standby placeholder */
                <div className="text-center p-6 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
                    <Layers className="w-8 h-8 text-slate-400/50" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300">Ready for Multimodal Fusion</h4>
                    <p className="text-xs text-slate-500 max-w-xs mt-1">
                      Configure your input images and directives on the left, then click Synthesize to inspect the fused output here.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Post-Fusion Export & Handoff Actions */}
            {fusedResult && (
              <div className="mt-4 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDownload}
                    className="p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Master
                  </button>

                  <button
                    onClick={handleReuseAsInputA}
                    className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Re-Fuse (Iterate)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSendToPhotoEditor && onSendToPhotoEditor(fusedResult)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                    Open in Photo Lab
                  </button>

                  <button
                    onClick={() => onSendToVideoStudio && onSendToVideoStudio(fusedResult)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Film className="w-3.5 h-3.5 text-pink-400" />
                    Animate with Veo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fusion Session History */}
          {fusedHistory.length > 0 && (
            <div className={`p-4 rounded-3xl border space-y-3 ${
              isDark ? 'bg-[#0c101c]/80 border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Recent Fusion Creations</span>
                <span className="font-mono text-purple-400">{fusedHistory.length} creations</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {fusedHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setFusedResult(item.fusedUrl)}
                    className="relative aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-purple-400 cursor-pointer group transition-all"
                  >
                    <img src={item.fusedUrl} alt="History" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
