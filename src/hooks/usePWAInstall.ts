import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((fn) => fn());
  });
}

/**
 * Returns true ONLY when calendar.q is running as a downloaded/installed standalone app
 * (PWA standalone/window-controls-overlay window, iOS Home Screen app, Electron desktop app,
 * Capacitor native wrapper, or Android Trusted Web Activity) — NOT in a regular browser tab.
 */
export function isDownloadedAppRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as Window & { electronAPI?: unknown; Capacitor?: unknown };
  const standaloneMatch =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches;
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const nativeBridge = Boolean(win.electronAPI || win.Capacitor);
  const androidTwa =
    typeof document !== 'undefined' && document.referrer.startsWith('android-app://');
  return Boolean(standaloneMatch || iosStandalone || nativeBridge || androidTwa);
}

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(Boolean(deferredPrompt));
  const [isInstalled, setIsInstalled] = useState(() => isDownloadedAppRuntime());
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const syncInstalled = () => setIsInstalled(isDownloadedAppRuntime());
    syncInstalled();

    const ua = window.navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream);

    const syncPrompt = () => setCanInstall(Boolean(deferredPrompt));
    promptListeners.add(syncPrompt);

    const onInstalled = () => {
      deferredPrompt = null;
      setCanInstall(false);
      setIsInstalled(true);
    };

    const standaloneMq = window.matchMedia('(display-mode: standalone)');
    const wcoMq = window.matchMedia('(display-mode: window-controls-overlay)');
    standaloneMq.addEventListener?.('change', syncInstalled);
    wcoMq.addEventListener?.('change', syncInstalled);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      promptListeners.delete(syncPrompt);
      standaloneMq.removeEventListener?.('change', syncInstalled);
      wcoMq.removeEventListener?.('change', syncInstalled);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) return 'unavailable';
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    setCanInstall(false);
    return outcome;
  }, []);

  return { canInstall, isInstalled, isIOS, install };
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
