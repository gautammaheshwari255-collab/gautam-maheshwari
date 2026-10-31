import React, { useState } from 'react';
import {
  User,
  Zap,
  ShieldCheck,
  Cpu,
  HardDrive,
  Clock,
  Sparkles,
  CheckCircle2,
  Download,
  CreditCard,
  Server,
  ArrowUpRight,
  LogOut
} from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileViewProps {
  profile: UserProfile;
  onTopUpCredits: () => void;
  onLogout?: () => void;
  onOpenStars?: () => void;
  theme: 'dark' | 'light';
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onTopUpCredits,
  onLogout,
  onOpenStars,
  theme
}) => {
  const [copiedKey, setCopiedKey] = useState(false);

  const clusterNodes = [
    { name: 'Quantum Cluster US-West-1', status: 'Online • 14ms latency', load: '64%' },
    { name: 'Neural Fabric EU-Frankfurt', status: 'Online • 32ms latency', load: '48%' },
    { name: 'Vision Matrix Tokyo-Edge', status: 'Online • 28ms latency', load: '72%' }
  ];

  return (
    <div id="ogoo-profile-view" className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Profile Card Banner */}
      <div className="relative glass-panel p-6 md:p-8 rounded-3xl border border-cyan-500/30 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#0c1220] via-[#11192e] to-[#07090e] border-2 border-cyan-400/60 shadow-xl shadow-cyan-500/25 flex flex-col items-center justify-center shrink-0 group overflow-hidden">
              <div className="absolute inset-0 bg-radial from-cyan-400/20 via-purple-600/10 to-transparent pointer-events-none" />
              <div className="relative flex flex-col items-center justify-center z-10">
                <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 group-hover:scale-110 transition-transform">
                  <User className="w-7 h-7 md:w-8 md:h-8 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                </div>
                <span className="text-[9px] font-mono font-black text-cyan-300 tracking-widest uppercase mt-1">
                  NEURAL ID
                </span>
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 ring-2 ring-[#07090e] shadow-[0_0_10px_#34d399] z-20" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-xl md:text-2xl text-white tracking-tight">
                  {profile.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  VERIFIED NEURAL IDENT
                </span>
              </div>
              <p className="text-xs font-mono text-cyan-400/90">{profile.handle}</p>
              <p className="text-xs text-slate-400 font-sans">{profile.email}</p>
              <div className="text-[11px] text-slate-400 font-mono pt-1">
                Member of OGOO Core since {profile.joinedDate}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              id="profile-topup-stars-btn"
              onClick={onOpenStars || onTopUpCredits}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:scale-105 active:scale-95 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
            >
              <span className="text-sm">⭐</span>
              <span>Manage & Get ⭐ Stars</span>
            </button>
            {onLogout && (
              <button
                type="button"
                id="profile-logout-btn"
                onClick={onLogout}
                className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="Log Out / Switch Account"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Compute Metrics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 - ⭐ Stars Currency */}
        <div
          onClick={onOpenStars}
          className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-950/10 shadow-lg space-y-2 cursor-pointer hover:border-amber-400 transition-all hover:scale-[1.02]"
          title="Click to view Stars Ledger and Transactions"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono uppercase text-[10px] tracking-wider text-amber-300 font-bold">⭐ Stars Balance</span>
            <span className="text-base animate-pulse">⭐</span>
          </div>
          <div className="font-display font-black text-2xl text-amber-200">
            {(profile.stars ?? 400).toLocaleString()} <span className="text-xs font-mono text-amber-400">Stars</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full shadow-[0_0_8px_#f59e0b]" style={{ width: '85%' }} />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-amber-300/80">
            <span>OGOO Currency</span>
            <span className="underline">View History →</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel p-5 rounded-2xl border border-purple-500/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono uppercase text-[10px] tracking-wider">GPU Compute</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="font-display font-black text-2xl text-white">
            {profile.computeHours} <span className="text-xs font-mono text-purple-400">HRS</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-purple-400 rounded-full" style={{ width: '60%' }} />
          </div>
          <span className="text-[10px] font-mono text-purple-300 block">H100 Tensor-Core Equiv</span>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-5 rounded-2xl border border-pink-500/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono uppercase text-[10px] tracking-wider">Total Creations</span>
            <Sparkles className="w-4 h-4 text-pink-400" />
          </div>
          <div className="font-display font-black text-2xl text-white">
            {profile.creationsCount} <span className="text-xs font-mono text-pink-400">ITEMS</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-pink-400 rounded-full" style={{ width: '92%' }} />
          </div>
          <span className="text-[10px] font-mono text-pink-300 block">Media, Code & Chats</span>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono uppercase text-[10px] tracking-wider">Vault Storage</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-display font-black text-2xl text-white">
            {(profile.storageMb / 1024).toFixed(2)} <span className="text-xs font-mono text-emerald-400">GB</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: '32%' }} />
          </div>
          <span className="text-[10px] font-mono text-emerald-300 block">Encrypted IPFS Node</span>
        </div>
      </div>

      {/* Subscription Tier Details & Active Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tier Benefits */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <h3 className="font-display font-bold text-sm text-white">
                Active Tier: {profile.tier}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Auto-Renew Active
            </span>
          </div>

          <div className="space-y-2.5">
            {[
              'Unlimited high-speed Quantum Omni 4.5 reasoning',
              'Native 4K Photorealistic & 8K Octane Image generation',
              'Cinematic 60fps video generation with trajectory control',
              'Priority latency queue across all 9 specialized AI engines',
              'Dedicated private inference server proxy with zero logging'
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Global Cluster Status */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" />
              <h3 className="font-display font-bold text-sm text-white">
                OGOO Global Neural Infrastructure
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">99.98% SLA</span>
          </div>

          <div className="space-y-3">
            {clusterNodes.map((node, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">{node.name}</div>
                  <div className="text-[10px] font-mono text-slate-400">{node.status}</div>
                </div>
                <div className="text-right font-mono text-cyan-400 font-bold">
                  {node.load} Load
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
