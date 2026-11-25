import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  CloudSun,
  ExternalLink,
  Globe,
  Languages,
  LocateFixed,
  LogOut,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import {
  CalendarLayer,
  GoogleUserProfile,
  TimezoneOption,
  WorldCalendarSystemId,
} from '../types/calendar';
import { WeatherUnits } from '../services/weatherService';
import {
  MASTER_REFERENCE_LINKS,
  WORLD_CALENDAR_GROUPS,
  WORLD_CALENDAR_SYSTEMS,
  convertToWorldCalendar,
} from '../data/worldCalendars';
import { COLOR_THEMES, MONTH_NAMES, TIMEZONE_OPTIONS } from '../utils/dateUtils';

export type SettingsTab = 'festivals' | 'world' | 'language' | 'google' | 'display';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: 'US', region: 'Global / International' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: 'IN', region: 'Gujarat, India' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: 'IN', region: 'India' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', flag: 'IN', region: 'Classical India' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: 'ES', region: 'Spain & Latin America' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: 'FR', region: 'France & Francophonie' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: 'DE', region: 'Germany & Central Europe' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: 'SA', region: 'Middle East & North Africa' },
  { code: 'zh', name: 'Chinese', nativeName: '中文 (简体)', flag: 'CN', region: 'East Asia' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: 'JP', region: 'Japan' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: 'RU', region: 'Eastern Europe' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: 'BR', region: 'Brazil & Portugal' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: 'IT', region: 'Italy' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: 'KR', region: 'South Korea' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: 'IN', region: 'West Bengal & Bangladesh' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: 'IN', region: 'Maharashtra, India' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: 'IN', region: 'Tamil Nadu & Sri Lanka' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: 'IN', region: 'Andhra Pradesh & Telangana' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: 'PK', region: 'South Asia' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: 'NP', region: 'Nepal & Himalayas' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: 'IN', region: 'Punjab, India' },
];

interface SettingsModalProps {
  open: boolean;
  initialTab?: SettingsTab;
  anchorDate: Date;
  layers: CalendarLayer[];
  gujaratiScript: boolean;
  enabledWorldCalendars: WorldCalendarSystemId[];
  headerSubCalendar: WorldCalendarSystemId | 'none';
  selectedLanguage?: string;
  onSelectLanguage?: (code: string) => void;
  primaryTz: TimezoneOption;
  secondaryTz: TimezoneOption;
  googleUser: GoogleUserProfile | null;
  googleSyncing: boolean;
  googleError: string | null;
  weatherLocationQuery: string;
  weatherUnits: WeatherUnits;
  onClose: () => void;
  onToggleLayer: (layerId: string) => void;
  onToggleAllCultural: () => void;
  onToggleGujaratiScript: () => void;
  onToggleWorldCalendar: (id: WorldCalendarSystemId) => void;
  onEnableAllWorldCalendars: (enable: boolean) => void;
  onSetHeaderSubCalendar: (id: WorldCalendarSystemId | 'none') => void;
  onSetPrimaryTz: (tz: TimezoneOption) => void;
  onSetSecondaryTz: (tz: TimezoneOption) => void;
  onSetWeatherLocationQuery: (city: string) => void;
  onSetWeatherUnits: (units: WeatherUnits) => void;
  onUseWeatherGeolocation: () => void;
  onGoogleSignIn: () => void;
  onGoogleSync: () => void;
  onGoogleLogout: () => void;
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`relative inline-flex h-[20px] w-[36px] shrink-0 items-center rounded-full transition-colors cursor-pointer ${
      checked ? 'bg-[#1A1A1A]' : 'bg-[#D8D8D8]'
    }`}
  >
    <span
      className={`inline-block h-[16px] w-[16px] transform rounded-full bg-white shadow-xs transition-transform ${
        checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
      }`}
    />
  </button>
);

