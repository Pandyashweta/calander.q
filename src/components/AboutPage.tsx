import React, { useEffect, useRef, useState } from 'react';
import { MotionConfig, motion } from 'motion/react';
import { ArrowLeft, Compass, Globe, HardDrive, Layers, Sparkles } from 'lucide-react';
import { WORLD_CALENDAR_SYSTEMS } from '../data/worldCalendars';
import { LegalDocId } from './LegalModal';
import { LandingFooter } from './LandingFooter';

interface AboutPageProps {
  onBack: () => void;
  onOpenCalendar: () => void;
  onOpenDownloadHub: () => void;
  onOpenLegal: (doc: LegalDocId) => void;
  onOpenAbout: () => void;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
const LANDSCAPE_BACKDROP = '/images/landscape-backdrop.jpg';

const PRINCIPLES = [
  {
    icon: Layers,
    title: 'Calm full-month default',
    description:
      'Every workspace opens to a quiet full-month grid with only your auto-detected regional holidays active—never overwhelming you with dozens of noisy layers.',
  },
  {
    icon: Globe,
    title: `${WORLD_CALENDAR_SYSTEMS.length} cultural & historical systems`,
    description:
      'Built-in mathematical conversions across Gujarati Vikram Samvat, Hindu Panchang, Islamic Hijri, Hebrew, Chinese Lunar, Persian, Japanese, and more.',
  },
  {
    icon: Compass,
    title: 'Astronomy & live weather',
    description:
      'Lunar phases, golden hour, civil and astronomical twilight, upcoming eclipses, meteor showers, and multi-city forecasts built directly alongside your schedule.',
  },
  {
    icon: HardDrive,
    title: 'Web sync or standalone offline app',
    description:
      'Use Calander.Q immediately in any browser with account & Google Calendar sync, or install the standalone desktop/mobile app to unlock on-device offline storage and widgets.',
  },
];

export const AboutPage: React.FC<AboutPageProps> = ({
  onBack,
  onOpenCalendar,
  onOpenDownloadHub,
  onOpenLegal,
  onOpenAbout,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 32);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

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
              <button
                type="button"
                onClick={onOpenDownloadHub}
                className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                Download App
              </button>
              <button
                type="button"
                onClick={() => onOpenLegal('contact')}
                className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                Contact
              </button>
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

        {/* ==================== HERO ==================== */}
        <section className="max-w-[1080px] mx-auto px-5 sm:px-6 pt-12 sm:pt-16 pb-12">
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
            className="max-w-[780px]"
          >
            <div className="text-[14px] font-mono text-[#858585]">// About Calander.Q</div>
            <h1 className="mt-3 text-[36px] sm:text-[52px] font-medium tracking-[-0.03em] leading-[1.06]">
              <span className="text-white block">Built for every calendar.</span>
              <span className="text-[#858585] block">Designed for daily calm.</span>
            </h1>
            <p className="mt-4 text-[15px] sm:text-[16px] text-[#858585] max-w-[600px] leading-[1.5]">
              Calander.Q unifies {WORLD_CALENDAR_SYSTEMS.length} cultural and astronomical
              calendars in one quiet full-month workspace—so people working across regions,
              traditions, and time zones never have to juggle disconnected tools.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <motion.button
                type="button"
                onClick={onOpenCalendar}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-[40px] px-5 rounded-[8px] bg-white hover:bg-[#E4E4E7] text-[#0A0908] text-[14px] font-medium transition-colors cursor-pointer"
              >
                Open Calendar
              </motion.button>
              <motion.button
                type="button"
                onClick={onOpenDownloadHub}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-[40px] px-5 rounded-[8px] bg-[#0F0F0F] hover:bg-[#171615] border border-white/[0.14] text-white text-[14px] font-medium transition-colors cursor-pointer"
              >
                Download App &amp; Widgets
              </motion.button>
            </div>
          </motion.div>

          {/* Sharp Landscape Showcase */}
          <motion.div
            initial={{ opacity: 0.001, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12, ease: EASE_OUT_EXPO }}
            className="mt-12 rounded-none overflow-hidden relative p-4 sm:p-10 md:p-14 bg-[#171615]"
          >
            <img
              src={LANDSCAPE_BACKDROP}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="relative z-10 max-w-[880px] mx-auto rounded-none overflow-hidden bg-[#0F0F0F] border border-white/[0.16] shadow-[0_32px_90px_rgba(0,0,0,0.88)]">
              <img
                src="/screenshots/workspace-world-dark.png"
                alt="Calander.Q world calendars and weather workspace"
                className="w-full h-auto block"
              />
            </div>
          </motion.div>
        </section>

        {/* ==================== ARCHITECTURE & PRINCIPLES ==================== */}
        <section className="max-w-[1080px] mx-auto px-5 sm:px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          >
            <div className="text-[14px] font-mono text-[#858585]">// Architecture</div>
            <h2 className="mt-3 text-[32px] sm:text-[40px] font-medium tracking-[-0.025em] leading-[1.15]">
              <span className="text-white block">Zero bloat.</span>
              <span className="text-[#858585] block">Precision at every scale.</span>
            </h2>
          </motion.div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRINCIPLES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: idx * 0.05, ease: EASE_OUT_EXPO }}
                  className="rounded-[8px] bg-[#0F0F0F] border border-white/[0.12] p-6 space-y-4"
                >
                  <div className="w-10 h-10 rounded-full bg-[#171615] border border-white/[0.08] flex items-center justify-center text-white">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-[19px] font-medium text-white">{item.title}</h3>
                  <p className="text-[14px] text-[#858585] leading-[1.5]">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ==================== NUMBERS STRIP ==================== */}
        <section className="max-w-[1080px] mx-auto px-5 sm:px-6 pb-20">
          <div className="rounded-[12px] bg-[#0F0F0F] border border-white/[0.14] p-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <div className="font-mono-tabular text-[34px] font-medium text-white">
                {WORLD_CALENDAR_SYSTEMS.length}
              </div>
              <div className="text-[14px] text-[#858585] mt-1">
                World calendar systems converted live
              </div>
            </div>
            <div>
              <div className="font-mono-tabular text-[34px] font-medium text-white">10</div>
              <div className="text-[14px] text-[#858585] mt-1">
                Auto-detected regional holiday calendars
              </div>
            </div>
            <div>
              <div className="font-mono-tabular text-[34px] font-medium text-white inline-flex items-center gap-2">
                <span>0</span>
                <Sparkles className="w-5 h-5 text-[#858585]" />
              </div>
              <div className="text-[14px] text-[#858585] mt-1">
                Ad trackers or cross-site surveillance
              </div>
            </div>
          </div>
        </section>

        {/* ==================== FOOTER ==================== */}
        <LandingFooter
          onOpenCalendar={onOpenCalendar}
          onOpenAbout={onOpenAbout}
          onOpenDownloadHub={onOpenDownloadHub}
          onOpenLegal={onOpenLegal}
        />
      </div>
    </MotionConfig>
  );
};
