import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  CloudSun,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Keyboard,
  Languages,
  LocateFixed,
  LogOut,
  Monitor,
  Moon,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Sun,
  Upload,
  X,
} from 'lucide-react';
import {
  CalendarEvent,
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
import {
  HOLIDAY_REGIONS,
  HolidayRegionCode,
  getRegionLabel,
} from '../utils/deviceUtils';
import { buildIcs, downloadIcs, parseIcsEvents } from '../utils/icsExport';

export type SettingsTab =
  | 'festivals'
  | 'world'
  | 'display'
  | 'sync'
  | 'shortcuts'
  | 'google'
  | 'language'
  | 'apps';

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

const SHORTCUT_CATEGORIES = [
  {
    name: 'Navigation & Views',
    items: [
      { keys: ['T'], desc: 'Jump to Today' },
      { keys: ['D', 'or', '1'], desc: 'Switch to Day view' },
      { keys: ['3'], desc: 'Switch to 3-Day view' },
      { keys: ['5'], desc: 'Switch to 5-Day view' },
      { keys: ['W'], desc: 'Switch to Week view' },
      { keys: ['M'], desc: 'Switch to Full Month view' },
      { keys: ['J', 'or', '→'], desc: 'Next period' },
      { keys: ['K', 'or', '←'], desc: 'Previous period' },
      { keys: ['.'], desc: 'Go to Date / Festival jump' },
    ],
  },
  {
    name: 'Events & Actions',
    items: [
      { keys: ['C', 'or', 'N'], desc: 'Create new event' },
      { keys: ['⌘/Ctrl', 'K'], desc: 'Open Command Menu & Search' },
      { keys: ['/'], desc: 'Quick search events & festivals' },
      { keys: ['⌘/Ctrl', 'E'], desc: 'Open .ics Calendar Sync in Settings' },
      { keys: ['S'], desc: 'Toggle Share Availability mode' },
      { keys: ['Esc'], desc: 'Close active dialog or clear selection' },
    ],
  },
  {
    name: 'Workspace & Overlays',
    items: [
      { keys: ['['], desc: 'Toggle left sidebar' },
      { keys: [']'], desc: 'Toggle right panel' },
      { keys: ['H'], desc: 'Toggle Holidays & Indian Festivals' },
      { keys: ['G'], desc: 'Toggle Gujarati Calendar & Tithis' },
      { keys: ['A'], desc: 'Open Astronomy Almanac' },
      { keys: ['⌘/Ctrl', ','], desc: 'Open Calendar Settings' },
      { keys: ['?'], desc: 'Open Keyboard Shortcuts in Settings' },
    ],
  },
];

interface SettingsModalProps {
  open: boolean;
  initialTab?: SettingsTab;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  anchorDate: Date;
  layers: CalendarLayer[];
  events: CalendarEvent[];
  gujaratiScript: boolean;
  holidayRegion: HolidayRegionCode;
  primaryCalendar: WorldCalendarSystemId;
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
  onSetHolidayRegion: (region: HolidayRegionCode) => void;
  onSetPrimaryCalendar: (id: WorldCalendarSystemId) => void;
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
  onImportEvents: (importedEvents: CalendarEvent[]) => void;
  onOpenDownloadHub?: () => void;
  showToast?: (msg: string) => void;
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
      checked ? 'bg-[#1A1A1A] dark:bg-[#F4F4F5]' : 'bg-[#D8D8D8] dark:bg-[#32323B]'
    }`}
  >
    <span
      className={`inline-block h-[16px] w-[16px] transform rounded-full shadow-xs transition-transform ${
        checked
          ? 'translate-x-[18px] bg-white dark:bg-[#09090B]'
          : 'translate-x-[2px] bg-white dark:bg-[#A1A1AA]'
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
    className={`w-full bg-white dark:bg-[#1C1C22] hover:bg-[#F8F9FA] dark:hover:bg-[#24242C] active:bg-[#F1F3F4] border border-[#DADCE0] dark:border-[#32323B] rounded-[6px] text-[#3C4043] dark:text-[#F4F4F5] font-medium flex items-center justify-center gap-2.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-60 ${
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
  darkMode,
  onToggleDarkMode,
  anchorDate,
  layers,
  events,
  gujaratiScript,
  holidayRegion,
  primaryCalendar,
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
  onSetHolidayRegion,
  onSetPrimaryCalendar,
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
  onImportEvents,
  onOpenDownloadHub,
  showToast,
}) => {
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [worldFilter, setWorldFilter] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [shortcutFilter, setShortcutFilter] = useState('');
  const [shortcutOs, setShortcutOs] = useState<'mac' | 'win'>(() =>
    typeof navigator !== 'undefined' && /mac/i.test(navigator.platform) ? 'mac' : 'win'
  );
  const [cityDraft, setCityDraft] = useState(weatherLocationQuery);

  // .ics sync state
  const [selectedExportLayers, setSelectedExportLayers] = useState<Set<string>>(
    () => new Set(layers.filter((l) => l.type === 'personal' || l.type === 'custom').map((l) => l.id))
  );
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportableLayers = useMemo(
    () => layers.filter((l) => l.type === 'personal' || l.type === 'custom' || l.type === 'google'),
    [layers]
  );

  React.useEffect(() => {
    setCityDraft(weatherLocationQuery);
  }, [weatherLocationQuery]);

  React.useEffect(() => {
    if (open) {
      setTab(initialTab);
      setImportStatus(null);
      setExportSuccess(false);
      setSelectedExportLayers(
        new Set(
          layers
            .filter((l) => l.type === 'personal' || l.type === 'custom' || l.type === 'google')
            .map((l) => l.id)
        )
      );
    }
  }, [open, initialTab, layers]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Ensure device's auto-detected primary/secondary timezone is always present in dropdown options
  const allTimezoneOptions = useMemo(() => {
    const map = new Map<string, TimezoneOption>();
    if (primaryTz) map.set(primaryTz.id, primaryTz);
    if (secondaryTz) map.set(secondaryTz.id, secondaryTz);
    for (const tz of TIMEZONE_OPTIONS) {
      if (!map.has(tz.id)) map.set(tz.id, tz);
    }
    return Array.from(map.values());
  }, [primaryTz, secondaryTz]);

  const holidayAndIndianLayers = useMemo(
    () => layers.filter((l) => l.id === 'national-holidays' || l.id === 'indian-festivals'),
    [layers]
  );

  const worldOverlayLayers = useMemo(
    () =>
      layers.filter(
        (l) =>
          l.id === 'world-observances' ||
          l.id === 'global-days'
      ),
    [layers]
  );

  const localLayers = useMemo(
    () => layers.filter((l) => l.type === 'personal' || l.type === 'custom'),
    [layers]
  );

  const googleLayers = useMemo(
    () => layers.filter((l) => l.type === 'google'),
    [layers]
  );

  const anyHolidayVisible = holidayAndIndianLayers.some((l) => l.visible);
  const enabledSet = useMemo(() => new Set(enabledWorldCalendars), [enabledWorldCalendars]);

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

  const eventsToExport = useMemo(
    () => events.filter((ev) => selectedExportLayers.has(ev.calendarId)),
    [events, selectedExportLayers]
  );

  const handleDownloadIcs = () => {
    const icsText = buildIcs(eventsToExport, layers, {
      calendarName: 'calendar.q Export',
      timezone: primaryTz.id,
      scope: 'all',
    });
    const dateStr = new Date().toISOString().split('T')[0];
    downloadIcs(`calendar-q-export-${dateStr}.ics`, icsText);
    setExportSuccess(true);
    showToast?.(`Exported ${eventsToExport.length} events to .ics`);
    window.setTimeout(() => setExportSuccess(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = String(ev.target?.result || '');
        const parsed = parseIcsEvents(content, 'personal');
        if (parsed.length === 0) {
          setImportStatus({
            type: 'error',
            message: 'No valid VEVENT entries were found in this .ics file.',
          });
          return;
        }
        onImportEvents(parsed);
        setImportStatus({
          type: 'success',
          message: `Imported ${parsed.length} event${parsed.length === 1 ? '' : 's'} into your local calendar.`,
        });
        showToast?.(`Imported ${parsed.length} events from .ics`);
      } catch {
        setImportStatus({
          type: 'error',
          message: 'Failed to parse this .ics file. Please check the file format.',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formatShortcutKey = (key: string) => {
    if (key === '⌘/Ctrl') return shortcutOs === 'mac' ? '⌘' : 'Ctrl';
    return key;
  };

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/30 dark:bg-black/65 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Calendar Settings"
        className="w-full max-w-[880px] h-[min(88vh,680px)] bg-white dark:bg-[#131317] border border-[#E2E2E2] dark:border-[#27272E] rounded-xl shadow-xl dark:shadow-[0_24px_60px_rgba(0,0,0,0.75)] flex flex-col overflow-hidden"
      >
        {/* Top Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-[#EFEFEF] dark:border-[#24242B] flex items-center justify-between gap-3 shrink-0 bg-white dark:bg-[#131317]">
          <div className="flex items-center gap-2 min-w-0">
            <SlidersHorizontal className="w-4 h-4 text-[#525252] dark:text-[#A1A1AA] shrink-0" />
            <h2 className="text-[15px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5] truncate">
              Calendar Settings
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Global Dark Mode Quick Toggle in Settings Header */}
            <button
              type="button"
              role="switch"
              aria-checked={darkMode}
              onClick={onToggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="h-[30px] px-2.5 rounded-lg border border-[#E4E4E4] dark:border-[#2E2E36] bg-[#FAFAFA] dark:bg-[#1C1C22] hover:bg-[#F2F2F2] dark:hover:bg-[#26262F] text-[12px] font-medium text-[#1A1A1A] dark:text-[#F4F4F5] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {darkMode ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#F4F4F5]" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Light Mode</span>
                </>
              )}
              <span
                aria-hidden="true"
                className={`ml-0.5 inline-flex h-[15px] w-[26px] items-center rounded-full transition-colors ${
                  darkMode ? 'bg-[#F4F4F5]' : 'bg-[#D4D4D8]'
                }`}
              >
                <span
                  className={`inline-block h-[11px] w-[11px] rounded-full transition-transform ${
                    darkMode
                      ? 'translate-x-[13px] bg-[#09090B]'
                      : 'translate-x-[2px] bg-white'
                  }`}
                />
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close settings"
              className="p-1.5 rounded-md hover:bg-[#F2F2F2] dark:hover:bg-[#23232A] text-[#7A7A7A] dark:text-[#A1A1AA] hover:text-[#1A1A1A] dark:hover:text-white cursor-pointer shrink-0 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 min-w-0 overflow-hidden">
          <nav className="md:w-[216px] shrink-0 bg-[#FAFAFA] dark:bg-[#0F0F13] border-b md:border-b-0 md:border-r border-[#EFEFEF] dark:border-[#24242B] p-2 md:p-2.5 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible md:overflow-y-auto cal-scroll">
            {(
              [
                { id: 'festivals', label: 'Holidays & Local', icon: Sparkles },
                { id: 'world', label: `World Calendars (${WORLD_CALENDAR_SYSTEMS.length})`, icon: Globe },
                { id: 'display', label: 'Display & Weather', icon: CloudSun },
                { id: 'sync', label: 'Calendar Sync (.ics)', icon: Download },
                { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard },
                { id: 'google', label: 'Google Calendar', icon: Calendar },
                { id: 'language', label: 'Language', icon: Languages },
                { id: 'apps', label: 'Apps & Widgets', icon: Smartphone },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`md:w-full shrink-0 flex items-center gap-2 px-3 py-1.5 md:py-2 rounded-lg text-[12px] md:text-[12.5px] font-medium transition-colors text-left cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-white dark:bg-[#1C1C22] text-[#1A1A1A] dark:text-[#F4F4F5] shadow-2xs border border-[#E6E6E6] dark:border-[#2E2E36]'
                      : 'text-[#666666] dark:text-[#A1A1AA] hover:bg-[#F0F0F0] dark:hover:bg-[#18181E] hover:text-[#1A1A1A] dark:hover:text-[#F4F4F5] border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Active Tab Panel */}
          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden cal-scroll p-4 sm:p-6 bg-white dark:bg-[#131317] text-[#1A1A1A] dark:text-[#F4F4F5]">
            {/* ==================== TAB 1: HOLIDAYS & LOCAL ==================== */}
            {tab === 'festivals' && (
              <div className="space-y-5 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#EFEFEF] dark:border-[#24242B]">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
                      Holidays &amp; Indian Festivals
                    </h3>
                    <p className="text-[12px] text-[#737373] dark:text-[#A1A1AA] mt-0.5">
                      Holidays automatically match your local region. Gujarati Tithis and World Calendar Festivals live under World Calendars.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[12px] text-[#525252] dark:text-[#A1A1AA] font-medium">
                      {anyHolidayVisible ? 'Visible' : 'Hidden'}
                    </span>
                    <ToggleSwitch
                      checked={anyHolidayVisible}
                      onChange={onToggleAllCultural}
                      label="Toggle holidays and Indian festivals"
                    />
                  </div>
                </div>

                {/* Holiday Region Picker */}
                <div className="p-3.5 rounded-lg bg-[#FAFAFA] dark:bg-[#1A1A20] border border-[#ECECEC] dark:border-[#27272E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
                      Local Holiday Region
                    </div>
                    <div className="text-[11.5px] text-[#737373] dark:text-[#A1A1AA] mt-0.5">
                      Detected from your device timezone. Switch country/region anytime.
                    </div>
                  </div>
                  <select
                    value={holidayRegion}
                    onChange={(e) => onSetHolidayRegion(e.target.value as HolidayRegionCode)}
                    className="w-full sm:w-auto sm:min-w-[200px] max-w-full bg-white dark:bg-[#131317] border border-[#DCDCDC] dark:border-[#2E2E36] rounded-md px-2.5 py-1.5 text-[12.5px] text-[#1A1A1A] dark:text-[#F4F4F5] focus:outline-none focus:border-[#3B9AE1] shrink-0"
                  >
                    {HOLIDAY_REGIONS.map((reg) => (
                      <option key={reg.code} value={reg.code}>
                        {reg.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ONLY Holidays & Indian Festivals */}
                <div className="divide-y divide-[#F2F2F2] dark:divide-[#24242B]">
                  {holidayAndIndianLayers.map((layer) => {
                    const theme = COLOR_THEMES[layer.color] || COLOR_THEMES.crimson;
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
                            <div className="text-[13px] font-medium text-[#1A1A1A] dark:text-[#F4F4F5]">
                              {layer.id === 'national-holidays'
                                ? `Local Holidays (${getRegionLabel(holidayRegion)})`
                                : layer.name}
                            </div>
                            {layer.description && (
                              <div className="text-[11.5px] text-[#7A7A7A] dark:text-[#A1A1AA] mt-0.5 leading-snug">
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
                </div>

                {/* Local Personal & Custom Calendar Categories */}
                <div className="pt-4 border-t border-[#EFEFEF] dark:border-[#24242B] space-y-2">
                  <h4 className="text-[12.5px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
                    My Local Calendars ({localLayers.length})
                  </h4>
                  <p className="text-[11.5px] text-[#7A7A7A] dark:text-[#A1A1AA]">
                    Stored privately on this device. Enable any personal category when you need it.
                  </p>
                  <div className="divide-y divide-[#F2F2F2] dark:divide-[#24242B]">
                    {localLayers.map((layer) => {
                      const theme = COLOR_THEMES[layer.color] || COLOR_THEMES.blue;
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
                            <span className="text-[12.5px] font-medium text-[#1A1A1A] dark:text-[#F4F4F5]">
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

            {/* ==================== TAB 2: WORLD CALENDARS ==================== */}
            {tab === 'world' && (
              <div className="space-y-4 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#EFEFEF] dark:border-[#24242B]">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
                      World Calendars ({enabledWorldCalendars.length} / {WORLD_CALENDAR_SYSTEMS.length} active)
                    </h3>
                    <p className="text-[12px] text-[#737373] dark:text-[#A1A1AA] mt-0.5 leading-relaxed">
                      Live conversion for{' '}
                      <span className="font-medium text-[#1A1A1A] dark:text-[#F4F4F5]">
                        {MONTH_NAMES[anchorDate.getMonth()]} {anchorDate.getDate()},{' '}
                        {anchorDate.getFullYear()}
                      </span>
                      . Includes World Calendar Festivals and International Days.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEnableAllWorldCalendars(true)}
                      className="px-2.5 py-1.5 rounded-md border border-[#E2E2E2] dark:border-[#2E2E36] bg-white dark:bg-[#1C1C22] text-[11.5px] font-medium text-[#3A3A3A] dark:text-[#E4E4E7] hover:bg-[#F5F5F5] dark:hover:bg-[#26262F] cursor-pointer transition-colors"
                    >
                      Enable all
                    </button>
                    <button
                      type="button"
                      onClick={() => onEnableAllWorldCalendars(false)}
                      className="px-2.5 py-1.5 rounded-md border border-[#E2E2E2] dark:border-[#2E2E36] bg-white dark:bg-[#1C1C22] text-[11.5px] font-medium text-[#3A3A3A] dark:text-[#E4E4E7] hover:bg-[#F5F5F5] dark:hover:bg-[#26262F] cursor-pointer transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                {/* World Calendar Festival & Tithi Overlays */}
                <div className="border border-[#ECECEC] dark:border-[#27272E] rounded-lg divide-y divide-[#F2F2F2] dark:divide-[#24242B] bg-[#FAFAFA] dark:bg-[#1A1A20] px-3.5">
                  {worldOverlayLayers.map((layer) => {
                    const theme = COLOR_THEMES[layer.color] || COLOR_THEMES.teal;
                    return (
                      <div
                        key={layer.id}
                        className="py-2.5 flex items-center justify-between gap-3 min-w-0"
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <span
                            className="w-3 h-3 rounded-[3px] mt-1 shrink-0"
                            style={{ backgroundColor: theme.dot }}
                          />
                          <div className="min-w-0">
                            <div className="text-[12.5px] font-medium text-[#1A1A1A] dark:text-[#F4F4F5]">
                              {layer.name}
                            </div>
                            {layer.description && (
                              <div className="text-[11px] text-[#737373] dark:text-[#A1A1AA] leading-snug">
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
                </div>

                {/* Primary & Sub-header Calendar Selectors (Aligned baseline & full width) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAFAFA] dark:bg-[#1A1A20] border border-[#ECECEC] dark:border-[#27272E] rounded-lg p-3.5">
                  <div className="flex flex-col justify-between gap-2 min-w-0">
                    <div className="min-w-0">
                      <label
                        htmlFor="primary-calendar-select"
                        className="block text-[12.5px] font-medium text-[#1A1A1A] dark:text-[#F4F4F5]"
                      >
                        Primary calendar system
                      </label>
                      <p className="text-[11px] text-[#7A7A7A] dark:text-[#A1A1AA] mt-0.5 leading-snug">
                        Reference calendar used for header &amp; date conversions.
                      </p>
                    </div>
                    <select
                      id="primary-calendar-select"
                      value={primaryCalendar}
                      onChange={(e) =>
                        onSetPrimaryCalendar(e.target.value as WorldCalendarSystemId)
                      }
                      className="w-full min-w-0 bg-white dark:bg-[#131317] border border-[#DCDCDC] dark:border-[#2E2E36] rounded-md px-2.5 py-2 text-[12px] text-[#1A1A1A] dark:text-[#F4F4F5] focus:outline-none focus:border-[#3B9AE1]"
                    >
                      <option value="gregorian">Gregorian (Standard International)</option>
                      {WORLD_CALENDAR_SYSTEMS.filter((s) => s.id !== 'gregorian').map((sys) => (
                        <option key={sys.id} value={sys.id}>
                          {sys.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col justify-between gap-2 min-w-0">
                    <div className="min-w-0">
                      <label
                        htmlFor="subheader-calendar-select"
                        className="block text-[12.5px] font-medium text-[#1A1A1A] dark:text-[#F4F4F5]"
                      >
                        Day column sub-header calendar
                      </label>
                      <p className="text-[11px] text-[#7A7A7A] dark:text-[#A1A1AA] mt-0.5 leading-snug">
                        Optional secondary date shown on calendar headers.
                      </p>
                    </div>
                    <select
                      id="subheader-calendar-select"
                      value={headerSubCalendar}
                      onChange={(e) =>
                        onSetHeaderSubCalendar(
                          e.target.value as WorldCalendarSystemId | 'none'
                        )
                      }
                      className="w-full min-w-0 bg-white dark:bg-[#131317] border border-[#DCDCDC] dark:border-[#2E2E36] rounded-md px-2.5 py-2 text-[12px] text-[#1A1A1A] dark:text-[#F4F4F5] focus:outline-none focus:border-[#3B9AE1]"
                    >
                      <option value="none">None (Clean Gregorian only)</option>
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
                  placeholder={`Filter all ${WORLD_CALENDAR_SYSTEMS.length} world calendars (e.g. Gujarati, Islamic, Hebrew, Chinese, ISO Week...)`}
                  className="w-full min-w-0 bg-white dark:bg-[#1A1A20] border border-[#E2E2E2] dark:border-[#2E2E36] rounded-md px-3 py-2 text-[12.5px] text-[#1A1A1A] dark:text-[#F4F4F5] placeholder:text-[#A3A3A3] dark:placeholder:text-[#71717A] focus:outline-none focus:border-[#3B9AE1]"
                />

                {/* Grouped World Calendar Toggles */}
                {WORLD_CALENDAR_GROUPS.map((grp) => {
                  const items = worldConversions.filter((c) => c.meta.group === grp.id);
                  if (items.length === 0) return null;
                  return (
                    <div key={grp.id} className="space-y-1.5">
                      <h4 className="text-[11.5px] font-semibold text-[#737373] dark:text-[#A1A1AA] pt-1">
                        {grp.label} ({items.length})
                      </h4>
                      <div className="divide-y divide-[#F2F2F2] dark:divide-[#24242B] border border-[#EFEFEF] dark:border-[#27272E] rounded-lg px-3">
                        {items.map(({ meta, val }) => (
                          <div
                            key={meta.id}
                            className="py-2.5 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[12.5px] font-medium text-[#1A1A1A] dark:text-[#F4F4F5] truncate">
                                  {meta.name}
                                </span>
                                <a
                                  href={meta.wikiUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`Reference: ${meta.name}`}
                                  className="text-[#A3A3A3] dark:text-[#71717A] hover:text-[#1A1A1A] dark:hover:text-white shrink-0"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                              <div
                                className={`text-[11.5px] text-[#525252] dark:text-[#A1A1AA] mt-0.5 tabular-nums truncate ${
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

                <div className="pt-3 border-t border-[#EFEFEF] dark:border-[#24242B]">
                  <div className="text-[11.5px] font-semibold text-[#737373] dark:text-[#A1A1AA] mb-2">
                    Reference Links
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px]">
                    {MASTER_REFERENCE_LINKS.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#185D8F] dark:text-[#60A5FA] hover:underline"
                      >
                        <span>{link.label}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB 3: DISPLAY, TIMEZONES & WEATHER ==================== */}
            {tab === 'display' && (
              <div className="space-y-6">
                {/* Global Appearance / Dark Mode Toggle */}
                <div className="space-y-3">
                  <div className="pb-3 border-b border-[#EFEFEF] dark:border-[#24242B]">
                    <h3 className="text-[14px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
                      Appearance
                    </h3>
                    <p className="text-[12px] text-[#737373] dark:text-[#A1A1AA] mt-0.5">
                      Choose between light and dark workspace themes. Saved automatically on this device.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAFAFA] dark:bg-[#1A1A20] border border-[#ECECEC] dark:border-[#27272E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white dark:bg-[#111114] border border-[#E6E6E6] dark:border-[#2E2E36] flex items-center justify-center shrink-0">
                        {darkMode ? (
                          <Moon className="w-4 h-4 text-[#F4F4F5]" />
                        ) : (
                          <Sun className="w-4 h-4 text-[#D97706]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
                          Global Dark Mode
                        </div>
                        <div className="text-[11.5px] text-[#737373] dark:text-[#A1A1AA]">
                          {darkMode
                            ? 'Obsidian dark canvas active across the workspace.'
                            : 'Bright studio canvas active across the workspace.'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[12px] font-medium text-[#525252] dark:text-[#A1A1AA]">
                        {darkMode ? 'Dark' : 'Light'}
                      </span>
                      <ToggleSwitch
                        checked={darkMode}
                        onChange={onToggleDarkMode}
                        label="Toggle global dark mode"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-[#EFEFEF] dark:border-[#24242B]">
                  <div className="pb-3 border-b border-[#EFEFEF] dark:border-[#24242B]">
                    <h3 className="text-[14px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
                      Dual Timezone Columns
                    </h3>
                    <p className="text-[12px] text-[#737373] dark:text-[#A1A1AA] mt-0.5">
                      Primary timezone defaults automatically to your current device location.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="flex flex-col justify-between gap-1.5 min-w-0">
                      <label className="block text-[12px] font-medium text-[#4A4A4A] dark:text-[#D4D4D8]">
                        Primary timezone (local)
                      </label>
                      <select
                        value={primaryTz.id}
                        onChange={(e) => {
                          const found = allTimezoneOptions.find(
                            (t) => t.id === e.target.value
                          );
                          if (found) onSetPrimaryTz(found);
                        }}
                        className="w-full min-w-0 bg-white dark:bg-[#1A1A20] border border-[#DCDCDC] dark:border-[#2E2E36] rounded-md px-3 py-2 text-[12.5px] text-[#1A1A1A] dark:text-[#F4F4F5] focus:outline-none focus:border-[#3B9AE1]"
                      >
                        {allTimezoneOptions.map((tz) => (
                          <option key={tz.id} value={tz.id}>
                            {tz.abbr} — {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col justify-between gap-1.5 min-w-0">
                      <label className="block text-[12px] font-medium text-[#4A4A4A] dark:text-[#D4D4D8]">
                        Secondary timezone (comparison)
                      </label>
                      <select
                        value={secondaryTz.id}
                        onChange={(e) => {
                          const found = allTimezoneOptions.find(
                            (t) => t.id === e.target.value
                          );
                          if (found) onSetSecondaryTz(found);
                        }}
                        className="w-full min-w-0 bg-white dark:bg-[#1A1A20] border border-[#DCDCDC] dark:border-[#2E2E36] rounded-md px-3 py-2 text-[12.5px] text-[#1A1A1A] dark:text-[#F4F4F5] focus:outline-none focus:border-[#3B9AE1]"
                      >
                        {allTimezoneOptions.map((tz) => (
                          <option key={tz.id} value={tz.id}>
                            {tz.abbr} — {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Weather Location & Units */}
                <div className="space-y-3 pt-4 border-t border-[#EFEFEF] dark:border-[#24242B]">
                  <div className="flex items-center gap-2">
                    <CloudSun className="w-4 h-4 text-[#D98E04] shrink-0" />
                    <h3 className="text-[14px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
                      Weather Forecast Location
                    </h3>
                  </div>
                  <p className="text-[12px] text-[#737373] dark:text-[#A1A1AA]">
                    Set your city or use browser geolocation for the Weather &amp; Time panel.
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
                      placeholder="City or region (e.g. London, New York, Mumbai)"
                      className="flex-1 min-w-0 bg-white dark:bg-[#1A1A20] border border-[#DCDCDC] dark:border-[#2E2E36] rounded-md px-3 py-2 text-[12.5px] text-[#1A1A1A] dark:text-[#F4F4F5] placeholder:text-[#A3A3A3] dark:placeholder:text-[#71717A] focus:outline-none focus:border-[#3B9AE1]"
                    />
                    <button
                      type="submit"
                      disabled={!cityDraft.trim()}
                      className="px-4 py-2 rounded-md bg-[#1A1A1A] dark:bg-[#F4F4F5] hover:bg-[#333333] dark:hover:bg-white disabled:opacity-40 text-white dark:text-[#09090B] text-[12.5px] font-medium cursor-pointer shrink-0 transition-colors"
                    >
                      Update location
                    </button>
                  </form>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={onUseWeatherGeolocation}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#DCDCDC] dark:border-[#2E2E36] bg-white dark:bg-[#1C1C22] hover:bg-[#F5F5F5] dark:hover:bg-[#26262F] text-[12px] font-medium text-[#1A1A1A] dark:text-[#F4F4F5] cursor-pointer transition-colors"
                    >
                      <LocateFixed className="w-3.5 h-3.5 text-[#185D8F] dark:text-[#60A5FA]" />
                      <span>Use my current GPS location</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#666666] dark:text-[#A1A1AA]">Temperature unit:</span>
                      <div className="inline-flex rounded-md border border-[#DCDCDC] dark:border-[#2E2E36] overflow-hidden text-[12px] font-medium">
                        <button
                          type="button"
                          onClick={() => onSetWeatherUnits('METRIC')}
                          className={`px-3 py-1 cursor-pointer transition-colors ${
                            weatherUnits === 'METRIC'
                              ? 'bg-[#1A1A1A] dark:bg-[#F4F4F5] text-white dark:text-[#09090B]'
                              : 'bg-white dark:bg-[#1C1C22] text-[#525252] dark:text-[#A1A1AA] hover:bg-[#F5F5F5] dark:hover:bg-[#26262F]'
                          }`}
                        >
                          °C
                        </button>
                        <button
                          type="button"
                          onClick={() => onSetWeatherUnits('IMPERIAL')}
                          className={`px-3 py-1 cursor-pointer transition-colors ${
                            weatherUnits === 'IMPERIAL'
                              ? 'bg-[#1A1A1A] dark:bg-[#F4F4F5] text-white dark:text-[#09090B]'
                              : 'bg-white dark:bg-[#1C1C22] text-[#525252] dark:text-[#A1A1AA] hover:bg-[#F5F5F5] dark:hover:bg-[#26262F]'
                          }`}
                        >
                          °F
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB 4: CALENDAR DATA SYNC (.ICS) ==================== */}
            {tab === 'sync' && (
              <div className="space-y-6">
                <div className="pb-3 border-b border-[#EFEFEF] dark:border-[#24242B]">
                  <h3 className="text-[14px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
                    Calendar Data Synchronization (.ics)
                  </h3>
                  <p className="text-[12px] text-[#737373] dark:text-[#A1A1AA] mt-0.5">
                    Export your schedule to an industry-standard iCalendar (.ics) file or import events from Apple Calendar, Outlook, or Google Calendar.
                  </p>
                </div>

                {/* Export Section */}
                <div className="p-4 rounded-xl border border-[#EAEAEA] dark:border-[#27272E] bg-[#FAFAFA] dark:bg-[#1A1A20] space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-[#1A1A1A] dark:text-[#F4F4F5] shrink-0" />
                      <h4 className="text-[13px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
                        Export to .ics File
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedExportLayers(new Set(exportableLayers.map((l) => l.id)))
                        }
                        className="text-[#4A4A4A] dark:text-[#A1A1AA] hover:text-[#1A1A1A] dark:hover:text-white underline cursor-pointer"
                      >
                        Select all
                      </button>
                      <span className="text-[#CCCCCC] dark:text-[#52525B]">·</span>
                      <button
                        type="button"
                        onClick={() => setSelectedExportLayers(new Set())}
                        className="text-[#4A4A4A] dark:text-[#A1A1AA] hover:text-[#1A1A1A] dark:hover:text-white underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {exportableLayers.map((layer) => {
                      const checked = selectedExportLayers.has(layer.id);
                      const theme = COLOR_THEMES[layer.color] || COLOR_THEMES.blue;
                      return (
                        <button
                          key={layer.id}
                          type="button"
                          onClick={() => {
                            setSelectedExportLayers((prev) => {
                              const next = new Set(prev);
                              if (next.has(layer.id)) next.delete(layer.id);
                              else next.add(layer.id);
                              return next;
                            });
                          }}
                          className={`px-2.5 py-1 rounded-md border text-[11.5px] font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                            checked
                              ? 'bg-white dark:bg-[#24242C] border-[#1A1A1A] dark:border-[#F4F4F5] text-[#1A1A1A] dark:text-[#F4F4F5]'
                              : 'bg-transparent border-[#DCDCDC] dark:border-[#2E2E36] text-[#737373] dark:text-[#A1A1AA]'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-xs shrink-0"
                            style={{ backgroundColor: layer.customHex || theme.dot }}
                          />
                          <span>{layer.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <span className="text-[11.5px] text-[#666666] dark:text-[#A1A1AA] tabular-nums">
                      {selectedExportLayers.size === 0
                        ? 'Select at least one calendar to export'
                        : `${eventsToExport.length} event${eventsToExport.length === 1 ? '' : 's'} ready to export`}
                    </span>
                    <button
                      type="button"
                      disabled={selectedExportLayers.size === 0}
                      onClick={handleDownloadIcs}
                      className="px-4 py-2 rounded-lg bg-[#1A1A1A] dark:bg-[#F4F4F5] hover:bg-[#333333] dark:hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-white dark:text-[#09090B] text-[12.5px] font-medium inline-flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      {exportSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Downloaded .ics</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download .ics File</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Import Section */}
                <div className="p-4 rounded-xl border border-[#EAEAEA] dark:border-[#27272E] bg-white dark:bg-[#1A1A20] space-y-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-[#1A1A1A] dark:text-[#F4F4F5]" />
                    <h4 className="text-[13px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
                      Import .ics Calendar File
                    </h4>
                  </div>
                  <p className="text-[12px] text-[#737373] dark:text-[#A1A1AA]">
                    Imported events are saved locally on this device inside your Personal Events calendar.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".ics,text/calendar"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-6 border border-dashed border-[#D0D0D0] dark:border-[#3A3A44] hover:border-[#1A1A1A] dark:hover:border-[#F4F4F5] hover:bg-[#FAFAFA] dark:hover:bg-[#22222A] rounded-lg flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-5 h-5 text-[#737373] dark:text-[#A1A1AA]" />
                    <span className="text-[12.5px] font-medium text-[#1A1A1A] dark:text-[#F4F4F5]">
                      Click to choose a .ics file from your device
                    </span>
                    <span className="text-[11px] text-[#8C8C8C] dark:text-[#71717A]">
                      Supports Apple Calendar, Google Calendar &amp; Outlook exports
                    </span>
                  </button>

                  {importStatus && (
                    <div
                      className={`p-2.5 rounded-lg text-[12px] flex items-center gap-2 ${
                        importStatus.type === 'success'
                          ? 'bg-[#E6F4EA] dark:bg-emerald-950/60 text-[#1E7E34] dark:text-emerald-300 border border-[#B7DFC2] dark:border-emerald-800/60'
                          : 'bg-[#FDE2E4] dark:bg-red-950/60 text-[#8A1520] dark:text-red-300 border border-[#F5B7BC] dark:border-red-800/60'
                      }`}
                    >
                      {importStatus.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{importStatus.message}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== TAB 5: KEYBOARD SHORTCUTS ==================== */}
            {tab === 'shortcuts' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#EFEFEF] dark:border-[#24242B]">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
                      Keyboard Shortcuts
                    </h3>
                    <p className="text-[12px] text-[#737373] dark:text-[#A1A1AA] mt-0.5">
                      Navigate dates, switch views, and create events without leaving your keyboard.
                    </p>
                  </div>

                  <div className="inline-flex rounded-md border border-[#DCDCDC] dark:border-[#2E2E36] overflow-hidden text-[11.5px] font-medium">
                    <button
                      type="button"
                      onClick={() => setShortcutOs('mac')}
                      className={`px-2.5 py-1 cursor-pointer transition-colors ${
                        shortcutOs === 'mac'
                          ? 'bg-[#1A1A1A] dark:bg-[#F4F4F5] text-white dark:text-[#09090B]'
                          : 'bg-white dark:bg-[#1C1C22] text-[#525252] dark:text-[#A1A1AA] hover:bg-[#F5F5F5] dark:hover:bg-[#26262F]'
                      }`}
                    >
                      macOS
                    </button>
                    <button
                      type="button"
                      onClick={() => setShortcutOs('win')}
                      className={`px-2.5 py-1 cursor-pointer transition-colors ${
                        shortcutOs === 'win'
                          ? 'bg-[#1A1A1A] dark:bg-[#F4F4F5] text-white dark:text-[#09090B]'
                          : 'bg-white dark:bg-[#1C1C22] text-[#525252] dark:text-[#A1A1AA] hover:bg-[#F5F5F5] dark:hover:bg-[#26262F]'
                      }`}
                    >
                      Windows
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#9A9A9A] dark:text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={shortcutFilter}
                    onChange={(e) => setShortcutFilter(e.target.value)}
                    placeholder="Filter shortcuts..."
                    className="w-full bg-white dark:bg-[#1A1A20] border border-[#E2E2E2] dark:border-[#2E2E36] rounded-md pl-8 pr-3 py-1.5 text-[12.5px] text-[#1A1A1A] dark:text-[#F4F4F5] placeholder:text-[#A3A3A3] dark:placeholder:text-[#71717A] focus:outline-none focus:border-[#3B9AE1]"
                  />
                </div>

                <div className="space-y-4">
                  {SHORTCUT_CATEGORIES.map((cat) => {
                    const filtered = cat.items.filter(
                      (item) =>
                        !shortcutFilter.trim() ||
                        item.desc.toLowerCase().includes(shortcutFilter.toLowerCase()) ||
                        item.keys.join(' ').toLowerCase().includes(shortcutFilter.toLowerCase())
                    );
                    if (filtered.length === 0) return null;
                    return (
                      <div key={cat.name} className="space-y-1.5">
                        <h4 className="text-[11.5px] font-semibold text-[#737373] dark:text-[#A1A1AA]">
                          {cat.name}
                        </h4>
                        <div className="border border-[#EFEFEF] dark:border-[#27272E] rounded-lg divide-y divide-[#F4F4F4] dark:divide-[#24242B]">
                          {filtered.map((item, idx) => (
                            <div
                              key={idx}
                              className="px-3 py-2 flex items-center justify-between gap-3 text-[12.5px]"
                            >
                              <span className="text-[#262626] dark:text-[#E4E4E7]">{item.desc}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                {item.keys.map((k, ki) =>
                                  k === 'or' ? (
                                    <span key={ki} className="text-[11px] text-[#9A9A9A] dark:text-[#71717A] px-0.5">
                                      or
                                    </span>
                                  ) : (
                                    <kbd
                                      key={ki}
                                      className="px-1.5 py-0.5 text-[11px] font-mono font-medium bg-[#F5F5F5] dark:bg-[#1E1E26] border border-[#DFDFDF] dark:border-[#32323B] rounded text-[#1A1A1A] dark:text-[#F4F4F5]"
                                    >
                                      {formatShortcutKey(k)}
                                    </kbd>
                                  )
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ==================== TAB 6: GOOGLE CALENDAR ==================== */}
            {tab === 'google' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#EFEFEF] dark:border-[#24242B]">
                  <h3 className="text-[14px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
                    Google Calendar Sync
                  </h3>
                  <p className="text-[12px] text-[#737373] dark:text-[#A1A1AA] mt-0.5 leading-relaxed">
                    Connect Google Calendar to view or edit events with explicit confirmation before any change. Synced calendars stay unchecked until you enable them.
                  </p>
                </div>

                {googleError && (
                  <div className="rounded-md bg-[#FDE2E4] dark:bg-red-950/60 border border-[#F5B7BC] dark:border-red-800/60 px-3 py-2 text-[12px] text-[#8A1520] dark:text-red-300">
                    {googleError}
                  </div>
                )}

                {!googleUser ? (
                  <div className="rounded-lg border border-[#EAEAEA] dark:border-[#27272E] bg-[#FAFAFA] dark:bg-[#1A1A20] p-4 space-y-3">
                    <div className="text-[12.5px] text-[#454545] dark:text-[#D4D4D8] leading-relaxed">
                      Sign in with Google to link your calendars while keeping your local holiday view clean.
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
                    <div className="rounded-lg border border-[#E6E6E6] dark:border-[#27272E] bg-[#FAFAFA] dark:bg-[#1A1A20] p-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {googleUser.photoURL ? (
                          <img
                            src={googleUser.photoURL}
                            alt={googleUser.displayName || 'Google account'}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full border border-[#E2E2E2] dark:border-[#32323B] shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#1A1A1A] dark:bg-[#F4F4F5] text-white dark:text-[#09090B] text-[13px] font-semibold flex items-center justify-center shrink-0">
                            {(googleUser.email || 'G')[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5] truncate">
                            {googleUser.displayName || 'Google Account'}
                          </div>
                          <div className="text-[11.5px] text-[#666666] dark:text-[#A1A1AA] truncate">
                            {googleUser.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={onGoogleSync}
                          disabled={googleSyncing}
                          className="px-2.5 py-1.5 rounded-md border border-[#DCDCDC] dark:border-[#2E2E36] bg-white dark:bg-[#1C1C22] hover:bg-[#F3F3F3] dark:hover:bg-[#26262F] text-[12px] font-medium text-[#1A1A1A] dark:text-[#F4F4F5] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${googleSyncing ? 'animate-spin' : ''}`} />
                          <span>{googleSyncing ? 'Syncing' : 'Sync now'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={onGoogleLogout}
                          className="px-2.5 py-1.5 rounded-md border border-[#DCDCDC] dark:border-[#2E2E36] bg-white dark:bg-[#1C1C22] hover:bg-[#FDE2E4] dark:hover:bg-red-950/60 hover:border-[#F5B7BC] dark:hover:border-red-800/60 hover:text-[#8A1520] dark:hover:text-red-300 text-[12px] font-medium text-[#525252] dark:text-[#A1A1AA] inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Disconnect</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[12px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
                        Synced Google Calendars ({googleLayers.length})
                      </div>
                      {googleLayers.length === 0 ? (
                        <p className="text-[12px] text-[#7A7A7A] dark:text-[#A1A1AA]">
                          No Google calendars loaded yet. Click Sync now to refresh.
                        </p>
                      ) : (
                        <div className="divide-y divide-[#F2F2F2] dark:divide-[#24242B] border border-[#EFEFEF] dark:border-[#27272E] rounded-lg px-3">
                          {googleLayers.map((cal) => {
                            const theme = COLOR_THEMES[cal.color] || COLOR_THEMES.blue;
                            return (
                              <div
                                key={cal.id}
                                className="py-2.5 flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span
                                    className="w-3 h-3 rounded-[3px] shrink-0"
                                    style={{ backgroundColor: cal.customHex || theme.dot }}
                                  />
                                  <span className="text-[12.5px] font-medium text-[#1A1A1A] dark:text-[#F4F4F5] truncate">
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

            {/* ==================== TAB 7: LANGUAGE ==================== */}
            {tab === 'language' && (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#EFEFEF] dark:border-[#24242B]">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
                      Language &amp; Localization
                    </h3>
                    <p className="text-[12px] text-[#737373] dark:text-[#A1A1AA] mt-0.5">
                      Choose your preferred interface language.
                    </p>
                  </div>
                  <span className="text-[11.5px] font-medium text-[#185D8F] dark:text-[#60A5FA] shrink-0">
                    {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.nativeName || 'English'}
                  </span>
                </div>

                <input
                  type="text"
                  placeholder="Search supported languages..."
                  value={langFilter}
                  onChange={(e) => setLangFilter(e.target.value)}
                  className="w-full bg-white dark:bg-[#1A1A20] border border-[#DCDCDC] dark:border-[#2E2E36] rounded-md px-3 py-1.5 text-[12px] text-[#1A1A1A] dark:text-[#F4F4F5] placeholder:text-[#A3A3A3] dark:placeholder:text-[#71717A] focus:outline-none focus:border-[#185D8F]"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[340px] overflow-y-auto cal-scroll pr-1">
                  {SUPPORTED_LANGUAGES.filter(
                    (l) =>
                      !langFilter ||
                      l.name.toLowerCase().includes(langFilter.toLowerCase()) ||
                      l.nativeName.toLowerCase().includes(langFilter.toLowerCase()) ||
                      l.region.toLowerCase().includes(langFilter.toLowerCase())
                  ).map((lang) => {
                    const isSelected = selectedLanguage === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => onSelectLanguage?.(lang.code)}
                        className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-[#F0F9FF] dark:bg-sky-950/40 border-[#0284C7] dark:border-sky-500/70'
                            : 'bg-white dark:bg-[#1A1A20] border-[#E5E7EB] dark:border-[#27272E] hover:bg-[#F9FAFB] dark:hover:bg-[#22222A]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-[12.5px] font-semibold text-[#111827] dark:text-[#F4F4F5] truncate">
                            {lang.nativeName}{' '}
                            <span className="text-[11px] font-normal text-[#6B7280] dark:text-[#A1A1AA]">
                              ({lang.name})
                            </span>
                          </div>
                          <div className="text-[10.5px] text-[#6B7280] dark:text-[#71717A] truncate">
                            {lang.region}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#0284C7] dark:text-sky-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ==================== TAB 8: APPS & WIDGETS ==================== */}
            {tab === 'apps' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#EFEFEF] dark:border-[#24242B]">
                  <h3 className="text-[14px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
                    Desktop &amp; Mobile Apps + Widgets
                  </h3>
                  <p className="text-[12px] text-[#737373] dark:text-[#A1A1AA] mt-0.5">
                    Install calendar.q directly on your Mac, Windows PC, Linux desktop, iPhone, or Android phone, and launch standalone desktop or mobile widgets.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl border border-[#E5E5E5] dark:border-[#27272E] bg-[#FAFAFA] dark:bg-[#1A1A20] space-y-2">
                    <Monitor className="w-5 h-5 text-[#1A1A1A] dark:text-[#F4F4F5]" />
                    <div className="text-[13px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
                      Desktop App &amp; Widget
                    </div>
                    <p className="text-[11.5px] text-[#666666] dark:text-[#A1A1AA] leading-relaxed">
                      Native PWA window, OS app launchers (macOS, Windows, Linux), and a standalone live desktop widget.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-[#E5E5E5] dark:border-[#27272E] bg-[#FAFAFA] dark:bg-[#1A1A20] space-y-2">
                    <Smartphone className="w-5 h-5 text-[#1A1A1A] dark:text-[#F4F4F5]" />
                    <div className="text-[13px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
                      Mobile App &amp; Home Widget
                    </div>
                    <p className="text-[11.5px] text-[#666666] dark:text-[#A1A1AA] leading-relaxed">
                      Installable offline-ready iOS &amp; Android app with compact 2×2, 4×2, and 4×4 live mobile widgets.
                    </p>
                  </div>
                </div>

                {onOpenDownloadHub && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDownloadHub();
                    }}
                    className="px-4 py-2.5 rounded-lg bg-[#1A1A1A] dark:bg-[#F4F4F5] hover:bg-[#333333] dark:hover:bg-white text-white dark:text-[#09090B] text-[12.5px] font-medium inline-flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Open Device Download &amp; Widget Hub</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
