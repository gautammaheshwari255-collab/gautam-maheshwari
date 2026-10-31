import React, { useState, useEffect } from 'react';
import {
  Star,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ShieldCheck,
  RefreshCw,
  Zap,
  Sliders,
  Users,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Coins,
  Receipt,
  Layers,
  Search,
  Filter
} from 'lucide-react';
import { UserProfile, StarTransaction, ToolPricing } from '../types';
import { defaultToolPricing } from '../data/mockData';
import { Og3DLogo } from './Og3DLogo';

interface StarsViewProps {
  profile: UserProfile;
  onUpdateStars: (newStars: number) => void;
  onSelectTab?: (tab: any) => void;
}

interface AdminUser {
  email: string;
  name: string;
  stars: number;
  isAdmin: boolean;
  lastUpdated: string;
}

export const StarsView: React.FC<StarsViewProps> = ({
  profile,
  onUpdateStars,
  onSelectTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'pricing' | 'topup' | 'admin'>('ledger');
  const [transactions, setTransactions] = useState<StarTransaction[]>([]);
  const [pricing, setPricing] = useState<ToolPricing>(defaultToolPricing);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all');

  // Admin state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [newBalanceInput, setNewBalanceInput] = useState('');
  const [balanceReason, setBalanceReason] = useState('Admin manual adjustment');
  const [adminStatusMsg, setAdminStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [adminPricingInput, setAdminPricingInput] = useState<ToolPricing>(defaultToolPricing);

  // Fetch stars transactions and pricing
  const fetchStarsData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch balance & refresh profile
      const balRes = await fetch(`/api/stars/balance?email=${encodeURIComponent(profile.email)}`);
      if (balRes.ok) {
        const balData = await balRes.json();
        const currentBal = balData.user?.stars ?? balData.stars ?? balData.balance;
        if (balData.success && typeof currentBal === 'number') {
          onUpdateStars(currentBal);
        }
      }

      // 2. Fetch transactions
      const txRes = await fetch(`/api/stars/transactions?email=${encodeURIComponent(profile.email)}`);
      if (txRes.ok) {
        const txData = await txRes.json();
        if (txData.success && Array.isArray(txData.transactions)) {
          setTransactions(txData.transactions);
        }
      }

      // 3. Fetch pricing
      const prRes = await fetch('/api/stars/pricing');
      if (prRes.ok) {
        const prData = await prRes.json();
        if (prData.success && prData.pricing) {
          setPricing(prData.pricing);
          setAdminPricingInput(prData.pricing);
        }
      }

      // 4. If admin, fetch all users
      if (profile.isAdmin) {
        fetchAdminUsers();
      }
    } catch (err) {
      console.error('Failed to fetch stars data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch(`/api/stars/admin/users?adminEmail=${encodeURIComponent(profile.email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setAdminUsers(data.users);
          if (data.users.length > 0 && !selectedUserEmail) {
            setSelectedUserEmail(data.users[0].email);
            setNewBalanceInput(String(data.users[0].stars));
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    }
  };

  useEffect(() => {
    fetchStarsData();
  }, [profile.email, profile.isAdmin]);

  // Handle Top-Up & Plan Upgrades
  const handleUpgradePlan = async (planId: string, planName: string, amountPaid: number) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/credits/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          planId,
          paymentMethod: 'UPI / NetBanking'
        })
      });

      const data = await res.json();
      if (data.success && typeof data.newBalance === 'number') {
        onUpdateStars(data.newBalance);
        await fetchStarsData();
        setActiveSubTab('ledger');
      } else {
        alert(data.error || 'Failed to upgrade plan');
      }
    } catch (err) {
      console.error('Error upgrading plan:', err);
      alert('Network error upgrading credits.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUp = async (amount: number, packageName: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/stars/top-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          amount,
          packageName
        })
      });

      const data = await res.json();
      if (data.success && typeof data.newBalance === 'number') {
        onUpdateStars(data.newBalance);
        await fetchStarsData();
        setActiveSubTab('ledger');
      } else {
        alert(data.error || 'Failed to top up stars');
      }
    } catch (err) {
      console.error('Error topping up:', err);
      alert('Network error topping up stars.');
    } finally {
      setIsLoading(false);
    }
  };

  // Admin: Update User Balance
  const handleAdminSetBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserEmail || newBalanceInput === '') return;

    setAdminStatusMsg(null);
    try {
      const res = await fetch('/api/stars/admin/set-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: profile.email,
          targetEmail: selectedUserEmail,
          newBalance: Number(newBalanceInput),
          reason: balanceReason || 'Admin adjustment'
        })
      });

      const data = await res.json();
      if (data.success) {
        setAdminStatusMsg({ type: 'success', text: data.message || `Updated ${selectedUserEmail} balance to ${newBalanceInput} ⭐ Stars.` });
        if (selectedUserEmail.toLowerCase() === profile.email.toLowerCase()) {
          onUpdateStars(Number(newBalanceInput));
        }
        await fetchAdminUsers();
        await fetchStarsData();
      } else {
        setAdminStatusMsg({ type: 'error', text: data.error || 'Failed to update balance' });
      }
    } catch (err: any) {
      setAdminStatusMsg({ type: 'error', text: err?.message || 'Network error updating balance' });
    }
  };

  // Admin: Update Tool Pricing
  const handleAdminUpdatePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminStatusMsg(null);
    try {
      const res = await fetch('/api/stars/admin/set-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: profile.email,
          pricing: adminPricingInput
        })
      });

      const data = await res.json();
      if (data.success) {
        setAdminStatusMsg({ type: 'success', text: 'AI Tool pricing updated successfully across OGOO.com.' });
        setPricing(data.pricing);
      } else {
        setAdminStatusMsg({ type: 'error', text: data.error || 'Failed to update pricing' });
      }
    } catch (err: any) {
      setAdminStatusMsg({ type: 'error', text: err?.message || 'Network error updating pricing' });
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return (
        t.reason.toLowerCase().includes(q) ||
        (t.toolId && t.toolId.toLowerCase().includes(q)) ||
        t.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* ================= HERO BALANCE BANNER ================= */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0c101c] via-[#11172a] to-[#1e1738] border border-amber-500/30 shadow-[0_0_50px_-15px_rgba(245,158,11,0.25)] overflow-hidden">
        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Balance info */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 font-mono text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>OGOO.COM NATIVE CURRENCY</span>
              {profile.isAdmin && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[10px]">
                  ADMIN ACCESS
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-4xl sm:text-6xl font-black font-display text-white tracking-tight flex items-center gap-3">
                <Og3DLogo size={52} variant="credit" glow={true} animated={true} />
                <span>{(profile.stars ?? 400).toLocaleString()}</span>
              </span>
              <span className="text-lg sm:text-xl font-bold text-amber-300/90 font-mono uppercase tracking-wider">
                Credits Balance
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              OG AI Credits power all AI image syntheses, neural video generations, upscalers, and creative studios. Every pioneer receives <strong className="text-amber-200">400 Initial Credits free</strong>. Credits are only deducted upon successful AI creation.
            </p>
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              id="stars-refresh-btn"
              type="button"
              onClick={fetchStarsData}
              disabled={isLoading}
              className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              title="Refresh ledger & balance"
            >
              <RefreshCw className={`w-4 h-4 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Balance</span>
            </button>

            <button
              id="stars-topup-btn"
              type="button"
              onClick={() => setActiveSubTab('topup')}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
            >
              <Og3DLogo size={20} variant="credit" glow={false} />
              <span>Get More OG Credits</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= NAVIGATION TABS ================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10">
        <button
          type="button"
          id="stars-tab-ledger"
          onClick={() => setActiveSubTab('ledger')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'ledger'
              ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Receipt className="w-4 h-4 text-amber-400" />
          <span>Transactions History ({transactions.length})</span>
        </button>

        <button
          type="button"
          id="stars-tab-pricing"
          onClick={() => setActiveSubTab('pricing')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'pricing'
              ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-400" />
          <span>AI Tools Pricing Matrix</span>
        </button>

        <button
          type="button"
          id="stars-tab-topup"
          onClick={() => setActiveSubTab('topup')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'topup'
              ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Get ⭐ Star Packages</span>
        </button>

        {profile.isAdmin && (
          <button
            type="button"
            id="stars-tab-admin"
            onClick={() => {
              setActiveSubTab('admin');
              fetchAdminUsers();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'admin'
                ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-purple-200 border border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                : 'text-purple-300 hover:text-white hover:bg-purple-500/10'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Admin Controls</span>
          </button>
        )}
      </div>

      {/* ================= TAB 1: TRANSACTIONS LEDGER ================= */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#0a0e19]/70 border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions, tool names, reasons..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
              />
            </div>

            {/* Type Filter Buttons */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-amber-500/30 text-amber-200'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({transactions.length})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('credit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === 'credit'
                    ? 'bg-emerald-500/30 text-emerald-200'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Credits (+)
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('debit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === 'debit'
                    ? 'bg-rose-500/30 text-rose-200'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Deductions (-)
              </button>
            </div>
          </div>

          {/* Transactions List */}
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0a0e19]/50 border border-white/10 space-y-3">
              <Receipt className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No transactions found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No star transactions match your filter criteria. Generate an AI image or video to see real-time deductions here!
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#0a0e19]/70 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Timestamp & ID</th>
                      <th className="p-4">Activity / Description</th>
                      <th className="p-4">Tool ID</th>
                      <th className="p-4 text-right">Stars Delta</th>
                      <th className="p-4 text-right">Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {filteredTransactions.map((tx) => {
                      const isCredit = tx.type === 'credit';
                      return (
                        <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-mono text-[11px] text-slate-400">
                            <div>{new Date(tx.timestamp).toLocaleDateString()}</div>
                            <div className="text-[10px] text-slate-500">{new Date(tx.timestamp).toLocaleTimeString()}</div>
                          </td>
                          <td className="p-4 font-medium text-white">
                            <div className="flex items-center gap-2">
                              <span
                                className={`p-1.5 rounded-lg shrink-0 ${
                                  isCredit
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {isCredit ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                              </span>
                              <span>{tx.reason}</span>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-[11px] text-cyan-300">
                            {tx.toolId ? (
                              <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30">
                                {tx.toolId}
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className={`p-4 text-right font-mono font-bold text-sm ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isCredit ? `+${tx.amount}` : `-${tx.amount}`} ⭐
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-amber-300">
                            {tx.balanceAfter} ⭐
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: AI TOOLS PRICING MATRIX ================= */}
      {activeSubTab === 'pricing' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-start gap-3">
            <Coins className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200 leading-relaxed">
              <strong className="text-amber-300">Guaranteed Transparent Pricing:</strong> Stars are only deducted <em className="underline">after</em> an AI generation finishes successfully. If generation fails or is aborted, zero stars are charged.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Image Standard */}
            <div className="p-5 rounded-2xl bg-[#0a0e19]/80 border border-purple-500/30 hover:border-purple-400/60 transition-all space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">AI Image</span>
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/40 font-mono font-bold text-xs">
                  {pricing.image_standard} ⭐ Stars
                </span>
              </div>
              <h4 className="font-display font-bold text-base text-white">Standard AI Image</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Standard resolution prompt synthesis with stylistic preset conditioning and negative prompt filters.
              </p>
            </div>

            {/* Image 8K */}
            <div className="p-5 rounded-2xl bg-[#0a0e19]/80 border border-purple-500/50 hover:border-purple-400/80 transition-all space-y-3 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-0.5 bg-gradient-to-l from-purple-600 to-pink-600 text-[10px] font-bold text-white rounded-bl-xl font-mono">
                POPULAR
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wider">AI Image Studio</span>
                <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-200 border border-pink-400/40 font-mono font-bold text-xs">
                  {pricing.image_8k} ⭐ Stars
                </span>
              </div>
              <h4 className="font-display font-bold text-base text-white">8K Photorealistic Master</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                High-definition Imagen 3.0 generation with extreme photorealism, ray tracing, and aspect ratio calibration.
              </p>
            </div>

            {/* Video Standard */}
            <div className="p-5 rounded-2xl bg-[#0a0e19]/80 border border-pink-500/30 hover:border-pink-400/60 transition-all space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wider">AI Video</span>
                <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-200 border border-pink-400/40 font-mono font-bold text-xs">
                  {pricing.video_standard} ⭐ Stars
                </span>
              </div>
              <h4 className="font-display font-bold text-base text-white">HD Neural Video</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                5-second cinematic temporal synthesis with motion dynamics, camera movement, and audio sync.
              </p>
            </div>

            {/* Video 4K */}
            <div className="p-5 rounded-2xl bg-[#0a0e19]/80 border border-pink-500/50 hover:border-pink-400/80 transition-all space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wider">AI Video Generator</span>
                <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-200 border border-pink-400/40 font-mono font-bold text-xs">
                  {pricing.video_4k} ⭐ Stars
                </span>
              </div>
              <h4 className="font-display font-bold text-base text-white">4K 60FPS Video Master</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                10-second ultra-high-definition Google Veo video with frame interpolation and physics coherence.
              </p>
            </div>

            {/* Photo Inpaint */}
            <div className="p-5 rounded-2xl bg-[#0a0e19]/80 border border-emerald-500/30 hover:border-emerald-400/60 transition-all space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">Photo Lab</span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 font-mono font-bold text-xs">
                  {pricing.photo_inpaint} ⭐ Stars
                </span>
              </div>
              <h4 className="font-display font-bold text-base text-white">Object Inpainting & Relight</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Brush-targeted generative fill, background replacement, and intelligent shadow relighting.
              </p>
            </div>

            {/* Photo Upscale */}
            <div className="p-5 rounded-2xl bg-[#0a0e19]/80 border border-emerald-500/30 hover:border-emerald-400/60 transition-all space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">Photo Lab</span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 font-mono font-bold text-xs">
                  {pricing.photo_upscale} ⭐ Stars
                </span>
              </div>
              <h4 className="font-display font-bold text-base text-white">4x Neural Super-Resolution</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Restores degraded textures, sharpens facial details, and enhances prints up to 16-megapixel resolution.
              </p>
            </div>

            {/* Quantum Chat */}
            <div className="p-5 rounded-2xl bg-[#0a0e19]/80 border border-cyan-500/30 hover:border-cyan-400/60 transition-all space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">Chat & Reasoning</span>
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 font-mono font-bold text-xs">
                  {pricing.chat_message} ⭐ Star / msg
                </span>
              </div>
              <h4 className="font-display font-bold text-base text-white">Quantum Reasoning Chat</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multimodal reasoning, file ingestion, vision camera parsing, and real-time coding assistance.
              </p>
            </div>

            {/* Audio Voice */}
            <div className="p-5 rounded-2xl bg-[#0a0e19]/80 border border-amber-500/30 hover:border-amber-400/60 transition-all space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Voice Studio</span>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/40 font-mono font-bold text-xs">
                  {pricing.audio_voice} ⭐ Stars
                </span>
              </div>
              <h4 className="font-display font-bold text-base text-white">Neural Voice Synthesis</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hyper-expressive text-to-speech with studio microphone mastering, emotion control, and multi-language support.
              </p>
            </div>

            {/* Music Gen */}
            <div className="p-5 rounded-2xl bg-[#0a0e19]/80 border border-indigo-500/30 hover:border-indigo-400/60 transition-all space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">Music Studio</span>
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/40 font-mono font-bold text-xs">
                  {pricing.music_gen} ⭐ Stars
                </span>
              </div>
              <h4 className="font-display font-bold text-base text-white">Instrumental Track Synthesis</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full-spectrum multi-instrument generative music composition with custom bpm, genre, and duration.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: TOP-UP PACKAGES ================= */}
      {activeSubTab === 'topup' && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="font-display font-black text-2xl text-white">
              Upgrade Credits & Acquire ⭐ Stars
            </h3>
            <p className="text-xs text-slate-300">
              Instant credit deposit via UPI / NetBanking. Continue generating unrestricted AI photos, 4K videos, and smart editor creations.
            </p>
          </div>

          {/* ₹385 Starter Credits Security Notice */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">
                  ₹385 Starter Credits Policy (Active & Claimed)
                </span>
                <p className="text-[11px] text-amber-200/80">
                  Every account receives ₹385 worth of starter credits strictly once on first registration.
                  Starter credits cannot be reclaimed via refreshing, logging out, or reinstalling.
                </p>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-bold text-xs whitespace-nowrap">
              ₹{profile.stars} REMAINING
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Plan 1: ₹100 Starter */}
            <div className="p-6 rounded-3xl bg-[#0a0e19]/90 border border-white/10 hover:border-cyan-400/40 transition-all flex flex-col justify-between space-y-6 shadow-xl">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-400 uppercase">Starter Boost</span>
                  <span className="text-base">⭐</span>
                </div>
                <div className="font-display font-black text-3xl text-white">
                  700 <span className="text-sm font-mono text-cyan-300 font-bold">Credits</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ideal for photo retouching, up to 70 background removals, or 28 HD video clips.
                </p>
                <div className="font-mono text-xl font-black text-white">₹100</div>
              </div>

              <button
                type="button"
                id="topup-pack-100"
                onClick={() => handleUpgradePlan('plan_100', '₹100 Starter Boost', 100)}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-cyan-500 hover:text-slate-950 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Get 700 Credits (₹100)
              </button>
            </div>

            {/* Plan 2: ₹500 Creator */}
            <div className="p-6 rounded-3xl bg-[#0a0e19]/90 border border-amber-500/30 hover:border-amber-400/60 transition-all flex flex-col justify-between space-y-6 shadow-xl">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-300 uppercase">Creator Pro</span>
                  <span className="text-base">⭐</span>
                </div>
                <div className="font-display font-black text-3xl text-white">
                  1,200 <span className="text-sm font-mono text-amber-300 font-bold">Credits</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  High-volume workflow with +200 bonus credits for video edits and generative audio.
                </p>
                <div className="font-mono text-xl font-black text-amber-400">₹500</div>
              </div>

              <button
                type="button"
                id="topup-pack-500"
                onClick={() => handleUpgradePlan('plan_500', '₹500 Creator Pro', 500)}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-slate-950 text-xs font-bold border border-amber-400/40 transition-all cursor-pointer shadow-md"
              >
                Get 1,200 Credits (₹500)
              </button>
            </div>

            {/* Plan 3: ₹1,000 Studio (Most Popular) */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-purple-950/30 to-[#0a0e19]/90 border-2 border-purple-400/60 hover:border-purple-400 transition-all flex flex-col justify-between space-y-6 shadow-[0_0_35px_-5px_rgba(168,85,247,0.3)] relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold font-mono text-[10px] tracking-wider shadow-md">
                MOST POPULAR
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-purple-300 uppercase">Studio Master</span>
                  <span className="text-xl animate-pulse">⭐</span>
                </div>
                <div className="font-display font-black text-3xl text-purple-200">
                  2,500 <span className="text-sm font-mono text-purple-300 font-bold">Credits</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Best value for studios. Includes 4K video exports, Image-to-Video AI, and priority neural compute.
                </p>
                <div className="font-mono text-xl font-black text-purple-300">₹1,000</div>
              </div>

              <button
                type="button"
                id="topup-pack-1000"
                onClick={() => handleUpgradePlan('plan_1000', '₹1,000 Studio Master', 1000)}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:scale-105 active:scale-95 text-white text-xs font-extrabold transition-all cursor-pointer shadow-lg shadow-purple-500/25"
              >
                Get 2,500 Credits (₹1,000)
              </button>
            </div>

            {/* Plan 4: ₹10,000 VIP Ultimate Pass */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-950/40 via-purple-950/30 to-[#0a0e19]/90 border-2 border-amber-400 hover:border-yellow-300 transition-all flex flex-col justify-between space-y-6 shadow-2xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black font-mono text-[10px] tracking-wider shadow-md">
                VIP UNLIMITED (1 MO + 12 DAYS FREE)
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-300 uppercase">VIP Ultimate Pass</span>
                  <span className="text-xl">👑</span>
                </div>
                <div className="font-display font-black text-2xl text-amber-300">
                  UNLIMITED <span className="text-xs font-mono text-slate-300 block font-normal">42 Days Validity</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Zero credit deduction! Unlimited 4K photo & video editing, Veo video creation, and private dedicated queue.
                </p>
                <div className="font-mono text-xl font-black text-amber-300">₹10,000</div>
              </div>

              <button
                type="button"
                id="topup-pack-10000-vip"
                onClick={() => handleUpgradePlan('plan_10000_vip', 'VIP Ultimate Pass', 10000)}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:scale-105 active:scale-95 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-lg shadow-amber-500/30"
              >
                Activate VIP Pass (₹10,000)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: ADMIN MANAGEMENT CONSOLE ================= */}
      {activeSubTab === 'admin' && profile.isAdmin && (
        <div className="space-y-6">
          {/* Status feedback */}
          {adminStatusMsg && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium border ${
                adminStatusMsg.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
              }`}
            >
              {adminStatusMsg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              )}
              <span>{adminStatusMsg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel 1: Adjust User Balance */}
            <div className="p-6 rounded-3xl bg-[#0a0e19]/90 border border-purple-500/30 space-y-5 shadow-xl">
              <div className="flex items-center gap-2 text-white font-display font-bold text-lg">
                <Users className="w-5 h-5 text-purple-400" />
                <span>Adjust User ⭐ Stars Balance</span>
              </div>
              <p className="text-xs text-slate-400">
                Authorized administrators can set or top up any user's balance directly in the secure server database.
              </p>

              <form onSubmit={handleAdminSetBalance} className="space-y-4">
                {/* User Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Target User</label>
                  <select
                    id="admin-select-user"
                    value={selectedUserEmail}
                    onChange={(e) => {
                      setSelectedUserEmail(e.target.value);
                      const target = adminUsers.find((u) => u.email === e.target.value);
                      if (target) setNewBalanceInput(String(target.stars));
                    }}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    {adminUsers.map((u) => (
                      <option key={u.email} value={u.email} className="bg-[#0b0f19] text-white">
                        {u.name} ({u.email}) — Current: {u.stars} ⭐ Stars {u.isAdmin ? '[ADMIN]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target email fallback if not in dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Or Type Any User Email</label>
                  <input
                    type="email"
                    id="admin-target-email-input"
                    placeholder="user@example.com"
                    value={selectedUserEmail}
                    onChange={(e) => setSelectedUserEmail(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>

                {/* New Stars Balance */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">New ⭐ Stars Balance</label>
                  <input
                    type="number"
                    id="admin-new-balance-input"
                    min="0"
                    placeholder="e.g. 500"
                    value={newBalanceInput}
                    onChange={(e) => setNewBalanceInput(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>

                {/* Reason */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Audit Reason</label>
                  <input
                    type="text"
                    id="admin-reason-input"
                    value={balanceReason}
                    onChange={(e) => setBalanceReason(e.target.value)}
                    placeholder="e.g. Compensation, VIP grant, Promo"
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <button
                  type="submit"
                  id="admin-save-balance-btn"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-102 active:scale-98 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
                >
                  Save User Balance in Database
                </button>
              </form>
            </div>

            {/* Panel 2: Update AI Tool Prices */}
            <div className="p-6 rounded-3xl bg-[#0a0e19]/90 border border-amber-500/30 space-y-5 shadow-xl">
              <div className="flex items-center gap-2 text-white font-display font-bold text-lg">
                <Sliders className="w-5 h-5 text-amber-400" />
                <span>Configure AI Tool Prices (⭐ Stars)</span>
              </div>
              <p className="text-xs text-slate-400">
                Adjust the star cost charged for each generation tool. Changes take effect across the entire platform immediately.
              </p>

              <form onSubmit={handleAdminUpdatePricing} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-300">Image Standard</label>
                    <input
                      type="number"
                      min="1"
                      value={adminPricingInput.image_standard}
                      onChange={(e) =>
                        setAdminPricingInput({ ...adminPricingInput, image_standard: Number(e.target.value) })
                      }
                      className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-300">Image 8K Master</label>
                    <input
                      type="number"
                      min="1"
                      value={adminPricingInput.image_8k}
                      onChange={(e) =>
                        setAdminPricingInput({ ...adminPricingInput, image_8k: Number(e.target.value) })
                      }
                      className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-300">Video Standard</label>
                    <input
                      type="number"
                      min="1"
                      value={adminPricingInput.video_standard}
                      onChange={(e) =>
                        setAdminPricingInput({ ...adminPricingInput, video_standard: Number(e.target.value) })
                      }
                      className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-300">Video 4K Veo</label>
                    <input
                      type="number"
                      min="1"
                      value={adminPricingInput.video_4k}
                      onChange={(e) =>
                        setAdminPricingInput({ ...adminPricingInput, video_4k: Number(e.target.value) })
                      }
                      className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-300">Photo Inpaint</label>
                    <input
                      type="number"
                      min="1"
                      value={adminPricingInput.photo_inpaint}
                      onChange={(e) =>
                        setAdminPricingInput({ ...adminPricingInput, photo_inpaint: Number(e.target.value) })
                      }
                      className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-300">Photo 4x Upscale</label>
                    <input
                      type="number"
                      min="1"
                      value={adminPricingInput.photo_upscale}
                      onChange={(e) =>
                        setAdminPricingInput({ ...adminPricingInput, photo_upscale: Number(e.target.value) })
                      }
                      className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="admin-save-pricing-btn"
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:scale-102 active:scale-98 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                >
                  Apply Global Tool Pricing Update
                </button>
              </form>
            </div>
          </div>

          {/* Registered Users List */}
          <div className="p-6 rounded-3xl bg-[#0a0e19]/90 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Registered Platform Users ({adminUsers.length})</span>
              </h4>
              <button
                type="button"
                onClick={fetchAdminUsers}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
              >
                ↻ Refresh Users
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-slate-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3 text-right">⭐ Stars Balance</th>
                    <th className="p-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {adminUsers.map((u) => (
                    <tr key={u.email} className="hover:bg-white/5">
                      <td className="p-3 font-semibold text-white">{u.name}</td>
                      <td className="p-3 font-mono text-slate-400">{u.email}</td>
                      <td className="p-3">
                        {u.isAdmin ? (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] border border-cyan-500/40 font-bold">
                            ADMIN
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-[10px]">USER</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-amber-300">
                        {u.stars} ⭐
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserEmail(u.email);
                            setNewBalanceInput(String(u.stars));
                            window.scrollTo({ top: 400, behavior: 'smooth' });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-600/30 text-purple-300 text-[11px] font-mono border border-white/10"
                        >
                          Edit Balance
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
