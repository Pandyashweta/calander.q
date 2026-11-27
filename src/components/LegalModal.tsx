import React, { useEffect, useState } from 'react';
import { BookOpen, FileText, Globe, HelpCircle, Lock, Shield, X } from 'lucide-react';

export type LegalDocId =
  | 'privacy'
  | 'terms'
  | 'cookies'
  | 'data-deletion'
  | 'account-deletion'
  | 'contact'
  | 'copyright'
  | 'licenses';

interface LegalModalProps {
  open: boolean;
  initialDoc?: LegalDocId;
  onClose: () => void;
}

const LEGAL_DOCS: Array<{ id: LegalDocId; title: string; icon: any }> = [
  { id: 'privacy', title: 'Privacy Policy', icon: Shield },
  { id: 'terms', title: 'Terms of Service', icon: FileText },
  { id: 'cookies', title: 'Cookie Policy', icon: Lock },
  { id: 'data-deletion', title: 'Data Deletion Policy', icon: FileText },
  { id: 'account-deletion', title: 'Account Deletion Info', icon: FileText },
  { id: 'contact', title: 'Contact & Support', icon: HelpCircle },
  { id: 'copyright', title: 'Copyright & IP Notice', icon: BookOpen },
  { id: 'licenses', title: 'Open-Source Licenses', icon: Globe },
];

