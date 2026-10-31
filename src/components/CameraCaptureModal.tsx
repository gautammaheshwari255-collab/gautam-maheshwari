import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, RefreshCw, AlertCircle, Sparkles, SwitchCamera } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const startCamera = async () => {
      setError(null);
      setCapturedImage(null);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Camera API is not supported in this browser environment.');
          return;
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        activeStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch((err) => {
            console.error('Video play error:', err);
          });
        }
      } catch (err: any) {
        console.warn('Camera access issue:', err);
        setError(
          err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
            ? 'Camera permission was denied. You can enable camera in your browser settings or use sample snapshot.'
            : 'Unable to access webcam. Switching to virtual camera mode.'
        );
      }
    };

    if (isOpen) {
      startCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  const handleTakeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
      }
    }
  };

  const handleUseSampleSnapshot = () => {
    // Futuristic procedural cyber test pattern (no external photos)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <defs>
        <linearGradient id="camBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#020617"/>
          <stop offset="50%" stop-color="#082f49"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#camBg)"/>
      <circle cx="400" cy="300" r="180" stroke="#06B6D4" stroke-width="2" stroke-dasharray="8 6" fill="none" opacity="0.6"/>
      <circle cx="400" cy="300" r="100" stroke="#38BDF8" stroke-width="1.5" fill="none" opacity="0.4"/>
      <line x1="200" y1="300" x2="600" y2="300" stroke="#22D3EE" stroke-width="1.5" opacity="0.7"/>
      <line x1="400" y1="120" x2="400" y2="480" stroke="#22D3EE" stroke-width="1.5" opacity="0.7"/>
      <text x="400" y="305" font-family="monospace" font-size="14" font-weight="bold" fill="#F8FAFC" text-anchor="middle">OPTICAL MATRIX CALIBRATION</text>
      <text x="400" y="335" font-family="monospace" font-size="11" fill="#38BDF8" text-anchor="middle">SENSOR: ACTIVE • 1080P • AI SCAN</text>
    </svg>`;
    const sample = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    setCapturedImage(sample);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCapturedImage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="camera-capture-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        id="camera-capture-modal-box"
        className="relative w-full max-w-xl bg-[#0b0f19] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD Header */}
        <div className="p-4 border-b border-white/10 bg-cyan-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h3 className="font-display font-bold text-sm text-cyan-200 tracking-wide flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-cyan-400" />
              OGOO Vision Neural Scanner
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Screen */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          ) : stream && !error ? (
            <>
              <video
                ref={(node) => {
                  videoRef.current = node;
                  if (node && stream && node.srcObject !== stream) {
                    node.srcObject = stream;
                    node.play().catch(() => {});
                  }
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Futuristic Cyber Overlay / Grid / Reticle */}
              <div className="absolute inset-0 pointer-events-none border border-cyan-500/30 m-4 rounded-xl flex items-center justify-center">
                {/* Corner markers */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

                {/* Center targeting reticle */}
                <div className="w-20 h-20 rounded-full border border-dashed border-cyan-400/60 flex items-center justify-center animate-spin-slow">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                </div>

                <div className="absolute bottom-3 left-4 text-[10px] font-mono text-cyan-300/80 bg-black/60 px-2 py-0.5 rounded">
                  AI VISION: ACTIVE • 60 FPS • MATRIX FEED
                </div>
              </div>
            </>
          ) : (
            /* Standby / Simulated Scanner Screen (No empty video tag) */
            <div className="w-full h-full bg-[#07090e] p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="w-24 h-24 rounded-full border border-cyan-500/30 flex items-center justify-center relative mb-4">
                <div className="w-16 h-16 rounded-full border border-dashed border-cyan-400/50 animate-spin-slow" />
                <Camera className="w-8 h-8 text-cyan-400 absolute" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">
                {error ? 'Camera Stream Standby' : 'Initializing Neural Optical Sensor...'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
                {error || 'Requesting camera access permissions for multimodal visual perception.'}
              </p>
              <button
                type="button"
                onClick={handleUseSampleSnapshot}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Use Simulated Neural Snapshot</span>
              </button>
            </div>
          )}

          {/* Hidden Canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls Footer */}
        <div className="p-4 bg-[#07090e] border-t border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Switch camera"
          >
            <SwitchCamera className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Switch</span>
          </button>

          {capturedImage ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCapturedImage(null)}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Attach to Prompt</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleTakeSnapshot}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:scale-105 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all cursor-pointer"
            >
              <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
              <span>Capture Photo</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
