import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CloudSun,
  Download,
  Globe,
  HardDrive,
  Laptop,
  Moon,
  Smartphone,
} from 'lucide-react';
import { UserAccount, WorldCalendarGroupId } from '../types/calendar';
import {
  WORLD_CALENDAR_GROUPS,
  WORLD_CALENDAR_SYSTEMS,
  convertToWorldCalendar,
} from '../data/worldCalendars';
import { MONTH_NAMES } from '../utils/dateUtils';
import {
  HolidayRegionCode,
  detectDeviceInfo,
  getRegionLabel,
} from '../utils/deviceUtils';

interface LandingPageProps {
  today: Date;
  holidayRegion: HolidayRegionCode;
  currentUser: UserAccount | null;
  onOpenCalendar: () => void;
  onOpenAuth: (tab?: 'signin' | 'signup') => void;
  onOpenDownloadHub: () => void;
  onLaunchWidget: (mode: 'desktop' | 'mobile') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  today,
  holidayRegion,
  currentUser,
  onOpenCalendar,
  onOpenAuth,
  onOpenDownloadHub,
  onLaunchWidget,
}) => {
  const [activeGroup, setActiveGroup] = useState<WorldCalendarGroupId>('indian');
  const device = useMemo(() => detectDeviceInfo(), []);

  const groupConversions = useMemo(
    () =>
      WORLD_CALENDAR_SYSTEMS.filter((s) => s.group === activeGroup).map((meta) => ({
        meta,
        val: convertToWorldCalendar(today, meta.id, false),
      })),
    [activeGroup, today]
  );

  const todayFormatted = `${MONTH_NAMES[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;

  return (
    <div className="h-screen overflow-y-auto bg-[#FAFAF9] text-[#171717] selection:bg-[#171717] selection:text-white">
      {/* 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 bg-[#FAFAF9]/90 backdrop-blur-md border-b border-[#E7E5E4]">
        <div className="max-w-[1160px] mx-auto px-5 sm:px-8 h-[64px] flex items-center justify-between gap-4">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <img src="/icon.svg" alt="" className="w-6 h-6 rounded-[6px]" />
            <span className="text-[17px] font-bold tracking-tight text-[#171717]">
              calendar<span className="text-[#DC2626]">.q</span>
            </span>
          </div>

          {/* Center: Clean Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-[13.5px] font-medium text-[#57534E]">
            <a href="#calendars" className="hover:text-[#171717] transition-colors">
              World Calendars
            </a>
            <a href="#apps" className="hover:text-[#171717] transition-colors">
              Desktop &amp; Mobile
            </a>
            <a href="#privacy" className="hover:text-[#171717] transition-colors">
              Local Privacy
            </a>
          </nav>

          {/* Right: Auth + Primary Open CTA */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenAuth('signin')}
              className="px-3.5 py-2 rounded-lg text-[13px] font-medium text-[#44403C] hover:text-[#171717] hover:bg-[#EFECE9] transition-colors cursor-pointer whitespace-nowrap"
            >
              {currentUser ? currentUser.name.split(' ')[0] : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={onOpenCalendar}
              className="px-4 py-2 rounded-lg bg-[#171717] hover:bg-[#292524] text-white text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Open Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-[1160px] mx-auto px-5 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-[#DC2626]">
              Universal Calendar · {todayFormatted}
            </p>

            <h1
              className="text-[40px] sm:text-[54px] font-bold tracking-[-0.035em] leading-[1.05] text-[#171717]"
              style={{ textWrap: 'balance' }}
            >
              Every world calendar, organized cleanly around your location.
            </h1>

            <p className="text-[16px] sm:text-[17.5px] text-[#57534E] leading-relaxed max-w-[560px]">
              Opens straight to a full month view with only your local {getRegionLabel(holidayRegion)} holidays selected. Enable any of {WORLD_CALENDAR_SYSTEMS.length} world calendars—from Gujarati Vikram Samvat and Hijri to Hebrew, Chinese, and ISO Week—only when you want them.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onOpenCalendar}
                className="px-6 py-3 rounded-xl bg-[#171717] hover:bg-[#292524] text-white text-[14.5px] font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <span>Open Full Month Calendar</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenDownloadHub}
                className="px-5 py-3 rounded-xl bg-white hover:bg-[#F5F5F4] border border-[#D6D3D1] text-[#171717] text-[14px] font-medium inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{device.appDownloadLabel}</span>
              </button>
            </div>

            <div className="pt-4 grid grid-cols-3 gap-6 border-t border-[#E7E5E4] max-w-[500px]">
              <div>
                <div className="text-[22px] font-bold tracking-tight tabular-nums text-[#171717]">
                  {WORLD_CALENDAR_SYSTEMS.length}
                </div>
                <div className="text-[12px] text-[#78716C] mt-0.5">World calendars</div>
              </div>
              <div>
                <div className="text-[22px] font-bold tracking-tight text-[#171717]">
                  Local
                </div>
                <div className="text-[12px] text-[#78716C] mt-0.5">Saved on your device</div>
              </div>
              <div>
                <div className="text-[22px] font-bold tracking-tight text-[#171717]">
                  Clean
                </div>
                <div className="text-[12px] text-[#78716C] mt-0.5">Holidays only on login</div>
              </div>
            </div>
          </div>

          {/* Right: Crisp Live Month Preview Card */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#E7E5E4] rounded-2xl shadow-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#F5F5F4] pb-3">
                <div>
                  <div className="text-[15px] font-bold text-[#171717]">
                    {MONTH_NAMES[today.getMonth()]} {today.getFullYear()}
                  </div>
                  <div className="text-[12px] text-[#78716C]">
                    Full Month View · {getRegionLabel(holidayRegion)} Holidays
                  </div>
                </div>
                <span className="text-[12px] font-mono text-[#DC2626] font-semibold tabular-nums">
                  {today.toLocaleDateString([], { weekday: 'short', day: 'numeric' })}
                </span>
              </div>

              {/* Clean mini 7-col month showcase */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#A8A29E]">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="py-1">
                    {d}
                  </div>
                ))}
                {Array.from({ length: 35 }, (_, idx) => {
                  const first = new Date(today.getFullYear(), today.getMonth(), 1);
                  const startOffset = first.getDay();
                  const d = new Date(today.getFullYear(), today.getMonth(), 1 - startOffset + idx);
                  const isToday =
                    d.getDate() === today.getDate() &&
                    d.getMonth() === today.getMonth() &&
                    d.getFullYear() === today.getFullYear();
                  const inMonth = d.getMonth() === today.getMonth();
                  return (
                    <div
                      key={idx}
                      className={`h-8 rounded-lg flex items-center justify-center text-[12px] tabular-nums ${
                        isToday
                          ? 'bg-[#171717] text-white font-bold'
                          : inMonth
                          ? 'text-[#292524] bg-[#FAFAF9]'
                          : 'text-[#D6D3D1]'
                      }`}
                    >
                      {d.getDate()}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[#F5F5F4] flex items-center justify-between text-[12px]">
                <span className="text-[#78716C]">
                  Zero clutter · Toggle extra calendars anytime
                </span>
                <button
                  type="button"
                  onClick={onOpenCalendar}
                  className="font-semibold text-[#171717] hover:underline cursor-pointer"
                >
                  Launch →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Organized World Calendars Directory Section */}
      <section id="calendars" className="border-t border-[#E7E5E4] bg-white py-20">
        <div className="max-w-[1160px] mx-auto px-5 sm:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-[600px]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#78716C]">
                Organized Multi-Calendar Engine
              </p>
              <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight text-[#171717]">
                All {WORLD_CALENDAR_SYSTEMS.length} calendars, converted live for today.
              </h2>
              <p className="text-[14.5px] text-[#57534E]">
                Gujarati Vikram Samvat, Tithis, and World Calendar Festivals are organized cleanly inside World Calendars—never cluttering your default holiday view.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {WORLD_CALENDAR_GROUPS.map((grp) => (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => setActiveGroup(grp.id)}
                  className={`px-3.5 py-2 rounded-lg text-[12.5px] font-medium transition-colors cursor-pointer ${
                    activeGroup === grp.id
                      ? 'bg-[#171717] text-white'
                      : 'bg-[#F5F5F4] text-[#57534E] hover:bg-[#E7E5E4] hover:text-[#171717]'
                  }`}
                >
                  {grp.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupConversions.map(({ meta, val }) => (
              <div
                key={meta.id}
                className="p-4 rounded-xl border border-[#E7E5E4] bg-[#FAFAF9] space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13.5px] font-semibold text-[#171717] truncate">
                    {meta.name}
                  </span>
                  <span className="text-[11px] text-[#78716C] shrink-0">{meta.region}</span>
                </div>
                <div className="text-[13px] font-medium text-[#44403C] tabular-nums">
                  {val.formatted}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Desktop + Mobile Apps & Widgets Section */}
      <section id="apps" className="border-t border-[#E7E5E4] bg-[#FAFAF9] py-20">
        <div className="max-w-[1160px] mx-auto px-5 sm:px-8 space-y-10">
          <div className="max-w-[600px] space-y-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#78716C]">
              Device-Ready Apps &amp; Widgets
            </p>
            <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight text-[#171717]">
              Built for Desktop, Mobile, and glanceable widgets.
            </h2>
            <p className="text-[14.5px] text-[#57534E]">
              Automatically detects your device ({device.label}) to offer native install, OS launchers, and live 2×2 / 4×2 / 4×4 desktop and mobile widgets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-[#E7E5E4] flex flex-col justify-between space-y-6">
              <div className="space-y-2.5">
                <Laptop className="w-6 h-6 text-[#171717]" />
                <h3 className="text-[18px] font-bold text-[#171717]">
                  Desktop App + Desktop Widget
                </h3>
                <p className="text-[13.5px] text-[#57534E] leading-relaxed">
                  Install on macOS, Windows, or Linux as a clean borderless app window, plus a live desktop widget showing clock, local weather, holidays, and mini month.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={onOpenDownloadHub}
                  className="px-4 py-2 rounded-lg bg-[#171717] hover:bg-[#292524] text-white text-[13px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => onLaunchWidget('desktop')}
                  className="px-4 py-2 rounded-lg border border-[#D6D3D1] hover:bg-[#F5F5F4] text-[13px] font-medium text-[#171717] cursor-pointer"
                >
                  Preview Desktop Widget
                </button>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E7E5E4] flex flex-col justify-between space-y-6">
              <div className="space-y-2.5">
                <Smartphone className="w-6 h-6 text-[#171717]" />
                <h3 className="text-[18px] font-bold text-[#171717]">
                  Mobile App + Mobile Widget
                </h3>
                <p className="text-[13.5px] text-[#57534E] leading-relaxed">
                  Add calendar.q to your iPhone, iPad, or Android home screen with offline support and touch-friendly 2×2, 4×2, and 4×4 mobile widgets.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={onOpenDownloadHub}
                  className="px-4 py-2 rounded-lg bg-[#171717] hover:bg-[#292524] text-white text-[13px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install Mobile</span>
                </button>
                <button
                  type="button"
                  onClick={() => onLaunchWidget('mobile')}
                  className="px-4 py-2 rounded-lg border border-[#D6D3D1] hover:bg-[#F5F5F4] text-[13px] font-medium text-[#171717] cursor-pointer"
                >
                  Preview Mobile Widget
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Local-First Privacy & Core Capabilities */}
      <section id="privacy" className="border-t border-[#E7E5E4] bg-white py-20">
        <div className="max-w-[1160px] mx-auto px-5 sm:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <HardDrive className="w-5 h-5 text-[#171717]" />
            <h3 className="text-[15.5px] font-bold text-[#171717]">
              Saved only on your device
            </h3>
            <p className="text-[13.5px] text-[#57534E] leading-relaxed">
              When you create an account or sign in, your profile, tasks, and local calendars stay directly on your computer or phone—never uploaded elsewhere.
            </p>
          </div>
          <div className="space-y-2">
            <CloudSun className="w-5 h-5 text-[#171717]" />
            <h3 className="text-[15.5px] font-bold text-[#171717]">
              Weather, World Clocks &amp; Agenda
            </h3>
            <p className="text-[13.5px] text-[#57534E] leading-relaxed">
              Unified Agenda + Tasks, Weather paired with World Clocks, and a dedicated Astronomy almanac button keep your workspace uncluttered.
            </p>
          </div>
          <div className="space-y-2">
            <Moon className="w-5 h-5 text-[#171717]" />
            <h3 className="text-[15.5px] font-bold text-[#171717]">
              .ics Sync &amp; Google Calendar
            </h3>
            <p className="text-[13.5px] text-[#57534E] leading-relaxed">
              Export or import standard .ics files and view Keyboard Shortcuts right inside Settings, plus optional two-way Google Calendar sync.
            </p>
          </div>
        </div>
      </section>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-[#E7E5E4] bg-[#FAFAF9] py-8">
        <div className="max-w-[1160px] mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12.5px] text-[#78716C]">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="" className="w-4 h-4 rounded-[4px]" />
            <span className="font-semibold text-[#171717]">calendar.q</span>
            <span>· Local-first universal calendar</span>
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={onOpenCalendar}
              className="hover:text-[#171717] cursor-pointer"
            >
              Open Calendar
            </button>
            <button
              type="button"
              onClick={onOpenDownloadHub}
              className="hover:text-[#171717] cursor-pointer"
            >
              Apps &amp; Widgets
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="hover:text-[#171717] cursor-pointer"
            >
              Create Local Account
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
