import React from 'react';
import { WifiOff, CloudOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:right-auto md:max-w-md z-50 flex items-center gap-3 rounded-2xl bg-amber-500/95 backdrop-blur-md px-4 py-2.5 text-xs md:text-sm font-semibold text-black shadow-2xl border border-amber-300/40 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-black/10">
        <WifiOff className="h-4 w-4 text-black animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold leading-tight flex items-center gap-1.5">
          <span>Offline App Mode Active</span>
          <span className="inline-block h-2 w-2 rounded-full bg-black/80 animate-ping" />
        </p>
        <p className="text-[11px] opacity-90 truncate">
          Offline cache is active. All chats, history, and studio edits are stored locally.
        </p>
      </div>
    </div>
  );
};