export const GoogleSignInButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  compact?: boolean;
}> = ({ onClick, disabled, compact }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`w-full bg-white hover:bg-[#F8F9FA] active:bg-[#F1F3F4] border border-[#DADCE0] rounded-[6px] text-[#3C4043] font-medium flex items-center justify-center gap-2.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-60 ${
      compact ? 'h-[32px] px-2.5 text-[12px]' : 'h-[38px] px-4 text-[13px]'
    }`}
  >
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={compact ? 'w-4 h-4 shrink-0' : 'w-[18px] h-[18px] shrink-0'}
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
    <span className="truncate">Sign in with Google</span>
  </button>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  initialTab = 'festivals',
  anchorDate,
  layers,
  gujaratiScript,
  enabledWorldCalendars,
  headerSubCalendar,
  selectedLanguage = 'en',
  onSelectLanguage,
  primaryTz,
  secondaryTz,
  googleUser,
  googleSyncing,
  googleError,
  weatherLocationQuery,
  weatherUnits,
  onClose,
  onToggleLayer,
  onToggleAllCultural,
  onToggleGujaratiScript,
  onToggleWorldCalendar,
  onEnableAllWorldCalendars,
  onSetHeaderSubCalendar,
  onSetPrimaryTz,
  onSetSecondaryTz,
  onSetWeatherLocationQuery,
  onSetWeatherUnits,
  onUseWeatherGeolocation,
  onGoogleSignIn,
  onGoogleSync,
  onGoogleLogout,
}) => {
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [worldFilter, setWorldFilter] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [cityDraft, setCityDraft] = useState(weatherLocationQuery);

  React.useEffect(() => {
    setCityDraft(weatherLocationQuery);
  }, [weatherLocationQuery]);

  React.useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const culturalLayers = useMemo(
    () => layers.filter((l) => l.type === 'cultural'),
    [layers]
  );
  const localLayers = useMemo(
    () => layers.filter((l) => l.type === 'personal'),
    [layers]
  );
  const googleLayers = useMemo(
    () => layers.filter((l) => l.type === 'google'),
    [layers]
  );

  const anyCulturalVisible = culturalLayers.some((l) => l.visible);
  const enabledSet = useMemo(
    () => new Set(enabledWorldCalendars),
    [enabledWorldCalendars]
  );

  const worldConversions = useMemo(() => {
    const q = worldFilter.trim().toLowerCase();
    return WORLD_CALENDAR_SYSTEMS.filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q)
    ).map((meta) => ({
      meta,
      val: convertToWorldCalendar(anchorDate, meta.id, gujaratiScript),
    }));
  }, [anchorDate, gujaratiScript, worldFilter]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[1px] flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Calendar Settings"
        className="w-full max-w-[760px] h-[min(82vh,640px)] bg-white border border-[#E2E2E2] rounded-xl shadow-xl flex flex-col overflow-hidden"
      >
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-[#EFEFEF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#525252]" />
            <h2 className="text-[15px] font-semibold text-[#1A1A1A]">
              Calendar Settings &amp; Integrations
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="p-1 rounded-md hover:bg-[#F2F2F2] text-[#7A7A7A] hover:text-[#1A1A1A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: Responsive Top Tabs on Mobile, Left Sidebar on Desktop */}
        <div className="flex-1 flex flex-col sm:flex-row min-h-0 overflow-hidden">
          {/* Sidebar / Top Tabs */}
          <nav className="sm:w-[196px] shrink-0 bg-[#FAFAFA] border-b sm:border-b-0 sm:border-r border-[#EFEFEF] p-2 sm:p-2.5 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible cal-scroll">
            {(
              [
                { id: 'festivals', label: 'Festivals & Holidays', icon: Sparkles },
                { id: 'world', label: 'World Calendars (33)', icon: Globe },
                { id: 'language', label: 'Language & Locale', icon: Languages },
                { id: 'google', label: 'Google Calendar', icon: Calendar },
                { id: 'display', label: 'Display & Weather', icon: SlidersHorizontal },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`sm:w-full shrink-0 flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-lg text-[12px] sm:text-[12.5px] font-medium transition-colors text-left cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-white text-[#1A1A1A] shadow-2xs border border-[#E6E6E6]'
                      : 'text-[#666666] hover:bg-[#F0F0F0] hover:text-[#1A1A1A] border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Active Tab Panel */}
          <div className="flex-1 overflow-y-auto cal-scroll p-4 sm:p-5">
            {/* ==================== TAB 1: FESTIVALS & HOLIDAYS ==================== */}
            {tab === 'festivals' && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EFEFEF]">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#1A1A1A]">
                      Festivals, Tithis &amp; Holidays
                    </h3>
                    <p className="text-[12px] text-[#737373] mt-0.5">
                      Toggle individual festival layers or hide every cultural overlay at once.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[12px] text-[#525252] font-medium">
                      {anyCulturalVisible ? 'Visible' : 'All hidden'}
                    </span>
                    <ToggleSwitch
                      checked={anyCulturalVisible}
                      onChange={onToggleAllCultural}
                      label="Toggle all festival and holiday layers"
                    />
                  </div>
                </div>

                {/* Individual Cultural Layer Switches */}
                <div className="divide-y divide-[#F2F2F2]">
                  {culturalLayers.map((layer) => {
                    const theme = COLOR_THEMES[layer.color];
                    return (
                      <div
                        key={layer.id}
                        className="py-3 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span
                            className="w-3 h-3 rounded-[3px] mt-1 shrink-0"
                            style={{ backgroundColor: theme.dot }}
                          />
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium text-[#1A1A1A]">
                              {layer.name}
                            </div>
                            {layer.description && (
                              <div className="text-[11.5px] text-[#7A7A7A] mt-0.5 leading-snug">
                                {layer.description}
                              </div>
                            )}
                          </div>
                        </div>

                        <ToggleSwitch
                          checked={layer.visible}
                          onChange={() => onToggleLayer(layer.id)}
                          label={`Toggle ${layer.name}`}
                        />
                      </div>
                    );
                  })}

                  {/* Gujarati Script Toggle */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[13px] font-medium text-[#1A1A1A]">
                        Gujarati Script Labels (<span className="font-gujarati">ગુજરાતી</span>)
                      </div>
                      <div className="text-[11.5px] text-[#7A7A7A] mt-0.5">
                        Display Gujarati Tithis and festival titles in native Gujarati script instead of English transliteration.
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={gujaratiScript}
                      onChange={onToggleGujaratiScript}
                      label="Toggle Gujarati script labels"
                    />
                  </div>
                </div>

                {/* Local Personal Category Visibility */}
                <div className="pt-4 border-t border-[#EFEFEF] space-y-2">
                  <h4 className="text-[12.5px] font-semibold text-[#1A1A1A]">
                    Local Calendar Categories
                  </h4>
                  <p className="text-[11.5px] text-[#7A7A7A]">
                    Show or hide local personal categories for events, birthdays, memorials, and workspace plans.
                  </p>
                  <div className="divide-y divide-[#F2F2F2]">
                    {localLayers.map((layer) => {
                      const theme = COLOR_THEMES[layer.color];
                      return (
                        <div
                          key={layer.id}
                          className="py-2.5 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3 h-3 rounded-[3px] shrink-0"
                              style={{ backgroundColor: theme.dot }}
                            />
                            <span className="text-[12.5px] font-medium text-[#1A1A1A]">
                              {layer.name}
                            </span>
                          </div>
                          <ToggleSwitch
                            checked={layer.visible}
                            onChange={() => onToggleLayer(layer.id)}
                            label={`Toggle ${layer.name}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB 2: 29 WORLD CALENDARS ==================== */}
            {tab === 'world' && (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#EFEFEF]">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#1A1A1A]">
                      Unified Calendar Systems ({enabledWorldCalendars.length} / {WORLD_CALENDAR_SYSTEMS.length} active)
                    </h3>
                    <p className="text-[12px] text-[#737373] mt-0.5">
                      Live conversion for{' '}
                      <span className="font-medium text-[#1A1A1A]">
                        {MONTH_NAMES[anchorDate.getMonth()]} {anchorDate.getDate()},{' '}
                        {anchorDate.getFullYear()}
                      </span>
                      . Enabled calendars appear in the Left Sidebar, Calendar Canvas, and Almanac.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEnableAllWorldCalendars(true)}
                      className="px-2 py-1 rounded border border-[#E2E2E2] text-[11px] font-medium text-[#4A4A4A] hover:bg-[#F5F5F5] cursor-pointer"
                    >
                      Enable all
                    </button>
                    <button
                      type="button"
                      onClick={() => onEnableAllWorldCalendars(false)}
                      className="px-2 py-1 rounded border border-[#E2E2E2] text-[11px] font-medium text-[#4A4A4A] hover:bg-[#F5F5F5] cursor-pointer"
                    >
                      Hide all
                    </button>
                  </div>
                </div>

                {/* Primary & Sub-header Calendar Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FAFAFA] border border-[#ECECEC] rounded-lg p-3">
                  <div>
                    <div className="text-[12.5px] font-medium text-[#1A1A1A]">
                      Primary calendar system
                    </div>
                    <div className="text-[11px] text-[#7A7A7A] mb-1.5">
                      Determines primary date display format.
                    </div>
                    <select
                      value="gregorian"
                      onChange={() => {}}
                      className="w-full bg-white border border-[#DCDCDC] rounded-md px-2.5 py-1.5 text-[12px] text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                    >
                      <option value="gregorian">Gregorian (Standard International)</option>
                      {WORLD_CALENDAR_SYSTEMS.map((sys) => (
                        <option key={sys.id} value={sys.id}>
                          {sys.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="text-[12.5px] font-medium text-[#1A1A1A]">
                      Day column sub-header calendar
                    </div>
                    <div className="text-[11px] text-[#7A7A7A] mb-1.5">
                      Secondary label beneath dates on calendar grid.
                    </div>
                    <select
                      value={headerSubCalendar}
                      onChange={(e) =>
                        onSetHeaderSubCalendar(
                          e.target.value as WorldCalendarSystemId | 'none'
                        )
                      }
                      className="w-full bg-white border border-[#DCDCDC] rounded-md px-2.5 py-1.5 text-[12px] text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                    >
                      <option value="none">None (Gregorian only)</option>
                      {WORLD_CALENDAR_SYSTEMS.map((sys) => (
                        <option key={sys.id} value={sys.id}>
                          {sys.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Search filter */}
                <input
                  type="text"
                  value={worldFilter}
                  onChange={(e) => setWorldFilter(e.target.value)}
                  placeholder="Filter 32 calendar systems (e.g. ISO Week, Academic, Fiscal, Tamil, Hebrew, Islamic, Chinese...)"
                  className="w-full bg-white border border-[#E2E2E2] rounded-md px-3 py-1.5 text-[12.5px] text-[#1A1A1A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#3B9AE1]"
                />

                {/* Grouped World Calendar Toggles with Live Date Conversion */}
                {WORLD_CALENDAR_GROUPS.map((grp) => {
                  const items = worldConversions.filter((c) => c.meta.group === grp.id);
                  if (items.length === 0) return null;
                  return (
                    <div key={grp.id} className="space-y-1.5">
                      <h4 className="text-[11.5px] font-semibold text-[#737373] pt-1">
                        {grp.label}
                      </h4>
                      <div className="divide-y divide-[#F2F2F2] border border-[#EFEFEF] rounded-lg px-3">
                        {items.map(({ meta, val }) => (
                          <div
                            key={meta.id}
                            className="py-2.5 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[12.5px] font-medium text-[#1A1A1A] truncate">
                                  {meta.name}
                                </span>
                                <a
                                  href={meta.wikiUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`Reference: ${meta.name}`}
                                  className="text-[#A3A3A3] hover:text-[#1A1A1A] shrink-0"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                              <div
                                className={`text-[11.5px] text-[#525252] mt-0.5 tabular-nums truncate ${
                                  meta.id === 'gujarati-vikram' && gujaratiScript
                                    ? 'font-gujarati'
                                    : ''
                                }`}
                              >
                                {val.formatted}
                              </div>
                            </div>

                            <ToggleSwitch
                              checked={enabledSet.has(meta.id)}
                              onChange={() => onToggleWorldCalendar(meta.id)}
                              label={`Toggle ${meta.name}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Master Reference Links */}
                <div className="pt-3 border-t border-[#EFEFEF]">
                  <div className="text-[11.5px] font-semibold text-[#737373] mb-2">
                    Reference Almanac &amp; Converter Links
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px]">
                    {MASTER_REFERENCE_LINKS.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#185D8F] hover:underline"
                      >
                        <span>{link.label}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB: LANGUAGE & LOCALE ==================== */}
            {tab === 'language' && (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#EFEFEF]">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#1A1A1A]">
                      Language &amp; Regional Localization
                    </h3>
                    <p className="text-[12px] text-[#737373] mt-0.5">
                      Choose your preferred interface and cultural calendar language.
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-[#185D8F] bg-[#EFF8FF] border border-[#B2DDFF] px-2.5 py-0.5 rounded-full shrink-0">
                    {SUPPORTED_LANGUAGES.find((l) => l.code === (selectedLanguage || 'en'))?.nativeName || 'English'}
                  </span>
                </div>

                {/* Quick select pills */}
                <div>
                  <div className="text-[11px] font-semibold text-[#737373] mb-1.5 uppercase tracking-wider">
                    Popular Languages
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SUPPORTED_LANGUAGES.slice(0, 8).map((lang) => {
                      const isSelected = (selectedLanguage || 'en') === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => onSelectLanguage?.(lang.code)}
                          className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#1A1A1A] text-white shadow-xs'
                              : 'bg-[#F2F4F7] text-[#344054] hover:bg-[#EAECF0]'
                          }`}
                        >
                          <span className="font-mono text-[10px] font-bold opacity-75">{lang.flag}</span>
                          <span>{lang.nativeName}</span>
                          <span className="text-[10px] opacity-60">({lang.name})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Search / Filter input */}
                <div className="pt-2">
                  <input
                    type="text"
                    placeholder="Search all 21 supported languages by name, native script, or region..."
                    value={langFilter}
                    onChange={(e) => setLangFilter(e.target.value)}
                    className="w-full bg-white border border-[#DCDCDC] rounded-md px-3 py-1.5 text-[12px] text-[#1A1A1A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#185D8F]"
                  />
                </div>

                {/* Full Language Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[320px] overflow-y-auto cal-scroll pr-1">
                  {SUPPORTED_LANGUAGES.filter(
                    (l) =>
                      !langFilter ||
                      l.name.toLowerCase().includes(langFilter.toLowerCase()) ||
                      l.nativeName.toLowerCase().includes(langFilter.toLowerCase()) ||
                      l.region.toLowerCase().includes(langFilter.toLowerCase()) ||
                      l.code.toLowerCase().includes(langFilter.toLowerCase())
                  ).map((lang) => {
                    const isSelected = (selectedLanguage || 'en') === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => onSelectLanguage?.(lang.code)}
                        className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-[#F0F9FF] border-[#0284C7] shadow-2xs'
                            : 'bg-white border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F9FAFB]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-7 h-7 rounded-md bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center font-bold text-[10.5px] text-[#374151] shrink-0 font-mono">
                            {lang.flag}
                          </span>
                          <div className="min-w-0">
                            <div className="text-[12.5px] font-semibold text-[#111827] leading-tight truncate">
                              {lang.nativeName}{' '}
                              <span className="text-[11px] font-normal text-[#6B7280]">
                                ({lang.name})
                              </span>
                            </div>
                            <div className="text-[10px] text-[#6B7280] truncate mt-0.5">
                              {lang.region}
                            </div>
                          </div>
                        </div>

                        {isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-[#0284C7] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#9CA3AF] shrink-0 font-mono">
                            {lang.code.toUpperCase()}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Cultural Script Quick Toggle */}
                <div className="pt-3 border-t border-[#EFEFEF] flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[12.5px] font-medium text-[#1A1A1A]">
                      Gujarati Script Labels (<span className="font-gujarati">ગુજરાતી</span>)
                    </div>
                    <div className="text-[11px] text-[#7A7A7A] mt-0.5">
                      Display Panchang Tithis and festival headers in native Gujarati script.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={gujaratiScript}
                    onChange={onToggleGujaratiScript}
                    label="Toggle Gujarati script labels"
                  />
                </div>
              </div>
            )}

            {/* ==================== TAB 3: GOOGLE CALENDAR ==================== */}
            {tab === 'google' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#EFEFEF]">
                  <h3 className="text-[14px] font-semibold text-[#1A1A1A]">
                    Google Calendar Sync
                  </h3>
                  <p className="text-[12px] text-[#737373] mt-0.5 leading-relaxed">
                    Connect your Google account to sync your real calendars and manage events, birthdays, memorials, and workspace plans directly from calendar.q.
                  </p>
                </div>

                {googleError && (
                  <div className="rounded-md bg-[#FDE2E4] border border-[#F5B7BC] px-3 py-2 text-[12px] text-[#8A1520]">
                    {googleError}
                  </div>
                )}

                {!googleUser ? (
                  <div className="rounded-lg border border-[#EAEAEA] bg-[#FAFAFA] p-4 space-y-3">
                    <div className="text-[12.5px] text-[#454545] leading-relaxed">
                      Sign in with Google to import your calendar lists (Work, Personal, Birthdays, Family, Plans) and add or update events with explicit confirmation before any change.
                    </div>
                    <div className="max-w-[260px]">
                      <GoogleSignInButton
                        onClick={onGoogleSignIn}
                        disabled={googleSyncing}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-[#E6E6E6] bg-[#FAFAFA] p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {googleUser.photoURL ? (
                          <img
                            src={googleUser.photoURL}
                            alt={googleUser.displayName || 'Google account'}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full border border-[#E2E2E2] shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#1A1A1A] text-white text-[13px] font-semibold flex items-center justify-center shrink-0">
                            {(googleUser.email || 'G')[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-[#1A1A1A] truncate">
                            {googleUser.displayName || 'Google Account'}
                          </div>
                          <div className="text-[11.5px] text-[#666666] truncate">
                            {googleUser.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={onGoogleSync}
                          disabled={googleSyncing}
                          className="px-2.5 py-1.5 rounded-md border border-[#DCDCDC] bg-white hover:bg-[#F3F3F3] text-[12px] font-medium text-[#1A1A1A] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${
                              googleSyncing ? 'animate-spin' : ''
                            }`}
                          />
                          <span>{googleSyncing ? 'Syncing' : 'Sync now'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={onGoogleLogout}
                          className="px-2.5 py-1.5 rounded-md border border-[#DCDCDC] bg-white hover:bg-[#FDE2E4] hover:border-[#F5B7BC] hover:text-[#8A1520] text-[12px] font-medium text-[#525252] inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Disconnect</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[12px] font-semibold text-[#1A1A1A]">
                        Synced Google Calendars ({googleLayers.length})
                      </div>
                      {googleLayers.length === 0 ? (
                        <p className="text-[12px] text-[#7A7A7A]">
                          No Google calendars loaded yet. Click Sync now to refresh.
                        </p>
                      ) : (
                        <div className="divide-y divide-[#F2F2F2] border border-[#EFEFEF] rounded-lg px-3">
                          {googleLayers.map((cal) => {
                            const theme = COLOR_THEMES[cal.color];
                            return (
                              <div
                                key={cal.id}
                                className="py-2.5 flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span
                                    className="w-3 h-3 rounded-[3px] shrink-0"
                                    style={{
                                      backgroundColor: cal.customHex || theme.dot,
                                    }}
                                  />
                                  <span className="text-[12.5px] font-medium text-[#1A1A1A] truncate">
                                    {cal.name}
                                  </span>
                                </div>
                                <ToggleSwitch
                                  checked={cal.visible}
                                  onChange={() => onToggleLayer(cal.id)}
                                  label={`Toggle ${cal.name}`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==================== TAB 4: DISPLAY, TIMEZONES & WEATHER ==================== */}
            {tab === 'display' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="pb-3 border-b border-[#EFEFEF]">
                    <h3 className="text-[14px] font-semibold text-[#1A1A1A]">
                      Dual Timezone Columns
                    </h3>
                    <p className="text-[12px] text-[#737373] mt-0.5">
                      Configure the two timezone rails displayed along the left edge of the schedule grid.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-medium text-[#4A4A4A] mb-1">
                        Primary timezone (right gutter)
                      </label>
                      <select
                        value={primaryTz.id}
                        onChange={(e) => {
                          const found = TIMEZONE_OPTIONS.find(
                            (t) => t.id === e.target.value
                          );
                          if (found) onSetPrimaryTz(found);
                        }}
                        className="w-full bg-white border border-[#DCDCDC] rounded-md px-3 py-2 text-[12.5px] text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                      >
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <option key={tz.id} value={tz.id}>
                            {tz.abbr} — {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[12px] font-medium text-[#4A4A4A] mb-1">
                        Secondary timezone (left gutter)
                      </label>
                      <select
                        value={secondaryTz.id}
                        onChange={(e) => {
                          const found = TIMEZONE_OPTIONS.find(
                            (t) => t.id === e.target.value
                          );
                          if (found) onSetSecondaryTz(found);
                        }}
                        className="w-full bg-white border border-[#DCDCDC] rounded-md px-3 py-2 text-[12.5px] text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                      >
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <option key={tz.id} value={tz.id}>
                            {tz.abbr} — {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Weather Location & Units */}
                <div className="space-y-3 pt-4 border-t border-[#EFEFEF]">
                  <div className="flex items-center gap-2">
                    <CloudSun className="w-4 h-4 text-[#D98E04]" />
                    <h3 className="text-[14px] font-semibold text-[#1A1A1A]">
                      Weather Forecast Location
                    </h3>
                  </div>
                  <p className="text-[12px] text-[#737373]">
                    Set the primary city used by the header weather widget and 5-day planning forecast.
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (cityDraft.trim()) {
                        onSetWeatherLocationQuery(cityDraft.trim());
                      }
                    }}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="text"
                      value={cityDraft}
                      onChange={(e) => setCityDraft(e.target.value)}
                      placeholder="City or region (e.g. Ahmedabad, India)"
                      className="flex-1 bg-white border border-[#DCDCDC] rounded-md px-3 py-2 text-[12.5px] text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                    />
                    <button
                      type="submit"
                      disabled={!cityDraft.trim()}
                      className="px-4 py-2 rounded-md bg-[#1A1A1A] hover:bg-[#333333] disabled:opacity-40 text-white text-[12.5px] font-medium cursor-pointer shrink-0"
                    >
                      Update location
                    </button>
                  </form>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={onUseWeatherGeolocation}
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#185D8F] hover:underline cursor-pointer"
                    >
                      <LocateFixed className="w-3.5 h-3.5" />
                      <span>Use browser location</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#666666]">Temperature unit:</span>
                      <div className="inline-flex rounded-md border border-[#DCDCDC] bg-white overflow-hidden text-[12px] font-medium">
                        <button
                          type="button"
                          onClick={() => onSetWeatherUnits('METRIC')}
                          className={`px-2.5 py-1 cursor-pointer transition-colors ${
                            weatherUnits === 'METRIC'
                              ? 'bg-[#1A1A1A] text-white'
                              : 'text-[#525252] hover:bg-[#F3F3F3]'
                          }`}
                        >
                          Celsius (°C)
                        </button>
                        <button
                          type="button"
                          onClick={() => onSetWeatherUnits('IMPERIAL')}
                          className={`px-2.5 py-1 cursor-pointer transition-colors ${
                            weatherUnits === 'IMPERIAL'
                              ? 'bg-[#1A1A1A] text-white'
                              : 'text-[#525252] hover:bg-[#F3F3F3]'
                          }`}
                        >
                          Fahrenheit (°F)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
