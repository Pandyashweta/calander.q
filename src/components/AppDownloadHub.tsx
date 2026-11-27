import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Copy,
  Download,
  ExternalLink,
  Laptop,
  LayoutGrid,
  Share,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  DevicePlatform,
  detectDeviceInfo,
  downloadIosScriptableWidget,
  downloadStandaloneWidgetHtml,
} from '../utils/deviceUtils';

interface AppDownloadHubProps {
  open: boolean;
  onClose: () => void;
  onLaunchWidget: (mode: 'desktop' | 'mobile') => void;
  showToast?: (msg: string) => void;
}

const PLATFORMS: Array<{
  id: DevicePlatform;
  label: string;
  category: 'desktop' | 'mobile';
  appSummary: string;
  widgetSummary: string;
}> = [
  {
    id: 'windows',
    label: 'Windows',
    category: 'desktop',
    appSummary:
      'Installs directly through Chrome or Edge into your Start Menu, Desktop, and Taskbar as a standalone app window—no browser tabs and no security warnings.',
    widgetSummary:
      'Installing via Microsoft Edge automatically adds calendar.q to the native Windows 11 Widgets Board (Win + W) with zero unsigned scripts.',
  },
  {
    id: 'macos',
    label: 'macOS',
    category: 'desktop',
    appSummary:
      'Installs as a real standalone macOS Dock & Applications app via Safari (File → Add to Dock) or Chrome/Edge—no unsigned installers.',
    widgetSummary:
      'Open the live widget view or save a self-contained offline HTML widget file.',
  },
  {
    id: 'ios',
    label: 'iPhone & iPad',
    category: 'mobile',
    appSummary:
      'Open in Safari → tap Share → Add to Home Screen. Launches full-screen with its own icon like a native iOS app and works offline.',
    widgetSummary:
      'Add a live 2×2, 4×2, or 4×4 calendar.q widget directly to your iPhone Home Screen using Scriptable.',
  },
  {
    id: 'android',
    label: 'Android',
    category: 'mobile',
    appSummary:
      'Open in Chrome → tap Install App (or ⋮ → Install app). Android installs a real WebAPK directly into your App Drawer & Home Screen.',
    widgetSummary:
      'Place the live chromeless widget directly onto your Android Home Screen via Web Widget or Hermit.',
  },
  {
    id: 'linux',
    label: 'Linux',
    category: 'desktop',
    appSummary:
      'Installs via Chrome, Edge, or Brave directly into your Linux application launcher as a standalone desktop window.',
    widgetSummary:
      'Open the live widget view or save a self-contained offline HTML widget file.',
  },
];

