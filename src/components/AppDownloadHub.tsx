import React, { useMemo, useState } from 'react';
import {
  Check,
  Download,
  ExternalLink,
  Laptop,
  Monitor,
  Share,
  Smartphone,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  DevicePlatform,
  detectDeviceInfo,
  downloadPlatformAppLauncher,
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
  fileHint: string;
}> = [
  { id: 'macos', label: 'macOS', category: 'desktop', fileHint: 'App Launcher (.command) + Widget' },
  { id: 'windows', label: 'Windows', category: 'desktop', fileHint: 'App Launcher (.cmd) + Widget' },
  { id: 'linux', label: 'Linux', category: 'desktop', fileHint: 'Desktop Entry (.desktop) + Widget' },
  { id: 'ios', label: 'iPhone & iPad', category: 'mobile', fileHint: 'Safari PWA + Home Widget' },
  { id: 'android', label: 'Android', category: 'mobile', fileHint: 'Chrome PWA + Mobile Widget' },
];

export const AppDownloadHub: React.FC<AppDownloadHubProps> = ({
  open,
  onClose,
  onLaunchWidget,
  showToast,
}) => {
  const detected = useMemo(() => detectDeviceInfo(), []);
  const [selectedPlatform, setSelectedPlatform] = useState<DevicePlatform>(detected.platform);
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();

  if (!open) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const isMobileSelected = selectedPlatform === 'ios' || selectedPlatform === 'android';

  const handlePrimaryInstall = async () => {
    if (canInstall) {
      const outcome = await install();
      if (outcome === 'accepted') {
        showToast?.('calendar.q installed as an app on your device.');
        return;
      }
    }
    downloadPlatformAppLauncher(selectedPlatform, origin);
    showToast?.(`Downloaded ${PLATFORMS.find((p) => p.id === selectedPlatform)?.label} package.`);
  };

  const handleDownloadWidget = (mode: 'desktop' | 'mobile') => {
    downloadStandaloneWidgetHtml(
      mode,
      `${origin}/?widget=${mode}`,
      `${origin}/?open=calendar`
    );
    showToast?.(`Downloaded standalone ${mode} widget.`);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Download Desktop and Mobile Apps and Widgets"
        className="w-full max-w-[680px] max-h-[88vh] bg-white border border-[#E2E2E2] rounded-xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#EFEFEF] flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="" className="w-5 h-5 rounded-[5px]" />
            <div>
              <h2 className="text-[15px] font-semibold text-[#1A1A1A]">
                Get calendar.q Apps &amp; Widgets
              </h2>
              <p className="text-[11.5px] text-[#737373]">
                Detected device: <strong className="text-[#1A1A1A]">{detected.label}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close download hub"
            className="p-1.5 rounded-md hover:bg-[#EFEFEF] text-[#737373] hover:text-[#1A1A1A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto cal-scroll space-y-5">
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
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
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
                    <span
                      className={`text-[10px] ${
                        active ? 'text-[#D4D4D4]' : 'text-[#8C8C8C]'
                      }`}
                    >
                      (This device)
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Primary Device Download Card */}
          <div className="p-4 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[14px] font-semibold text-[#171717]">
                  calendar.q for {PLATFORMS.find((p) => p.id === selectedPlatform)?.label}
                </div>
                <div className="text-[12px] text-[#666666] mt-0.5">
                  {PLATFORMS.find((p) => p.id === selectedPlatform)?.fileHint}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isInstalled && selectedPlatform === detected.platform ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#E6F4EA] text-[#1E7E34] text-[12px] font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>Installed on this device</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handlePrimaryInstall}
                    className="px-4 py-2 rounded-lg bg-[#171717] hover:bg-[#333333] text-white text-[12.5px] font-medium inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {canInstall && selectedPlatform === detected.platform
                        ? 'Install Native App'
                        : `Download for ${PLATFORMS.find((p) => p.id === selectedPlatform)?.label}`}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {(selectedPlatform === 'ios' || (isIOS && selectedPlatform === detected.platform)) && (
              <div className="p-3 rounded-lg bg-white border border-[#EAEAEA] text-[12px] text-[#404040] flex items-start gap-2.5">
                <Share className="w-4 h-4 text-[#185D8F] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#171717]">Install on iOS Safari:</strong> Tap the{' '}
                  <strong>Share</strong> icon in Safari, then choose{' '}
                  <strong>Add to Home Screen</strong> to install calendar.q with offline support and full-screen icon.
                </div>
              </div>
            )}

            {!isMobileSelected && (
              <div className="text-[11.5px] text-[#737373]">
                Works offline with local-first storage. You can also click the browser install icon in the address bar for a dedicated desktop window.
              </div>
            )}
          </div>

          {/* Desktop Widget & Mobile Widget Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-xl border border-[#E5E5E5] bg-white flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[13.5px] font-semibold text-[#171717]">
                  <Monitor className="w-4 h-4" />
                  <span>Desktop Widget</span>
                </div>
                <p className="text-[12px] text-[#666666] leading-relaxed">
                  Compact live clock, today&apos;s local holidays, weather, and mini month grid sized for macOS, Windows, or Linux desktops.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLaunchWidget('desktop');
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#171717] hover:bg-[#333333] text-white text-[12px] font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Live</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadWidget('desktop')}
                  className="py-2 px-3 rounded-lg border border-[#DCDCDC] hover:bg-[#F5F5F5] text-[12px] font-medium text-[#171717] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#E5E5E5] bg-white flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[13.5px] font-semibold text-[#171717]">
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile Widget</span>
                </div>
                <p className="text-[12px] text-[#666666] leading-relaxed">
                  Touch-ready 2×2, 4×2, and 4×4 widgets synced with your local schedule and holidays for iPhone, iPad, and Android.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLaunchWidget('mobile');
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#171717] hover:bg-[#333333] text-white text-[12px] font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Live</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadWidget('mobile')}
                  className="py-2 px-3 rounded-lg border border-[#DCDCDC] hover:bg-[#F5F5F5] text-[12px] font-medium text-[#171717] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
