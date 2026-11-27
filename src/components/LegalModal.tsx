import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Globe,
  HelpCircle,
  Lock,
  Shield,
} from 'lucide-react';
import { LegalDocId as _Unused } from './LegalModal';
import { LandingFooter } from './LandingFooter';

export type LegalDocId =
  | 'privacy'
  | 'terms'
  | 'cookies'
  | 'data-deletion'
  | 'account-deletion'
  | 'contact'
  | 'copyright'
  | 'licenses';

interface LegalPageProps {
  initialDoc?: LegalDocId;
  onBack: () => void;
  onOpenCalendar: () => void;
  onOpenAbout: () => void;
  onOpenDownloadHub: () => void;
  onSelectDoc?: (doc: LegalDocId) => void;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const LEGAL_DOCS: Array<{ id: LegalDocId; title: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'privacy', title: 'Privacy Policy', icon: Shield },
  { id: 'terms', title: 'Terms of Service', icon: FileText },
  { id: 'cookies', title: 'Cookie Policy', icon: Lock },
  { id: 'data-deletion', title: 'Data Deletion Policy', icon: FileText },
  { id: 'account-deletion', title: 'Account Deletion Info', icon: FileText },
  { id: 'contact', title: 'Contact & Support', icon: HelpCircle },
  { id: 'copyright', title: 'Copyright & IP Notice', icon: BookOpen },
  { id: 'licenses', title: 'Open-Source Licenses', icon: Globe },
];