export const AppDownloadHub: React.FC<AppDownloadHubProps> = ({
  open,
  onClose,
  onLaunchWidget,
  showToast,
}) => {
  const detected = useMemo(() => detectDeviceInfo(), []);
  const [selectedPlatform, setSelectedPlatform] = useState<DevicePlatform>(detected.platform);
  const [copiedKey, setCopiedKey] = useState<'app' | 'widget' | null>(null);
  const { canInstall, isInstalled, install } = usePWAInstall();

  const isInIframe = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }, []);

  if (!open) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const directAppUrl = `${origin}/?open=calendar`;
  const directInstallUrl = `${origin}/?open=calendar&install=1`;
  const mobileWidgetEmbedUrl = `${origin}/?widget=mobile&embed=1`;
  const desktopWidgetEmbedUrl = `${origin}/?widget=desktop&embed=1`;
  const activeMeta = PLATFORMS.find((p) => p.id === selectedPlatform) || PLATFORMS[0];
  const isMobileSelected = activeMeta.category === 'mobile';
  const isCurrentDevice = selectedPlatform === detected.platform;

  const copyText = (text: string, key: 'app' | 'widget', msg: string) => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopiedKey(key);
        showToast?.(msg);
        window.setTimeout(() => setCopiedKey(null), 2200);
      },
      () => showToast?.('Copy the link manually from your address bar.')
    );
  };

  const handleNativeInstall = async () => {
    if (!canInstall) return;
    const outcome = await install();
    if (outcome === 'accepted') {
      showToast?.('calendar.q installed as a standalone app on this device.');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Install Standalone App and Home Screen Widgets"
        className="w-full max-w-[700px] max-h-[88vh] bg-white border border-[#E2E2E2] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#EFEFEF] flex items-center justify-between bg-[#FAFAFA] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-[8px] overflow-hidden bg-black flex items-center justify-center shrink-0">
              <img
                src="/android-chrome-192x192.png"
                alt=""
                className="w-full h-full object-cover scale-[1.38]"
              />
            </span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-[#171717] truncate">
                Install Standalone App &amp; Widgets
              </h2>
              <p className="text-[11.5px] text-[#737373] truncate">
                Detected device: <strong className="text-[#171717]">{detected.label}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close install hub"
            className="p-1.5 rounded-md hover:bg-[#EFEFEF] text-[#737373] hover:text-[#171717] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto cal-scroll space-y-5">
          {/* Verified Zero-Warning Notice when inside embedded preview iframe */}
          {isInIframe && !canInstall && !isInstalled && (
            <div className="p-3.5 rounded-xl bg-[#F4F8F6] border border-[#CDE3D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <ShieldCheck className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                <div className="text-[12px] text-[#1F2937] leading-relaxed min-w-0">
                  <strong className="text-[#111827]">Install without security warnings:</strong>{' '}
                  Open calendar.q in a direct browser tab so Chrome, Edge, or Safari can install it
                  directly as a verified standalone desktop or phone app (no unsigned scripts).
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={directInstallUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-lg bg-[#171717] hover:bg-[#333333] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span>Open Installer Tab</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() =>
                    copyText(directAppUrl, 'app', 'Direct app link copied! Open on any device.')
                  }
                  className="px-2.5 py-2 rounded-lg border border-[#D4D4D8] bg-white hover:bg-[#F5F5F5] text-[#171717] text-[12px] font-medium inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  {copiedKey === 'app' ? (
                    <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === 'app' ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Platform Switcher */}
          <div className="flex flex-wrap gap-1.5">
            {PLATFORMS.map((p) => {
              const active = selectedPlatform === p.id;
              const isDetected = detected.platform === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlatform(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap ${
                    active
                      ? 'bg-[#171717] text-white border-[#171717]'
                      : 'bg-white text-[#404040] border-[#E4E4E4] hover:bg-[#F5F5F5]'
                  }`}
                >
                  {p.category === 'mobile' ? (
                    <Smartphone className="w-3.5 h-3.5" />
                  ) : (
                    <Laptop className="w-3.5 h-3.5" />
                  )}
                  <span>{p.label}</span>
                  {isDetected && (
                    <span className={`text-[10px] ${active ? 'text-[#D4D4D4]' : 'text-[#8C8C8C]'}`}>
                      (This device)
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Step 1: Verified Native OS Standalone App Install */}
          <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#EAEAEA] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-[#737373]">
                  Step 1 · Standalone App (Runs Outside Browser · Zero Warnings)
                </div>
                <div className="text-[14px] font-semibold text-[#171717] mt-0.5">
                  Install calendar.q on {activeMeta.label}
                </div>
                <p className="text-[12px] text-[#525252] mt-1 leading-relaxed">
                  {activeMeta.appSummary}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isInstalled && isCurrentDevice ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#E6F4EA] text-[#1E7E34] text-[12px] font-semibold whitespace-nowrap">
                    <Check className="w-3.5 h-3.5" />
                    <span>Installed as App</span>
                  </span>
                ) : canInstall && isCurrentDevice ? (
                  <button
                    type="button"
                    onClick={() => void handleNativeInstall()}
                    className="px-4 py-2 rounded-lg bg-[#171717] hover:bg-[#333333] text-white text-[12.5px] font-semibold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App Now</span>
                  </button>
                ) : isInIframe && isCurrentDevice ? (
                  <a
                    href={directInstallUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-[#171717] hover:bg-[#333333] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>Open Installer Tab</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        directInstallUrl,
                        'app',
                        `Link copied! Open it in ${
                          selectedPlatform === 'ios'
                            ? 'Safari on your iPhone/iPad'
                            : selectedPlatform === 'android'
                            ? 'Chrome on your Android phone'
                            : `Chrome or Edge on ${activeMeta.label}`
                        } to install.`
                      )
                    }
                    className="px-3.5 py-2 rounded-lg bg-[#171717] hover:bg-[#333333] text-white text-[12px] font-medium inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    {copiedKey === 'app' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {copiedKey === 'app'
                        ? 'Link Copied'
                        : isMobileSelected
                        ? 'Copy Link for Phone'
                        : 'Copy Direct App Link'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Platform-specific verified zero-warning install steps */}
            {selectedPlatform === 'windows' && (
              <ol className="p-3 rounded-lg bg-white border border-[#EAEAEA] text-[12px] text-[#404040] space-y-1.5 list-decimal list-inside">
                <li>
                  Open the direct app tab in <strong>Microsoft Edge</strong> or{' '}
                  <strong>Google Chrome</strong> (not inside an embedded preview).
                </li>
                <li>
                  Click the <strong>Install icon</strong> in the right side of the address bar (or
                  Edge menu <strong>··· → Apps → Install calendar.q</strong>).
                </li>
                <li>
                  Check <strong>Pin to Taskbar</strong> / <strong>Create Desktop shortcut</strong>{' '}
                  and click <strong>Install</strong>. Opens in its own standalone window with zero
                  Windows security warnings.
                </li>
              </ol>
            )}

            {selectedPlatform === 'macos' && (
              <ol className="p-3 rounded-lg bg-white border border-[#EAEAEA] text-[12px] text-[#404040] space-y-1.5 list-decimal list-inside">
                <li>
                  <strong>Safari (macOS Sonoma+):</strong> Open the direct tab → click{' '}
                  <strong>File → Add to Dock</strong> to install a native standalone macOS Dock app.
                </li>
                <li>
                  <strong>Chrome / Edge:</strong> Click the <strong>Install icon</strong> in the
                  address bar to install into your Applications folder &amp; Dock.
                </li>
              </ol>
            )}

            {selectedPlatform === 'linux' && (
              <ol className="p-3 rounded-lg bg-white border border-[#EAEAEA] text-[12px] text-[#404040] space-y-1.5 list-decimal list-inside">
                <li>
                  Open the direct app tab in <strong>Chrome</strong>, <strong>Edge</strong>, or{' '}
                  <strong>Brave</strong>.
                </li>
                <li>
                  Click the <strong>Install icon</strong> in the address bar →{' '}
                  <strong>Install</strong> to add calendar.q to your desktop launcher as a
                  standalone window.
                </li>
              </ol>
            )}

            {selectedPlatform === 'ios' && (
              <div className="p-3 rounded-lg bg-white border border-[#EAEAEA] text-[12px] text-[#404040] flex items-start gap-2.5">
                <Share className="w-4 h-4 text-[#185D8F] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#171717]">iPhone / iPad Standalone App:</strong> Open the
                  direct link in <strong>Safari</strong> → tap <strong>Share</strong> → tap{' '}
                  <strong>Add to Home Screen</strong>. Launches full-screen without Safari bars.
                </div>
              </div>
            )}

            {selectedPlatform === 'android' && (
              <div className="p-3 rounded-lg bg-white border border-[#EAEAEA] text-[12px] text-[#404040]">
                <strong className="text-[#171717]">Android Standalone App (WebAPK):</strong> Open
                the direct link in <strong>Chrome</strong> → tap <strong>⋮ Menu</strong> → tap{' '}
                <strong>Install app</strong>. Installs directly to your App Drawer and Home Screen
                like a Play Store app.
              </div>
            )}
          </div>

          {/* Step 2: Outside-the-App OS Home Screen / Desktop Widget */}
          <div className="p-4 rounded-xl bg-white border border-[#E5E5E5] space-y-3.5">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-[#737373]">
                Step 2 · Outside Home Screen &amp; Desktop Widget
              </div>
              <div className="text-[14px] font-semibold text-[#171717] mt-0.5 flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4 text-[#171717] shrink-0" />
                <span>
                  {selectedPlatform === 'ios'
                    ? 'Add Real iPhone Home Screen Widget'
                    : selectedPlatform === 'android'
                    ? 'Add Real Android Home Screen Widget'
                    : selectedPlatform === 'windows'
                    ? 'Pin in Windows 11 Widgets Board (Win + W)'
                    : `${activeMeta.label} Live Desktop Widget`}
                </span>
              </div>
              <p className="text-[12px] text-[#525252] mt-1 leading-relaxed">
                {activeMeta.widgetSummary}
              </p>
            </div>

            {selectedPlatform === 'ios' && (
              <ol className="text-[12px] text-[#404040] space-y-1.5 list-decimal list-inside bg-[#FAFAFA] rounded-lg p-3 border border-[#EFEFEF]">
                <li>
                  Download <strong>calendar-q-ios-widget.js</strong> below and open it in the free{' '}
                  <strong>Scriptable</strong> iOS app.
                </li>
                <li>
                  Long-press your <strong>iPhone Home Screen</strong> → tap <strong>+</strong> →
                  select <strong>Scriptable</strong> (2×2, 4×2, or 4×4).
                </li>
                <li>
                  Tap the widget → choose <strong>calendar.q</strong>. It updates on your Home
                  Screen and opens calendar.q when tapped.
                </li>
              </ol>
            )}

            {selectedPlatform === 'android' && (
              <ol className="text-[12px] text-[#404040] space-y-1.5 list-decimal list-inside bg-[#FAFAFA] rounded-lg p-3 border border-[#EFEFEF]">
                <li>
                  Copy the <strong>Chromeless Live Widget URL</strong> below.
                </li>
                <li>
                  Long-press your <strong>Android Home Screen</strong> → <strong>Widgets</strong> →
                  add a <strong>Web Widget</strong> (e.g., <em>Hermit</em> or <em>Web Widget</em>)
                  and paste the URL.
                </li>
                <li>
                  Resize to 2×2, 4×2, or 4×4 directly on your Home Screen outside the browser.
                </li>
              </ol>
            )}

            {selectedPlatform === 'windows' && (
              <ol className="text-[12px] text-[#404040] space-y-1.5 list-decimal list-inside bg-[#FAFAFA] rounded-lg p-3 border border-[#EFEFEF]">
                <li>
                  Install calendar.q via <strong>Microsoft Edge</strong> in Step 1 above.
                </li>
                <li>
                  Press <strong>Win + W</strong> to open the native Windows 11 Widgets Board → click{' '}
                  <strong>+</strong> → pin <strong>calendar.q Today &amp; Month</strong>.
                </li>
              </ol>
            )}

            {/* Action Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {selectedPlatform === 'ios' && (
                <button
                  type="button"
                  onClick={() => {
                    downloadIosScriptableWidget(origin);
                    showToast?.('Downloaded iOS Home Screen Widget (calendar-q-ios-widget.js).');
                  }}
                  className="px-3.5 py-2 rounded-lg bg-[#171717] hover:bg-[#333333] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download iOS Home Widget (.js)</span>
                </button>
              )}

              {selectedPlatform === 'android' && (
                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      mobileWidgetEmbedUrl,
                      'widget',
                      'Android Home Screen Widget URL copied! Paste into Web Widget / Hermit.'
                    )
                  }
                  className="px-3.5 py-2 rounded-lg bg-[#171717] hover:bg-[#333333] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {copiedKey === 'widget' ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {copiedKey === 'widget' ? 'Widget URL Copied' : 'Copy Android Widget URL'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLaunchWidget(isMobileSelected ? 'mobile' : 'desktop');
                }}
                className={`px-3.5 py-2 rounded-lg text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  !isMobileSelected
                    ? 'bg-[#171717] hover:bg-[#333333] text-white'
                    : 'border border-[#DCDCDC] hover:bg-[#F5F5F5] text-[#525252] hover:text-[#171717]'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Live Widget</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  downloadStandaloneWidgetHtml(
                    isMobileSelected ? 'mobile' : 'desktop',
                    isMobileSelected ? mobileWidgetEmbedUrl : desktopWidgetEmbedUrl,
                    directAppUrl
                  );
                  showToast?.('Saved offline HTML widget file (no security warnings).');
                }}
                className="px-3 py-2 rounded-lg border border-[#DCDCDC] hover:bg-[#F5F5F5] text-[#171717] text-[12px] font-medium inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Offline HTML Widget</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
