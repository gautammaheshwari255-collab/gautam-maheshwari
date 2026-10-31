import React from 'react';
import {
  MessageSquare,
  Sparkles,
  Layers,
  Wand2,
  Boxes,
  Video,
  Code2,
  Mic,
  Trash2,
  Zap,
  Coins,
  CreditCard,
  History,
  Palette,
  Eye,
  Sliders,
  X,
  ExternalLink,
  ChevronRight,
  Smartphone,
  Download,
  Key,
  Lock
} from 'lucide-react';
import { NavTab, UserProfile } from '../types';
import { Og3DLogo } from './Og3DLogo';

export interface MobileQuickActionMenuProps {
  tab: NavTab | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: NavTab) => void;
  profile: UserProfile;
  onQuickPrompt?: (prompt: string) => void;
  onToggleAudioSpeech?: () => void;
  audioSpeechEnabled?: boolean;
  onClearChat?: () => void;
  onTopUpCredits?: (amount: number) => void;
  onOpenConvertAppModal?: () => void;
}

export const MobileQuickActionMenu: React.FC<MobileQuickActionMenuProps> = ({
  tab,
  isOpen,
  onClose,
  onSelectTab,
  profile,
  onQuickPrompt,
  onToggleAudioSpeech,
  audioSpeechEnabled,
  onClearChat,
  onTopUpCredits,
  onOpenConvertAppModal
}) => {
  if (!isOpen || !tab) return null;

  const triggerHaptic = (ms = 12) => {
    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  };

  // Content configurations for each tab
  const getTabConfig = () => {
    switch (tab) {
      case 'chat':
        return {
          title: 'Chat Shortcuts',
          subtitle: 'Quantum Multimodal Intelligence',
          icon: <MessageSquare className="w-5 h-5 text-cyan-400" />,
          glow: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
          badge: 'AI Conversations',
          actions: [
            {
              id: 'chat-code',
              icon: <Code2 className="w-4 h-4 text-cyan-400" />,
              label: 'Generate Full-Stack Code',
              desc: 'Production TypeScript architecture & APIs',
              onClick: () => {
                triggerHaptic(15);
                onSelectTab('chat');
                onClose();
                onQuickPrompt?.('Generate a complete, production-grade TypeScript microservice with clean architecture, typed interfaces, and robust error handling.');
              }
            },
            {
              id: 'chat-voice',
              icon: <Mic className={`w-4 h-4 ${audioSpeechEnabled ? 'text-emerald-400' : 'text-slate-400'}`} />,
              label: audioSpeechEnabled ? 'Voice Response (Enabled)' : 'Enable Voice Audio',
              desc: 'Text-to-speech AI voice synthesis',
              onClick: () => {
                triggerHaptic(15);
                onToggleAudioSpeech?.();
                onSelectTab('chat');
                onClose();
              }
            },
            {
              id: 'chat-clear',
              icon: <Trash2 className="w-4 h-4 text-red-400" />,
              label: 'Clear Chat Messages',
              desc: 'Reset conversation thread cleanly',
              onClick: () => {
                triggerHaptic(20);
                onClearChat?.();
                onSelectTab('chat');
                onClose();
              }
            }
          ]
        };

      case 'image':
      case 'video':
        return {
          title: 'Creative Studio Shortcuts',
          subtitle: 'Generative Visual Engine',
          icon: <Sparkles className="w-5 h-5 text-purple-400" />,
          glow: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400',
          badge: 'Images & Veo Videos',
          actions: [
            {
              id: 'studio-image',
              icon: <Palette className="w-4 h-4 text-purple-400" />,
              label: '8K Photorealistic Image Gen',
              desc: 'Nano Banana high-fidelity visual rendering',
              onClick: () => {
                triggerHaptic(15);
                onSelectTab('image');
                onClose();
              }
            },
            {
              id: 'studio-video',
              icon: <Video className="w-4 h-4 text-pink-400" />,
              label: 'Veo 2 Cinematic Video Gen',
              desc: 'Generate motion video clips with AI',
              onClick: () => {
                triggerHaptic(15);
                onSelectTab('video');
                onClose();
              }
            },
            {
              id: 'studio-cyberpunk',
              icon: <Zap className="w-4 h-4 text-cyan-400" />,
              label: 'Cyberpunk Concept Art Studio',
              desc: 'Jumpstart with futuristic neon aesthetics',
              onClick: () => {
                triggerHaptic(15);
                onSelectTab('image');
                onClose();
              }
            }
          ]
        };

      case 'fusion':
        return {
          title: 'Fusion Studio Shortcuts',
          subtitle: 'Multi-Image Neural Composite',
          icon: <Layers className="w-5 h-5 text-fuchsia-400" />,
          glow: 'from-fuchsia-500/20 to-purple-500/10 border-fuchsia-500/30 text-fuchsia-400',
          badge: 'Neural Compositing',
          actions: [
            {
              id: 'fusion-blend',
              icon: <Layers className="w-4 h-4 text-fuchsia-400" />,
              label: 'Dual Image Harmonizer',
              desc: 'Seamless blend with interactive split slider',
              onClick: () => {
                triggerHaptic(15);
                onSelectTab('fusion');
                onClose();
              }
            },
            {
              id: 'fusion-style',
              icon: <Sliders className="w-4 h-4 text-purple-400" />,
              label: 'Neural Style Transfer',
              desc: 'Map aesthetic texture to source subjects',
              onClick: () => {
                triggerHaptic(15);
                onSelectTab('fusion');
                onClose();
              }
            },
            {
              id: 'fusion-video',
              icon: <Video className="w-4 h-4 text-pink-400" />,
              label: 'Send Fusion Result to Video Generator',
              desc: 'Animate composite images into videos',
              onClick: () => {
                triggerHaptic(15);
                onSelectTab('fusion');
                onClose();
              }
            }
          ]
        };

      case 'photo-editor':
        return {
          title: 'Photo Editor Shortcuts',
          subtitle: 'Precision AI Enhancement',
          icon: <Wand2 className="w-5 h-5 text-cyan-300" />,
          glow: 'from-cyan-500/20 to-teal-500/10 border-cyan-500/30 text-cyan-300',
          badge: 'AI Darkroom',
          actions: [
            {
              id: 'editor-enhance',
              icon: <Wand2 className="w-4 h-4 text-cyan-300" />,
              label: 'Auto HDR & Clarity Boost',
              desc: 'Sub-millisecond dynamic range enhancement',
              onClick: () => {
                triggerHaptic(15);
                onSelectTab('photo-editor');
                onClose();
              }
            },
            {
              id: 'editor-filters',
              icon: <Eye className="w-4 h-4 text-emerald-400" />,
              label: 'Cinematic Cyber LUTs',
              desc: 'Apply Matrix, Neon, and Sci-Fi film grading',
              onClick: () => {
                triggerHaptic(15);
                onSelectTab('photo-editor');
                onClose();
              }
            },
            {
              id: 'editor-crop',
              icon: <Sliders className="w-4 h-4 text-purple-400" />,
              label: 'Aspect Ratio & Dimensions',
              desc: 'Crop to 16:9, 9:16, 1:1, or 4:3 for socials',
              onClick: () => {
                triggerHaptic(15);
                onSelectTab('photo-editor');
                onClose();
              }
            }
          ]
        };

      case 'stars':
        return {
          title: 'OG AI Credits Shortcuts',
          subtitle: `Current Balance: ₹${profile.stars} Credits`,
          icon: <Og3DLogo size={22} variant="credit" glow={true} />,
          glow: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400',
          badge: 'Credits & Ledger',
          actions: [
            {
              id: 'stars-topup-starter',
              icon: <Coins className="w-4 h-4 text-amber-400" />,
              label: 'Quick Top-Up (+250 Credits for ₹49)',
              desc: 'Instant recharge for 50 images or 10 videos',
              onClick: () => {
                triggerHaptic(20);
                onTopUpCredits?.(250);
                onSelectTab('stars');
                onClose();
              }
            },
            {
              id: 'stars-ledger',
              icon: <History className="w-4 h-4 text-cyan-400" />,
              label: 'View Transaction Ledger',
              desc: 'Inspect credits claimed and generation costs',
              onClick: () => {
                triggerHaptic(15);
                onSelectTab('stars');
                onClose();
              }
            },
            {
              id: 'stars-plans',
              icon: <CreditCard className="w-4 h-4 text-purple-400" />,
              label: 'Explore Pro & Enterprise Packs',
              desc: 'High-volume generation up to 10,000 Stars',
              onClick: () => {
                triggerHaptic(15);
                onSelectTab('stars');
                onClose();
              }
            }
          ]
        };

      case 'my-api':
        return {
          title: 'My API Engine',
          subtitle: 'Photo & Video Custom API Keys',
          icon: <Key className="w-5 h-5 text-emerald-400" />,
          glow: 'from-emerald-500/20 to-cyan-500/10 border-emerald-500/30 text-emerald-400',
          badge: 'Self-Serve',
          actions: [
            {
              id: 'my-api-photo',
              icon: <Wand2 className="w-4 h-4 text-purple-400" />,
              label: 'Configure Photo API Key',
              desc: 'Set custom Magic Hour or fal.ai credentials',
              onClick: () => {
                triggerHaptic(15);
                onSelectTab('my-api');
                onClose();
              }
            },
            {
              id: 'my-api-video',
              icon: <Video className="w-4 h-4 text-cyan-400" />,
              label: 'Configure Video API Key',
              desc: 'Set custom cinema video generator endpoint',
              onClick: () => {
                triggerHaptic(15);
                onSelectTab('my-api');
                onClose();
              }
            }
          ]
        };

      case 'owner-secret':
        return {
          title: 'Owner Secret Portal',
          subtitle: 'Quantum Chat API & n8n Management',
          icon: <Lock className="w-5 h-5 text-rose-400" />,
          glow: 'from-rose-500/20 to-purple-500/10 border-rose-500/30 text-rose-400',
          badge: 'Owner Only',
          actions: [
            {
              id: 'secret-chat-api',
              icon: <MessageSquare className="w-4 h-4 text-cyan-400" />,
              label: 'Manage Chat API & Webhooks',
              desc: 'Configure production n8n AI Agent endpoint',
              onClick: () => {
                triggerHaptic(15);
                onSelectTab('owner-secret');
                onClose();
              }
            }
          ]
        };

      case 'tools':
      default:
        return {
          title: 'Quantum Tools Suite',
          subtitle: 'Specialized Autonomous AI Modules',
          icon: <Boxes className="w-5 h-5 text-emerald-400" />,
          glow: 'from-emerald-500/20 to-cyan-500/10 border-emerald-500/30 text-emerald-400',
          badge: 'AI Micro-Apps',
          actions: [
            {
              id: 'tools-all',
              icon: <Boxes className="w-4 h-4 text-emerald-400" />,
              label: 'Open Full Tools Catalog',
              desc: 'Browse code sandbox, vision, and profilers',
              onClick: () => {
                triggerHaptic(15);
                onSelectTab('tools');
                onClose();
              }
            },
            {
              id: 'tools-prompt',
              icon: <Zap className="w-4 h-4 text-amber-400" />,
              label: 'Prompt Engineer & Optimizer',
              desc: 'Refine raw prompts into structured instructions',
              onClick: () => {
                triggerHaptic(15);
                onSelectTab('tools');
                onClose();
              }
            },
            {
              id: 'tools-history',
              icon: <History className="w-4 h-4 text-cyan-400" />,
              label: 'Creation History & Vault',
              desc: 'Access saved chats, images, and renders',
              onClick: () => {
                triggerHaptic(15);
                onSelectTab('history');
                onClose();
              }
            }
          ]
        };
    }
  };

  const config = getTabConfig();

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={() => {
          triggerHaptic(8);
          onClose();
        }}
      />

      {/* Quick Action Floating Sheet (anchored right above mobile bottom nav) */}
      <div
        className="relative z-10 w-full max-w-lg mx-auto bg-[#0d121f]/95 border-t border-x border-white/15 rounded-t-3xl shadow-[0_-10px_35px_rgba(0,0,0,0.8)] backdrop-blur-2xl p-4 pb-6 transition-all duration-200 transform translate-y-0"
        style={{ marginBottom: '62px' }}
      >
        {/* Pull handle */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${config.glow} border shadow-lg flex items-center justify-center`}>
              {config.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">{config.title}</h3>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                  {config.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{config.subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close shortcuts"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action List */}
        <div className="space-y-2">
          {config.actions.map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={act.onClick}
              className="w-full text-left p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.14] active:scale-[0.98] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between cursor-pointer group tap-haptic-responsive"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-black/40 border border-white/10 group-hover:scale-105 transition-transform">
                  {act.icon}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-100 group-hover:text-white flex items-center gap-1.5">
                    {act.label}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {act.desc}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
            </button>
          ))}
        </div>

        {/* Convert Full Web to App Shortcut */}
        {onOpenConvertAppModal && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                onClose();
                onOpenConvertAppModal();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-cyan-500/15 to-purple-500/20 hover:from-amber-500/30 hover:to-cyan-500/25 border border-amber-400/40 text-amber-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Convert Web to App</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 text-[9px] font-mono uppercase">
                      PWA
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300 font-mono">
                    Install to Home Screen & offline access
                  </div>
                </div>
              </div>
              <Download className="w-4 h-4 text-amber-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
            </button>
          </div>
        )}

        {/* Long-press gesture hint */}
        <div className="mt-3 text-center">
          <span className="text-[10px] text-slate-500 font-mono inline-flex items-center gap-1">
            <span>✨</span> Hold any bottom nav icon anytime to reveal its shortcuts
          </span>
        </div>
      </div>
    </div>
  );
};