export const LegalModal: React.FC<LegalPageProps> = ({
  initialDoc = 'privacy',
  onBack,
  onOpenCalendar,
  onOpenAbout,
  onOpenDownloadHub,
  onSelectDoc,
}) => {
  const [activeDoc, setActiveDoc] = useState<LegalDocId>(initialDoc);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setActiveDoc(initialDoc);
  }, [initialDoc]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 32);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const handleChooseDoc = (doc: LegalDocId) => {
    setActiveDoc(doc);
    onSelectDoc?.(doc);
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
              <button
                type="button"
                onClick={() => handleChooseDoc('privacy')}
                className={`transition-colors cursor-pointer whitespace-nowrap ${
                  activeDoc === 'privacy' ? 'text-white' : 'hover:text-white'
                }`}
              >
                Privacy
              </button>
              <button
                type="button"
                onClick={() => handleChooseDoc('terms')}
                className={`transition-colors cursor-pointer whitespace-nowrap ${
                  activeDoc === 'terms' ? 'text-white' : 'hover:text-white'
                }`}
              >
                Terms
              </button>
              <button
                type="button"
                onClick={() => handleChooseDoc('contact')}
                className={`transition-colors cursor-pointer whitespace-nowrap ${
                  activeDoc === 'contact' ? 'text-white' : 'hover:text-white'
                }`}
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

        {/* ==================== PAGE HEADER ==================== */}
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
            <div className="text-[14px] font-mono text-[#858585]">// Legal &amp; Compliance</div>
            <h1 className="mt-3 text-[36px] sm:text-[52px] font-medium tracking-[-0.03em] leading-[1.06]">
              <span className="text-white block">Privacy, terms,</span>
              <span className="text-[#858585] block">&amp; transparency.</span>
            </h1>
            <p className="mt-4 text-[15px] sm:text-[16px] text-[#858585] max-w-[560px] leading-[1.45]">
              Clear documentation covering how Calander.Q handles account sync, on-device storage,
              third-party integrations, and user support.
            </p>
          </motion.div>
        </section>

        {/* ==================== MAIN LEGAL WORKSPACE ==================== */}
        <section className="max-w-[1080px] mx-auto px-5 sm:px-6 pb-20">
          <div className="rounded-[12px] bg-[#0F0F0F] border border-white/[0.14] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Sidebar Navigation */}
            <nav className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-white/[0.1] p-4 space-y-1 bg-[#0F0F0F]">
              {LEGAL_DOCS.map((doc) => {
                const Icon = doc.icon;
                const active = activeDoc === doc.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => handleChooseDoc(doc.id)}
                    className={`relative w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-[8px] text-[13.5px] font-medium text-left transition-colors cursor-pointer ${
                      active ? 'text-white' : 'text-[#858585] hover:text-white'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="legal-doc-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        className="absolute inset-0 rounded-[8px] bg-[#171615] border border-white/[0.1]"
                      />
                    )}
                    <Icon className="relative z-10 w-4 h-4 shrink-0" />
                    <span className="relative z-10 truncate">{doc.title}</span>
                  </button>
                );
              })}
            </nav>

            {/* Document Content */}
            <div className="lg:col-span-8 p-6 sm:p-10 text-[14px] leading-[1.6] text-[#A1A1AA]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDoc}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
                >
                  {activeDoc === 'privacy' && (
                    <article className="space-y-6">
                      <header className="border-b border-white/[0.1] pb-4">
                        <h2 className="text-[24px] font-medium tracking-[-0.02em] text-white">
                          Privacy Policy
                        </h2>
                        <p className="text-[13px] text-[#858585] mt-1">
                          Last updated: November 2026 · Effective Date: January 1, 2026
                        </p>
                      </header>

                      <section className="space-y-2">
                        <h3 className="font-medium text-white text-[15px]">
                          1. Overview &amp; Commitment
                        </h3>
                        <p>
                          Calander.Q (&quot;we&quot;, &quot;our&quot;, or &quot;the Service&quot;) is
                          committed to protecting your privacy. This Privacy Policy explains how we
                          handle account, calendar, and preference data across our web and desktop
                          applications.
                        </p>
                      </section>

                      <section className="space-y-2">
                        <h3 className="font-medium text-white text-[15px]">
                          2. Information We Collect
                        </h3>
                        <ul className="list-disc pl-5 space-y-2">
                          <li>
                            <strong className="text-white">Account Data:</strong> When using
                            account sign-in on the website, we store your name, email, and a salted
                            PBKDF2-SHA512 password hash. Plain-text passwords are never stored.
                          </li>
                          <li>
                            <strong className="text-white">Calendar Events:</strong> Events, titles,
                            notes, start/end times, and preferences you create or sync.
                          </li>
                          <li>
                            <strong className="text-white">Location Data:</strong> Coordinates are
                            requested via the browser Geolocation API strictly when you trigger
                            weather or regional holiday detection.
                          </li>
                          <li>
                            <strong className="text-white">Timezone Preferences:</strong> Primary
                            and secondary timezones are stored to render accurate schedule views.
                          </li>
                        </ul>
                      </section>

                      <section className="space-y-2">
                        <h3 className="font-medium text-white text-[15px]">
                          3. Third-Party Integrations
                        </h3>
                        <p>
                          <strong className="text-white">Google Calendar API:</strong> When you
                          connect your Google Account, we request scoped access strictly to display
                          and synchronize your selected Google Calendars. Access tokens are held
                          in-memory and never sold or used for ad targeting.
                        </p>
                        <p>
                          <strong className="text-white">Weather &amp; Geocoding APIs:</strong> City
                          lookup queries and forecasts are retrieved via server-side proxies without
                          exposing user identity.
                        </p>
                      </section>

                      <section className="space-y-2">
                        <h3 className="font-medium text-white text-[15px]">
                          4. Data Retention &amp; Rights
                        </h3>
                        <p>
                          You may access, export (.ics), or permanently delete your account and
                          calendar data at any time through the Account dialog.
                        </p>
                      </section>
                    </article>
                  )}

                  {activeDoc === 'terms' && (
                    <article className="space-y-6">
                      <header className="border-b border-white/[0.1] pb-4">
                        <h2 className="text-[24px] font-medium tracking-[-0.02em] text-white">
                          Terms of Service
                        </h2>
                        <p className="text-[13px] text-[#858585] mt-1">
                          Effective as of January 1, 2026
                        </p>
                      </header>

                      <section className="space-y-2">
                        <h3 className="font-medium text-white text-[15px]">
                          1. Acceptance of Terms
                        </h3>
                        <p>
                          By accessing or using Calander.Q, you agree to be bound by these Terms of
                          Service. If you do not agree, please discontinue use of the application.
                        </p>
                      </section>

                      <section className="space-y-2">
                        <h3 className="font-medium text-white text-[15px]">2. Acceptable Use</h3>
                        <p>
                          You agree to use Calander.Q only for lawful personal and business
                          scheduling purposes and not to disrupt server stability or deploy automated
                          abuse against our services.
                        </p>
                      </section>

                      <section className="space-y-2">
                        <h3 className="font-medium text-white text-[15px]">
                          3. Calendar Calculations &amp; Observances
                        </h3>
                        <p>
                          Calander.Q incorporates astronomical and cultural calendar algorithms
                          (Vikram Samvat, Islamic Hijri, Hindu Panchang, Hebrew, Chinese Lunar, and
                          more). Because local sightings and regional declarations vary, dates are
                          provided for informational scheduling purposes without warranty.
                        </p>
                      </section>

                      <section className="space-y-2">
                        <h3 className="font-medium text-white text-[15px]">
                          4. Limitation of Liability
                        </h3>
                        <p>
                          Calander.Q is provided on an &quot;AS IS&quot; and &quot;AS
                          AVAILABLE&quot; basis. We are not liable for scheduling oversights, missed
                          appointments, or third-party service outages.
                        </p>
                      </section>
                    </article>
                  )}

                  {activeDoc === 'cookies' && (
                    <article className="space-y-6">
                      <header className="border-b border-white/[0.1] pb-4">
                        <h2 className="text-[24px] font-medium tracking-[-0.02em] text-white">
                          Cookie &amp; Storage Policy
                        </h2>
                        <p className="text-[13px] text-[#858585] mt-1">Last revised: 2026</p>
                      </header>

                      <section className="space-y-3">
                        <h3 className="font-medium text-white text-[15px]">
                          1. How We Use Storage
                        </h3>
                        <p>
                          Calander.Q does not use third-party advertising or cross-site tracking
                          cookies. Web sessions sync via your signed-in account, while downloaded
                          standalone apps unlock on-device offline storage:
                        </p>
                        <ul className="list-disc pl-5 space-y-1.5">
                          <li>
                            <code className="text-white">calendar_q_events_v3</code>: Stores
                            on-device events inside the downloaded app.
                          </li>
                          <li>
                            <code className="text-white">calendar_q_layers_v3</code>: Preserves
                            calendar layer visibility toggles inside the downloaded app.
                          </li>
                          <li>
                            <code className="text-white">calendar_q_prefs_v3</code>: Saves timezone,
                            weather units, and world calendar preferences inside the downloaded app.
                          </li>
                          <li>
                            <code className="text-white">calendar_q_session_token_v3</code>: Keeps
                            your authenticated session active.
                          </li>
                        </ul>
                      </section>
                    </article>
                  )}

                  {activeDoc === 'data-deletion' && (
                    <article className="space-y-6">
                      <header className="border-b border-white/[0.1] pb-4">
                        <h2 className="text-[24px] font-medium tracking-[-0.02em] text-white">
                          Data Deletion Policy
                        </h2>
                      </header>
                      <section className="space-y-3">
                        <p>You maintain complete ownership and control over your personal data.</p>
                        <h3 className="font-medium text-white text-[15px]">
                          Immediate On-Device Wipe
                        </h3>
                        <p>
                          When running the downloaded app, you can clear all stored events and
                          preferences at any time by clearing app storage or clicking &quot;Remove
                          Device Account&quot;.
                        </p>
                        <h3 className="font-medium text-white text-[15px]">
                          Server-Side Deletion Request
                        </h3>
                        <p>
                          When you delete your web account, all account records, session tokens, and
                          synced event files are erased from our servers immediately. Email requests
                          can also be sent to{' '}
                          <a
                            href="mailto:pandyashweta.in@gmail.com"
                            className="text-white underline hover:text-[#D4D4D8]"
                          >
                            pandyashweta.in@gmail.com
                          </a>
                          .
                        </p>
                      </section>
                    </article>
                  )}

                  {activeDoc === 'account-deletion' && (
                    <article className="space-y-6">
                      <header className="border-b border-white/[0.1] pb-4">
                        <h2 className="text-[24px] font-medium tracking-[-0.02em] text-white">
                          Account Deletion Instructions
                        </h2>
                      </header>
                      <section className="space-y-3">
                        <p>To delete your Calander.Q account:</p>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>Click on your Account icon or avatar in the top-right header bar.</li>
                          <li>In the Account &amp; Profile dialog, scroll to the bottom.</li>
                          <li>
                            Click <strong className="text-white">&quot;Delete Account&quot;</strong>.
                          </li>
                          <li>
                            Confirm deletion to permanently purge all account records and synced
                            events.
                          </li>
                        </ol>
                        <p className="text-[#FCA5A5] font-medium">
                          Warning: This action is permanent and cannot be undone.
                        </p>
                      </section>
                    </article>
                  )}

                  {activeDoc === 'contact' && (
                    <article className="space-y-6">
                      <header className="border-b border-white/[0.1] pb-4">
                        <h2 className="text-[24px] font-medium tracking-[-0.02em] text-white">
                          Contact &amp; Support
                        </h2>
                      </header>
                      <section className="space-y-4">
                        <p>Have questions, feature suggestions, or need assistance?</p>
                        <div className="p-5 bg-[#0A0908] border border-white/[0.12] rounded-[8px] space-y-2.5">
                          <div>
                            <strong className="text-white">General Inquiries:</strong>{' '}
                            <a
                              href="mailto:pandyashweta.in@gmail.com"
                              className="text-[#D4D4D8] underline hover:text-white font-mono"
                            >
                              pandyashweta.in@gmail.com
                            </a>
                          </div>
                          <div>
                            <strong className="text-white">Security &amp; Vulnerability Reports:</strong>{' '}
                            <a
                              href="mailto:pandyashweta.in@gmail.com"
                              className="text-[#D4D4D8] underline hover:text-white font-mono"
                            >
                              pandyashweta.in@gmail.com
                            </a>
                          </div>
                          <div>
                            <strong className="text-white">Privacy &amp; Compliance:</strong>{' '}
                            <a
                              href="mailto:pandyashweta.in@gmail.com"
                              className="text-[#D4D4D8] underline hover:text-white font-mono"
                            >
                              pandyashweta.in@gmail.com
                            </a>
                          </div>
                        </div>
                      </section>
                    </article>
                  )}

                  {activeDoc === 'copyright' && (
                    <article className="space-y-6">
                      <header className="border-b border-white/[0.1] pb-4">
                        <h2 className="text-[24px] font-medium tracking-[-0.02em] text-white">
                          Copyright &amp; Intellectual Property Notice
                        </h2>
                        <p className="text-[13px] text-[#858585] mt-1">
                          © 2026 Calander.Q. All rights reserved.
                        </p>
                      </header>
                      <section className="space-y-3">
                        <p>
                          The Calander.Q brand, application software, source code, visual design,
                          and documentation are protected by copyright and intellectual property
                          laws.
                        </p>
                        <h3 className="font-medium text-white text-[15px]">
                          Public Domain &amp; Cultural Heritage Notice
                        </h3>
                        <p>
                          Calander.Q does not claim proprietary ownership over the mathematical
                          structures, epoch definitions, or traditional calendar systems of world
                          cultures (including Gregorian, Julian, Islamic Hijri, Vikram Samvat, Saka,
                          Hebrew, Persian, Buddhist, Coptic, Ethiopian, Mayan, or Chinese calendars).
                        </p>
                      </section>
                    </article>
                  )}

                  {activeDoc === 'licenses' && (
                    <article className="space-y-6">
                      <header className="border-b border-white/[0.1] pb-4">
                        <h2 className="text-[24px] font-medium tracking-[-0.02em] text-white">
                          Open-Source Licenses &amp; Attributions
                        </h2>
                      </header>
                      <section className="space-y-3">
                        <p>
                          Calander.Q is built upon modern open-source software and astronomical
                          references:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                          <li>
                            <strong className="text-white">React &amp; React DOM:</strong> MIT
                            License © Meta Platforms, Inc.
                          </li>
                          <li>
                            <strong className="text-white">Motion:</strong> MIT License © Framer
                            B.V.
                          </li>
                          <li>
                            <strong className="text-white">Lucide Icons:</strong> ISC License ©
                            Lucide Contributors
                          </li>
                          <li>
                            <strong className="text-white">Tailwind CSS:</strong> MIT License ©
                            Tailwind Labs Inc.
                          </li>
                          <li>
                            <strong className="text-white">Vite:</strong> MIT License © Evan You
                            &amp; Vite Contributors
                          </li>
                          <li>
                            <strong className="text-white">Express:</strong> MIT License ©
                            StrongLoop, Inc. &amp; Express Contributors
                          </li>
                          <li>
                            <strong className="text-white">Astronomical Algorithms:</strong> Jean
                            Meeus (Astronomical Algorithms), John Walker (Fourmilab), and Drik
                            Panchang methodologies.
                          </li>
                        </ul>
                      </section>
                    </article>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ==================== FOOTER ==================== */}
        <LandingFooter
          onOpenCalendar={onOpenCalendar}
          onOpenLegal={(doc) => handleChooseDoc(doc)}
          onOpenAbout={onOpenAbout}
          onOpenDownloadHub={onOpenDownloadHub}
        />
      </div>
    </MotionConfig>
  );
};
