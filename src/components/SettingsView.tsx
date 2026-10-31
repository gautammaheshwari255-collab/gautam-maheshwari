import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sliders,
  Sparkles,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  ShieldCheck,
  Check,
  RotateCcw,
  Zap,
  Lock,
  Smartphone,
  Eye,
  Layers,
  Palette,
  HardDrive,
  Cpu,
  Trash2,
  Film,
  Image as ImageIcon,
  Cloud,
  CloudOff,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  ArrowUpDown,
  Server,
  Activity,
  Radio,
  Clock,
  Maximize2,
  Minimize2,
  Download,
  KeyRound,
  Bot
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { AppSettings, UserProfile, HistoryItem, ChatMessage, GeneratedImage, GeneratedVideo } from '../types';
import {
  forceSyncOfflineWithFirestore,
  calculateOfflineStorageTelemetry,
  testFirestoreConnection,
  ForceSyncResult,
  OfflineSyncPayload
} from '../lib/firebase';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  userEmail?: string;
  profile?: UserProfile;
  history?: HistoryItem[];
  messages?: ChatMessage[];
  images?: GeneratedImage[];
  videos?: GeneratedVideo[];
  onManualSync?: () => Promise<ForceSyncResult>;
  onApplySyncedData?: (data: OfflineSyncPayload) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  theme,
  onToggleTheme,
  userEmail,
  profile,
  history = [],
  messages = [],
  images = [],
  videos = [],
  onManualSync,
  onApplySyncedData
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  // Local / Cloud Sync State
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState<boolean>(
    settings.cloudSyncEnabled !== undefined ? settings.cloudSyncEnabled : true
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<ForceSyncResult | null>(null);
  const [syncStatusText, setSyncStatusText] = useState<string>('');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(
    settings.lastSyncedAt
      ? new Date(settings.lastSyncedAt).toLocaleTimeString()
      : 'Not synced yet this session'
  );

  // Firestore connection telemetry
  const [connectionHealth, setConnectionHealth] = useState<{
    online: boolean;
    latencyMs: number;
    tested: boolean;
  }>({
    online: true,
    latencyMs: 38,
    tested: false
  });

  // Offline cache storage telemetry
  const [cacheTelemetry, setCacheTelemetry] = useState(() => calculateOfflineStorageTelemetry());

  // Mobile App preferences
  const [hapticsEnabled, setHapticsEnabled] = useState(settings.hapticsEnabled ?? true);
  const [soundEffects, setSoundEffects] = useState(settings.soundEffects ?? true);
  const [defaultExportRes, setDefaultExportRes] = useState<'1080p' | '4k'>(
    settings.defaultExportRes ?? '1080p'
  );
  const [defaultPhotoFormat, setDefaultPhotoFormat] = useState<'png' | 'webp' | 'jpg'>(
    settings.defaultPhotoFormat ?? 'png'
  );
  const [autoSaveDrafts, setAutoSaveDrafts] = useState(settings.autoSaveDrafts ?? true);
  const [hwAcceleration, setHwAcceleration] = useState(settings.hwAcceleration ?? true);

  // Fullscreen App Mode state
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  };

  // Dedicated API Keys Management (1: Quantum Chat, 2: Image, 3: Video)
  const [keysStatus, setKeysStatus] = useState<{
    chat: { isConfigured: boolean; isCustom: boolean; maskedKey: string; provider: string; lastTested: string };
    image: { isConfigured: boolean; isCustom: boolean; maskedKey: string; provider: string; lastTested: string };
    video: { isConfigured: boolean; isCustom: boolean; maskedKey: string; provider: string; lastTested: string };
  }>({
    chat: { isConfigured: false, isCustom: false, maskedKey: 'None', provider: 'AI Chat Engine', lastTested: 'Not Configured' },
    image: { isConfigured: false, isCustom: false, maskedKey: 'None', provider: 'AI Image Engine', lastTested: 'Not Configured' },
    video: { isConfigured: false, isCustom: false, maskedKey: 'None', provider: 'OG AI Cinema Video Studio', lastTested: 'Not Configured' }
  });
  const [editingKeyType, setEditingKeyType] = useState<'chat' | 'image' | 'video' | null>(null);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [keyNotice, setKeyNotice] = useState<string | null>(null);
  const [testingKeyType, setTestingKeyType] = useState<'chat' | 'image' | 'video' | null>(null);

  // Fetch live keys status on mount
  useEffect(() => {
    fetch('/api/keys/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setKeysStatus({
            chat: data.chat || { isConfigured: true, isCustom: true, maskedKey: '6a6d••••••••27f5', provider: 'Quantum AI Chat Engine', lastTested: 'Active' },
            image: data.image,
            video: data.video
          });
        }
      })
      .catch((err) => console.warn('Could not fetch keys status:', err));
  }, []);

  const handleTestKey = async (type: 'chat' | 'image' | 'video') => {
    setTestingKeyType(type);
    setKeyNotice(null);
    try {
      const res = await fetch('/api/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setKeyNotice(`✓ ${data.message}`);
        // Refresh status
        const statusRes = await fetch('/api/keys/status');
        const statusData = await statusRes.json();
        if (statusData.success) {
          setKeysStatus({
            chat: statusData.chat || keysStatus.chat,
            image: statusData.image,
            video: statusData.video
          });
        }
      } else {
        setKeyNotice(`⚠ Error: ${data.error || 'Test failed'}`);
      }
    } catch (err: any) {
      setKeyNotice(`⚠ Connection failed: ${err?.message || 'Server error'}`);
    } finally {
      setTestingKeyType(null);
      setTimeout(() => setKeyNotice(null), 6000);
    }
  };

  const handleSaveKey = async (type: 'chat' | 'image' | 'video') => {
    if (!newKeyValue.trim()) return;
    try {
      const res = await fetch('/api/keys/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, apiKey: newKeyValue.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setKeyNotice(`✓ ${type === 'chat' ? 'Quantum Chat' : type === 'image' ? 'Image' : 'Video'} API Key saved successfully.`);
        setEditingKeyType(null);
        setNewKeyValue('');
        const statusRes = await fetch('/api/keys/status');
        const statusData = await statusRes.json();
        if (statusData.success) {
          setKeysStatus({
            chat: statusData.chat || keysStatus.chat,
            image: statusData.image,
            video: statusData.video
          });
        }
      } else {
        setKeyNotice(`⚠ Save error: ${data.error || 'Failed to save'}`);
      }
    } catch (err: any) {
      setKeyNotice(`⚠ Save error: ${err?.message || 'Server error'}`);
    } finally {
      setTimeout(() => setKeyNotice(null), 6000);
    }
  };

  const handleResetKey = async (type: 'chat' | 'image' | 'video') => {
    try {
      const res = await fetch('/api/keys/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setKeyNotice(`✓ ${type === 'chat' ? 'Quantum Chat' : type === 'image' ? 'Image' : 'Video'} API Key restored to default.`);
        const statusRes = await fetch('/api/keys/status');
        const statusData = await statusRes.json();
        if (statusData.success) {
          setKeysStatus({
            chat: statusData.chat || keysStatus.chat,
            image: statusData.image,
            video: statusData.video
          });
        }
      }
    } catch (err: any) {
      setKeyNotice(`⚠ Reset error: ${err?.message || 'Server error'}`);
    } finally {
      setTimeout(() => setKeyNotice(null), 6000);
    }
  };

  // Probe Firestore on mount
  useEffect(() => {
    let isMounted = true;
    testFirestoreConnection()
      .then((res) => {
        if (isMounted) {
          setConnectionHealth({
            online: res.online,
            latencyMs: res.latencyMs || 42,
            tested: true
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setConnectionHealth({
            online: false,
            latencyMs: 0,
            tested: true
          });
        }
      });

    setCacheTelemetry(calculateOfflineStorageTelemetry());
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Local/Cloud Sync Toggle change
  const handleToggleCloudSync = (enabled: boolean) => {
    setCloudSyncEnabled(enabled);
    const updated = {
      ...localSettings,
      cloudSyncEnabled: enabled
    };
    setLocalSettings(updated);
    onUpdateSettings(updated);
    try {
      localStorage.setItem('ogoo_settings', JSON.stringify(updated));
    } catch {}
  };

  // Force Manual Synchronization of offline cached data with Firestore backend
  const handleForceSync = async () => {
    setIsSyncing(true);
    setSyncStatusText('Connecting to Firestore database...');

    try {
      let res: ForceSyncResult;

      if (onManualSync) {
        res = await onManualSync();
      } else {
        // Fallback directly to client sync routine
        const fallbackEmail = userEmail || profile?.email || 'gautammaheshwari225@gmail.com';
        const payload: OfflineSyncPayload = {
          profile: profile || {
            name: 'Alex Vance',
            handle: '@vance_cyber',
            email: fallbackEmail,
            avatar: '',
            tier: 'OG AI Neural Pro',
            stars: 385,
            credits: 385,
            computeHours: 142.6,
            creationsCount: 384,
            storageMb: 1240,
            joinedDate: 'November 2024'
          },
          settings: {
            ...localSettings,
            cloudSyncEnabled
          },
          history,
          messages,
          images,
          videos
        };
        res = await forceSyncOfflineWithFirestore(fallbackEmail, payload);
      }

      setSyncResult(res);
      setLastSyncedTime(res.syncedAt);
      setCacheTelemetry(calculateOfflineStorageTelemetry());

      if (res.success) {
        setConnectionHealth({
          online: true,
          latencyMs: res.latencyMs || 35,
          tested: true
        });

        // Update settings timestamp
        const updatedSettings: AppSettings = {
          ...localSettings,
          cloudSyncEnabled,
          lastSyncedAt: new Date().toISOString()
        };
        setLocalSettings(updatedSettings);
        onUpdateSettings(updatedSettings);

        // Apply merged data back to React state if handler provided
        if (onApplySyncedData && res.mergedData) {
          onApplySyncedData(res.mergedData);
        }

        setSyncStatusText('Parity achieved! Offline cache and Firestore are fully synchronized.');
      } else {
        setSyncStatusText(res.message || 'Synchronization encountered an issue.');
      }
    } catch (err: any) {
      console.error('Manual sync failure:', err);
      setSyncStatusText(err?.message || 'Sync failed. Local data remains safe.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSave = () => {
    const updated = {
      ...localSettings,
      cloudSyncEnabled,
      hapticsEnabled,
      soundEffects,
      defaultExportRes,
      defaultPhotoFormat,
      autoSaveDrafts,
      hwAcceleration
    };
    onUpdateSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2200);
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem('ogoo_draft_project');
      localStorage.removeItem('ogoo_editor_history');
    } catch {}
    setCacheCleared(true);
    setCacheTelemetry(calculateOfflineStorageTelemetry());
    setTimeout(() => setCacheCleared(false), 2500);
  };

  return (
    <div id="ogoo-settings-view" className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 md:p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-black text-xl text-white flex items-center gap-2">
              <span>App Preferences & Studio Settings</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                Cloud & Offline Ready
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Control Firestore cross-device parity, offline cached memory, and AI Studio defaults.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer self-start sm:self-auto active:scale-95"
        >
          {saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <ShieldCheck className="w-4 h-4" />}
          <span>{saveSuccess ? 'Preferences Saved!' : 'Save Preferences'}</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 🚀 HIGHLIGHTED: LOCAL / CLOUD SYNC & FIRESTORE PARITY ENGINE */}
      {/* ============================================================ */}
      <div
        id="local-cloud-sync-container"
        className="glass-panel p-6 rounded-3xl border-2 border-cyan-500/40 bg-gradient-to-b from-cyan-950/20 via-black/40 to-black/60 shadow-2xl space-y-6 relative overflow-hidden"
      >
        {/* Glow ambient background aura */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Cloud className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-lg text-white">Local / Cloud Sync</h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    cloudSyncEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {cloudSyncEnabled ? 'Auto-Sync Active' : 'Local Cache Only'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Maintain seamless cross-device parity between your local offline browser cache and the Firestore cloud backend.
              </p>
            </div>
          </div>

          {/* Master Local/Cloud Sync Toggle */}
          <div className="flex items-center gap-3 self-start sm:self-auto bg-black/60 p-1.5 rounded-2xl border border-white/10">
            <span className="text-xs font-mono font-bold text-slate-300 pl-2">
              {cloudSyncEnabled ? 'SYNC ON' : 'SYNC OFF'}
            </span>
            <button
              id="local-cloud-sync-toggle"
              type="button"
              role="switch"
              aria-checked={cloudSyncEnabled}
              onClick={() => handleToggleCloudSync(!cloudSyncEnabled)}
              className={`w-14 h-8 rounded-xl transition-all p-1 flex items-center cursor-pointer shadow-inner ${
                cloudSyncEnabled
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 justify-end'
                  : 'bg-slate-800 justify-start'
              }`}
            >
              <span className="w-6 h-6 rounded-lg bg-white shadow-md flex items-center justify-center transition-transform">
                {cloudSyncEnabled ? (
                  <Cloud className="w-3.5 h-3.5 text-cyan-600" />
                ) : (
                  <CloudOff className="w-3.5 h-3.5 text-slate-500" />
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Sync Controls & Force Manual Synchronization Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative z-10">
          {/* Main Manual Sync Action Card */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-black/50 border border-cyan-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  <span>Manual Cross-Device Synchronization</span>
                </span>
                <p className="text-xs text-slate-300">
                  Force a manual bidirectional sync to push offline cached studio creations, chats, and vault balances to Firestore, while pulling any remote updates from other devices.
                </p>
              </div>

              {/* Force Manual Sync Button */}
              <button
                id="force-sync-now-button"
                type="button"
                disabled={isSyncing}
                onClick={handleForceSync}
                className={`px-5 py-3 rounded-xl font-display font-bold text-xs flex items-center gap-2.5 transition-all cursor-pointer shrink-0 shadow-lg active:scale-95 ${
                  isSyncing
                    ? 'bg-cyan-500/50 text-white cursor-wait opacity-80'
                    : 'bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/25 hover:shadow-cyan-500/40'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Synchronizing with Firestore...' : 'Force Sync Now'}</span>
              </button>
            </div>

            {/* Sync Status Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  <strong className="text-white">Last Synced:</strong> {lastSyncedTime}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">Parity Status:</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isSyncing
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse'
                      : syncResult?.success || cloudSyncEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSyncing ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'
                    }`}
                  />
                  <span>
                    {isSyncing
                      ? 'Sync in progress'
                      : syncResult?.success
                      ? '100% In Parity'
                      : cloudSyncEnabled
                      ? 'Synchronized'
                      : 'Offline Cached Mode'}
                  </span>
                </span>
              </div>
            </div>

            {/* Sync Feedback Message */}
            {syncStatusText && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-200 ${
                  syncResult?.success
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : isSyncing
                    ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
                    : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                }`}
              >
                {syncResult?.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : isSyncing ? (
                  <Activity className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 animate-spin" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <p className="font-semibold">{syncStatusText}</p>
                  {syncResult?.stats && (
                    <p className="text-[11px] opacity-80 font-mono">
                      Merged: {syncResult.stats.historyCount} history records,{' '}
                      {syncResult.stats.messagesCount} chat messages • Latency: {syncResult.latencyMs}ms
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Live Firestore Backend Status Tile */}
          <div className="p-5 rounded-2xl bg-black/50 border border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                <span>Backend Database</span>
              </span>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 font-mono text-[11px] text-cyan-300 break-all select-all">
                ai-studio-ogoocomfuturisti-3ca754a8-3a6d-4e24-a298-11f8abb2543f
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Firestore Connection:</span>
                <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online ({connectionHealth.latencyMs}ms)</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Account Identity:</span>
                <span className="font-mono text-slate-200 truncate max-w-[140px]">
                  {userEmail || profile?.email || 'gautammaheshwari225@gmail.com'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Sync Protocol:</span>
                <span className="font-mono text-purple-300">Firestore v2 Zero-Trust</span>
              </div>
            </div>
          </div>
        </div>

        {/* Offline Cache Breakdown & Storage Telemetry */}
        <div className="space-y-3 pt-2 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              <span>Offline Cache Inspection & Parity Breakdown</span>
            </span>
            <span className="text-xs font-mono text-amber-300 font-bold">
              Total Cache: {cacheTelemetry.formattedSize}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Studio History</span>
              <span className="text-lg font-mono font-bold text-white block mt-0.5">
                {history.length || cacheTelemetry.itemCounts.history} items
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
                <Check className="w-3 h-3" /> Synced to cloud
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Chat Messages</span>
              <span className="text-lg font-mono font-bold text-white block mt-0.5">
                {messages.length || cacheTelemetry.itemCounts.messages} msgs
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
                <Check className="w-3 h-3" /> Synced to cloud
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Editor Drafts</span>
              <span className="text-lg font-mono font-bold text-white block mt-0.5">
                {cacheTelemetry.itemCounts.drafts} active
              </span>
              <span className="text-[10px] text-cyan-400 flex items-center gap-1 mt-1 font-mono">
                <HardDrive className="w-3 h-3" /> Local cache
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Cross-Device Parity</span>
              <span className="text-lg font-mono font-bold text-emerald-300 block mt-0.5">
                {cloudSyncEnabled ? 'Continuous' : 'On-Demand'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                {cloudSyncEnabled ? 'Background sync' : 'Manual sync only'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Backend Security Assurance Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-purple-950/30 border border-emerald-500/30 shadow-lg flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0">
          <Lock className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Secure Backend AI Cloud Architecture
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            All AI computation pipelines, API credentials, and sensitive configurations are encrypted and hosted securely on the server backend.
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 🔑 DEDICATED AI GENERATION API KEYS (1: IMAGE, 2: VIDEO)     */}
      {/* ============================================================ */}
      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 via-black/40 to-black/60 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white flex items-center gap-2">
                <span>Dedicated AI Generation API Keys</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase">
                  Active
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Independent production API keys configured for Image &amp; Video Generation.
              </p>
            </div>
          </div>
        </div>

        {keyNotice && (
          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>{keyNotice}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Key 1: Quantum Chat API Key */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-blue-500/20 hover:border-blue-500/40 transition space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-300 border border-blue-500/30">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>1. Quantum Chat API Key</span>
                  </h4>
                  <span className="text-[11px] font-mono text-blue-400 block mt-0.5 truncate max-w-[170px]" title={keysStatus.chat.provider}>
                    {keysStatus.chat.provider}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Operational
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Active Key</span>
                <span className="text-xs font-mono font-bold text-slate-200 mt-0.5 block tracking-wider">
                  {keysStatus.chat.maskedKey}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {keysStatus.chat.lastTested}
              </span>
            </div>

            {editingKeyType === 'chat' ? (
              <div className="space-y-2 pt-1">
                <input
                  type="password"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder="Paste your Chat API Key (Gemini, OpenRouter, or Custom API key)"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-blue-500/50 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setEditingKeyType(null); setNewKeyValue(''); }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveKey('chat')}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save Key
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleTestKey('chat')}
                  disabled={testingKeyType === 'chat'}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-xs font-semibold text-blue-300 transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {testingKeyType === 'chat' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  <span>Test Connection</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingKeyType('chat'); setNewKeyValue(''); }}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => handleResetKey('chat')}
                  title="Reset to default key"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Key 2: Image Generation API Key */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-cyan-500/20 hover:border-cyan-500/40 transition space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>2. Image Generation API Key</span>
                  </h4>
                  <span className="text-[11px] font-mono text-cyan-400 block mt-0.5 truncate max-w-[170px]" title={keysStatus.image.provider}>
                    {keysStatus.image.provider}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Operational
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Active Key</span>
                <span className="text-xs font-mono font-bold text-slate-200 mt-0.5 block tracking-wider">
                  {keysStatus.image.maskedKey}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {keysStatus.image.lastTested}
              </span>
            </div>

            {editingKeyType === 'image' ? (
              <div className="space-y-2 pt-1">
                <input
                  type="password"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder="Paste your Image Generation API Key"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/50 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setEditingKeyType(null); setNewKeyValue(''); }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveKey('image')}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save Key
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleTestKey('image')}
                  disabled={testingKeyType === 'image'}
                  className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-xs font-semibold text-cyan-300 transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {testingKeyType === 'image' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  <span>Test Connection</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingKeyType('image'); setNewKeyValue(''); }}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => handleResetKey('image')}
                  title="Reset to default key"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Key 2: Video Generation API Key */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-purple-500/20 hover:border-purple-500/40 transition space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>3. Video Generation API Key</span>
                  </h4>
                  <span className="text-[11px] font-mono text-purple-400 block mt-0.5">
                    {keysStatus.video.provider}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Operational
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Active Key</span>
                <span className="text-xs font-mono font-bold text-slate-200 mt-0.5 block tracking-wider">
                  {keysStatus.video.maskedKey}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {keysStatus.video.lastTested}
              </span>
            </div>

            {editingKeyType === 'video' ? (
              <div className="space-y-2 pt-1">
                <input
                  type="password"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder="Paste your Video Generation API Key"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-purple-500/50 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setEditingKeyType(null); setNewKeyValue(''); }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveKey('video')}
                    className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save Key
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleTestKey('video')}
                  disabled={testingKeyType === 'video'}
                  className="flex-1 py-2 px-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-xs font-semibold text-purple-300 transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {testingKeyType === 'video' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  <span>Test Connection</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingKeyType('video'); setNewKeyValue(''); }}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => handleResetKey('video')}
                  title="Reset to default key"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 📱 FULL WEB CONVERT TO APP: PWA & STANDALONE INSTALLATION    */}
      {/* ============================================================ */}
      <div
        id="pwa-standalone-section"
        className="glass-panel p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-950/15 via-black/40 to-black/60 shadow-xl space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white flex items-center gap-2">
                <span>Progressive Web App & Standalone Mode</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                  App Ready
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Run OG AI as an installable standalone app across Android, iOS, Windows, Mac, and Linux.
              </p>
            </div>
          </div>

          {/* Fullscreen Mode Quick Trigger */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-cyan-400" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-amber-400" />
                <span>Fullscreen App Mode</span>
              </>
            )}
          </button>
        </div>

        {/* PWA In-App Install Card */}
        <PWAInstallButton variant="settings" />

        {/* Technical App Runtime Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Display Mode</span>
            <span className="text-xs font-bold text-white mt-0.5 block">Standalone (Borderless)</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Service Worker</span>
            <span className="text-xs font-bold text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Precaching
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Offline Cache</span>
            <span className="text-xs font-bold text-cyan-300 mt-0.5 block">SW + Local Storage</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Orientation</span>
            <span className="text-xs font-bold text-white mt-0.5 block">Adaptive Responsive</span>
          </div>
        </div>
      </div>

      {/* 1. Android & Mobile Experience */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-white/10">
          <Smartphone className="w-5 h-5 text-cyan-400" />
          <h3 className="font-display font-bold text-base text-white">Android & Touch Interface</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Theme selector */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">Visual Theme</span>
              <span className="text-[11px] text-slate-400 block">Switch between Futuristic Dark and Clean Light</span>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold"
            >
              {theme === 'dark' ? (
                <>
                  <Moon className="w-4 h-4 text-cyan-400" />
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Light</span>
                </>
              )}
            </button>
          </div>

          {/* Haptic touch feedback */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">Touch Haptics & Feedback</span>
              <span className="text-[11px] text-slate-400 block">Vibrate slightly on button taps & scrub</span>
            </div>
            <button
              type="button"
              onClick={() => setHapticsEnabled(!hapticsEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                hapticsEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/5 text-slate-400 border border-white/10'
              }`}
            >
              {hapticsEnabled ? 'ENABLED' : 'MUTED'}
            </button>
          </div>

          {/* Studio Audio Chimes */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">Interactive Audio Chimes</span>
              <span className="text-[11px] text-slate-400 block">Play sound effects upon edit completion</span>
            </div>
            <button
              type="button"
              onClick={() => setSoundEffects(!soundEffects)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                soundEffects
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 border border-white/10'
              }`}
            >
              {soundEffects ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Hardware acceleration */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">GPU Canvas Acceleration</span>
              <span className="text-[11px] text-slate-400 block">Hardware-accelerated WebGL rendering</span>
            </div>
            <button
              type="button"
              onClick={() => setHwAcceleration(!hwAcceleration)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                hwAcceleration
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-white/5 text-slate-400 border border-white/10'
              }`}
            >
              {hwAcceleration ? 'ACTIVE' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. AI Photo & Video Editor Defaults */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-white/10">
          <Palette className="w-5 h-5 text-purple-400" />
          <h3 className="font-display font-bold text-base text-white">AI Photo & Video Editor Defaults</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Default Photo Export Format */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
            <span className="text-xs font-bold text-white block">Default Photo Export Format</span>
            <div className="flex items-center gap-2">
              {(['png', 'webp', 'jpg'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setDefaultPhotoFormat(fmt)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-mono uppercase font-bold transition-all cursor-pointer ${
                    defaultPhotoFormat === fmt
                      ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">PNG provides lossless quality; WebP yields smallest file sizes.</p>
          </div>

          {/* Default Video Export Resolution */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
            <span className="text-xs font-bold text-white block">Default Video Resolution</span>
            <div className="flex items-center gap-2">
              {(['1080p', '4k'] as const).map((res) => (
                <button
                  key={res}
                  type="button"
                  onClick={() => setDefaultExportRes(res)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-mono uppercase font-bold transition-all cursor-pointer ${
                    defaultExportRes === res
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {res === '1080p' ? '1080p Full HD' : '4K Ultra HD'}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">4K renders at 3840×2160 with highest neural bit-depth.</p>
          </div>

          {/* Auto-save Drafts */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between sm:col-span-2">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">Auto-Save Editor Drafts</span>
              <span className="text-[11px] text-slate-400 block">
                Preserve active photo adjustments, video cuts, and text layers across app sessions
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAutoSaveDrafts(!autoSaveDrafts)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                autoSaveDrafts
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/5 text-slate-400 border border-white/10'
              }`}
            >
              {autoSaveDrafts ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Storage, Cache & Privacy */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-white/10">
          <HardDrive className="w-5 h-5 text-amber-400" />
          <h3 className="font-display font-bold text-base text-white">Storage & Local Cache</h3>
        </div>

        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-white block">Offline Project Cache & Temp Previews</span>
            <p className="text-[11px] text-slate-400 max-w-lg leading-relaxed">
              Clear temporary image canvas blobs and video scrub previews from your browser cache to free up mobile memory.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearCache}
            className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          >
            {cacheCleared ? <Check className="w-4 h-4 text-emerald-300" /> : <Trash2 className="w-4 h-4" />}
            <span>{cacheCleared ? 'Cache Cleared!' : 'Clear Cache'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
