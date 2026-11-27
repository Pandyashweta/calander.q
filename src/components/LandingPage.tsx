import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Download,
  HardDrive,
  Pause,
  Play,
  X,
} from 'lucide-react';
import { UserAccount, WorldCalendarGroupId } from '../types/calendar';
import {
  WORLD_CALENDAR_GROUPS,
  WORLD_CALENDAR_SYSTEMS,
  convertToWorldCalendar,
} from '../data/worldCalendars';
import { MONTH_NAMES, formatDateKey, parseDateKey } from '../utils/dateUtils';
import {
  HolidayRegionCode,
  detectDeviceInfo,
  getRegionLabel,
} from '../utils/deviceUtils';
import { LegalDocId } from './LegalModal';
import { LandingFooter } from './LandingFooter';

interface LandingPageProps {
  today: Date;
  holidayRegion: HolidayRegionCode;
  currentUser: UserAccount | null;
  onOpenCalendar: () => void;
  onOpenAuth: (tab?: 'signin' | 'signup') => void;
  onOpenDownloadHub: () => void;
  onLaunchWidget: (mode: 'desktop' | 'mobile') => void;
  onOpenLegal: (doc: LegalDocId) => void;
  showToast?: (msg: string) => void;
}

interface GalleryShot {
  id: string;
  label: string;
  caption: string;
  src: string;
}

const CAPABILITY_CARDS: Array<{
  id: string;
  index: string;
  title: string;
  subtitle: string;
  src: string;
  span: string;
  objectPos: string;
}> = [
  {
    id: 'month',
    index: '01 · Full-Month Default',
    title: 'Only your local holidays on sign-in',
    subtitle:
      'Opens to a calm full month with local holidays auto-detected. Gujarati Tithis and World Calendar Festivals stay organized until you enable them.',
    src: '/screenshots/workspace-month.png',
    span: 'lg:col-span-7',
    objectPos: 'object-top',
  },
  {
    id: 'astronomy',
    index: '02 · Celestial Almanac',
    title: 'Dedicated Astronomy modal',
    subtitle:
      'Spacious lunar illumination, solar twilight windows, eclipses, and meteor showers outside the sidebar.',
    src: '/screenshots/workspace-astronomy.png',
    span: 'lg:col-span-5',
    objectPos: 'object-center',
  },
  {
    id: 'weather',
    index: '03 · Unified Side Panel',
    title: 'Weather paired with World Clocks',
    subtitle:
      'Agenda and Tasks live in one unified tab while live local forecasts sit alongside World Clocks and meeting overlaps.',
    src: '/screenshots/workspace-weather.png',
    span: 'lg:col-span-5',
    objectPos: 'object-top',
  },
  {
    id: 'settings',
    index: '04 · Local-First & Portable',
    title: 'On-device accounts, .ics Sync & Shortcuts',
    subtitle:
      'Accounts stay strictly on your device with salted hashing, standard .ics import/export, and optional Google Calendar sync.',
    src: '/screenshots/workspace-settings.png',
    span: 'lg:col-span-7',
    objectPos: 'object-center',
  },
];

const DESKTOP_WIDGET_CARD_IMG =
  '/src/assets/images/desktop_home_widget_card_1795779773624.jpg';
const MOBILE_WIDGET_CARD_IMG =
  '/src/assets/images/mobile_home_widget_card_1795779771330.jpg';

