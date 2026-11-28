import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig, motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Laptop,
  Share,
  Smartphone,
  Terminal,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  DevicePlatform,
  detectDeviceInfo,
  downloadPlatformAppLauncher,
} from '../utils/deviceUtils';
import { LegalDocId } from './LegalModal';
import { LandingFooter } from './LandingFooter';

interface AppDownloadHubProps {
  onBack: () => void;
  onOpenCalendar: () => void;
  onOpenLegal: (doc: LegalDocId) => void;
  onOpenAbout: () => void;
  showToast?: (msg: string) => void;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
const LANDSCAPE_BACKDROP = '/images/landscape-backdrop.jpg';

const PLATFORMS: Array<{
  id: DevicePlatform;
  label: string;
  category: 'desktop' | 'mobile';
  appSummary: string;
}> = [
  {
    id: 'windows',
    label: 'Windows',
    category: 'desktop',
    appSummary:
      'Download the native Windows setup installer (.exe) or install as a standalone app window with zero browser tabs. Unlocks on-device local & offline mode.',
  },
  {
    id: 'macos',
    label: 'macOS',
    category: 'desktop',
    appSummary:
      'Install as a standalone macOS Dock & Applications window via Safari (File → Add to Dock), Chrome/Edge/Brave, or the macOS .command app launcher.',
  },
  {
    id: 'ios',
    label: 'iPhone & iPad',
    category: 'mobile',
    appSummary:
      'Open in Safari → tap Share → Add to Home Screen. Launches full-screen with its own app icon and unlocks offline local storage.',
  },
  {
    id: 'android',
    label: 'Android',
    category: 'mobile',
    appSummary:
      'Open in Chrome or Brave → tap Install App (or ⋮ → Install app). Android installs a standalone WebAPK into your App Drawer & Home Screen.',
  },
  {
    id: 'linux',
    label: 'Linux',
    category: 'desktop',
    appSummary:
      'Install via Chrome, Edge, or Brave as a standalone desktop window, or save the .desktop launcher to ~/.local/share/applications.',
  },
];

export const AppDownloadHub: React.FC<AppDownloadHubProps> = ({
  onBack,
  onOpenCalendar,
  onOpenLegal,
  onOpenAbout,
  showToast,
}) => {
  const detected = useMemo(() => detectDeviceInfo(), []);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<DevicePlatform>(detected.platform);
  const [copiedKey, setCopiedKey] = useState<'app' | 'cmd' | null>(null);
  const [windowsInstaller, setWindowsInstaller] = useState<{
    filename: string;
    url: string;
    sizeBytes: number;
  } | null>(null);
  const { canInstall, isInstalled, install } = usePWAInstall();

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 32);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/downloads/available')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.windows?.url) {
          setWindowsInstaller(data.windows);
        }
      })
      .catch(() => {
        // ignore
      });
    return () => {
      active = false;
    };
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const directAppUrl = `${origin}/?open=calendar`;
  const activeMeta = PLATFORMS.find((p) => p.id === selectedPlatform) || PLATFORMS[0];
  const isMobileSelected = activeMeta.category === 'mobile';
  const isCurrentDevice = selectedPlatform === detected.platform;

  const copyText = (text: string, key: 'app' | 'cmd', msg: string) => {
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
      showToast?.('Calander.Q installed as a standalone app! Local & offline mode unlocked.');
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={scrollContainerRef}
        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
        className="h-screen overflow-y-auto dark-scroll bg-[#0A0908] text-white selection:bg-white selection:text-[#0A0908]"
      >
        {/* ==================== STICKY TOP NAVIGATION ==================== */}
        <header
          className={`sticky top-0 z-40 h-[64px] bg-[#0A0908]/85 backdrop-blur-md transition-colors ${
            scrolled ? 'border-b border-white/[0.08]' : 'border-b border-transparent'
          }`}
        >
          <div className="max-w-[1080px] mx-auto h-full px-5 sm:px-6 flex items-center justify-between gap-6">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2.5 text-[15px] font-medium tracking-[-0.02em] text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              <img
                src="/android-chrome-192x192.png"
                alt=""
                className="w-5 h-5 object-contain shrink-0"
              />
              <span>Calander.Q</span>
            </button>

            <nav className="hidden md:flex items-center gap-7 text-[14px] font-normal text-[#858585]">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to overview</span>
              </button>
              <a href="#standalone-app" className="hover:text-white transition-colors whitespace-nowrap">
                Standalone App
              </a>
              <a href="#native-builds" className="hover:text-white transition-colors whitespace-nowrap">
                Native Builds
              </a>
            </nav>

            <motion.button
              type="button"
              onClick={onOpenCalendar}
              animate={{
                backgroundColor: scrolled ? '#FFFFFF' : 'rgba(255, 255, 255, 0)',
                color: scrolled ? '#0A0908' : '#FFFFFF',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
              className="inline-flex items-center justify-center h-[32px] px-3.5 rounded-[8px] text-[13.5px] font-medium cursor-pointer whitespace-nowrap"
            >
              Open Calendar
            </motion.button>
          </div>
        </header>

        {/* ==================== PAGE HEADER & PLATFORM SWITCHER ==================== */}
        <section className="max-w-[1080px] mx-auto px-5 sm:px-6 pt-12 sm:pt-16 pb-10">
          <button
            type="button"
            onClick={onBack}
            className="md:hidden mb-6 inline-flex items-center gap-1.5 text-[13.5px] text-[#858585] hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to overview</span>
          </button>

          <motion.div
            initial={{ opacity: 0.001, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
            className="max-w-[760px]"
          >
            <div className="text-[14px] font-mono text-[#858585]">
              // Download App · Detected: {detected.label}
              {isInstalled ? ' · Installed App Active' : ''}
            </div>
            <h1 className="mt-3 text-[36px] sm:text-[52px] font-medium tracking-[-0.03em] leading-[1.06]">
              <span className="text-white block">Install Calander.Q.</span>
              <span className="text-[#858585] block">Run on every device.</span>
            </h1>
            <p className="mt-4 text-[15px] sm:text-[16px] text-[#858585] max-w-[580px] leading-[1.45]">
              Download the standalone desktop or mobile app to unlock offline local mode on Windows,
              macOS, Linux, iPhone, and Android.
            </p>
          </motion.div>

          {/* Animated Platform Switcher */}
          <motion.div
            initial={{ opacity: 0.001, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: EASE_OUT_EXPO }}
            className="mt-8 inline-flex flex-wrap bg-[#0F0F0F] border border-white/[0.12] rounded-[8px] p-1 gap-1"
          >
            {PLATFORMS.map((p) => {
              const active = selectedPlatform === p.id;
              const isDetected = detected.platform === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlatform(p.id)}
                  className={`relative px-3.5 py-2 rounded-[6px] text-[13px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap ${
                    active ? 'text-white' : 'text-[#858585] hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="download-platform-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-[6px] bg-[#171615]"
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-1.5">
                    {p.category === 'mobile' ? (
                      <Smartphone className="w-3.5 h-3.5" />
                    ) : (
                      <Laptop className="w-3.5 h-3.5" />
                    )}
                    <span>{p.label}</span>
                    {isDetected && (
                      <span className="text-[11px] text-[#858585]">(This device)</span>
                    )}
                  </span>
                </button>
              );
            })}
          </motion.div>
        </section>

        {/* ==================== STEP 1 & STEP 2 CARDS ==================== */}
        <section className="max-w-[1080px] mx-auto px-5 sm:px-6 pb-20 space-y-6">
          {/* Step 1: Standalone App */}
          <motion.div
            id="standalone-app"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16, ease: EASE_OUT_EXPO }}
            className="rounded-[12px] bg-[#0F0F0F] border border-white/[0.14] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-center"
          >
            <div className="lg:col-span-7 p-6 sm:p-10 space-y-5">
              <div className="flex items-start gap-4">
                <img
                  src="/android-chrome-192x192.png"
                  alt="Calander.Q app icon"
                  className="w-14 h-14 rounded-[14px] border border-white/[0.14] bg-[#171615] object-contain shrink-0 shadow-lg"
                />
                <div>
                  <div className="text-[13px] font-mono text-[#858585]">
                    // Step 1 · Standalone App (Unlocks Local &amp; Offline Mode)
                  </div>
                  <h2 className="mt-1.5 text-[24px] sm:text-[28px] font-medium tracking-[-0.02em] text-white">
                    Download Calander.Q for {activeMeta.label}
                  </h2>
                </div>
              </div>
              <p className="text-[14.5px] text-[#858585] leading-[1.5]">
                {activeMeta.appSummary}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {isInstalled && isCurrentDevice ? (
                  <span className="inline-flex items-center gap-1.5 px-4 h-[40px] rounded-[8px] bg-[#163020] text-[#86EFAC] border border-[#22C55E]/30 text-[13.5px] font-medium whitespace-nowrap">
                    <Check className="w-4 h-4" />
                    <span>Installed · Local Mode Active</span>
                  </span>
                ) : selectedPlatform === 'windows' && windowsInstaller ? (
                  <a
                    href={windowsInstaller.url}
                    download={windowsInstaller.filename}
                    onClick={() =>
                      showToast?.(`Downloading ${windowsInstaller.filename}...`)
                    }
                    className="h-[40px] px-5 rounded-[8px] bg-white hover:bg-[#E4E4E7] text-[#0A0908] text-[13.5px] font-medium inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      Download {windowsInstaller.filename} (
                      {Math.round(windowsInstaller.sizeBytes / (1024 * 1024))} MB)
                    </span>
                  </a>
                ) : canInstall && isCurrentDevice ? (
                  <button
                    type="button"
                    onClick={() => void handleNativeInstall()}
                    className="h-[40px] px-5 rounded-[8px] bg-white hover:bg-[#E4E4E7] text-[#0A0908] text-[13.5px] font-medium inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App Now</span>
                  </button>
                ) : !isMobileSelected ? (
                  <button
                    type="button"
                    onClick={() => {
                      downloadPlatformAppLauncher(selectedPlatform, origin);
                      showToast?.(
                        `Downloaded standalone ${activeMeta.label} app launcher (opens outside browser tabs).`
                      );
                    }}
                    className="h-[40px] px-5 rounded-[8px] bg-white hover:bg-[#E4E4E7] text-[#0A0908] text-[13.5px] font-medium inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {activeMeta.label} Launcher</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        directAppUrl,
                        'app',
                        `Link copied! Open it in ${
                          selectedPlatform === 'ios' ? 'Safari on iPhone/iPad' : 'Chrome on Android'
                        } to install.`
                      )
                    }
                    className="h-[40px] px-5 rounded-[8px] bg-white hover:bg-[#E4E4E7] text-[#0A0908] text-[13.5px] font-medium inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {copiedKey === 'app' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>{copiedKey === 'app' ? 'Link Copied' : 'Copy Link for Phone'}</span>
                  </button>
                )}

                {selectedPlatform === 'windows' && (
                  <button
                    type="button"
                    onClick={() => {
                      downloadPlatformAppLauncher('windows', origin);
                      showToast?.('Downloaded standalone Windows app launcher (.cmd).');
                    }}
                    className="h-[40px] px-4 rounded-[8px] bg-[#171615] hover:bg-[#22201E] border border-white/[0.14] text-white text-[13px] font-medium inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Windows .cmd Launcher</span>
                  </button>
                )}
              </div>

              {selectedPlatform === 'windows' && (
                <ol className="p-4 rounded-[8px] bg-[#0A0908] border border-white/[0.08] text-[13px] text-[#858585] space-y-2 list-decimal list-inside">
                  <li>
                    Run <code className="text-white">calander-q-setup-windows-amd64.exe</code> to
                    install Calander.Q into your Start Menu and Desktop as a real standalone app.
                  </li>
                  <li>
                    Or install directly via Brave/Chrome/Edge (<strong className="text-white">⋮ → Cast, save, and share → Install Calander.Q</strong>).
                  </li>
                </ol>
              )}

              {selectedPlatform === 'macos' && (
                <ol className="p-4 rounded-[8px] bg-[#0A0908] border border-white/[0.08] text-[13px] text-[#858585] space-y-2 list-decimal list-inside">
                  <li>
                    <strong className="text-white">Safari (macOS Sonoma+):</strong> Click{' '}
                    <strong className="text-white">File → Add to Dock</strong> to install as a
                    native macOS Dock app.
                  </li>
                  <li>
                    <strong className="text-white">Chrome / Brave / Edge:</strong> Click the{' '}
                    <strong className="text-white">Install icon</strong> in the address bar or run{' '}
                    <code className="text-white">calendar-q-macos-app.command</code>.
                  </li>
                </ol>
              )}

              {selectedPlatform === 'linux' && (
                <ol className="p-4 rounded-[8px] bg-[#0A0908] border border-white/[0.08] text-[13px] text-[#858585] space-y-2 list-decimal list-inside">
                  <li>
                    Open in <strong className="text-white">Chrome / Brave / Edge</strong> and click
                    Install in the address bar, or save <code className="text-white">calendar-q.desktop</code>{' '}
                    into <code className="text-white">~/.local/share/applications</code>.
                  </li>
                </ol>
              )}

              {selectedPlatform === 'ios' && (
                <div className="p-4 rounded-[8px] bg-[#0A0908] border border-white/[0.08] text-[13px] text-[#858585] flex items-start gap-2.5">
                  <Share className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">iPhone / iPad App:</strong> Open in{' '}
                    <strong className="text-white">Safari</strong> → tap{' '}
                    <strong className="text-white">Share</strong> → tap{' '}
                    <strong className="text-white">Add to Home Screen</strong>. Launches full-screen
                    without Safari bars and unlocks on-device local mode.
                  </div>
                </div>
              )}

              {selectedPlatform === 'android' && (
                <div className="p-4 rounded-[8px] bg-[#0A0908] border border-white/[0.08] text-[13px] text-[#858585]">
                  <strong className="text-white">Android App (WebAPK):</strong> Open in{' '}
                  <strong className="text-white">Chrome</strong> or{' '}
                  <strong className="text-white">Brave</strong> → tap{' '}
                  <strong className="text-white">⋮ Menu</strong> → tap{' '}
                  <strong className="text-white">Install app</strong>. Installs directly to your App
                  Drawer and Home Screen.
                </div>
              )}
            </div>

            <div className="lg:col-span-5 p-4 sm:p-6">
              <div className="relative rounded-none overflow-hidden aspect-[4/3] bg-[#171615] p-4 flex items-center justify-center group">
                <img
                  src={LANDSCAPE_BACKDROP}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div className="relative z-10 w-full h-full rounded-none overflow-hidden border border-white/[0.16] bg-[#0F0F0F] shadow-2xl">
                  <img
                    src="/screenshots/workspace-month-dark.png"
                    alt="Calander.Q standalone desktop app"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Native Installer Build Reference */}
          <motion.div
            id="native-builds"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className="rounded-[12px] bg-[#0F0F0F] border border-white/[0.14] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 max-w-[680px]">
              <div className="flex items-center gap-2 text-[14px] font-medium text-white">
                <Terminal className="w-4 h-4 text-[#858585]" />
                <span>Native Installer Packaging (.exe / .dmg / .AppImage / .apk)</span>
              </div>
              <p className="text-[13.5px] text-[#858585] leading-[1.5]">
                Desktop setup binaries are compiled with Electron (<code className="text-white">electron/main.cjs</code>{' '}
                and <code className="text-white">electron-builder.json</code>), producing{' '}
                <code className="text-white">calander-q-setup-windows-amd64.exe</code> with a native
                system tray.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                copyText(
                  'npm run desktop:build',
                  'cmd',
                  'Copied native desktop build command!'
                )
              }
              className="h-[38px] px-4 rounded-[8px] bg-[#171615] hover:bg-[#22201E] border border-white/[0.14] text-[13px] font-mono text-white inline-flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-center"
            >
              {copiedKey === 'cmd' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>npm run desktop:build</span>
            </button>
          </motion.div>
        </section>

        {/* ==================== FOOTER ==================== */}
        <LandingFooter
          onOpenCalendar={onOpenCalendar}
          onOpenLegal={onOpenLegal}
          onOpenAbout={onOpenAbout}
        />
      </div>
    </MotionConfig>
  );
};
