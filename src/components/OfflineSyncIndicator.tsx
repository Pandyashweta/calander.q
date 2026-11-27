import React, { useEffect, useRef, useState } from 'react';
import { Check, HardDrive, RefreshCw, WifiOff } from 'lucide-react';

type SyncVisualState = 'local' | 'offline' | 'syncing' | 'synced';

interface OfflineSyncIndicatorProps {
  isOnline: boolean;
  isExternalSyncing?: boolean;
  onReconnectSync?: () => void;
}

export const OfflineSyncIndicator: React.FC<OfflineSyncIndicatorProps> = ({
  isOnline,
  isExternalSyncing = false,
  onReconnectSync,
}) => {
  const [status, setStatus] = useState<SyncVisualState>(isOnline ? 'local' : 'offline');
  const wasOfflineRef = useRef<boolean>(!isOnline);
  const syncTimerRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const onReconnectRef = useRef(onReconnectSync);
  onReconnectRef.current = onReconnectSync;

  useEffect(() => {
    const clearTimers = () => {
      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
    };

    if (!isOnline) {
      clearTimers();
      wasOfflineRef.current = true;
      setStatus('offline');
      return clearTimers;
    }

    // Back online after being offline — show brief syncing animation then synced confirmation
    if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      clearTimers();
      setStatus('syncing');
      onReconnectRef.current?.();

      syncTimerRef.current = window.setTimeout(() => {
        setStatus('synced');
        settleTimerRef.current = window.setTimeout(() => {
          setStatus('local');
        }, 2200);
      }, 1450);
    }

    return clearTimers;
  }, [isOnline]);

  // Reflect active Google/external sync seamlessly when online
  const effectiveStatus: SyncVisualState =
    !isOnline ? 'offline' : status === 'syncing' || isExternalSyncing ? 'syncing' : status;

  if (effectiveStatus === 'offline') {
    return (
      <div
        role="status"
        aria-live="polite"
        title="Offline mode — all calendar events, holidays, and edits remain saved locally on this device and will sync once you reconnect."
        className="h-[30px] px-2.5 rounded-[6px] bg-[#FEF3C7] dark:bg-[#422006]/80 text-[#92400E] dark:text-[#FCD34D] text-[11.5px] font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 select-none shadow-[0_1px_2px_rgba(146,64,14,0.10)] transition-colors duration-200"
      >
        <WifiOff className="w-3.5 h-3.5 shrink-0" />
        <span>Offline</span>
        <span className="hidden xl:inline text-[#B45309] dark:text-[#FBBF24] font-normal">· Local</span>
      </div>
    );
  }

  if (effectiveStatus === 'syncing') {
    return (
      <div
        role="status"
        aria-live="polite"
        title="Connection restored — resuming local-first synchronization."
        className="relative overflow-hidden h-[30px] px-2.5 rounded-[6px] bg-[#EFF6FF] dark:bg-[#172554]/80 text-[#1D4ED8] dark:text-[#93C5FD] text-[11.5px] font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 select-none shadow-[0_1px_2px_rgba(29,78,216,0.10)] transition-colors duration-200"
      >
        <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin motion-reduce:animate-none" />
        <span>Syncing…</span>
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-[2px] w-1/2 rounded-full bg-[#3B82F6] dark:bg-[#60A5FA] animate-sync-bar"
        />
      </div>
    );
  }

  if (effectiveStatus === 'synced') {
    return (
      <div
        role="status"
        aria-live="polite"
        title="Back online — your local calendar is synced and up to date."
        className="h-[30px] px-2.5 rounded-[6px] bg-[#ECFDF5] dark:bg-[#052E16]/80 text-[#166534] dark:text-[#86EFAC] text-[11.5px] font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 select-none shadow-[0_1px_2px_rgba(22,101,52,0.10)] transition-colors duration-200"
      >
        <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
        <span>Synced</span>
      </div>
    );
  }

  // Quiet steady-state local-first cue
  return (
    <div
      title="Local-first mode — your calendar stays stored on this device and works offline."
      className="h-[30px] px-2 sm:px-2.5 rounded-[6px] bg-[#F5F5F7] dark:bg-[#1C1C22] text-[#52525B] dark:text-[#A1A1AA] text-[11.5px] font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 select-none transition-colors duration-200"
    >
      <HardDrive className="w-3.5 h-3.5 text-[#71717A] dark:text-[#8E8E99] shrink-0" />
      <span className="hidden xl:inline">Local</span>
    </div>
  );
};
