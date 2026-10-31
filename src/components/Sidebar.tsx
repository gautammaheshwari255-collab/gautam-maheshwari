import React from 'react';
import {
  MessageSquare,
  Image as ImageIcon,
  Film,
  Wand2,
  Boxes,
  History,
  Settings,
  User,
  Zap,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Cpu,
  ShieldCheck,
  LogOut,
  Star,
  Layers
} from 'lucide-react';
import { NavTab, UserProfile } from '../types';
import { Og3DLogo } from './Og3DLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { Smartphone, Coins, Lock, Key } from 'lucide-react';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  profile: UserProfile;
  onLogout?: () => void;
  theme: 'dark' | 'light';
  onOpenConvertAppModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  profile,
  onLogout,
  theme,
  onOpenConvertAppModal
}) => {
  const isDark = theme === 'dark';

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ElementType;
    badge?: string;
    color: string;
  }[] = [
    { id: 'chat', label: 'Quantum Chat', icon: MessageSquare, badge: 'Omni', color: 'text-cyan-400' },
    { id: 'image', label: 'AI Image Studio', icon: ImageIcon, badge: '8K', color: 'text-purple-400' },
    { id: 'fusion', label: 'AI Fusion Studio', icon: Layers, badge: 'All Fusion', color: 'text-fuchsia-400' },
    { id: 'video', label: 'AI Video Generator', icon: Film, badge: 'Veo 3', color: 'text-pink-400' },
    { id: 'photo-editor', label: 'AI Photo & Video Editor', icon: Wand2, badge: 'Full Suite', color: 'text-cyan-400' },
    { id: 'tools', label: 'AI Tools Suite', icon: Boxes, badge: '9 in 1', color: 'text-amber-400' },
    { id: 'stars', label: 'OG Credits', icon: Coins, badge: `₹${profile.stars ?? 385}`, color: 'text-amber-400' },
    { id: 'my-api', label: 'My API', icon: Key, badge: 'Photo/Vid', color: 'text-emerald-400' },
    { id: 'history', label: 'Creations & Vault', icon: History, color: 'text-blue-400' },
    { id: 'settings', label: 'App Preferences', icon: Settings, color: 'text-slate-400' },
    { id: 'profile', label: 'Neural Profile', icon: User, color: 'text-indigo-400' }
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          id="sidebar-mobile-backdrop"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="ogoo-main-sidebar"
        className={`fixed md:sticky top-0 left-0 z-50 h-screen transition-all duration-300 flex flex-col justify-between shrink-0 ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          isDark
            ? 'bg-[#0b0f19]/90 border-r border-cyan-950/40 backdrop-blur-xl text-slate-200'
            : 'bg-white/90 border-r border-slate-200 backdrop-blur-xl text-slate-800'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div
            onClick={() => handleNavClick('chat')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative shrink-0 flex items-center justify-center">
              <Og3DLogo size={36} glow={true} animated={true} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#07090e] animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#07090e]" />
            </div>

            {!collapsed && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-black text-xl tracking-tight text-white drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]">
                    OG AI<span className="text-cyan-400">.pro</span>
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400/80 font-semibold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 inline text-cyan-300 animate-pulse" />
                  3D Quantum OS
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Button */}
          <button
            id="sidebar-toggle-collapse-btn"
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-1.5 overflow-y-auto grow">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
            {!collapsed ? 'Core Intelligence' : '•••'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 via-purple-500/10 to-transparent text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                }`}
                title={collapsed ? item.label : undefined}
              >
                {/* Active Neon Line */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                )}

                <div
                  className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                    isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {!collapsed && (
                  <div className="flex items-center justify-between grow">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md uppercase font-bold tracking-wider ${
                          isActive
                            ? 'bg-cyan-400/20 text-cyan-200 border border-cyan-400/30'
                            : 'bg-white/5 text-slate-400 border border-white/5'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Compute Quota & Status */}
        <div className="p-3 border-t border-white/5">
          {!collapsed ? (
            <div
              onClick={() => handleNavClick('stars')}
              className="p-3 rounded-xl bg-gradient-to-b from-amber-950/20 via-yellow-950/10 to-purple-950/20 border border-amber-500/25 space-y-2.5 cursor-pointer hover:border-amber-400/50 transition-all group"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                  <Og3DLogo size={18} variant="credit" glow={true} />
                  <span>OG Credits</span>
                </div>
                <span className="font-mono text-[11px] text-amber-200 font-bold bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <span>{profile.stars ?? 400}</span>
                  <Og3DLogo size={14} variant="credit" glow={false} />
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-full shadow-[0_0_8px_#f59e0b]"
                  style={{ width: `${Math.min(100, Math.max(15, ((profile.stars ?? 400) / 1000) * 100))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="text-amber-400/80 group-hover:text-amber-300 transition-colors flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  View Ledger & Top-Up
                </span>
                <span className="text-emerald-400 font-semibold">400 Initial Bonus</span>
              </div>
            </div>
          ) : (
            <div
              onClick={() => handleNavClick('stars')}
              className="flex justify-center p-2 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-400 cursor-pointer hover:scale-105 transition-transform"
              title={`${profile.stars ?? 400} OG AI Credits Available`}
            >
              <Og3DLogo size={22} variant="credit" glow={true} animated={true} />
            </div>
          )}

          {/* Convert Web to App Trigger */}
          <div className="mt-2.5">
            {!collapsed ? (
              <PWAInstallButton
                variant="sidebar"
                onOpenConvertModal={onOpenConvertAppModal}
              />
            ) : (
              <button
                type="button"
                onClick={() => onOpenConvertAppModal?.()}
                className="w-full flex justify-center p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 cursor-pointer transition-colors"
                title="Convert Full Web to App (PWA)"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Secret Owner Access Gate */}
          <div className="mt-2">
            {!collapsed ? (
              <button
                type="button"
                id="sidebar-secret-portal-btn"
                onClick={() => handleNavClick('owner-secret')}
                className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                  activeTab === 'owner-secret'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.35)]'
                    : 'bg-rose-950/20 hover:bg-rose-950/40 border-rose-500/20 text-rose-300/80 hover:text-rose-200'
                }`}
                title="Restricted: Owner Secret Function (Chat API & Master Access)"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[11px] font-mono font-bold tracking-tight">Secret Function</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold uppercase tracking-wider">
                  Owner
                </span>
              </button>
            ) : (
              <button
                type="button"
                id="sidebar-secret-portal-btn"
                onClick={() => handleNavClick('owner-secret')}
                className={`w-full flex justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                  activeTab === 'owner-secret'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.35)]'
                    : 'bg-rose-950/20 hover:bg-rose-950/40 border-rose-500/20 text-rose-400'
                }`}
                title="Restricted: Owner Secret Function"
              >
                <Lock className="w-4 h-4 text-rose-400" />
              </button>
            )}
          </div>

          {/* User mini status */}
          <div className="mt-3 flex items-center justify-between gap-1">
            <div
              onClick={() => handleNavClick('profile')}
              className={`flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors grow min-w-0 ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <div className="relative shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-blue-500/20 border border-cyan-400/50 flex items-center justify-center">
                <User className="w-4 h-4 text-cyan-300" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#07090e]" />
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-white truncate">
                      {profile.name}
                    </span>
                    <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                  </div>
                  <span className="text-[10px] text-cyan-300 font-mono truncate">
                    {profile.tier}
                  </span>
                </div>
              )}
            </div>

            {onLogout && !collapsed && (
              <button
                type="button"
                id="sidebar-logout-btn"
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                title="Log Out of OGOO AI"
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