export const LandingPage: React.FC<LandingPageProps> = ({
  today,
  holidayRegion,
  currentUser,
  onOpenCalendar,
  onOpenAuth,
  onOpenDownloadHub,
  onLaunchWidget,
  onOpenLegal,
  showToast,
}) => {
  const device = useMemo(() => detectDeviceInfo(), []);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [videoFailed, setVideoFailed] = useState<boolean>(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [lightboxShot, setLightboxShot] = useState<GalleryShot | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Live Interactive 33 World Calendars Converter State
  const [activeGroup, setActiveGroup] = useState<WorldCalendarGroupId>('indian');
  const [converterDateKey, setConverterDateKey] = useState<string>(() =>
    formatDateKey(today)
  );

  const converterDate = useMemo(() => {
    try {
      return parseDateKey(converterDateKey);
    } catch {
      return today;
    }
  }, [converterDateKey, today]);

  const groupConversions = useMemo(
    () =>
      WORLD_CALENDAR_SYSTEMS.filter((s) => s.group === activeGroup).map((meta) => ({
        meta,
        val: convertToWorldCalendar(converterDate, meta.id, false),
      })),
    [activeGroup, converterDate]
  );

  const todayFormatted = `${MONTH_NAMES[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;

  const markImageFailed = (key: string) => {
    setFailedImages((prev) => ({ ...prev, [key]: true }));
  };

  const togglePlayback = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="h-screen overflow-y-auto dark-scroll bg-[#09090B] text-[#FAFAFA] selection:bg-white selection:text-[#09090B]">
      {/* Subtle Top Architectural Radial Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[560px] z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(255, 255, 255, 0.07), transparent 72%)',
        }}
      />

      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 h-[64px] bg-[#09090B]/85 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-[1200px] mx-auto h-full px-5 sm:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="#top"
            className="inline-flex items-center gap-3 text-[19px] font-display font-semibold tracking-[-0.025em] text-white whitespace-nowrap shrink-0"
          >
            <span className="w-9 h-9 rounded-[10px] overflow-hidden bg-black ring-1 ring-white/[0.14] flex items-center justify-center shrink-0">
              <img
                src="/android-chrome-192x192.png"
                alt=""
                className="w-full h-full object-cover scale-[1.42]"
              />
            </span>
            <span>
              calendar<span className="text-[#F04422]">.q</span>
            </span>
          </a>

          {/* Zone 2: Clean Single-Line Text Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-[13.5px] font-medium text-[#A1A1AA]">
            <a
              href="#walkthrough"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Product
            </a>
            <a
              href="#capabilities"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Capabilities
            </a>
            <a
              href="#calendars"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              World Calendars
            </a>
            <a
              href="#apps"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Apps &amp; Widgets
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action Button */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onOpenCalendar}
              className="h-[36px] px-4 rounded-lg bg-white hover:bg-[#E4E4E7] text-[#09090B] text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Open Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ==================== SECTION 1: HERO & PURE SEAMLESS VIDEO ==================== */}
      <section
        id="top"
        className="relative z-10 max-w-[1200px] mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-16 sm:pb-24"
      >
        <div className="max-w-[820px] mx-auto text-center space-y-6">
          <div className="flex items-center justify-center gap-2 text-[12.5px] text-[#A1A1AA] font-medium tracking-[0.01em]">
            <span className="text-[#E4E4E7]">Universal calendar</span>
            <span aria-hidden="true" className="text-[#52525B]">
              ·
            </span>
            <span>{getRegionLabel(holidayRegion)} holidays</span>
            <span aria-hidden="true" className="text-[#52525B]">
              ·
            </span>
            <span className="tabular-nums">{todayFormatted}</span>
          </div>

          <h1
            className="font-display font-semibold tracking-[-0.04em] leading-[1.03] text-white"
            style={{
              fontSize: 'clamp(2.45rem, 5.4vw, 4.35rem)',
              textWrap: 'balance',
            }}
          >
            Every world calendar, unified in one quiet workspace.
          </h1>

          <p className="text-[16px] sm:text-[18px] text-[#A1A1AA] leading-[1.6] max-w-[610px] mx-auto">
            Opens straight to a full month grid with only your local{' '}
            {getRegionLabel(holidayRegion)} holidays selected. Layer any of{' '}
            {WORLD_CALENDAR_SYSTEMS.length} world calendars, live weather, world clocks, and
            astronomy—while keeping your account saved strictly on your device.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenCalendar}
              className="h-[44px] px-6 rounded-xl bg-white hover:bg-[#E4E4E7] text-[#09090B] text-[14px] font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Open Full Month Calendar</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenDownloadHub}
              className="h-[44px] px-5 rounded-xl bg-[#16161A] hover:bg-[#202026] text-[#F4F4F5] text-[14px] font-medium inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-[#A1A1AA]" />
              <span>{device.appDownloadLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenAuth(currentUser ? 'signin' : 'signup')}
              className="h-[44px] px-4 rounded-xl text-[#A1A1AA] hover:text-white text-[13.5px] font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              {currentUser ? `Signed in as ${currentUser.name.split(' ')[0]}` : 'Sign in locally'}
            </button>
          </div>
        </div>

        {/* Pure Frameless Auto-Playing Video Showcase — Zero Chrome, Zero Title Bars */}
        <div id="walkthrough" className="mt-14 sm:mt-16">
          <div className="group relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-[#111114] shadow-[0_36px_96px_-24px_rgba(0,0,0,0.92)]">
            {!videoFailed ? (
              <>
                <video
                  ref={videoRef}
                  src="/videos/calendar-q-demo.mp4"
                  poster="/screenshots/workspace-month.png"
                  autoPlay
                  muted
                  loop
                  playsInline
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={() => setVideoFailed(true)}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={togglePlayback}
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                  className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-black/55 backdrop-blur-md text-white/90 hover:bg-black/80 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                </button>
              </>
            ) : (
              <img
                src="/screenshots/workspace-month.png"
                alt="calendar.q full-month workspace"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
            )}
          </div>
        </div>

        {/* Quantitative Architectural Proof Strip */}
        <div className="mt-14 pt-10 border-t border-white/[0.06] grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="font-mono-tabular text-[30px] sm:text-[34px] font-semibold tracking-tight text-white">
              {WORLD_CALENDAR_SYSTEMS.length}
            </div>
            <div className="text-[13px] text-[#A1A1AA] mt-1">
              World calendars converted live
            </div>
          </div>
          <div>
            <div className="font-mono-tabular text-[30px] sm:text-[34px] font-semibold tracking-tight text-white">
              100%
            </div>
            <div className="text-[13px] text-[#A1A1AA] mt-1">
              Local device storage for accounts
            </div>
          </div>
          <div>
            <div className="font-mono-tabular text-[30px] sm:text-[34px] font-semibold tracking-tight text-white">
              10
            </div>
            <div className="text-[13px] text-[#A1A1AA] mt-1">
              Auto-detected regional holiday sets
            </div>
          </div>
          <div>
            <div className="font-mono-tabular text-[30px] sm:text-[34px] font-semibold tracking-tight text-white">
              5
            </div>
            <div className="text-[13px] text-[#A1A1AA] mt-1">
              Desktop, mobile &amp; widget platforms
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 2: BORDERLESS FULL-BLEED CARD IMAGES ==================== */}
      <section
        id="capabilities"
        className="relative z-10 border-t border-white/[0.06] py-20 sm:py-28"
      >
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 space-y-12">
          <div className="max-w-[640px] space-y-3">
            <div className="text-[12.5px] font-medium text-[#A1A1AA]">
              Core architecture
            </div>
            <h2
              className="font-display text-[30px] sm:text-[42px] font-semibold tracking-[-0.035em] leading-[1.08] text-white"
              style={{ textWrap: 'balance' }}
            >
              Engineered for daily clarity, without cramped sidebars.
            </h2>
            <p className="text-[15.5px] text-[#A1A1AA] leading-relaxed">
              Every module was reorganized around how you actually check dates: a calm full
              month first, optional cultural layers second, and spacious utility panels on
              demand.
            </p>
          </div>

          {/* Asymmetric Borderless Full-Bleed Image Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {CAPABILITY_CARDS.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() =>
                  setLightboxShot({
                    id: card.id,
                    label: card.title,
                    caption: card.subtitle,
                    src: card.src,
                  })
                }
                className={`${card.span} group relative rounded-2xl overflow-hidden bg-[#141418] h-[340px] sm:h-[400px] w-full text-left cursor-zoom-in focus-visible:outline-2 focus-visible:outline-white`}
              >
                {!failedImages[card.id] ? (
                  <img
                    src={card.src}
                    alt={card.title}
                    referrerPolicy="no-referrer"
                    onError={() => markImageFailed(card.id)}
                    className={`w-full h-full object-cover ${card.objectPos} transition-transform duration-500 ease-out group-hover:scale-[1.03]`}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1C1C22] to-[#0E0E11]" />
                )}

                {/* Deep Measured Bottom Contrast Scrim — Zero Box Borders */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/65 to-transparent opacity-95"
                />

                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7 space-y-1.5">
                  <div className="text-[11.5px] font-mono-tabular text-[#A1A1AA]">
                    {card.index}
                  </div>
                  <h3 className="font-display text-[20px] sm:text-[23px] font-semibold tracking-[-0.02em] text-white leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-[13.5px] text-[#D4D4D8] leading-relaxed max-w-[540px] line-clamp-2">
                    {card.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SECTION 3: LIVE 33 WORLD CALENDARS ENGINE ==================== */}
      <section
        id="calendars"
        className="relative z-10 border-t border-white/[0.06] bg-[#0C0C0F] py-20 sm:py-28"
      >
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-[580px] space-y-3">
              <div className="text-[12.5px] font-medium text-[#A1A1AA]">
                Live conversion engine · {WORLD_CALENDAR_SYSTEMS.length} systems
              </div>
              <h2
                className="font-display text-[30px] sm:text-[40px] font-semibold tracking-[-0.035em] leading-[1.08] text-white"
                style={{ textWrap: 'balance' }}
              >
                Test every world calendar right here.
              </h2>
              <p className="text-[15px] text-[#A1A1AA] leading-relaxed">
                Pick any Gregorian date and switch categories to inspect live conversions
                across Indian Panchangs, Middle Eastern, East Asian, and historical
                calendars.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#151519] text-[12.5px] text-[#A1A1AA]">
                <span>Date</span>
                <input
                  type="date"
                  value={converterDateKey}
                  onChange={(e) => {
                    if (e.target.value) setConverterDateKey(e.target.value);
                  }}
                  className="bg-transparent text-white font-mono-tabular text-[12.5px] focus:outline-none [color-scheme:dark]"
                />
              </label>

              <button
                type="button"
                onClick={() => setConverterDateKey(formatDateKey(today))}
                className="h-[38px] px-4 rounded-xl bg-[#151519] hover:bg-[#1E1E24] text-[12.5px] font-medium text-[#E4E4E7] transition-colors cursor-pointer"
              >
                Today
              </button>
            </div>
          </div>

          {/* Interactive Category Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#141418] w-fit">
            {WORLD_CALENDAR_GROUPS.map((grp) => (
              <button
                key={grp.id}
                type="button"
                onClick={() => setActiveGroup(grp.id)}
                className={`px-3.5 py-2 rounded-lg text-[12.5px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  activeGroup === grp.id
                    ? 'bg-white text-[#09090B]'
                    : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                {grp.label}
              </button>
            ))}
          </div>

          {/* Clean Borderless Tonal Surface Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {groupConversions.map(({ meta, val }) => (
              <div
                key={meta.id}
                className="p-5 rounded-2xl bg-[#131317] hover:bg-[#18181D] transition-colors space-y-2"
              >
                <div className="flex items-center justify-between gap-2 text-[12px] text-[#71717A]">
                  <span className="truncate">{meta.region}</span>
                  <span className="font-mono-tabular shrink-0">{val.shortLabel}</span>
                </div>
                <div className="text-[14.5px] font-semibold text-white">{meta.name}</div>
                <div className="text-[13.5px] font-mono-tabular text-[#D4D4D8]">
                  {val.formatted}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SECTION 4: BORDERLESS APPS & HOME SCREEN WIDGET CARDS ==================== */}
      <section
        id="apps"
        className="relative z-10 border-t border-white/[0.06] py-20 sm:py-28"
      >
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-[620px] space-y-3">
              <div className="text-[12.5px] font-medium text-[#A1A1AA]">
                Detected platform · {device.label}
              </div>
              <h2
                className="font-display text-[30px] sm:text-[40px] font-semibold tracking-[-0.035em] leading-[1.08] text-white"
                style={{ textWrap: 'balance' }}
              >
                Install the app. Pin widgets right on your home screen.
              </h2>
              <p className="text-[15px] text-[#A1A1AA] leading-relaxed">
                Install calendar.q as a standalone app on desktop or phone, and place live
                glanceable widgets outside the app—on your iPhone Home Screen, Android Home
                Screen, Windows 11 Widgets Board, or floating on your desktop.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenDownloadHub}
              className="h-[42px] px-5 rounded-xl bg-white hover:bg-[#E4E4E7] text-[#09090B] text-[13.5px] font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer self-start md:self-auto whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>{device.appDownloadLabel}</span>
            </button>
          </div>

          {/* 2 Full-Bleed Borderless Photorealistic Card Images */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Desktop App & Outside Desktop Widget Card Image */}
            <div className="group relative rounded-2xl overflow-hidden bg-[#131317] aspect-[4/3] w-full">
              {!failedImages['card-desktop-widget'] ? (
                <img
                  src={DESKTOP_WIDGET_CARD_IMG}
                  alt="calendar.q widget pinned cleanly on a dark desktop display wallpaper"
                  referrerPolicy="no-referrer"
                  onError={() => markImageFailed('card-desktop-widget')}
                  className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1C1C22] to-[#0D0D10]" />
              )}

              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/60 to-transparent"
              />

              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7 space-y-4">
                <div className="space-y-1.5">
                  <div className="text-[11.5px] font-mono-tabular text-[#A1A1AA]">
                    Windows 11 · macOS · Linux
                  </div>
                  <h3 className="font-display text-[22px] sm:text-[24px] font-semibold tracking-[-0.02em] text-white">
                    Desktop App &amp; Desktop Widget
                  </h3>
                  <p className="text-[13.5px] text-[#D4D4D8] leading-relaxed max-w-[460px]">
                    Install via Chrome or Edge (with native Windows 11 Widgets Board support)
                    or launch a compact floating widget right on your desktop.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onOpenDownloadHub}
                    className="h-[38px] px-4 rounded-lg bg-white hover:bg-[#E4E4E7] text-[#09090B] text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Install Desktop App &amp; Widget</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onLaunchWidget('desktop')}
                    className="h-[38px] px-4 rounded-lg bg-white/12 hover:bg-white/20 backdrop-blur-md text-white text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>Preview</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile App & Phone Home Screen Widget Card Image */}
            <div className="group relative rounded-2xl overflow-hidden bg-[#131317] aspect-[4/3] w-full">
              {!failedImages['card-mobile-widget'] ? (
                <img
                  src={MOBILE_WIDGET_CARD_IMG}
                  alt="calendar.q widget placed directly on a smartphone home screen above app icons"
                  referrerPolicy="no-referrer"
                  onError={() => markImageFailed('card-mobile-widget')}
                  className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1C1C22] to-[#0D0D10]" />
              )}

              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/60 to-transparent"
              />

              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7 space-y-4">
                <div className="space-y-1.5">
                  <div className="text-[11.5px] font-mono-tabular text-[#A1A1AA]">
                    iPhone · iPad · Android Home Screen
                  </div>
                  <h3 className="font-display text-[22px] sm:text-[24px] font-semibold tracking-[-0.02em] text-white">
                    Phone App &amp; Home Screen Widget
                  </h3>
                  <p className="text-[13.5px] text-[#D4D4D8] leading-relaxed max-w-[460px]">
                    Add calendar.q to your phone home screen as an offline app and pin a real
                    2×2, 4×2, or 4×4 widget directly onto your iOS or Android Home Screen.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onOpenDownloadHub}
                    className="h-[38px] px-4 rounded-lg bg-white hover:bg-[#E4E4E7] text-[#09090B] text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Add to Phone Home Screen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onLaunchWidget('mobile')}
                    className="h-[38px] px-4 rounded-lg bg-white/12 hover:bg-white/20 backdrop-blur-md text-white text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>Preview</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 5: LOCAL-FIRST CLOSING CTA ==================== */}
      <section className="relative z-10 border-t border-white/[0.06] bg-[#0C0C0F] py-20 sm:py-24">
        <div className="max-w-[820px] mx-auto px-5 sm:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 text-[12.5px] text-[#A1A1AA]">
            <HardDrive className="w-3.5 h-3.5 text-[#D4D4D8]" />
            <span>Saved only on your computer or phone · Optional Google sync</span>
          </div>

          <h2
            className="font-display text-[32px] sm:text-[46px] font-semibold tracking-[-0.038em] leading-[1.06] text-white"
            style={{ textWrap: 'balance' }}
          >
            Start with a clean month. Keep your data yours.
          </h2>

          <p className="text-[15.5px] text-[#A1A1AA] max-w-[540px] mx-auto leading-relaxed">
            Open calendar.q immediately with zero sign-up required, or create a local
            device profile in seconds.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenCalendar}
              className="h-[44px] px-6 rounded-xl bg-white hover:bg-[#E4E4E7] text-[#09090B] text-[14px] font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Open Calendar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenDownloadHub}
              className="h-[44px] px-5 rounded-xl bg-[#16161A] hover:bg-[#202026] text-[#F4F4F5] text-[14px] font-medium inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-[#A1A1AA]" />
              <span>Install Apps &amp; Widgets</span>
            </button>
          </div>
        </div>
      </section>

      {/* Professional Editorial Footer with About, Privacy, Terms & Waitlist */}
      <LandingFooter
        currentUser={currentUser}
        onOpenCalendar={onOpenCalendar}
        onOpenAuth={onOpenAuth}
        onOpenDownloadHub={onOpenDownloadHub}
        onOpenLegal={onOpenLegal}
        showToast={showToast}
      />

      {/* High-Resolution Screenshot Lightbox */}
      {lightboxShot && (
        <div
          onClick={() => setLightboxShot(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={lightboxShot.label}
            className="w-full max-w-[1160px] rounded-2xl overflow-hidden bg-[#111114] shadow-2xl"
          >
            <div className="px-5 py-3.5 flex items-center justify-between gap-4 bg-[#141418]">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-white truncate">
                  {lightboxShot.label}
                </div>
                <div className="text-[12px] text-[#A1A1AA] truncate">
                  {lightboxShot.caption}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLightboxShot(null)}
                aria-label="Close preview"
                className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/[0.08] cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-[#09090B] max-h-[80vh] overflow-auto">
              <img
                src={lightboxShot.src}
                alt={lightboxShot.caption}
                referrerPolicy="no-referrer"
                className="w-full h-auto block"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
