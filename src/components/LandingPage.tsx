import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  Download,
  ExternalLink,
  Menu,
  Pin,
  X,
} from 'lucide-react';
import { UserAccount } from '../types/calendar';
import { WORLD_CALENDAR_SYSTEMS } from '../data/worldCalendars';
import { HolidayRegionCode, detectDeviceInfo, launchFloatingDesktopWidget } from '../utils/deviceUtils';
import { LegalDocId } from './LegalModal';
import { LandingFooter } from './LandingFooter';

interface LandingPageProps {
  today: Date;
  holidayRegion: HolidayRegionCode;
  currentUser: UserAccount | null;
  onOpenCalendar: () => void;
  onOpenAuth: (tab?: 'signin' | 'signup') => void;
  onOpenDownloadHub: () => void;
  onOpenAbout: () => void;
  onLaunchWidget: (mode: 'desktop' | 'mobile') => void;
  onOpenLegal: (doc: LegalDocId) => void;
  showToast?: (msg: string) => void;
}

const LANDSCAPE_BACKDROP = '/images/landscape-backdrop.jpg';
const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const HERO_WORDS = ['Plan', 'with', 'exact', 'precision.'];

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  onOpenCalendar,
  onOpenDownloadHub,
  onOpenAbout,
  onLaunchWidget,
  onOpenLegal,
  showToast,
}) => {
  const device = useMemo(() => detectDeviceInfo(), []);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 32);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const heroSubtitleWords = useMemo(
    () =>
      `The universal calendar that gets every date right. No clutter. No guesswork. Just ${WORLD_CALENDAR_SYSTEMS.length} world calendars, holidays, and time—every day.`.split(
        ' '
      ),
    []
  );

  const handlePinDesktopWidget = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const res = await launchFloatingDesktopWidget(origin);
    if (res === 'pip') {
      showToast?.('Floating desktop widget pinned on your screen.');
    } else if (res === 'popup') {
      showToast?.('Opened standalone desktop widget window.');
    } else {
      onLaunchWidget('desktop');
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={scrollContainerRef}
        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
        className="h-screen overflow-y-auto dark-scroll bg-[#0A0908] text-white selection:bg-white selection:text-[#0A0908]"
      >
        {/* ==================== 1. STICKY TOP NAVIGATION ==================== */}
        <header
          className={`sticky top-0 z-40 h-[64px] bg-[#0A0908]/85 backdrop-blur-md transition-colors ${
            scrolled ? 'border-b border-white/[0.08]' : 'border-b border-transparent'
          }`}
        >
          <div className="max-w-[1080px] mx-auto h-full px-5 sm:px-6 flex items-center justify-between gap-6">
            {/* Left Brand */}
            <a
              href="#hero"
              className="inline-flex items-center gap-2.5 text-[15px] font-medium tracking-[-0.02em] text-white whitespace-nowrap shrink-0"
            >
              <img
                src="/android-chrome-192x192.png"
                alt=""
                className="w-5 h-5 object-contain shrink-0"
              />
              <span>Calander.Q</span>
            </a>

            {/* Center Nav Links */}
            <nav className="hidden md:flex items-center gap-7 text-[14px] font-normal text-[#858585]">
              <a href="#core-features" className="hover:text-white transition-colors whitespace-nowrap">
                Features
              </a>
              <a href="#ways" className="hover:text-white transition-colors whitespace-nowrap">
                Platforms
              </a>
            </nav>

            {/* Right Action (scroll-morphs into white pill button like exact.framer.ai) */}
            <div className="flex items-center gap-3 shrink-0">
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
                className="hidden md:inline-flex items-center justify-center h-[32px] px-3.5 rounded-[8px] text-[13.5px] font-medium cursor-pointer whitespace-nowrap"
              >
                {currentUser ? 'Open Calendar' : 'Get Started'}
              </motion.button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Toggle navigation menu"
                className="md:hidden p-2 rounded-[8px] text-white hover:bg-white/[0.08] cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Nav Drawer */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                className="md:hidden bg-[#0F0F0F] border-b border-white/[0.12] px-5 py-4 space-y-3 text-[14px]"
              >
                <a
                  href="#core-features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-[#858585] hover:text-white"
                >
                  Features
                </a>
                <a
                  href="#ways"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-[#858585] hover:text-white"
                >
                  Platforms
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenCalendar();
                  }}
                  className="w-full h-[38px] rounded-[8px] bg-white text-[#0A0908] font-medium cursor-pointer"
                >
                  Get Started
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* ==================== 2. HERO ==================== */}
        <section id="hero" className="max-w-[1080px] mx-auto px-5 sm:px-6 pt-14 sm:pt-20 pb-14">
          <div className="max-w-[800px] mx-auto text-center">
            {/* Word-by-word blur + translateY reveal matching exact.framer.ai */}
            <h1 className="text-[38px] sm:text-[56px] font-medium tracking-[-0.03em] leading-[1.06] text-white">
              {HERO_WORDS.map((word, idx) => (
                <motion.span
                  key={word}
                  initial={{ opacity: 0.001, y: 14, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{
                    duration: 0.55,
                    delay: idx * 0.07,
                    ease: EASE_OUT_EXPO,
                  }}
                  className="inline-block mr-[0.26em] last:mr-0"
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            {/* Subtitle blur + stagger reveal */}
            <p className="mt-4 text-[15px] sm:text-[16px] text-[#858585] max-w-[500px] mx-auto leading-[1.45]">
              {heroSubtitleWords.map((word, idx) => (
                <motion.span
                  key={`${word}-${idx}`}
                  initial={{ opacity: 0.001, y: 8, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{
                    duration: 0.45,
                    delay: 0.22 + idx * 0.018,
                    ease: EASE_OUT_EXPO,
                  }}
                  className="inline-block mr-[0.26em] last:mr-0"
                >
                  {word}
                </motion.span>
              ))}
            </p>

            {/* Staggered CTA row */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-6">
              <motion.button
                type="button"
                onClick={onOpenDownloadHub}
                initial={{ opacity: 0.001, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.55, delay: 0.42, ease: EASE_OUT_EXPO }}
                className="h-[40px] px-5 rounded-[8px] bg-white hover:bg-[#E4E4E7] text-[#0A0908] text-[14px] font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                {device.appDownloadLabel}
              </motion.button>
              <motion.a
                href="#core-features"
                initial={{ opacity: 0.001, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.5, ease: EASE_OUT_EXPO }}
                className="text-[14px] font-medium text-white hover:text-[#858585] transition-colors whitespace-nowrap"
              >
                Discover product
              </motion.a>
            </div>
          </div>

          {/* Painterly Landscape Framing Live Dark Software Window */}
          <motion.div
            initial={{ opacity: 0.001, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease: EASE_OUT_EXPO }}
            className="mt-12 rounded-none overflow-hidden relative p-4 sm:p-10 md:p-14 bg-[#171615]"
          >
            <img
              src={LANDSCAPE_BACKDROP}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="relative z-10 max-w-[880px] mx-auto rounded-none overflow-hidden bg-[#0F0F0F] border border-white/[0.16] shadow-[0_32px_90px_rgba(0,0,0,0.88)]">
              <div className="h-[28px] bg-[#141414] border-b border-white/[0.08] flex items-center justify-center text-[11px] text-[#858585]">
                Calander.Q
              </div>
              <img
                src="/screenshots/workspace-month-dark.png"
                alt="Calander.Q dark mode workspace"
                className="w-full h-auto block"
              />
            </div>
          </motion.div>
        </section>

        {/* ==================== 3. CORE FEATURES ==================== */}
        <section id="core-features" className="max-w-[1080px] mx-auto px-5 sm:px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
          >
            <div className="text-[14px] font-mono text-[#858585]">// Core features</div>
            <h2 className="mt-3 text-[32px] sm:text-[40px] font-medium tracking-[-0.025em] leading-[1.15]">
              <span className="text-white block">Plan with precision.</span>
              <span className="text-[#858585] block">Stay aligned everywhere.</span>
            </h2>
          </motion.div>

          <div className="mt-12 space-y-6">
            {/* Card 1: Media Left / Copy Right */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
              className="rounded-[12px] bg-[#0F0F0F] border border-white/[0.14] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-center"
            >
              <div className="lg:col-span-6 p-4 sm:p-6">
                <div className="relative rounded-none overflow-hidden aspect-[4/3] bg-[#171615] p-4 flex items-center justify-center group">
                  <img
                    src={LANDSCAPE_BACKDROP}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="relative z-10 w-full h-full rounded-none overflow-hidden border border-white/[0.16] bg-[#0F0F0F] shadow-2xl">
                    <img
                      src="/screenshots/workspace-world-dark.png"
                      alt="33 world calendars view"
                      className="w-full h-full object-cover object-left-top"
                    />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-6 p-6 sm:p-10 space-y-4">
                <h3 className="text-[20px] font-medium tracking-[-0.015em] text-white">
                  {WORLD_CALENDAR_SYSTEMS.length} world calendars in one grid
                </h3>
                <p className="text-[15px] text-[#858585] leading-[1.45]">
                  Opens to a clean full month with only your regional holidays enabled. Layer
                  Gujarati Vikram Samvat Tithis, Hijri, Hebrew, or East Asian dates whenever you
                  need them.
                </p>
                <div className="pt-1">
                  <motion.button
                    type="button"
                    onClick={onOpenCalendar}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-[38px] px-4 rounded-[8px] bg-white hover:bg-[#E4E4E7] text-[#0A0908] text-[13.5px] font-medium transition-colors cursor-pointer"
                  >
                    Open calendar
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Copy Left / Media Right */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.05, ease: EASE_OUT_EXPO }}
              className="rounded-[12px] bg-[#0F0F0F] border border-white/[0.14] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-center"
            >
              <div className="lg:col-span-6 p-6 sm:p-10 space-y-4 order-2 lg:order-1">
                <h3 className="text-[20px] font-medium tracking-[-0.015em] text-white">
                  Astronomy &amp; celestial almanac
                </h3>
                <p className="text-[15px] text-[#858585] leading-[1.45]">
                  Inspect live lunar illumination, solar twilight windows, upcoming eclipses, and
                  meteor showers in a spacious dedicated view—without crowding your calendar sidebar.
                </p>
                <div className="pt-1">
                  <motion.button
                    type="button"
                    onClick={onOpenCalendar}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-[38px] px-4 rounded-[8px] bg-white hover:bg-[#E4E4E7] text-[#0A0908] text-[13.5px] font-medium transition-colors cursor-pointer"
                  >
                    See it in action
                  </motion.button>
                </div>
              </div>
              <div className="lg:col-span-6 p-4 sm:p-6 order-1 lg:order-2">
                <div className="relative rounded-none overflow-hidden aspect-[4/3] bg-[#171615] p-4 flex items-center justify-center group">
                  <img
                    src={LANDSCAPE_BACKDROP}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="relative z-10 w-full h-full rounded-none overflow-hidden border border-white/[0.16] bg-[#0F0F0F] shadow-2xl">
                    <img
                      src="/screenshots/workspace-astronomy-dark.png"
                      alt="Astronomy and celestial almanac view"
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Media Left / Copy Right */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.08, ease: EASE_OUT_EXPO }}
              className="rounded-[12px] bg-[#0F0F0F] border border-white/[0.14] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-center"
            >
              <div className="lg:col-span-6 p-4 sm:p-6">
                <div className="relative rounded-none overflow-hidden aspect-[4/3] bg-[#171615] p-4 flex items-center justify-center group">
                  <img
                    src={LANDSCAPE_BACKDROP}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="relative z-10 w-full h-full rounded-none overflow-hidden border border-white/[0.16] bg-[#0F0F0F] shadow-2xl">
                    <img
                      src="/screenshots/workspace-weather-dark.png"
                      alt="Live weather and world clocks panel"
                      className="w-full h-full object-cover object-right-top"
                    />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-6 p-6 sm:p-10 space-y-4">
                <h3 className="text-[20px] font-medium tracking-[-0.015em] text-white">
                  Weather &amp; world clocks side panel
                </h3>
                <p className="text-[15px] text-[#858585] leading-[1.45]">
                  Track live forecasts, multi-timezone meeting overlaps, agenda items, and tasks side
                  by side—with instant date conversion built right in.
                </p>
                <div className="pt-1">
                  <motion.button
                    type="button"
                    onClick={onOpenCalendar}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-[38px] px-4 rounded-[8px] bg-white hover:bg-[#E4E4E7] text-[#0A0908] text-[13.5px] font-medium transition-colors cursor-pointer"
                  >
                    Explore workspace
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==================== 6. THREE WAYS TO RUN ==================== */}
        <section id="ways" className="max-w-[1080px] mx-auto px-5 sm:px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
          >
            <div className="text-[14px] font-mono text-[#858585]">// Three ways to run</div>
            <h2 className="mt-3 text-[32px] sm:text-[40px] font-medium tracking-[-0.025em] leading-[1.15]">
              <span className="text-white block">Start planning your way.</span>
              <span className="text-[#858585] block">Choose what works best.</span>
            </h2>
          </motion.div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Desktop & Mobile Widgets */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0, ease: EASE_OUT_EXPO }}
              className="space-y-4"
            >
              <div className="relative rounded-none overflow-hidden aspect-[4/3] bg-[#171615] p-3 flex items-center justify-center group">
                <img
                  src={LANDSCAPE_BACKDROP}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div className="relative z-10 w-full h-full rounded-none overflow-hidden border border-white/[0.16] bg-[#0F0F0F] shadow-xl">
                  <img
                    src="/screenshots/widget-desktop-dark.png"
                    alt="Desktop widget preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[20px] font-medium text-white">Desktop &amp; mobile widget</h3>
                <p className="text-[14px] text-[#858585] leading-[1.45]">
                  Pin an always-on-top widget on your desktop or add it to your iPhone &amp; Android
                  home screen.
                </p>
              </div>
              <motion.button
                type="button"
                onClick={() => void handlePinDesktopWidget()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-[38px] px-4 rounded-[8px] bg-[#0F0F0F] hover:bg-[#171615] border border-white/[0.18] text-white text-[13.5px] font-medium inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Pin className="w-3.5 h-3.5" />
                <span>Pin desktop widget</span>
              </motion.button>
            </motion.div>

            {/* 2. Standalone App */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.08, ease: EASE_OUT_EXPO }}
              className="space-y-4"
            >
              <div className="relative rounded-none overflow-hidden aspect-[4/3] bg-[#171615] p-3 flex items-center justify-center group">
                <img
                  src={LANDSCAPE_BACKDROP}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div className="relative z-10 w-full h-full rounded-none overflow-hidden border border-white/[0.16] bg-[#0F0F0F] shadow-xl">
                  <img
                    src="/screenshots/workspace-astronomy-dark.png"
                    alt="Standalone desktop and mobile app"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[20px] font-medium text-white">Desktop &amp; phone app</h3>
                <p className="text-[14px] text-[#858585] leading-[1.45]">
                  Standalone macOS, Windows, Linux, iOS, and Android app with full offline &amp; local
                  mode.
                </p>
              </div>
              <motion.button
                type="button"
                onClick={onOpenDownloadHub}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-[38px] px-4 rounded-[8px] bg-white hover:bg-[#E4E4E7] text-[#0A0908] text-[13.5px] font-medium inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>{device.appDownloadLabel}</span>
                <Download className="w-3.5 h-3.5" />
              </motion.button>
            </motion.div>

            {/* 3. Browser */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.16, ease: EASE_OUT_EXPO }}
              className="space-y-4"
            >
              <div className="relative rounded-none overflow-hidden aspect-[4/3] bg-[#171615] p-3 flex items-center justify-center group">
                <img
                  src={LANDSCAPE_BACKDROP}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div className="relative z-10 w-full h-full rounded-none overflow-hidden border border-white/[0.16] bg-[#0F0F0F] shadow-xl">
                  <img
                    src="/screenshots/workspace-month-dark.png"
                    alt="Calander.Q in browser"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[20px] font-medium text-white">Browser</h3>
                <p className="text-[14px] text-[#858585] leading-[1.45]">
                  Try Calander.Q instantly in your browser. No installation required.
                </p>
              </div>
              <motion.button
                type="button"
                onClick={onOpenCalendar}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-[38px] px-4 rounded-[8px] bg-white hover:bg-[#E4E4E7] text-[#0A0908] text-[13.5px] font-medium inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Open in browser</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </motion.button>
            </motion.div>
          </div>
        </section>

        {/* ==================== 7. BOTTOM CTA BANNER ==================== */}
        <section className="max-w-[1080px] mx-auto px-5 sm:px-6 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            className="rounded-[12px] bg-[#0F0F0F] border border-white/[0.14] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center overflow-hidden"
          >
            <div className="lg:col-span-6 space-y-4">
              <h2 className="text-[28px] sm:text-[36px] font-medium tracking-[-0.025em] leading-[1.12] text-white">
                Start planning with precision today
              </h2>
              <p className="text-[15px] text-[#858585] leading-[1.45]">
                Free forever. Install in seconds. Start organizing immediately.
              </p>
              <div className="pt-2">
                <motion.button
                  type="button"
                  onClick={onOpenDownloadHub}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-[40px] px-5 rounded-[8px] bg-white hover:bg-[#E4E4E7] text-[#0A0908] text-[14px] font-medium transition-colors cursor-pointer"
                >
                  {device.appDownloadLabel}
                </motion.button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-none overflow-hidden aspect-[16/10] bg-[#171615] p-3 sm:p-4 flex items-center justify-center group">
                <img
                  src={LANDSCAPE_BACKDROP}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div className="relative z-10 w-full h-full rounded-none overflow-hidden border border-white/[0.16] bg-[#0F0F0F] shadow-2xl">
                  <img
                    src="/screenshots/workspace-month-dark.png"
                    alt="Calander.Q dark mode calendar preview"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ==================== 8. FOOTER ==================== */}
        <LandingFooter
          onOpenCalendar={onOpenCalendar}
          onOpenLegal={onOpenLegal}
          onOpenAbout={onOpenAbout}
          onOpenDownloadHub={onOpenDownloadHub}
        />
      </div>
    </MotionConfig>
  );
};
