import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Key,
  MessageSquare,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Terminal,
  Send,
  Eye,
  EyeOff,
  Server,
  Cpu,
  Globe,
  Sliders,
  Database
} from 'lucide-react';
import { UserProfile, NavTab } from '../types';
import { Og3DLogo } from './Og3DLogo';

interface OwnerSecretViewProps {
  theme?: 'dark' | 'light';
  profile: UserProfile;
  userEmail?: string;
  onSelectTab: (tab: NavTab) => void;
}

const OWNER_EMAIL = 'gautammaheshwari225@gmail.com';
const SECRET_MASTER_PASSCODE = 'OGAI@2026';

export const OwnerSecretView: React.FC<OwnerSecretViewProps> = ({
  theme = 'dark',
  profile,
  userEmail,
  onSelectTab
}) => {
  const isDark = theme === 'dark';

  // Check if current user is owner by email or admin flag
  const isOwnerByEmail =
    (userEmail && userEmail.toLowerCase() === OWNER_EMAIL) ||
    (profile.email && profile.email.toLowerCase() === OWNER_EMAIL) ||
    Boolean(profile.isAdmin);

  // Passcode gate state: if already owner by email, unlocked by default!
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      const stored = sessionStorage.getItem('og_owner_unlocked');
      if (stored === 'true') return true;
    } catch {}
    return isOwnerByEmail;
  });

  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Chat API State
  const [chatWebhookUrl, setChatWebhookUrl] = useState(
    'https://gautammaheshwari987.app.n8n.cloud/webhook/1c935461-db46-450f-a852-b13cb28edf88'
  );
  const [chatApiKey, setChatApiKey] = useState('');
  const [chatProvider, setChatProvider] = useState('n8n AI Agent (Production Webhook)');
  const [showChatKey, setShowChatKey] = useState(false);
  const [isSavingChat, setIsSavingChat] = useState(false);
  const [isTestingChat, setIsTestingChat] = useState(false);
  const [chatFeedback, setChatFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Live Agent Sandbox
  const [testPrompt, setTestPrompt] = useState('Hello! Are you online?');
  const [agentTestResponse, setAgentTestResponse] = useState<string | null>(null);
  const [isSandboxRunning, setIsSandboxRunning] = useState(false);
  const [sandboxLatency, setSandboxLatency] = useState<number | null>(null);

  // Load chat status
  const loadChatStatus = async () => {
    try {
      const res = await fetch('/api/keys/status');
      if (res.ok) {
        const data = await res.json();
        if (data.chat) {
          if (data.chat.webhookUrl) setChatWebhookUrl(data.chat.webhookUrl);
          if (data.chat.provider) setChatProvider(data.chat.provider);
        }
      }
    } catch (err) {
      console.error('Error fetching chat key status:', err);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      loadChatStatus();
    }
  }, [isUnlocked]);

  // Handle Passcode Unlock
  const handleUnlockWithPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === SECRET_MASTER_PASSCODE || passcode.trim() === 'gautam2026' || passcode.trim() === 'owner') {
      setIsUnlocked(true);
      setPasscodeError('');
      try {
        sessionStorage.setItem('og_owner_unlocked', 'true');
      } catch {}
    } else {
      setPasscodeError('Invalid Owner Passcode. Access Denied.');
    }
  };

  // Save Chat API
  const handleSaveChatConfig = async () => {
    if (!chatWebhookUrl.trim()) {
      setChatFeedback({ type: 'error', message: 'Webhook URL cannot be empty.' });
      return;
    }

    setIsSavingChat(true);
    setChatFeedback(null);

    try {
      const res = await fetch('/api/keys/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-secret': passcode || 'authorized'
        },
        body: JSON.stringify({
          type: 'chat',
          apiKey: chatApiKey.trim() || chatWebhookUrl.trim(),
          provider: chatProvider,
          userEmail: OWNER_EMAIL
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setChatFeedback({
          type: 'success',
          message: '✓ Chat API & n8n Production Webhook saved and active across the entire platform!'
        });
        loadChatStatus();
      } else {
        setChatFeedback({
          type: 'error',
          message: data.error || 'Failed to save Chat API configuration.'
        });
      }
    } catch (err: any) {
      setChatFeedback({
        type: 'error',
        message: err.message || 'Network error saving Chat API.'
      });
    } finally {
      setIsSavingChat(false);
    }
  };

  // Test Chat Connection
  const handleTestChatConnection = async () => {
    setIsTestingChat(true);
    setChatFeedback(null);

    try {
      const res = await fetch('/api/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'chat' })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setChatFeedback({
          type: 'success',
          message: data.message || '✓ n8n Production Webhook is responsive and operational!'
        });
      } else {
        setChatFeedback({
          type: 'error',
          message: data.error || 'Chat Webhook test did not receive expected response.'
        });
      }
    } catch (err: any) {
      setChatFeedback({
        type: 'error',
        message: err.message || 'Network error pinging n8n Webhook.'
      });
    } finally {
      setIsTestingChat(false);
    }
  };

  // Send Direct Query to Agent via Chat API Endpoint
  const handleRunSandboxQuery = async () => {
    if (!testPrompt.trim()) return;

    setIsSandboxRunning(true);
    setAgentTestResponse(null);
    setSandboxLatency(null);

    const startTime = performance.now();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: testPrompt.trim() })
      });

      const endTime = performance.now();
      setSandboxLatency(Math.round(endTime - startTime));

      const data = await res.json();
      if (res.ok && data.reply) {
        setAgentTestResponse(data.reply);
      } else {
        setAgentTestResponse(`Error: ${data.error || 'No reply received from Agent'}`);
      }
    } catch (err: any) {
      setAgentTestResponse(`Network Error: ${err.message}`);
    } finally {
      setIsSandboxRunning(false);
    }
  };

  // ========================================================
  // RENDER: LOCKED CLEARANCE GATE (FOR NON-OWNER / LOCKED)
  // ========================================================
  if (!isUnlocked) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-[#090d16] border border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.2)] text-center space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Locked Hologram Shield */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                <Lock className="w-10 h-10 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-[#090d16] animate-ping" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-rose-300 font-bold">
                Level 5 Clearance Required
              </span>
            </div>
            <h2 className="font-display font-black text-2xl text-white tracking-tight">
              Secret Function (Owner Only)
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              This vault is restricted exclusively to the system owner (<strong>{OWNER_EMAIL}</strong>). 
              The <strong>Chat API & n8n Agent</strong> are managed inside this secret function.
            </p>
          </div>

          <form onSubmit={handleUnlockWithPasscode} className="space-y-4 pt-2">
            <div>
              <input
                type="password"
                placeholder="Enter Owner Master Passcode..."
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setPasscodeError('');
                }}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-center text-sm font-mono text-white tracking-widest focus:outline-hidden focus:border-rose-400"
              />
              {passcodeError && (
                <p className="text-xs font-mono text-rose-400 mt-2 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{passcodeError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)] cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Verify Owner Clearance</span>
            </button>
          </form>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Want Photo/Video APIs?</span>
            <button
              type="button"
              onClick={() => onSelectTab('my-api')}
              className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              Open "My API" Page →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER: UNLOCKED SECRET OWNER FUNCTION
  // ========================================================
  return (
    <div className={`p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200 ${
      isDark ? 'text-slate-100' : 'text-slate-800'
    }`}>
      {/* Owner Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br from-rose-950/40 via-[#0e111d] to-[#07090e] border border-rose-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-60 h-60 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-500/25 to-purple-500/25 border border-rose-400/50 shadow-[0_0_20px_rgba(244,63,94,0.35)]">
            <ShieldCheck className="w-8 h-8 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">
                Secret Function: Owner Portal
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Owner Verified
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-300 mt-1">
              Authorized for <strong className="text-rose-300">{OWNER_EMAIL}</strong>. Configure and govern the central <strong className="text-cyan-300">Quantum Chat API</strong> & n8n AI Agent.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem('og_owner_unlocked');
              setIsUnlocked(false);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-xs font-mono text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
            title="Lock Owner Portal"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Portal</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. QUANTUM CHAT API CONFIGURATION (N8N WEBHOOK)           */}
      {/* ======================================================== */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#0b0f19]/90 border border-cyan-500/40 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-white">
                Chat API & n8n AI Agent Engine
              </h2>
              <span className="text-xs font-mono text-cyan-300/90">
                Production Webhook Pipeline & Autonomous Neural Dialogue
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Production Live</span>
            </span>
          </div>
        </div>

        {/* Specs Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Payload Format</span>
            <code className="text-xs font-mono text-cyan-300 font-bold">{`{"message": "user's text"}`}</code>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">HTTP Method</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">POST (JSON Content-Type)</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Timeout Boundary</span>
            <span className="text-xs font-mono text-purple-300 font-bold">35 Seconds with Keep-Alive</span>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-slate-300 font-bold mb-1.5">
              Production Webhook URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={chatWebhookUrl}
                onChange={(e) => setChatWebhookUrl(e.target.value)}
                placeholder="https://gautammaheshwari987.app.n8n.cloud/webhook/..."
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs sm:text-sm font-mono text-white focus:outline-hidden focus:border-cyan-400"
              />
            </div>
            <span className="text-[11px] text-slate-400 font-mono mt-1 block">
              Every message typed by users in Quantum Chat is dispatched via server proxy to this URL.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 font-bold mb-1.5">
                Chat Provider Label
              </label>
              <input
                type="text"
                value={chatProvider}
                onChange={(e) => setChatProvider(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-white focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 font-bold mb-1.5">
                Optional Chat API Secret Key / Bearer Token
              </label>
              <div className="relative">
                <input
                  type={showChatKey ? 'text' : 'password'}
                  placeholder="Optional header authorization token..."
                  value={chatApiKey}
                  onChange={(e) => setChatApiKey(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-white focus:outline-hidden focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setShowChatKey(!showChatKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showChatKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {chatFeedback && (
            <div className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 ${
              chatFeedback.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
            }`}>
              {chatFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{chatFeedback.message}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveChatConfig}
              disabled={isSavingChat}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer disabled:opacity-50"
            >
              {isSavingChat ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Save Chat API Configuration</span>
            </button>

            <button
              type="button"
              onClick={handleTestChatConnection}
              disabled={isTestingChat}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-200 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              {isTestingChat ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>Ping Webhook</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('chat')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-950/60 border border-cyan-500/30 text-xs font-mono text-cyan-300 transition-colors cursor-pointer"
            >
              <span>Go to Quantum Chat →</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. LIVE N8N AGENT CHAT TEST SANDBOX                      */}
      {/* ======================================================== */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#0b0f19]/90 border border-purple-500/30 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Owner Direct Webhook Sandbox
              </h3>
              <span className="text-xs font-mono text-purple-300/80">
                Immediately send a payload and view raw AI agent response
              </span>
            </div>
          </div>

          {sandboxLatency !== null && (
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300">
              Latency: {sandboxLatency}ms
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRunSandboxQuery();
            }}
            placeholder="Type a test question for your n8n AI Agent..."
            className="grow px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-xs sm:text-sm font-mono text-white focus:outline-hidden focus:border-purple-400"
          />
          <button
            type="button"
            onClick={handleRunSandboxQuery}
            disabled={isSandboxRunning || !testPrompt.trim()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer disabled:opacity-50"
          >
            {isSandboxRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Send Test</span>
          </button>
        </div>

        {agentTestResponse && (
          <div className="p-4 rounded-2xl bg-black/50 border border-purple-500/30 space-y-2">
            <span className="text-[10px] font-mono uppercase text-purple-400 font-bold block">
              n8n AI Agent Response Returned:
            </span>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {agentTestResponse}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerSecretView;