export const LegalModal: React.FC<LegalModalProps> = ({
  open,
  initialDoc = 'privacy',
  onClose,
}) => {
  const [activeDoc, setActiveDoc] = useState<LegalDocId>(initialDoc);

  useEffect(() => {
    if (open) {
      setActiveDoc(initialDoc);
    }
  }, [open, initialDoc]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[840px] h-[85vh] bg-white rounded-xl shadow-2xl border border-[#E0E0E0] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#EFEFEF] flex items-center justify-between shrink-0 bg-[#FAFAFA]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#1A1A1A]" />
            <h2 className="text-[14px] font-semibold text-[#1A1A1A]">
              Legal, Privacy &amp; Compliance Center
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close legal modal"
            className="p-1 rounded-md hover:bg-[#F2F2F2] text-[#7A7A7A] hover:text-[#1A1A1A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col sm:flex-row min-h-0 overflow-hidden">
          {/* Sidebar Nav */}
          <nav className="sm:w-[210px] shrink-0 bg-[#FAFAFA] border-b sm:border-b-0 sm:border-r border-[#EFEFEF] p-2 space-y-0.5 overflow-x-auto sm:overflow-y-auto cal-scroll">
            {LEGAL_DOCS.map((doc) => {
              const Icon = doc.icon;
              const active = activeDoc === doc.id;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setActiveDoc(doc.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-left transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-white text-[#1A1A1A] shadow-2xs border border-[#E4E4E4]'
                      : 'text-[#666666] hover:bg-[#F0F0F0] hover:text-[#1A1A1A] border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0 text-[#737373]" />
                  <span className="truncate">{doc.title}</span>
                </button>
              );
            })}
          </nav>

          {/* Document Content */}
          <div className="flex-1 overflow-y-auto cal-scroll p-6 text-[12.5px] leading-relaxed text-[#333333] space-y-4">
            {/* 1. PRIVACY POLICY */}
            {activeDoc === 'privacy' && (
              <article className="space-y-4">
                <header className="border-b border-[#EFEFEF] pb-3">
                  <h3 className="text-[17px] font-bold text-[#1A1A1A]">Privacy Policy</h3>
                  <p className="text-[11.5px] text-[#737373] mt-1">
                    Last updated: November 2026 · Effective Date: January 1, 2026
                  </p>
                </header>

                <section className="space-y-2">
                  <h4 className="font-semibold text-[#1A1A1A] text-[13.5px]">1. Overview &amp; Commitment</h4>
                  <p>
                    calendar.q (&quot;we&quot;, &quot;our&quot;, or &quot;the Service&quot;) is committed to protecting your privacy. This Privacy Policy explains our policies regarding the collection, use, and disclosure of personal data when you use the calendar.q calendar application.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-semibold text-[#1A1A1A] text-[13.5px]">2. Information We Collect</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>Account Data:</strong> If you sign up with an email address, we store your name, email, and a securely salted PBKDF2-SHA512 password hash. We never store plain-text passwords.
                    </li>
                    <li>
                      <strong>Calendar Events:</strong> Events, titles, notes, start and end times, attendee emails, and reminder preferences created within the app.
                    </li>
                    <li>
                      <strong>Location Data:</strong> Device location coordinates are requested via the standard browser Geolocation API strictly when you trigger local weather or regional festival features. Coordinates are never continuously monitored, logged, or shared with third-party advertisers.
                    </li>
                    <li>
                      <strong>Timezone Preferences:</strong> Your configured primary and secondary timezones are stored in your device storage and user preferences to render accurate schedule views.
                    </li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h4 className="font-semibold text-[#1A1A1A] text-[13.5px]">3. Third-Party Integrations</h4>
                  <p>
                    <strong>Google Calendar API:</strong> When you connect your Google Account, we request scoped read/write access strictly to display and synchronize your selected Google Calendars. Access tokens are held in-memory and are never sold or used for ad targeting.
                  </p>
                  <p>
                    <strong>Google Maps Platform Weather &amp; Geocoding APIs:</strong> City lookup queries and weather forecasts are retrieved via secure server-side proxies without exposing user identity.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-semibold text-[#1A1A1A] text-[13.5px]">4. Data Retention &amp; Rights</h4>
                  <p>
                    You have the right to access, export, or permanently delete your account and personal data at any time through the Account Settings panel.
                  </p>
                </section>
              </article>
            )}

            {/* 2. TERMS OF SERVICE */}
            {activeDoc === 'terms' && (
              <article className="space-y-4">
                <header className="border-b border-[#EFEFEF] pb-3">
                  <h3 className="text-[17px] font-bold text-[#1A1A1A]">Terms of Service</h3>
                  <p className="text-[11.5px] text-[#737373] mt-1">
                    Effective as of January 1, 2026
                  </p>
                </header>

                <section className="space-y-2">
                  <h4 className="font-semibold text-[#1A1A1A] text-[13.5px]">1. Acceptance of Terms</h4>
                  <p>
                    By accessing or using calendar.q, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-semibold text-[#1A1A1A] text-[13.5px]">2. Acceptable Use</h4>
                  <p>
                    You agree to use calendar.q only for lawful personal and business scheduling purposes. You agree not to reverse-engineer, disrupt server stability, or deploy automated bots against our services.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-semibold text-[#1A1A1A] text-[13.5px]">3. Calendar Calculations &amp; Observances</h4>
                  <p>
                    calendar.q incorporates authoritative algorithms for astronomical and cultural calendars (such as Vikram Samvat, Islamic Hijri, Hindu Panchang, Hebrew, Chinese Lunar, and others). While calculations are grounded in established astronomical methods, local sightings and regional religious declarations may cause official dates to vary by region. Dates are provided for informational scheduling purposes without warranty.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-semibold text-[#1A1A1A] text-[13.5px]">4. Limitation of Liability</h4>
                  <p>
                    calendar.q is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We are not liable for scheduling oversights, missed appointments, or third-party service outages.
                  </p>
                </section>
              </article>
            )}

            {/* 3. COOKIE POLICY */}
            {activeDoc === 'cookies' && (
              <article className="space-y-4">
                <header className="border-b border-[#EFEFEF] pb-3">
                  <h3 className="text-[17px] font-bold text-[#1A1A1A]">Cookie &amp; Storage Policy</h3>
                  <p className="text-[11.5px] text-[#737373] mt-1">Last revised: 2026</p>
                </header>

                <section className="space-y-2">
                  <h4 className="font-semibold text-[#1A1A1A] text-[13.5px]">1. How We Use Storage</h4>
                  <p>
                    calendar.q does not use third-party advertising or cross-site tracking cookies. We utilize local browser storage (HTML5 LocalStorage) strictly for core application functionality:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><code>calendar_q_events_v2</code>: Stores your local events and schedule items.</li>
                    <li><code>calendar_q_layers_v2</code>: Preserves your calendar visibility toggles.</li>
                    <li><code>calendar_q_prefs_v2</code>: Saves your timezone, weather units, and primary calendar system.</li>
                    <li><code>calendar_q_collapsed_groups</code>: Remembers which sidebar groups you have expanded or collapsed.</li>
                    <li><code>calendar_q_auth_token_v2</code>: Keeps your authentication session active across browser restarts.</li>
                  </ul>
                </section>
              </article>
            )}

            {/* 4. DATA DELETION POLICY */}
            {activeDoc === 'data-deletion' && (
              <article className="space-y-4">
                <header className="border-b border-[#EFEFEF] pb-3">
                  <h3 className="text-[17px] font-bold text-[#1A1A1A]">Data Deletion Policy</h3>
                </header>
                <section className="space-y-2">
                  <p>
                    You maintain complete ownership and control over your personal data.
                  </p>
                  <h4 className="font-semibold text-[#1A1A1A] text-[13.5px]">Immediate Local Wipe</h4>
                  <p>
                    You can clear all locally stored events, preferences, and cached calendars at any time by clearing your browser cache or clicking &quot;Delete Account&quot; in the Account dialog.
                  </p>
                  <h4 className="font-semibold text-[#1A1A1A] text-[13.5px]">Server-Side Deletion Request</h4>
                  <p>
                    When you request account deletion, all account records, session tokens, and synced data files are permanently erased from our servers immediately. Email requests can also be submitted to <code>privacy@calendar.q</code>.
                  </p>
                </section>
              </article>
            )}

            {/* 5. ACCOUNT DELETION INFO */}
            {activeDoc === 'account-deletion' && (
              <article className="space-y-4">
                <header className="border-b border-[#EFEFEF] pb-3">
                  <h3 className="text-[17px] font-bold text-[#1A1A1A]">Account Deletion Instructions</h3>
                </header>
                <section className="space-y-2">
                  <p>To delete your calendar.q account:</p>
                  <ol className="list-decimal pl-5 space-y-1.5">
                    <li>Click on your Account icon or avatar in the top right header bar.</li>
                    <li>In the Account &amp; Security dialog, scroll to the bottom.</li>
                    <li>Click <strong>&quot;Delete Account&quot;</strong>.</li>
                    <li>Click <strong>&quot;Confirm Delete&quot;</strong> to permanently purge all account data.</li>
                  </ol>
                  <p className="mt-2 text-[#8A1520] font-medium">
                    Warning: This action is permanent and cannot be undone. All personal calendars and local events will be permanently removed.
                  </p>
                </section>
              </article>
            )}

            {/* 6. CONTACT & SUPPORT */}
            {activeDoc === 'contact' && (
              <article className="space-y-4">
                <header className="border-b border-[#EFEFEF] pb-3">
                  <h3 className="text-[17px] font-bold text-[#1A1A1A]">Contact &amp; Support</h3>
                </header>
                <section className="space-y-2">
                  <p>Have questions, feature suggestions, or need assistance?</p>
                  <div className="p-3 bg-[#FAFAFA] border border-[#EAEAEA] rounded-lg space-y-1.5">
                    <div><strong>General Inquiries:</strong> <code>support@calendar.q</code></div>
                    <div><strong>Security &amp; Vulnerability Reports:</strong> <code>security@calendar.q</code></div>
                    <div><strong>Privacy &amp; Compliance:</strong> <code>privacy@calendar.q</code></div>
                  </div>
                </section>
              </article>
            )}

            {/* 7. COPYRIGHT & INTELLECTUAL PROPERTY */}
            {activeDoc === 'copyright' && (
              <article className="space-y-4">
                <header className="border-b border-[#EFEFEF] pb-3">
                  <h3 className="text-[17px] font-bold text-[#1A1A1A]">Copyright &amp; Intellectual Property Notice</h3>
                  <p className="text-[11.5px] text-[#737373] mt-1">© 2026 calendar.q. All rights reserved.</p>
                </header>
                <section className="space-y-2">
                  <p>
                    The calendar.q brand, application software, source code, visual design, custom icon mappings, and original documentation are protected by copyright and intellectual property laws.
                  </p>
                  <h4 className="font-semibold text-[#1A1A1A] text-[13.5px]">Public Domain &amp; Cultural Heritage Notice</h4>
                  <p>
                    calendar.q does not claim proprietary ownership over the mathematical structures, epoch definitions, or traditional calendar systems of world cultures (including the Gregorian, Julian, Islamic Hijri, Vikram Samvat, Saka, Hebrew, Persian, Buddhist, Coptic, Ethiopian, Mayan, or Chinese calendars). These calendar systems are public heritage.
                  </p>
                </section>
              </article>
            )}

            {/* 8. LICENSES & ATTRIBUTIONS */}
            {activeDoc === 'licenses' && (
              <article className="space-y-4">
                <header className="border-b border-[#EFEFEF] pb-3">
                  <h3 className="text-[17px] font-bold text-[#1A1A1A]">Open-Source Licenses &amp; Attributions</h3>
                </header>
                <section className="space-y-2">
                  <p>
                    calendar.q is built with gratitude upon modern open-source software and reference datasets:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>React &amp; React DOM:</strong> MIT License © Meta Platforms, Inc.</li>
                    <li><strong>Lucide Icons:</strong> ISC License © Lucide Contributors</li>
                    <li><strong>Tailwind CSS:</strong> MIT License © Tailwind Labs Inc.</li>
                    <li><strong>Vite:</strong> MIT License © Yuxi (Evan) You &amp; Vite Contributors</li>
                    <li><strong>Express:</strong> MIT License © StrongLoop, Inc. &amp; Express Contributors</li>
                    <li><strong>Calendar Astronomical Algorithms:</strong> Grounded in astronomical methodologies documented by Jean Meeus (Astronomical Algorithms), John Walker (Fourmilab), and Drik Panchang algorithms.</li>
                  </ul>
                </section>
              </article>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-[#EFEFEF] bg-[#FAFAFA] flex items-center justify-between text-[11.5px] text-[#737373] shrink-0">
          <span>© 2026 calendar.q. All rights reserved.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-md bg-[#1A1A1A] text-white hover:bg-[#333333] cursor-pointer text-[12px] font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
