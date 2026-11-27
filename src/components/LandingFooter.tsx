import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { UserAccount } from '../types/calendar';
import { LegalDocId } from './LegalModal';
import { WORLD_CALENDAR_SYSTEMS } from '../data/worldCalendars';

const WAITLIST_STORAGE_KEY = 'calendar_q_waitlist_v1';

interface LandingFooterProps {
  currentUser: UserAccount | null;
  onOpenCalendar: () => void;
  onOpenAuth: (tab?: 'signin' | 'signup') => void;
  onOpenDownloadHub: () => void;
  onOpenLegal: (doc: LegalDocId) => void;
  showToast?: (msg: string) => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  currentUser,
  onOpenCalendar,
  onOpenAuth,
  onOpenDownloadHub,
  onOpenLegal,
  showToast,
}) => {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [joinedEmail, setJoinedEmail] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = window.localStorage.getItem(WAITLIST_STORAGE_KEY);
      return saved || null;
    } catch {
      return null;
    }
  });
  const [highlightWaitlist, setHighlightWaitlist] = useState(false);
  const waitlistInputRef = useRef<HTMLInputElement | null>(null);
  const waitlistContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!aboutOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAboutOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [aboutOpen]);

  const focusWaitlist = () => {
    setAboutOpen(false);
    waitlistContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightWaitlist(true);
    window.setTimeout(() => {
      waitlistInputRef.current?.focus();
    }, 220);
    window.setTimeout(() => setHighlightWaitlist(false), 1600);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!trimmed || !emailRegex.test(trimmed)) {
      setErrorMsg('Enter a valid email address to join the waitlist.');
      waitlistInputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const resp = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data?.error?.message || 'Unable to join right now.');
      }

      const data = await resp.json().catch(() => ({ alreadyJoined: false }));
      try {
        window.localStorage.setItem(WAITLIST_STORAGE_KEY, trimmed);
      } catch {
        // Ignore storage quota errors
      }
      setJoinedEmail(trimmed);
      setEmail('');
      showToast?.(
        data.alreadyJoined
          ? `${trimmed} is already on the waitlist.`
          : `Added ${trimmed} to the calendar.q waitlist.`
      );
    } catch (err: unknown) {
      // Offline / network fallback: store locally so the user isn't blocked offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        try {
          window.localStorage.setItem(WAITLIST_STORAGE_KEY, trimmed);
        } catch {
          // Ignore
        }
        setJoinedEmail(trimmed);
        setEmail('');
        showToast?.('Saved locally while offline.');
      } else {
        setErrorMsg(
          err instanceof Error ? err.message : 'Something went wrong. Please try again.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <footer className="relative z-10 border-t border-white/[0.06] bg-[#09090B] text-[#A1A1AA]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-14 sm:pt-16 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10">
            {/* Brand & Waitlist Sign-Up Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <a
                  href="#top"
                  className="inline-flex items-center gap-3 font-display text-[19px] font-semibold tracking-[-0.025em] text-white whitespace-nowrap"
                >
                  <span className="w-9 h-9 rounded-[10px] overflow-hidden bg-black ring-1 ring-white/[0.14] flex items-center justify-center shrink-0">
                    <img
                      src="/android-chrome-192x192.png"
                      alt="calendar.q"
                      className="w-full h-full object-cover scale-[1.42]"
                    />
                  </span>
                  <span>
                    calendar<span className="text-[#F04422]">.q</span>
                  </span>
                </a>
                <p className="text-[14px] text-[#A1A1AA] leading-relaxed max-w-[380px]">
                  Universal calendar unifying {WORLD_CALENDAR_SYSTEMS.length} cultural date
                  systems, local holidays, live weather, and astronomy—stored strictly on your
                  device.
                </p>
              </div>

              {/* Waitlist Sign-Up Action */}
              <div
                id="waitlist"
                ref={waitlistContainerRef}
                className={`pt-1 space-y-2.5 max-w-[420px] rounded-xl transition-shadow duration-300 ${
                  highlightWaitlist ? 'ring-2 ring-white/40 ring-offset-4 ring-offset-[#09090B]' : ''
                }`}
              >
                <div className="flex items-center gap-2 text-[12.5px] text-[#D4D4D8] font-medium">
                  <span>Waitlist</span>
                  <span aria-hidden="true" className="text-[#52525B]">
                    ·
                  </span>
                  <span className="text-[#A1A1AA] font-normal">
                    Early access to native widget packs &amp; releases
                  </span>
                </div>

                {joinedEmail ? (
                  <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[#131317] border border-white/[0.08] text-[13px]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-white text-[#09090B] flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" strokeWidth={2.5} />
                      </span>
                      <span className="text-[#F4F4F5] truncate">
                        Waitlist confirmed for <strong className="font-medium">{joinedEmail}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setJoinedEmail(null);
                        try {
                          window.localStorage.removeItem(WAITLIST_STORAGE_KEY);
                        } catch {
                          // Ignore
                        }
                        window.setTimeout(() => waitlistInputRef.current?.focus(), 50);
                      }}
                      className="text-[12px] text-[#A1A1AA] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlistSubmit} noValidate className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label htmlFor="footer-waitlist-email" className="sr-only">
                        Email address for waitlist
                      </label>
                      <input
                        id="footer-waitlist-email"
                        ref={waitlistInputRef}
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        placeholder="you@domain.com"
                        aria-invalid={Boolean(errorMsg)}
                        aria-describedby={errorMsg ? 'footer-waitlist-error' : undefined}
                        className="flex-1 min-w-0 h-[42px] px-3.5 rounded-xl bg-[#131317] border border-white/[0.09] focus:border-white/35 focus:outline-none text-[13.5px] text-white placeholder:text-[#71717A] transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="h-[42px] px-4 rounded-xl bg-white hover:bg-[#E4E4E7] disabled:opacity-60 text-[#09090B] text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span>{submitting ? 'Joining...' : 'Join Waitlist'}</span>
                        {!submitting && <ArrowRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {errorMsg && (
                      <p
                        id="footer-waitlist-error"
                        role="alert"
                        className="text-[12px] text-[#FCA5A5]"
                      >
                        {errorMsg}
                      </p>
                    )}
                  </form>
                )}
              </div>
            </div>

            {/* Navigation Columns */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 lg:pl-8">
              {/* Column 1: Product */}
              <div className="space-y-3.5">
                <h3 className="text-[12.5px] font-semibold text-white tracking-[-0.01em]">
                  Product
                </h3>
                <ul className="space-y-2.5 text-[13.5px]">
                  <li>
                    <button
                      type="button"
                      onClick={onOpenCalendar}
                      className="text-[#A1A1AA] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Open Calendar
                    </button>
                  </li>
                  <li>
                    <a
                      href="#capabilities"
                      className="text-[#A1A1AA] hover:text-white transition-colors whitespace-nowrap"
                    >
                      Capabilities
                    </a>
                  </li>
                  <li>
                    <a
                      href="#calendars"
                      className="text-[#A1A1AA] hover:text-white transition-colors whitespace-nowrap"
                    >
                      World Calendars
                    </a>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={onOpenDownloadHub}
                      className="text-[#A1A1AA] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Apps &amp; Widgets
                    </button>
                  </li>
                </ul>
              </div>

              {/* Column 2: Company */}
              <div className="space-y-3.5">
                <h3 className="text-[12.5px] font-semibold text-white tracking-[-0.01em]">
                  Company
                </h3>
                <ul className="space-y-2.5 text-[13.5px]">
                  <li>
                    <button
                      type="button"
                      onClick={() => setAboutOpen(true)}
                      className="text-[#A1A1AA] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                    >
                      About
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={focusWaitlist}
                      className="text-[#A1A1AA] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Waitlist
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onOpenAuth('signin')}
                      className="text-[#A1A1AA] hover:text-white transition-colors cursor-pointer truncate max-w-[180px] block"
                    >
                      {currentUser ? currentUser.email : 'Local Sign In'}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onOpenLegal('contact')}
                      className="text-[#A1A1AA] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Contact
                    </button>
                  </li>
                </ul>
              </div>

              {/* Column 3: Legal */}
              <div className="space-y-3.5">
                <h3 className="text-[12.5px] font-semibold text-white tracking-[-0.01em]">
                  Legal
                </h3>
                <ul className="space-y-2.5 text-[13.5px]">
                  <li>
                    <button
                      type="button"
                      onClick={() => onOpenLegal('privacy')}
                      className="text-[#A1A1AA] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Privacy
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onOpenLegal('terms')}
                      className="text-[#A1A1AA] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Terms
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onOpenLegal('data-deletion')}
                      className="text-[#A1A1AA] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Data Deletion
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onOpenLegal('licenses')}
                      className="text-[#A1A1AA] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Licenses
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Quiet Bottom Copyright & Quick Links Bar */}
        <div className="border-t border-white/[0.06]">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12.5px] text-[#71717A]">
            <div className="flex items-center gap-2">
              <span className="text-[#A1A1AA]">© 2026 calendar.q</span>
              <span aria-hidden="true">·</span>
              <span>Local-first Universal Calendar</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6">
              <button
                type="button"
                onClick={() => setAboutOpen(true)}
                className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                About
              </button>
              <button
                type="button"
                onClick={() => onOpenLegal('privacy')}
                className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                Privacy
              </button>
              <button
                type="button"
                onClick={() => onOpenLegal('terms')}
                className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                Terms
              </button>
              <button
                type="button"
                onClick={focusWaitlist}
                className="text-[#D4D4D8] hover:text-white transition-colors cursor-pointer whitespace-nowrap font-medium"
              >
                Waitlist
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* About calendar.q Modal */}
      {aboutOpen && (
        <div
          onClick={() => setAboutOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="About calendar.q"
            className="w-full max-w-[540px] rounded-2xl bg-[#111114] border border-white/[0.08] shadow-2xl overflow-hidden text-[#F4F4F5]"
          >
            <div className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-[8px] overflow-hidden bg-black ring-1 ring-white/[0.14] flex items-center justify-center shrink-0">
                  <img
                    src="/android-chrome-192x192.png"
                    alt=""
                    className="w-full h-full object-cover scale-[1.42]"
                  />
                </span>
                <h2 className="font-display text-[16px] font-semibold text-white tracking-[-0.015em]">
                  About calendar.q
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAboutOpen(false)}
                aria-label="Close about dialog"
                className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/[0.08] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-[14px] text-[#A1A1AA] leading-relaxed">
              <p className="text-[#E4E4E7]">
                calendar.q is a calm, local-first universal calendar designed for people who live
                and collaborate across multiple cultures, time zones, and astronomical traditions.
              </p>
              <p>
                Every workspace opens cleanly to your full month with only your auto-detected local
                holidays enabled. Whenever you need deeper context, you can layer any of{' '}
                {WORLD_CALENDAR_SYSTEMS.length} world calendar systems—including Gujarati Vikram
                Samvat Tithis, Islamic Hijri, Hebrew, Chinese Lunar, and Persian—alongside live
                weather, world clocks, and a dedicated celestial almanac.
              </p>
              <p>
                Your accounts, events, and preferences stay saved locally on your computer or phone
                with salted local password hashing, standard .ics portability, and strictly optional
                Google Calendar synchronization.
              </p>

              <div className="pt-2 border-t border-white/[0.07] grid grid-cols-3 gap-4">
                <div>
                  <div className="font-mono-tabular text-[22px] font-semibold text-white">
                    {WORLD_CALENDAR_SYSTEMS.length}
                  </div>
                  <div className="text-[12px] text-[#A1A1AA]">World calendars</div>
                </div>
                <div>
                  <div className="font-mono-tabular text-[22px] font-semibold text-white">
                    100%
                  </div>
                  <div className="text-[12px] text-[#A1A1AA]">On-device accounts</div>
                </div>
                <div>
                  <div className="font-mono-tabular text-[22px] font-semibold text-white">
                    0
                  </div>
                  <div className="text-[12px] text-[#A1A1AA]">Ad trackers</div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/[0.07] bg-[#0D0D10] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={focusWaitlist}
                className="text-[13px] font-medium text-[#D4D4D8] hover:text-white transition-colors cursor-pointer"
              >
                Join the Waitlist →
              </button>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setAboutOpen(false);
                    onOpenCalendar();
                  }}
                  className="h-[36px] px-4 rounded-lg bg-white hover:bg-[#E4E4E7] text-[#09090B] text-[13px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Open Calendar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
