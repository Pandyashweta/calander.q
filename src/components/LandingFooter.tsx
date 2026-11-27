import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { LegalDocId } from './LegalModal';
import { WORLD_CALENDAR_SYSTEMS } from '../data/worldCalendars';

interface LandingFooterProps {
  onOpenCalendar: () => void;
  onOpenLegal: (doc: LegalDocId) => void;
  onOpenAbout?: () => void;
  onOpenDownloadHub?: () => void;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const FAQ_ITEMS = [
  {
    q: 'Is Calander.Q really free?',
    a: 'Yes. Calander.Q is free for personal planning across all 33 world calendars, regional holidays, live weather, astronomy, and .ics import/export.',
  },
  {
    q: 'How do I download the app so it does not just open a browser tab?',
    a: 'Click Download for Windows to get the standalone setup installer (or run the macOS/Linux standalone launcher). It installs and launches as its own OS desktop application with zero browser tabs and unlocks offline local mode.',
  },
  {
    q: 'Why is local device mode unlocked after downloading the app?',
    a: 'On the main website, your account and events sync through your signed-in cloud session. Once you download and open the standalone app on your computer or phone, on-device local storage and offline mode turn on automatically.',
  },
  {
    q: 'How can I add widgets on Desktop, iPhone, and Android?',
    a: 'Open the Download & Widgets page (or click Pin Desktop Widget) to pop out an always-on-top floating widget on Windows, macOS, or Linux, pin the Windows 11 Widgets Board card (Win + W), or add the iOS Scriptable / Android Home Screen widget.',
  },
  {
    q: 'Which world calendars and regional holidays are supported?',
    a: `All ${WORLD_CALENDAR_SYSTEMS.length} world calendar systems—including Gujarati Vikram Samvat, Hindu Panchang, Islamic Hijri, Hebrew, Chinese Lunar, Persian, Japanese, and historical calendars—plus auto-detected national holidays for 10 regions.`,
  },
  {
    q: 'Can I sync with Google Calendar or import .ics files?',
    a: 'Yes. Connect Google Calendar for two-way event sync with explicit confirmation prompts, or import and export standard .ics files from Apple Calendar, Google Calendar, and Outlook.',
  },
];

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onOpenCalendar,
  onOpenLegal,
  onOpenAbout,
  onOpenDownloadHub,
}) => {
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  return (
    <footer className="bg-[#0F0F0F] border-t border-white/[0.1] text-[#858585]">
      {/* FAQ inside Footer ONLY */}
      <div
        id="faq"
        className="max-w-[1080px] mx-auto px-5 sm:px-6 pt-14 pb-12 border-b border-white/[0.08] grid grid-cols-1 lg:grid-cols-12 gap-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
          className="lg:col-span-5 self-start"
        >
          <div className="text-[14px] font-mono text-[#858585]">// FAQ</div>
          <h2 className="mt-3 text-[32px] sm:text-[40px] font-medium tracking-[-0.025em] leading-[1.15]">
            <span className="text-white block">Questions?</span>
            <span className="text-[#858585] block">We&apos;ve got answers.</span>
          </h2>
        </motion.div>

        <div className="lg:col-span-7 space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <motion.div
                key={item.q}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: idx * 0.04, ease: EASE_OUT_EXPO }}
                className="rounded-[8px] bg-[#0A0908] border border-white/[0.12] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left text-[15px] font-medium text-white hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="shrink-0 text-[#858585]"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 text-[14px] text-[#858585] leading-[1.5]">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto px-5 sm:px-6 py-12 sm:py-14 flex flex-col md:flex-row justify-between gap-10">
        {/* Left Column: Brand, Tagline, Legal/Info Actions, Credit */}
        <div className="space-y-5 max-w-[340px]">
          <a
            href="#hero"
            className="inline-flex items-center gap-2.5 text-[15px] font-medium tracking-[-0.02em] text-white"
          >
            <img
              src="/android-chrome-192x192.png"
              alt=""
              className="w-5 h-5 object-contain shrink-0"
            />
            <span>Calander.Q</span>
          </a>

          <p className="text-[13.5px] leading-[1.45] text-[#858585]">
            The universal calendar built for precision. {WORLD_CALENDAR_SYSTEMS.length} world
            calendars, holidays, weather, and astronomy in one quiet workspace.
          </p>

          {/* Clean Legal & Info Row */}
          <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#858585]">
            <button
              type="button"
              onClick={() => onOpenAbout?.()}
              className="hover:text-white transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal('privacy')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal('terms')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Terms
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal('contact')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Contact
            </button>
          </div>

          <div className="pt-1 flex items-center gap-2 text-[12.5px] text-[#858585]">
            <span>© 2026</span>
            <span className="text-white font-medium">Calander.Q</span>
            <span>· Universal Calendar Platform</span>
          </div>
        </div>

        {/* Right Columns: Navigation & Product */}
        <div className="flex flex-wrap gap-12 sm:gap-16">
          <div className="space-y-3 min-w-[120px]">
            <div className="text-[14px] font-medium text-white">Navigation</div>
            <ul className="space-y-2.5 text-[13.5px]">
              <li>
                <a href="#core-features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#ways" className="hover:text-white transition-colors">
                  Platforms
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3 min-w-[120px]">
            <div className="text-[14px] font-medium text-white">Product</div>
            <ul className="space-y-2.5 text-[13.5px]">
              <li>
                <button
                  type="button"
                  onClick={onOpenCalendar}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Open Calendar
                </button>
              </li>
              <li>
                {onOpenDownloadHub ? (
                  <button
                    type="button"
                    onClick={onOpenDownloadHub}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Download App
                  </button>
                ) : (
                  <a href="/?page=download" className="hover:text-white transition-colors">
                    Download App
                  </a>
                )}
              </li>
              <li>
                <a href="/?widget=desktop" className="hover:text-white transition-colors">
                  Desktop Widget
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
