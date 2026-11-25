import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Bell,
  Calendar as CalendarIcon,
  CalendarPlus,
  Check,
  CheckSquare,
  Clock,
  Clock3,
  Compass,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  HelpCircle,
  MapPin,
  Moon,
  Pause,
  Play,
  Plus,
  Repeat,
  Search,
  SlidersHorizontal,
  Sparkles,
  Square,
  Star,
  Sun,
  Sunrise,
  Sunset,
  Telescope,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import {
  AvailabilitySlot,
  CalendarEvent,
  CalendarLayer,
  CalendarTask,
  EventAttendee,
  EventCategory,
  EventRecurrence,
  EventReminder,
  FestivalItem,
  GoogleUserProfile,
  GujaratiPanchang,
  TimezoneOption,
  UserAccount,
  WorldCalendarSystemId,
} from '../types/calendar';
import { WeatherWidget } from './WeatherWidget';
import { WeatherBundle, WeatherUnits } from '../services/weatherService';
import { getAllFestivalsForYear, getFestivalsForDate } from '../data/festivalsAndDays';
import { getGujaratiPanchang } from '../data/gujaratiPanchang';
import {
  WORLD_CALENDAR_SYSTEMS,
  convertCalendarDate,
  convertToWorldCalendar,
  getWorldCalendarsForDate,
} from '../data/worldCalendars';
import {
  WorldCity,
  PRESET_WORLD_CITIES,
  getCityTimeInfo,
  calculateMeetingOverlap,
} from '../services/worldTimeService';
import {
  getDetailedMoon,
  getSolarAlmanac,
  ECLIPSE_CATALOG,
  ANNUAL_METEOR_SHOWERS,
  PLANETARY_EVENTS,
} from '../services/astronomyService';
import {
  TimeEntry,
  TrackingCategory,
  CATEGORY_META,
  loadTimeEntries,
  saveTimeEntries,
  startLiveTimer,
  stopLiveTimer,
  addManualTimeEntry,
  deleteTimeEntry,
  computeTimeAnalytics,
  exportTimeCsv,
} from '../services/timeTrackingService';
import {
  COLOR_THEMES,
  DAY_NAMES_FULL,
  DAY_NAMES_SHORT,
  MONTH_NAMES,
  formatDateKey,
  formatTimeRange,
  parseDateKey,
} from '../utils/dateUtils';
import { SettingsTab } from './SettingsModal';

export type RightSelection =
  | { kind: 'none' }
  | { kind: 'event'; eventId: string }
  | { kind: 'festival'; festival: FestivalItem; panchang: GujaratiPanchang }
  | { kind: 'panchang'; date: Date; panchang: GujaratiPanchang };

interface RightPanelProps {
  today: Date;
  anchorDate: Date;
  events: CalendarEvent[];
  layers: CalendarLayer[];
  visibleLayerIds: Set<string>;
  showGujaratiCalendar: boolean;
  anyCulturalVisible: boolean;
  gujaratiScript: boolean;
  enabledWorldCalendars: WorldCalendarSystemId[];
  primaryTz: TimezoneOption;
  secondaryTz?: TimezoneOption;
  googleUser: GoogleUserProfile | null;
  selection: RightSelection;
  shareMode: boolean;
  availabilitySlots: AvailabilitySlot[];
  meetInputRef: React.RefObject<HTMLInputElement | null>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onClearSelection: () => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectFestival: (festival: FestivalItem, panchang: GujaratiPanchang) => void;
  onUpdateLocalEvent: (event: CalendarEvent) => void;
  onRequestSaveGoogleEvent: (event: CalendarEvent, isNewOnGoogle: boolean) => void;
  onDeleteEvent: (event: CalendarEvent) => void;
  onDuplicateEvent: (event: CalendarEvent) => void;
  onQuickCreateMeeting: (title: string) => void;
  onScheduleOnDate: (dateKey: string, suggestedTitle?: string) => void;
  onToggleShareMode: () => void;
  onRemoveAvailabilitySlot: (slotId: string) => void;
  onClearAvailabilitySlots: () => void;
  onJumpToDate: (date: Date) => void;
  onOpenCommandMenu: () => void;
  onOpenGoToDate: () => void;
  onOpenShortcuts: () => void;
  onOpenSettings: (tab?: SettingsTab) => void;
  onToggleAllCultural: () => void;
  onToggleGujaratiLayer: () => void;
  isDrawer?: boolean;
  onClosePanel?: () => void;
  currentUser?: UserAccount | null;
  onOpenAuth?: () => void;
  onOpenExport?: () => void;
  weatherData?: WeatherBundle | null;
  weatherLoading?: boolean;
  weatherError?: string | null;
  weatherUnits?: WeatherUnits;
  weatherLocationQuery?: string;
  onChangeWeatherUnits?: (units: WeatherUnits) => void;
  onSearchWeatherCity?: (cityQuery: string) => void;
  onUseWeatherGeolocation?: () => void;
  onRefreshWeather?: () => void;
}

const EVENT_CATEGORIES: Array<{ id: EventCategory; label: string }> = [
  { id: 'event', label: 'General Event' },
  { id: 'birthday', label: 'Birthday' },
  { id: 'memorial', label: 'Memorial / Funeral Date' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'plan', label: 'Plan / Milestone' },
];

function minutesToTimeInput(mins: number): string {
  const clamped = Math.max(0, Math.min(1439, mins));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeInputToMinutes(val: string): number {
  const [h, m] = val.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 540;
  return Math.max(0, Math.min(1440, h * 60 + m));
}

function getDayOfYear(date: Date): { day: number; total: number } {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const day = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  const isLeap =
    (date.getFullYear() % 4 === 0 && date.getFullYear() % 100 !== 0) ||
    date.getFullYear() % 400 === 0;
  return { day, total: isLeap ? 366 : 365 };
}

function getIsoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getApproximateSunTimes(date: Date): { sunrise: string; sunset: string } {
  const d = date.getMonth();
  const sunriseMinutes = 360 + Math.round(25 * Math.cos((d / 12) * 2 * Math.PI));
  const sunsetMinutes = 1110 - Math.round(35 * Math.cos((d / 12) * 2 * Math.PI));
  const formatM = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const dh = h % 12 || 12;
    return `${dh}:${String(m).padStart(2, '0')} ${ampm}`;
  };
  return { sunrise: formatM(sunriseMinutes), sunset: formatM(sunsetMinutes) };
}

export const RightPanel: React.FC<RightPanelProps> = ({
  today,
  anchorDate,
  events,
  layers,
  visibleLayerIds,
  showGujaratiCalendar,
  anyCulturalVisible,
  gujaratiScript,
  enabledWorldCalendars,
  primaryTz,
  secondaryTz,
  googleUser,
  selection,
  shareMode,
  availabilitySlots,
  meetInputRef,
  searchInputRef,
  onClearSelection,
  onSelectEvent,
  onSelectFestival,
  onUpdateLocalEvent,
  onRequestSaveGoogleEvent,
  onDeleteEvent,
  onDuplicateEvent,
  onQuickCreateMeeting,
  onScheduleOnDate,
  onToggleShareMode,
  onRemoveAvailabilitySlot,
  onClearAvailabilitySlots,
  onJumpToDate,
  onOpenCommandMenu,
  onOpenGoToDate,
  onOpenShortcuts,
  onOpenSettings,
  onToggleAllCultural,
  onToggleGujaratiLayer,
  isDrawer = false,
  onClosePanel,
  currentUser,
  onOpenAuth,
  onOpenExport,
  weatherData,
  weatherLoading,
  weatherError,
  weatherUnits,
  weatherLocationQuery,
  onChangeWeatherUnits,
  onSearchWeatherCity,
  onUseWeatherGeolocation,
  onRefreshWeather,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [meetQuery, setMeetQuery] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [draftEvent, setDraftEvent] = useState<CalendarEvent | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  type IdleTab = 'overview' | 'tasks' | 'worldtime' | 'astro' | 'converter' | 'tracker';
  const [idleTab, setIdleTab] = useState<IdleTab>('overview');

  const [attendeeDraft, setAttendeeDraft] = useState('');

  // ======================== PHASE 4: WORLD TIME DASHBOARD ========================
  const [worldCities, setWorldCities] = useState<WorldCity[]>(() => {
    try {
      const saved = localStorage.getItem('calendar_q_world_cities_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return PRESET_WORLD_CITIES.slice(0, 5);
  });
  const [selectedOverlapCityIds, setSelectedOverlapCityIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('calendar_q_overlap_cities_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['mumbai', 'newyork', 'london'];
  });
  const [selectedAddCityId, setSelectedAddCityId] = useState<string>('');
  const [use24Hour, setUse24Hour] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('calendar_q_world_cities_v2', JSON.stringify(worldCities));
    } catch {}
  }, [worldCities]);

  useEffect(() => {
    try {
      localStorage.setItem('calendar_q_overlap_cities_v2', JSON.stringify(selectedOverlapCityIds));
    } catch {}
  }, [selectedOverlapCityIds]);

  const handleAddWorldCity = (cityId: string) => {
    const found = PRESET_WORLD_CITIES.find((c) => c.id === cityId);
    if (!found || worldCities.some((c) => c.id === cityId)) return;
    setWorldCities((prev) => [...prev, found]);
    setSelectedAddCityId('');
  };

  const handleRemoveWorldCity = (cityId: string) => {
    setWorldCities((prev) => prev.filter((c) => c.id !== cityId));
    setSelectedOverlapCityIds((prev) => prev.filter((id) => id !== cityId));
  };

  const handleToggleOverlapCity = (cityId: string) => {
    setSelectedOverlapCityIds((prev) =>
      prev.includes(cityId) ? prev.filter((id) => id !== cityId) : [...prev, cityId]
    );
  };

  const overlapCities = useMemo(
    () => PRESET_WORLD_CITIES.filter((c) => selectedOverlapCityIds.includes(c.id)),
    [selectedOverlapCityIds]
  );

  const overlapAnalysis = useMemo(
    () => calculateMeetingOverlap(overlapCities),
    [overlapCities]
  );

  // ======================== PHASE 5: ASTRONOMY ENGINE ========================
  const [astroSection, setAstroSection] = useState<'all' | 'moon' | 'solar' | 'eclipses' | 'meteors' | 'planets'>('all');
  const [astroReminders, setAstroReminders] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('calendar_q_astro_reminders_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const toggleAstroReminder = (id: string) => {
    setAstroReminders((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('calendar_q_astro_reminders_v2', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const detailedMoon = useMemo(() => getDetailedMoon(anchorDate), [anchorDate]);
  const solarAlmanac = useMemo(() => getSolarAlmanac(anchorDate), [anchorDate]);

  // ======================== PHASE 7: TIME TRACKING & ANALYTICS ========================
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(() => loadTimeEntries());
  const [trackerActivity, setTrackerActivity] = useState('');
  const [trackerCat, setTrackerCat] = useState<TrackingCategory>('work');
  const [trackerProject, setTrackerProject] = useState('');
  const [, setTimerTick] = useState(0);

  // Live timer interval ticker (updates elapsed duration in real-time)
  useEffect(() => {
    const hasRunning = timeEntries.some((e) => e.isRunning);
    if (!hasRunning) return;
    const interval = setInterval(() => {
      setTimerTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeEntries]);

  const activeTimer = useMemo(() => timeEntries.find((e) => e.isRunning), [timeEntries]);

  const handleStartTimer = () => {
    if (!trackerActivity.trim()) return;
    const updated = startLiveTimer(trackerActivity, trackerCat, trackerProject);
    setTimeEntries(updated);
    setTrackerActivity('');
  };

  const handleStopTimer = () => {
    const updated = stopLiveTimer();
    setTimeEntries(updated);
  };

  const handleDeleteTimeEntry = (id: string) => {
    const updated = deleteTimeEntry(id);
    setTimeEntries(updated);
  };

  const timeAnalytics = useMemo(
    () => computeTimeAnalytics(timeEntries, anchorDate),
    [timeEntries, anchorDate]
  );

  const handleExportTimeCsv = () => {
    const csv = exportTimeCsv(timeEntries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendar-q-time-report-${formatDateKey(anchorDate)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ======================== PHASE 8: UNIVERSAL 2-WAY DATE CONVERTER ========================
  const [convFromSystem, setConvFromSystem] = useState<WorldCalendarSystemId>('gregorian');
  const [convTargetSystem, setConvTargetSystem] = useState<WorldCalendarSystemId>('islamic-hijri');
  const [convYear, setConvYear] = useState<number>(anchorDate.getFullYear());
  const [convMonth, setConvMonth] = useState<number>(anchorDate.getMonth() + 1);
  const [convDay, setConvDay] = useState<number>(anchorDate.getDate());

  const conversionResult = useMemo(() => {
    return convertCalendarDate(
      convFromSystem,
      convYear,
      convMonth,
      convDay,
      convTargetSystem,
      gujaratiScript
    );
  }, [convFromSystem, convYear, convMonth, convDay, convTargetSystem, gujaratiScript]);

  // Tasks (calendar.q To-Do Manager)
  const [tasks, setTasks] = useState<CalendarTask[]>(() => {
    try {
      const saved =
        localStorage.getItem('calendar_q_tasks_v2') ||
        localStorage.getItem('calander_q_tasks_v2') ||
        localStorage.getItem('samay_tasks_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    const nowIso = new Date().toISOString();
    return [
      { id: 't1', title: 'Prepare Q1 calendar review', completed: false, priority: 'high', createdAt: nowIso },
      { id: 't2', title: 'Sync Vikram Samvat & Gregorian dates', completed: true, priority: 'medium', createdAt: nowIso },
      { id: 't3', title: 'Set up festival notifications', completed: false, priority: 'low', createdAt: nowIso },
    ];
  });
  const [taskDraft, setTaskDraft] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    try {
      localStorage.setItem('calendar_q_tasks_v2', JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  const handleAddTask = () => {
    const trimmed = taskDraft.trim();
    if (!trimmed) return;
    const newTask: CalendarTask = {
      id: `task-${Date.now()}`,
      title: trimmed,
      completed: false,
      priority: taskPriority,
      dueDate: formatDateKey(anchorDate),
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    setTaskDraft('');
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'active') return tasks.filter((t) => !t.completed);
    if (taskFilter === 'completed') return tasks.filter((t) => t.completed);
    return tasks;
  }, [tasks, taskFilter]);

  // Converter Date
  const [converterDateStr, setConverterDateStr] = useState<string>(() =>
    formatDateKey(anchorDate)
  );

  const converterDate = useMemo(
    () => parseDateKey(converterDateStr),
    [converterDateStr]
  );

  const convertedSystems = useMemo(() => {
    return WORLD_CALENDAR_SYSTEMS.map((sys) => {
      const conv = convertToWorldCalendar(converterDate, sys.id, gujaratiScript);
      return {
        sys,
        conv,
      };
    });
  }, [converterDate, gujaratiScript]);

  // Conflict Detection for draft event
  const conflictingEvents = useMemo(() => {
    if (!draftEvent || draftEvent.allDay) return [];
    return events.filter((e) => {
      if (e.id === draftEvent.id || e.allDay) return false;
      if (e.startDate !== draftEvent.startDate) return false;
      if (!visibleLayerIds.has(e.calendarId)) return false;
      return draftEvent.startMinutes < e.endMinutes && draftEvent.endMinutes > e.startMinutes;
    });
  }, [draftEvent, events, visibleLayerIds]);

  const addAttendee = () => {
    const trimmed = attendeeDraft.trim();
    if (!trimmed || !draftEvent) return;
    const cur = draftEvent.attendeesList || [];
    if (cur.some((a) => a.email.toLowerCase() === trimmed.toLowerCase())) return;
    const next: EventAttendee[] = [
      ...cur,
      { email: trimmed, name: trimmed.split('@')[0], status: 'needsAction' },
    ];
    handleDraftChange({ ...draftEvent, attendeesList: next });
    setAttendeeDraft('');
  };

  const writableLayers = useMemo(
    () => layers.filter((l) => l.type === 'personal' || l.type === 'google'),
    [layers]
  );

  const layerById = useMemo(() => {
    const m = new Map<string, CalendarLayer>();
    for (const l of layers) m.set(l.id, l);
    return m;
  }, [layers]);

  const selectedEvent =
    selection.kind === 'event'
      ? events.find((e) => e.id === selection.eventId) || null
      : null;

  // Keep draft synced when selecting a different event
  useEffect(() => {
    if (selectedEvent) {
      setDraftEvent(selectedEvent);
    } else {
      setDraftEvent(null);
    }
  }, [selectedEvent?.id, selectedEvent?.startDate, selectedEvent?.startMinutes, selectedEvent?.endMinutes]);

  const upcomingMeetings = useMemo(() => {
    const todayKey = formatDateKey(today);
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    return events
      .filter(
        (e) =>
          !e.allDay &&
          e.startDate === todayKey &&
          e.endMinutes > nowMins &&
          visibleLayerIds.has(e.calendarId)
      )
      .sort((a, b) => a.startMinutes - b.startMinutes)
      .slice(0, 3);
  }, [events, today, visibleLayerIds]);

  const todayPanchang = useMemo(() => getGujaratiPanchang(today), [today]);
  const todayFestivals = useMemo(
    () => getFestivalsForDate(today, visibleLayerIds),
    [today, visibleLayerIds]
  );

  const todayWorldDates = useMemo(
    () => getWorldCalendarsForDate(today, enabledWorldCalendars, gujaratiScript),
    [today, enabledWorldCalendars, gujaratiScript]
  );

  const inspectedDate =
    selection.kind === 'panchang'
      ? selection.date
      : selection.kind === 'festival'
      ? parseDateKey(selection.festival.date)
      : null;

  const inspectedWorldDates = useMemo(() => {
    if (!inspectedDate) return [];
    return getWorldCalendarsForDate(
      inspectedDate,
      enabledWorldCalendars,
      gujaratiScript
    );
  }, [inspectedDate, enabledWorldCalendars, gujaratiScript]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matchedEvents = events
      .filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.location && e.location.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q))
      )
      .slice(0, 6);

    const yearFestivals = getAllFestivalsForYear(anchorDate.getFullYear());
    const matchedFestivals = yearFestivals
      .filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          (f.gujaratiTitle && f.gujaratiTitle.toLowerCase().includes(q)) ||
          f.categoryLabel.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
      )
      .slice(0, 10);

    return { matchedEvents, matchedFestivals };
  }, [searchQuery, events, anchorDate]);

  const snippetText = useMemo(() => {
    if (availabilitySlots.length === 0) return '';
    const sorted = [...availabilitySlots].sort((a, b) =>
      a.dateKey !== b.dateKey
        ? a.dateKey.localeCompare(b.dateKey)
        : a.startMinutes - b.startMinutes
    );
    const lines = sorted.map((s) => {
      const d = parseDateKey(s.dateKey);
      return `• ${DAY_NAMES_SHORT[d.getDay()]}, ${MONTH_NAMES[d.getMonth()].slice(
        0,
        3
      )} ${d.getDate()}: ${formatTimeRange(s.startMinutes, s.endMinutes)} (${
        primaryTz.abbr
      })`;
    });
    return `Here is my availability (${primaryTz.abbr}):\n${lines.join('\n')}`;
  }, [availabilitySlots, primaryTz]);

  const handleCopySnippet = async () => {
    if (!snippetText) return;
    try {
      await navigator.clipboard.writeText(snippetText);
      setCopiedSnippet(true);
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopiedSnippet(false), 1800);
    } catch {
      setCopiedSnippet(true);
    }
  };

  // Helper to update draft; immediately persists if local event on local calendar, or holds draft until user clicks Save for Google Calendar
  const handleDraftChange = (updated: CalendarEvent) => {
    setDraftEvent(updated);
    const targetLayer = layerById.get(updated.calendarId);
    const involvesGoogle =
      updated.source === 'google' || targetLayer?.type === 'google';
    if (!involvesGoogle) {
      onUpdateLocalEvent(updated);
    }
  };

  const targetLayerForDraft = draftEvent
    ? layerById.get(draftEvent.calendarId)
    : undefined;
  const draftTargetsGoogle =
    Boolean(draftEvent) &&
    (draftEvent?.source === 'google' || targetLayerForDraft?.type === 'google');

  return (
    <aside
      className={
        isDrawer
          ? 'fixed inset-y-0 right-0 z-50 w-[min(92vw,320px)] h-full bg-[#FBFBFB] border-l border-[#EBEBEB] shadow-2xl flex flex-col select-none'
          : 'w-[304px] shrink-0 h-full bg-[#FBFBFB] border-l border-[#EBEBEB] flex flex-col select-none'
      }
    >
      {/* Top Utilities & App Controls Bar (The 6 controls housed in the side of right) */}
      <div className="p-2 bg-white border-b border-[#EAEAEA] flex items-center justify-between gap-1.5 shrink-0">
        {/* Weather Widget */}
        {weatherData !== undefined && onChangeWeatherUnits && onSearchWeatherCity && onUseWeatherGeolocation && onRefreshWeather ? (
          <div className="min-w-0 flex-1">
            <WeatherWidget
              weather={weatherData}
              loading={Boolean(weatherLoading)}
              error={weatherError ?? null}
              units={weatherUnits || 'METRIC'}
              locationQuery={weatherLocationQuery || 'Ahmedabad, India'}
              today={today}
              onChangeUnits={onChangeWeatherUnits}
              onSearchCity={onSearchWeatherCity}
              onUseGeolocation={onUseWeatherGeolocation}
              onRefresh={onRefreshWeather}
              onJumpToDate={onJumpToDate}
            />
          </div>
        ) : null}

        {/* Action Controls: Cultural/Festivals, Export, Shortcuts, Settings, Profile */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Master Cultural / Festivals Toggle */}
          <button
            type="button"
            onClick={onToggleAllCultural}
            title={
              anyCulturalVisible
                ? 'Hide all festivals, holidays & Gujarati calendar (H)'
                : 'Show all festivals, holidays & Gujarati calendar (H)'
            }
            className={`h-[30px] px-2 rounded-[6px] border text-[11.5px] font-medium inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs ${
              anyCulturalVisible
                ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                : 'bg-[#F5F5F5] border-[#E4E4E4] text-[#737373] hover:text-[#1A1A1A]'
            }`}
          >
            {anyCulturalVisible ? (
              <>
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[11px] font-semibold">Festivals</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-[#8C8C8C]" />
                <span className="text-[11px]">Hidden</span>
              </>
            )}
          </button>

          {/* Export Button (.ics) */}
          {onOpenExport && (
            <button
              type="button"
              onClick={onOpenExport}
              title="Export or Import calendar (.ics) (⌘E)"
              className="h-[30px] w-[30px] rounded-[6px] border border-[#E4E4E4] bg-white hover:bg-[#F5F5F5] text-[#3F3F3F] flex items-center justify-center transition-colors shrink-0 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#6B6B6B]" />
            </button>
          )}

          {/* Shortcuts / Help Button */}
          <button
            type="button"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts & Help (?)"
            aria-label="Keyboard Shortcuts and Help"
            className="h-[30px] w-[30px] rounded-[6px] border border-[#E4E4E4] bg-white hover:bg-[#F5F5F5] text-[#3F3F3F] flex items-center justify-center transition-colors shrink-0 cursor-pointer shadow-2xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#6B6B6B]" />
          </button>

          {/* Settings Menu Button */}
          <button
            type="button"
            onClick={() => onOpenSettings('festivals')}
            title="Settings, World Calendars & Google Calendar (,)"
            className="h-[30px] w-[30px] rounded-[6px] border border-[#E4E4E4] bg-white hover:bg-[#F5F5F5] text-[#3F3F3F] flex items-center justify-center transition-colors shrink-0 cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#6B6B6B]" />
          </button>

          {/* Account Avatar Button */}
          {onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              title={
                currentUser
                  ? `Account: ${currentUser.name || currentUser.email}`
                  : googleUser
                  ? `Connected: ${googleUser.email}`
                  : 'Sign in to calendar.q'
              }
              aria-label="Account and authentication"
              className="w-[30px] h-[30px] rounded-full border border-[#E5E5E5] bg-[#F7F7F7] hover:bg-[#EFEFEF] flex items-center justify-center transition-colors shrink-0 cursor-pointer overflow-hidden text-[11px] font-bold text-[#1A1A1A] shadow-2xs"
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : currentUser ? (
                <span>
                  {(currentUser.name ? currentUser.name[0] : currentUser.email[0]).toUpperCase()}
                </span>
              ) : googleUser?.photoURL ? (
                <img
                  src={googleUser.photoURL}
                  alt={googleUser.displayName || 'Google user'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-[#6B6B6B]" />
              )}
            </button>
          )}

          {/* Drawer Close Button on mobile */}
          {isDrawer && onClosePanel && (
            <button
              type="button"
              onClick={onClosePanel}
              aria-label="Close panel"
              className="p-1 rounded-md hover:bg-[#E5E7EB] text-[#6B7280] hover:text-[#1A1A1A] cursor-pointer shrink-0 ml-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Top Search Bar */}
      <div className="p-2.5 border-b border-[#EAEAEA] bg-white shrink-0">
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#F4F5F7] rounded-lg border border-[#E5E7EB] focus-within:bg-white focus-within:border-[#185D8F] focus-within:ring-2 focus-within:ring-[#185D8F]/15 transition-all">
          <Search className="w-3.5 h-3.5 text-[#8C939F] shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, festivals, days..."
            className="flex-1 min-w-0 bg-transparent text-[12.5px] text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="p-0.5 rounded hover:bg-[#E5E7EB] text-[#6B7280] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto cal-scroll">
        {searchResults ? (
          <div className="p-3.5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-medium text-[#737373]">
                Search results
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[11px] text-[#737373] hover:text-[#1A1A1A] cursor-pointer"
              >
                Close
              </button>
            </div>

            {searchResults.matchedEvents.length === 0 &&
            searchResults.matchedFestivals.length === 0 ? (
              <p className="text-[12.5px] text-[#8C8C8C] py-4 text-center">
                No matching events, festivals, or special days found.
              </p>
            ) : (
              <>
                {searchResults.matchedEvents.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-medium text-[#8C8C8C] mb-1">
                      Your Events
                    </div>
                    {searchResults.matchedEvents.map((ev) => {
                      const layer = layerById.get(ev.calendarId);
                      const theme = COLOR_THEMES[layer?.color || 'blue'];
                      const d = parseDateKey(ev.startDate);
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => {
                            onJumpToDate(d);
                            onSelectEvent(ev);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[#EFEFEF] transition-colors flex items-start gap-2 cursor-pointer"
                        >
                          <span
                            className="w-2 h-2 rounded-[2px] mt-1.5 shrink-0"
                            style={{ backgroundColor: layer?.customHex || theme.dot }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-[12.5px] font-medium text-[#1A1A1A] truncate">
                              {ev.title}
                            </div>
                            <div className="text-[11px] text-[#7A7A7A] tabular-nums">
                              {MONTH_NAMES[d.getMonth()].slice(0, 3)} {d.getDate()} ·{' '}
                              {ev.allDay
                                ? 'All-day'
                                : formatTimeRange(ev.startMinutes, ev.endMinutes)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {searchResults.matchedFestivals.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-medium text-[#8C8C8C] mb-1">
                      Festivals &amp; Special Days ({anchorDate.getFullYear()})
                    </div>
                    {searchResults.matchedFestivals.map((fest) => {
                      const layer = layerById.get(fest.layerId);
                      const theme = COLOR_THEMES[layer?.color || 'saffron'];
                      const d = parseDateKey(fest.date);
                      return (
                        <button
                          key={fest.id}
                          type="button"
                          onClick={() => {
                            onJumpToDate(d);
                            onSelectFestival(fest, getGujaratiPanchang(d));
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[#EFEFEF] transition-colors flex items-start gap-2 cursor-pointer"
                        >
                          <span
                            className="w-2 h-2 rounded-[2px] mt-1.5 shrink-0"
                            style={{ backgroundColor: theme.dot }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-[12.5px] font-medium text-[#1A1A1A] truncate">
                              {fest.title}
                            </div>
                            <div className="text-[11px] text-[#7A7A7A] tabular-nums">
                              {MONTH_NAMES[d.getMonth()].slice(0, 3)} {d.getDate()},{' '}
                              {d.getFullYear()} · {fest.categoryLabel}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        ) : selection.kind === 'event' && draftEvent && selectedEvent ? (
          /* ================= EVENT EDITOR INSPECTOR ================= */
          <div className="p-3.5 space-y-3.5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onClearSelection}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-[#737373] hover:text-[#1A1A1A] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onDuplicateEvent(selectedEvent)}
                  title="Duplicate event"
                  className="p-1.5 rounded hover:bg-[#EAEAEA] text-[#6B6B6B] hover:text-[#1A1A1A] cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteEvent(selectedEvent)}
                  title="Delete event"
                  className="p-1.5 rounded hover:bg-[#FDE2E4] text-[#6B6B6B] hover:text-[#C81E2B] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Conflict Detection Banner */}
            {conflictingEvents.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-2 text-[11px] text-amber-900 flex items-start gap-1.5 leading-snug">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold">Schedule Conflict:</span> Overlaps with{' '}
                  {conflictingEvents
                    .map(
                      (c) =>
                        `${c.title} (${formatTimeRange(c.startMinutes, c.endMinutes)})`
                    )
                    .join(', ')}
                </div>
              </div>
            )}

            <div>
              <input
                type="text"
                value={draftEvent.title}
                onChange={(e) =>
                  handleDraftChange({ ...draftEvent, title: e.target.value })
                }
                placeholder="Event title (e.g. Mom’s Birthday, Workspace Sprint...)"
                className="w-full bg-white border border-[#E3E3E3] focus:border-[#3B9AE1] rounded-md px-2.5 py-2 text-[13.5px] font-semibold text-[#1A1A1A] focus:outline-none"
              />
            </div>

            {/* Category (General, Birthday, Memorial/Funeral, Workspace, Plan) */}
            <div>
              <span className="block text-[11px] font-medium text-[#737373] mb-1">
                Category
              </span>
              <select
                value={draftEvent.category || 'event'}
                onChange={(e) => {
                  const cat = e.target.value as EventCategory;
                  const makeAllDay =
                    cat === 'birthday' || cat === 'memorial' ? true : draftEvent.allDay;
                  handleDraftChange({
                    ...draftEvent,
                    category: cat,
                    allDay: makeAllDay,
                  });
                }}
                className="w-full bg-white border border-[#E3E3E3] rounded-md px-2.5 py-1.5 text-[12px] text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
              >
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time */}
            <div className="space-y-2 pt-2 border-t border-[#EFEFEF]">
              <div className="flex items-center justify-between">
                <label className="text-[11.5px] font-medium text-[#737373] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Date &amp; time</span>
                </label>
                <label className="inline-flex items-center gap-1.5 text-[11.5px] text-[#525252] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftEvent.allDay}
                    onChange={(e) =>
                      handleDraftChange({
                        ...draftEvent,
                        allDay: e.target.checked,
                        startMinutes: e.target.checked
                          ? 0
                          : draftEvent.startMinutes || 9 * 60,
                        endMinutes: e.target.checked
                          ? 0
                          : draftEvent.endMinutes || 10 * 60,
                      })
                    }
                    className="rounded border-[#D4D4D4] accent-[#1A1A1A]"
                  />
                  <span>All-day</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <span className="block text-[10.5px] text-[#8C8C8C] mb-0.5">
                    Start date
                  </span>
                  <input
                    type="date"
                    value={draftEvent.startDate}
                    onChange={(e) => {
                      const nextStart = e.target.value;
                      handleDraftChange({
                        ...draftEvent,
                        startDate: nextStart,
                        endDate:
                          draftEvent.endDate < nextStart ? nextStart : draftEvent.endDate,
                      });
                    }}
                    className="w-full bg-white border border-[#E3E3E3] rounded-md px-2 py-1.5 text-[11.5px] tabular-nums text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                  />
                </div>
                <div>
                  <span className="block text-[10.5px] text-[#8C8C8C] mb-0.5">
                    End date
                  </span>
                  <input
                    type="date"
                    value={draftEvent.endDate}
                    min={draftEvent.startDate}
                    onChange={(e) =>
                      handleDraftChange({ ...draftEvent, endDate: e.target.value })
                    }
                    className="w-full bg-white border border-[#E3E3E3] rounded-md px-2 py-1.5 text-[11.5px] tabular-nums text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                  />
                </div>
              </div>

              {!draftEvent.allDay && (
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <span className="block text-[10.5px] text-[#8C8C8C] mb-0.5">
                      Start ({primaryTz.abbr})
                    </span>
                    <input
                      type="time"
                      value={minutesToTimeInput(draftEvent.startMinutes)}
                      onChange={(e) => {
                        const s = timeInputToMinutes(e.target.value);
                        const eMin =
                          draftEvent.endMinutes <= s
                            ? Math.min(1440, s + 30)
                            : draftEvent.endMinutes;
                        handleDraftChange({
                          ...draftEvent,
                          startMinutes: s,
                          endMinutes: eMin,
                        });
                      }}
                      className="w-full bg-white border border-[#E3E3E3] rounded-md px-2 py-1.5 text-[11.5px] tabular-nums text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                    />
                  </div>
                  <div>
                    <span className="block text-[10.5px] text-[#8C8C8C] mb-0.5">
                      End ({primaryTz.abbr})
                    </span>
                    <input
                      type="time"
                      value={minutesToTimeInput(draftEvent.endMinutes)}
                      onChange={(e) => {
                        const endM = timeInputToMinutes(e.target.value);
                        handleDraftChange({
                          ...draftEvent,
                          endMinutes: Math.max(draftEvent.startMinutes + 15, endM),
                        });
                      }}
                      className="w-full bg-white border border-[#E3E3E3] rounded-md px-2 py-1.5 text-[11.5px] tabular-nums text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Recurrence Settings */}
            <div className="space-y-1.5 pt-2 border-t border-[#EFEFEF]">
              <label className="text-[11.5px] font-medium text-[#737373] flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5" />
                <span>Repeat</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <select
                  value={draftEvent.recurrence?.frequency || 'none'}
                  onChange={(e) => {
                    const freq = e.target.value as any;
                    if (freq === 'none') {
                      handleDraftChange({ ...draftEvent, recurrence: undefined });
                    } else {
                      handleDraftChange({
                        ...draftEvent,
                        recurrence: {
                          frequency: freq,
                          interval: draftEvent.recurrence?.interval || 1,
                          until: draftEvent.recurrence?.until,
                        },
                      });
                    }
                  }}
                  className="w-full bg-white border border-[#E3E3E3] rounded-md px-2 py-1.5 text-[11.5px] text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                {draftEvent.recurrence && draftEvent.recurrence.frequency !== 'none' && (
                  <input
                    type="date"
                    title="Repeat until date"
                    value={draftEvent.recurrence.until || ''}
                    onChange={(e) => {
                      handleDraftChange({
                        ...draftEvent,
                        recurrence: {
                          ...draftEvent.recurrence!,
                          until: e.target.value || undefined,
                        },
                      });
                    }}
                    className="w-full bg-white border border-[#E3E3E3] rounded-md px-2 py-1.5 text-[11.5px] text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                  />
                )}
              </div>
            </div>

            {/* Multiple Reminders */}
            <div className="space-y-1.5 pt-2 border-t border-[#EFEFEF]">
              <div className="flex items-center justify-between">
                <label className="text-[11.5px] font-medium text-[#737373] flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />
                  <span>Reminders</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const current = draftEvent.reminders || [];
                    handleDraftChange({
                      ...draftEvent,
                      reminders: [
                        ...current,
                        { id: `rem-${Date.now()}`, minutes: 15, method: 'popup' },
                      ],
                    });
                  }}
                  className="text-[11px] font-medium text-[#185D8F] hover:underline cursor-pointer"
                >
                  + Add reminder
                </button>
              </div>
              {!draftEvent.reminders || draftEvent.reminders.length === 0 ? (
                <p className="text-[11px] text-[#9A9A9A]">No reminders configured</p>
              ) : (
                <div className="space-y-1">
                  {draftEvent.reminders.map((rem, idx) => (
                    <div
                      key={rem.id || idx}
                      className="flex items-center justify-between gap-1 text-[11.5px] bg-white border border-[#EBEBEB] rounded px-2 py-1"
                    >
                      <select
                        value={rem.minutes}
                        onChange={(e) => {
                          const mins = Number(e.target.value);
                          const next = draftEvent.reminders!.map((r, i) =>
                            i === idx ? { ...r, minutes: mins } : r
                          );
                          handleDraftChange({ ...draftEvent, reminders: next });
                        }}
                        className="bg-transparent text-[#1A1A1A] focus:outline-none text-[11.5px]"
                      >
                        <option value={5}>5 minutes before</option>
                        <option value={10}>10 minutes before</option>
                        <option value={15}>15 minutes before</option>
                        <option value={30}>30 minutes before</option>
                        <option value={60}>1 hour before</option>
                        <option value={1440}>1 day before</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const next = draftEvent.reminders!.filter((_, i) => i !== idx);
                          handleDraftChange({ ...draftEvent, reminders: next });
                        }}
                        className="text-[#9A9A9A] hover:text-[#C81E2B] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attendees / Invitations */}
            <div className="space-y-1.5 pt-2 border-t border-[#EFEFEF]">
              <label className="text-[11.5px] font-medium text-[#737373] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Attendees &amp; Invitations</span>
              </label>
              <div className="flex gap-1.5">
                <input
                  type="email"
                  placeholder="colleague@example.com"
                  value={attendeeDraft}
                  onChange={(e) => setAttendeeDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAttendee();
                    }
                  }}
                  className="flex-1 bg-white border border-[#E3E3E3] rounded-md px-2 py-1 text-[11.5px] text-[#1A1A1A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#3B9AE1]"
                />
                <button
                  type="button"
                  onClick={addAttendee}
                  className="px-2 py-1 bg-[#1A1A1A] text-white text-[11px] font-medium rounded hover:bg-[#333333] cursor-pointer"
                >
                  Add
                </button>
              </div>
              {draftEvent.attendeesList && draftEvent.attendeesList.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {draftEvent.attendeesList.map((att, idx) => (
                    <span
                      key={att.email || idx}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F0F0F0] text-[10.5px] text-[#4A4A4A]"
                    >
                      <span>{att.name || att.email}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = draftEvent.attendeesList!.filter((_, i) => i !== idx);
                          handleDraftChange({ ...draftEvent, attendeesList: next });
                        }}
                        className="text-[#8C8C8C] hover:text-[#1A1A1A] cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Target Calendar (Local or Connected Google Calendar) */}
            <div className="space-y-1.5 pt-2 border-t border-[#EFEFEF]">
              <span className="block text-[11.5px] font-medium text-[#737373]">
                Calendar
              </span>
              <select
                value={draftEvent.calendarId}
                onChange={(e) =>
                  handleDraftChange({ ...draftEvent, calendarId: e.target.value })
                }
                className="w-full bg-white border border-[#E3E3E3] rounded-md px-2.5 py-1.5 text-[12px] text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
              >
                {writableLayers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.type === 'google' ? `Google · ${l.name}` : l.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    handleDraftChange({ ...draftEvent, status: 'confirmed' })
                  }
                  className={`flex-1 py-1 text-[11.5px] font-medium rounded border transition-colors cursor-pointer ${
                    draftEvent.status !== 'tentative'
                      ? 'bg-white border-[#D0D0D0] text-[#1A1A1A] shadow-2xs'
                      : 'bg-transparent border-transparent text-[#7A7A7A] hover:bg-[#EFEFEF]'
                  }`}
                >
                  Confirmed
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleDraftChange({ ...draftEvent, status: 'tentative' })
                  }
                  className={`flex-1 py-1 text-[11.5px] font-medium rounded border transition-colors cursor-pointer ${
                    draftEvent.status === 'tentative'
                      ? 'bg-white border-[#D0D0D0] text-[#1A1A1A] shadow-2xs'
                      : 'bg-transparent border-transparent text-[#7A7A7A] hover:bg-[#EFEFEF]'
                  }`}
                >
                  Tentative
                </button>
              </div>
            </div>

            {/* Location & Notes */}
            <div className="space-y-2 pt-2 border-t border-[#EFEFEF]">
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-[#9A9A9A] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={draftEvent.location || ''}
                  onChange={(e) =>
                    handleDraftChange({ ...draftEvent, location: e.target.value })
                  }
                  placeholder="Add location or video link"
                  className="w-full bg-white border border-[#E3E3E3] rounded-md pl-8 pr-2.5 py-1.5 text-[12px] text-[#1A1A1A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#3B9AE1]"
                />
              </div>

              <textarea
                rows={3}
                value={draftEvent.notes || ''}
                onChange={(e) =>
                  handleDraftChange({ ...draftEvent, notes: e.target.value })
                }
                placeholder="Add description, reminders, or notes..."
                className="w-full bg-white border border-[#E3E3E3] rounded-md px-2.5 py-1.5 text-[12px] text-[#1A1A1A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#3B9AE1] resize-none"
              />
            </div>

            {/* Explicit Save Action for Google Calendar events (triggers confirmation dialog!) */}
            {draftTargetsGoogle && (
              <div className="pt-2 border-t border-[#EFEFEF] space-y-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onRequestSaveGoogleEvent(
                      draftEvent,
                      draftEvent.source !== 'google'
                    )
                  }
                  className="w-full py-2 px-3 rounded-md bg-[#1A1A1A] hover:bg-[#333333] text-white text-[12.5px] font-medium transition-colors cursor-pointer"
                >
                  {draftEvent.source === 'google'
                    ? 'Save changes to Google Calendar'
                    : 'Add to Google Calendar'}
                </button>
                <p className="text-[10.5px] text-[#7A7A7A] text-center">
                  You will be asked to confirm before syncing to Google Calendar.
                </p>
              </div>
            )}
          </div>
        ) : selection.kind === 'festival' || selection.kind === 'panchang' ? (
          /* ================= FESTIVAL & 29-CALENDAR ALMANAC INSPECTOR ================= */
          <div className="p-3.5 space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onClearSelection}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-[#737373] hover:text-[#1A1A1A] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <span className="text-[11px] text-[#8C8C8C]">
                {selection.kind === 'festival'
                  ? selection.festival.categoryLabel
                  : 'Date Almanac'}
              </span>
            </div>

            {selection.kind === 'festival' ? (
              <div className="space-y-2">
                <h3 className="text-[15px] font-bold text-[#1A1A1A] leading-snug">
                  {selection.festival.title}
                </h3>
                {selection.festival.gujaratiTitle && (
                  <div className="text-[13.5px] font-gujarati font-medium text-[#8B4C00]">
                    {selection.festival.gujaratiTitle}
                  </div>
                )}
                <div className="text-[12px] text-[#6B6B6B] tabular-nums">
                  {(() => {
                    const d = parseDateKey(selection.festival.date);
                    return `${DAY_NAMES_FULL[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
                  })()}
                  {selection.festival.region ? ` · ${selection.festival.region}` : ''}
                </div>
                <p className="text-[12.5px] leading-relaxed text-[#454545] pt-1">
                  {selection.festival.description}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className="text-[15px] font-bold text-[#1A1A1A]">
                  {DAY_NAMES_FULL[selection.date.getDay()]},{' '}
                  {MONTH_NAMES[selection.date.getMonth()]} {selection.date.getDate()},{' '}
                  {selection.date.getFullYear()}
                </h3>
                <p className="text-[12px] text-[#6B6B6B]">
                  Gujarati Panchang &amp; World Calendar Equivalents
                </p>
              </div>
            )}

            {/* Gujarati Panchang Detail */}
            {showGujaratiCalendar && (
              <div className="pt-3 border-t border-[#EBEBEB] space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11.5px] font-semibold text-[#1F1F1F]">
                    Gujarati Calendar (Panchang)
                  </span>
                  <span className="text-[11px] font-medium text-[#8B4C00] tabular-nums">
                    VS {selection.panchang.vikramSamvat}
                  </span>
                </div>

                <dl className="divide-y divide-[#F0F0F0] text-[12px]">
                  <div className="py-1.5 flex items-center justify-between gap-2">
                    <dt className="text-[#7A7A7A]">Month (Mas)</dt>
                    <dd className="font-medium text-[#1A1A1A] text-right">
                      {selection.panchang.monthEn}{' '}
                      <span className="font-gujarati text-[#6B6B6B]">
                        ({selection.panchang.monthGu})
                      </span>
                    </dd>
                  </div>
                  <div className="py-1.5 flex items-center justify-between gap-2">
                    <dt className="text-[#7A7A7A]">Paksha &amp; Tithi</dt>
                    <dd className="font-medium text-[#1A1A1A] text-right">
                      {selection.panchang.pakshaEn} {selection.panchang.tithiEn}{' '}
                      <span className="font-gujarati text-[#6B6B6B]">
                        ({selection.panchang.pakshaGu} {selection.panchang.tithiGu})
                      </span>
                    </dd>
                  </div>
                  <div className="py-1.5 flex items-center justify-between gap-2">
                    <dt className="text-[#7A7A7A]">Vaar · Nakshatra</dt>
                    <dd className="font-medium text-[#1A1A1A] text-right">
                      {selection.panchang.vaarEn} · {selection.panchang.nakshatraEn}
                    </dd>
                  </div>
                  <div className="py-1.5 flex items-center justify-between gap-2">
                    <dt className="text-[#7A7A7A]">Lunar Phase</dt>
                    <dd className="font-medium text-[#1A1A1A] text-right tabular-nums">
                      {selection.panchang.moonPhaseLabel} ({selection.panchang.moonIllumination}%)
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {/* Enabled World Calendars Almanac */}
            <div className="pt-3 border-t border-[#EBEBEB] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-[#1F1F1F] inline-flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#737373]" />
                  <span>World Calendars</span>
                </span>
                <button
                  type="button"
                  onClick={() => onOpenSettings('world')}
                  className="text-[11px] font-medium text-[#185D8F] hover:underline cursor-pointer"
                >
                  All 29
                </button>
              </div>

              {inspectedWorldDates.length === 0 ? (
                <p className="text-[11.5px] text-[#8C8C8C]">
                  No world calendars enabled. Open Settings to enable any of the 29 systems.
                </p>
              ) : (
                <div className="divide-y divide-[#F0F0F0]">
                  {inspectedWorldDates.map((wc) => (
                    <div key={wc.id} className="py-1.5 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-medium text-[#7A7A7A]">
                          {wc.name}
                        </span>
                        <a
                          href={wc.wikiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#A3A3A3] hover:text-[#1A1A1A]"
                          title={`Learn about ${wc.name}`}
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <div
                        className={`text-[12px] font-medium text-[#1A1A1A] tabular-nums ${
                          wc.id === 'gujarati-vikram' && gujaratiScript
                            ? 'font-gujarati'
                            : ''
                        }`}
                      >
                        {wc.formatted}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                onScheduleOnDate(
                  selection.panchang.dateKey,
                  selection.kind === 'festival' ? selection.festival.title : undefined
                )
              }
              className="w-full py-2 px-3 bg-white border border-[#DFDFDF] hover:border-[#C5C5C5] hover:bg-[#F5F5F5] rounded-md text-[12.5px] font-medium text-[#1A1A1A] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Add event on this date</span>
            </button>
          </div>
        ) : (
          /* ================= DEFAULT IDLE CONTEXT PANEL ================= */
          <div className="flex flex-col h-full">
            {/* Sub-tab Navigation */}
            <div className="p-2 border-b border-[#EAEAEA] bg-[#FAFAFA] shrink-0">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden p-1 bg-[#ECEEF1] rounded-xl">
                <button
                  type="button"
                  onClick={() => setIdleTab('overview')}
                  className={`py-1 px-2.5 rounded-lg text-[11.5px] font-medium transition-all cursor-pointer text-center whitespace-nowrap shrink-0 ${
                    idleTab === 'overview'
                      ? 'bg-white text-[#111827] shadow-xs font-semibold'
                      : 'text-[#5A6372] hover:text-[#111827] hover:bg-white/40'
                  }`}
                >
                  Agenda
                </button>
                <button
                  type="button"
                  onClick={() => setIdleTab('tasks')}
                  className={`py-1 px-2.5 rounded-lg text-[11.5px] font-medium transition-all cursor-pointer text-center whitespace-nowrap shrink-0 ${
                    idleTab === 'tasks'
                      ? 'bg-white text-[#111827] shadow-xs font-semibold'
                      : 'text-[#5A6372] hover:text-[#111827] hover:bg-white/40'
                  }`}
                >
                  Tasks ({tasks.filter((t) => !t.completed).length})
                </button>
                <button
                  type="button"
                  onClick={() => setIdleTab('worldtime')}
                  className={`py-1 px-2.5 rounded-lg text-[11.5px] font-medium transition-all cursor-pointer text-center whitespace-nowrap shrink-0 ${
                    idleTab === 'worldtime'
                      ? 'bg-white text-[#111827] shadow-xs font-semibold'
                      : 'text-[#5A6372] hover:text-[#111827] hover:bg-white/40'
                  }`}
                >
                  World Time
                </button>
                <button
                  type="button"
                  onClick={() => setIdleTab('astro')}
                  className={`py-1 px-2.5 rounded-lg text-[11.5px] font-medium transition-all cursor-pointer text-center whitespace-nowrap shrink-0 ${
                    idleTab === 'astro'
                      ? 'bg-white text-[#111827] shadow-xs font-semibold'
                      : 'text-[#5A6372] hover:text-[#111827] hover:bg-white/40'
                  }`}
                >
                  Astronomy
                </button>
                <button
                  type="button"
                  onClick={() => setIdleTab('converter')}
                  className={`py-1 px-2.5 rounded-lg text-[11.5px] font-medium transition-all cursor-pointer text-center whitespace-nowrap shrink-0 ${
                    idleTab === 'converter'
                      ? 'bg-white text-[#111827] shadow-xs font-semibold'
                      : 'text-[#5A6372] hover:text-[#111827] hover:bg-white/40'
                  }`}
                >
                  Converter
                </button>
                <button
                  type="button"
                  onClick={() => setIdleTab('tracker')}
                  className={`py-1 px-2.5 rounded-lg text-[11.5px] font-medium transition-all cursor-pointer text-center whitespace-nowrap shrink-0 ${
                    idleTab === 'tracker'
                      ? 'bg-white text-[#111827] shadow-xs font-semibold'
                      : 'text-[#5A6372] hover:text-[#111827] hover:bg-white/40'
                  }`}
                >
                  Time Tracker
                </button>
              </div>
            </div>

            {/* TAB 1: OVERVIEW / AGENDA */}
            {idleTab === 'overview' && (
              <div className="p-3 space-y-3 bg-[#F9FAFB]">
                {/* 1. Upcoming Meetings & Today across calendars */}
                <section className="bg-white rounded-xl border border-[#EAEAEA] p-3.5 shadow-2xs space-y-3">
                  {upcomingMeetings.length === 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#EBF5FB] text-[#185D8F] flex items-center justify-center shrink-0">
                            <CalendarIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-[#1F1F1F]">Upcoming today</div>
                            <div className="text-[11px] text-[#71717A]">No meetings scheduled</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onScheduleOnDate(formatDateKey(today), 'New Event')}
                          className="text-[11px] font-semibold text-[#185D8F] hover:bg-[#EBF5FB] px-2 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>
                      {!googleUser && (
                        <p className="text-[11.5px] text-[#71717A] leading-relaxed bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5">
                          Connect Google Calendar or drag on the time grid to quickly add events, birthdays, or meetings.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#EBF5FB] text-[#185D8F] flex items-center justify-center shrink-0">
                            <CalendarIcon className="w-4 h-4" />
                          </div>
                          <div className="text-[13px] font-semibold text-[#1F1F1F]">Upcoming today</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onScheduleOnDate(formatDateKey(today), 'New Event')}
                          className="text-[11px] font-semibold text-[#185D8F] hover:bg-[#EBF5FB] px-2 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        {upcomingMeetings.map((ev) => {
                          const layer = layerById.get(ev.calendarId);
                          const theme = COLOR_THEMES[layer?.color || 'blue'];
                          return (
                            <button
                              key={ev.id}
                              type="button"
                              onClick={() => onSelectEvent(ev)}
                              className="w-full text-left p-2.5 rounded-lg bg-[#F9FAFB] border border-[#ECECEC] hover:border-[#D6D6D6] hover:bg-white transition-all flex items-start gap-2.5 cursor-pointer shadow-2xs"
                            >
                              <span
                                className="w-1 self-stretch rounded-full shrink-0"
                                style={{ backgroundColor: layer?.customHex || theme.bar }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-[12.5px] font-semibold text-[#1A1A1A] truncate">
                                  {ev.title}
                                </div>
                                <div className="text-[11px] text-[#71717A] tabular-nums mt-0.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[#9CA3AF]" />
                                  <span>{formatTimeRange(ev.startMinutes, ev.endMinutes)}</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Today across enabled World Calendars & Festivals */}
                  {(todayWorldDates.length > 0 || (anyCulturalVisible && todayFestivals.length > 0)) && (
                    <div className="pt-3 border-t border-[#F0F2F5] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                          Today Across Calendars
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenSettings('world')}
                          className="text-[11px] font-medium text-[#185D8F] hover:underline cursor-pointer"
                        >
                          Configure
                        </button>
                      </div>

                      <div className="space-y-1 bg-[#F8FAFC] rounded-lg p-2 border border-[#E2E8F0]">
                        {todayWorldDates.slice(0, 4).map((wc) => (
                          <div
                            key={wc.id}
                            className="flex items-baseline justify-between gap-2 text-[11.5px] py-0.5"
                          >
                            <span className="text-[#64748B] shrink-0 font-medium">{wc.name.split(' ')[0]}</span>
                            <span
                              className={`font-semibold text-[#1E293B] text-right truncate tabular-nums ${
                                wc.id === 'gujarati-vikram' && gujaratiScript
                                  ? 'font-gujarati text-[#B45309]'
                                  : ''
                              }`}
                            >
                              {wc.shortLabel}
                            </span>
                          </div>
                        ))}

                        {todayWorldDates.length > 4 && (
                          <button
                            type="button"
                            onClick={() => onOpenSettings('world')}
                            className="text-[11px] text-[#185D8F] hover:underline cursor-pointer pt-0.5 font-medium block"
                          >
                            +{todayWorldDates.length - 4} more calendars…
                          </button>
                        )}
                      </div>

                      {anyCulturalVisible &&
                        todayFestivals.slice(0, 2).map((fest) => (
                          <button
                            key={fest.id}
                            type="button"
                            onClick={() => onSelectFestival(fest, todayPanchang)}
                            className="w-full text-left text-[11.5px] text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] p-1.5 rounded-md truncate block cursor-pointer transition-colors"
                          >
                            <span className="text-[#94A3B8] font-medium">{fest.categoryLabel}</span> ·{' '}
                            <span className="font-semibold text-[#1E293B]">{fest.title}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </section>

                {/* 2. Scheduling snippet */}
                <section className="bg-white rounded-xl border border-[#EAEAEA] p-3.5 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
                        <Clock3 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-[#1F1F1F]">Scheduling snippet</div>
                        <div className="text-[11px] text-[#71717A]">Share available slots</div>
                      </div>
                    </div>
                    {shareMode && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={onToggleShareMode}
                    className={`w-full h-[36px] px-3 rounded-lg border text-[12px] font-medium flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                      shareMode
                        ? 'bg-[#E1F2FC] border-[#3B9AE1] text-[#14588A] ring-2 ring-[#3B9AE1]/20'
                        : 'bg-[#FAFAFA] border-[#E5E7EB] text-[#1F1F1F] hover:bg-white hover:border-[#D1D5DB]'
                    }`}
                  >
                    <span className="flex-1 text-center font-medium">
                      {shareMode ? 'Done selecting slots' : 'Share availability'}
                    </span>
                    <kbd className="w-5 h-5 rounded bg-white border border-[#D1D5DB] text-[10.5px] font-mono-tabular text-[#6B7280] flex items-center justify-center shrink-0 shadow-2xs">
                      S
                    </kbd>
                  </button>

                  {shareMode && (
                    <div className="space-y-2 pt-1">
                      {availabilitySlots.length === 0 ? (
                        <p className="text-[11.5px] text-[#6B7280] leading-snug bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-2.5">
                          Drag across open hours on the calendar grid to pick time slots to share with attendees.
                        </p>
                      ) : (
                        <>
                          <div className="space-y-1 max-h-[120px] overflow-y-auto no-scrollbar scrollbar-none">
                            {availabilitySlots.map((slot) => {
                              const d = parseDateKey(slot.dateKey);
                              return (
                                <div
                                  key={slot.id}
                                  className="flex items-center justify-between gap-2 text-[11.5px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5"
                                >
                                  <span className="truncate tabular-nums text-[#1E293B] font-medium">
                                    {DAY_NAMES_SHORT[d.getDay()]} {d.getDate()} ·{' '}
                                    {formatTimeRange(slot.startMinutes, slot.endMinutes)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onRemoveAvailabilitySlot(slot.id)}
                                    className="text-[#94A3B8] hover:text-[#EF4444] cursor-pointer p-0.5"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={handleCopySnippet}
                              className="flex-1 py-1.5 px-3 rounded-lg bg-[#185D8F] text-white text-[11.5px] font-medium hover:bg-[#134972] transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              {copiedSnippet ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Copied to Clipboard</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy snippet</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={onClearAvailabilitySlots}
                              className="py-1.5 px-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[11.5px] text-[#6B7280] hover:text-[#111827] cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </section>

                {/* 3. Quick Add Event / Meeting */}
                <section className="bg-white rounded-xl border border-[#EAEAEA] p-3.5 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#1F1F1F]">Quick add event</div>
                      <div className="text-[11px] text-[#71717A]">Type event name &amp; press Enter</div>
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const trimmed = meetQuery.trim();
                      if (!trimmed) return;
                      onQuickCreateMeeting(trimmed);
                      setMeetQuery('');
                    }}
                    className="flex items-center gap-2 h-[36px] px-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus-within:bg-white focus-within:border-[#185D8F] focus-within:ring-2 focus-within:ring-[#185D8F]/15 transition-all"
                  >
                    <User className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                    <input
                      ref={meetInputRef}
                      type="text"
                      value={meetQuery}
                      onChange={(e) => setMeetQuery(e.target.value)}
                      placeholder="Event, birthday, meeting..."
                      className="flex-1 min-w-0 bg-transparent text-[12px] text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none"
                    />
                    <kbd className="w-5 h-5 rounded bg-white border border-[#D1D5DB] text-[10.5px] font-mono-tabular text-[#6B7280] flex items-center justify-center shrink-0 shadow-2xs">
                      F
                    </kbd>
                  </form>
                </section>

                {/* 4. Useful shortcuts */}
                <section className="bg-white rounded-xl border border-[#EAEAEA] p-3.5 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#1F1F1F]">Useful shortcuts</div>
                      <div className="text-[11px] text-[#71717A]">Quick navigation &amp; controls</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={onOpenCommandMenu}
                      className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[#F3F4F6] text-[12px] text-[#4B5563] hover:text-[#111827] transition-colors cursor-pointer group"
                    >
                      <span className="font-medium">Command menu</span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 h-5 rounded bg-[#F9FAFB] border border-[#E5E7EB] text-[10.5px] font-mono-tabular text-[#6B7280] inline-flex items-center justify-center shadow-2xs group-hover:bg-white">
                          ⌘
                        </kbd>
                        <kbd className="px-1.5 h-5 rounded bg-[#F9FAFB] border border-[#E5E7EB] text-[10.5px] font-mono-tabular text-[#6B7280] inline-flex items-center justify-center shadow-2xs group-hover:bg-white">
                          K
                        </kbd>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenSettings('festivals')}
                      className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[#F3F4F6] text-[12px] text-[#4B5563] hover:text-[#111827] transition-colors cursor-pointer group"
                    >
                      <span className="font-medium">Settings &amp; World Calendars</span>
                      <kbd className="w-5 h-5 rounded bg-[#F9FAFB] border border-[#E5E7EB] text-[10.5px] font-mono-tabular text-[#6B7280] inline-flex items-center justify-center shadow-2xs group-hover:bg-white">
                        ,
                      </kbd>
                    </button>

                    <button
                      type="button"
                      onClick={onToggleAllCultural}
                      className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[#F3F4F6] text-[12px] text-[#4B5563] hover:text-[#111827] transition-colors cursor-pointer group"
                    >
                      <span className="font-medium">
                        {anyCulturalVisible ? 'Hide festivals & days' : 'Show festivals & days'}
                      </span>
                      <kbd className="w-5 h-5 rounded bg-[#F9FAFB] border border-[#E5E7EB] text-[10.5px] font-mono-tabular text-[#6B7280] inline-flex items-center justify-center shadow-2xs group-hover:bg-white">
                        H
                      </kbd>
                    </button>

                    <button
                      type="button"
                      onClick={onToggleGujaratiLayer}
                      className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[#F3F4F6] text-[12px] text-[#4B5563] hover:text-[#111827] transition-colors cursor-pointer group"
                    >
                      <span className="font-medium">
                        {showGujaratiCalendar
                          ? 'Hide Gujarati calendar'
                          : 'Show Gujarati calendar'}
                      </span>
                      <kbd className="w-5 h-5 rounded bg-[#F9FAFB] border border-[#E5E7EB] text-[10.5px] font-mono-tabular text-[#6B7280] inline-flex items-center justify-center shadow-2xs group-hover:bg-white">
                        G
                      </kbd>
                    </button>

                    <button
                      type="button"
                      onClick={onOpenGoToDate}
                      className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[#F3F4F6] text-[12px] text-[#4B5563] hover:text-[#111827] transition-colors cursor-pointer group"
                    >
                      <span className="font-medium">Go to date</span>
                      <kbd className="w-5 h-5 rounded bg-[#F9FAFB] border border-[#E5E7EB] text-[10.5px] font-mono-tabular text-[#6B7280] inline-flex items-center justify-center shadow-2xs group-hover:bg-white">
                        .
                      </kbd>
                    </button>

                    <button
                      type="button"
                      onClick={onOpenShortcuts}
                      className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[#F3F4F6] text-[12px] text-[#4B5563] hover:text-[#111827] transition-colors cursor-pointer group"
                    >
                      <span className="font-medium">All keyboard shortcuts</span>
                      <kbd className="w-5 h-5 rounded bg-[#F9FAFB] border border-[#E5E7EB] text-[10.5px] font-mono-tabular text-[#6B7280] inline-flex items-center justify-center shadow-2xs group-hover:bg-white">
                        ?
                      </kbd>
                    </button>
                  </div>
                </section>
              </div>
            )}

            {/* TAB 2: TASKS & TO-DO MANAGER */}
            {idleTab === 'tasks' && (
              <div className="p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-[#185D8F]" />
                    <span>calendar.q Tasks</span>
                  </div>
                  <span className="text-[11px] text-[#7A7A7A]">
                    {tasks.filter((t) => t.completed).length} / {tasks.length} done
                  </span>
                </div>

                {/* Filter Pills */}
                <div className="flex gap-1">
                  {(['all', 'active', 'completed'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setTaskFilter(f)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-colors cursor-pointer ${
                        taskFilter === f
                          ? 'bg-[#1A1A1A] text-white'
                          : 'bg-[#EAEAEA] text-[#6B6B6B] hover:text-[#1A1A1A]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* Add Task Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddTask();
                  }}
                  className="space-y-1.5 pt-1"
                >
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Add a new task..."
                      value={taskDraft}
                      onChange={(e) => setTaskDraft(e.target.value)}
                      className="flex-1 bg-white border border-[#E3E3E3] rounded-md px-2.5 py-1.5 text-[12px] text-[#1A1A1A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#3B9AE1]"
                    />
                    <button
                      type="submit"
                      disabled={!taskDraft.trim()}
                      className="px-3 py-1.5 bg-[#1A1A1A] text-white rounded-md text-[11.5px] font-medium hover:bg-[#333333] transition-colors cursor-pointer disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#8C8C8C]">Priority:</span>
                    <div className="flex gap-1">
                      {(['low', 'medium', 'high'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setTaskPriority(p)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                            taskPriority === p
                              ? p === 'high'
                                ? 'bg-rose-100 text-rose-800 font-bold'
                                : p === 'medium'
                                ? 'bg-amber-100 text-amber-800 font-bold'
                                : 'bg-slate-200 text-slate-800 font-bold'
                              : 'text-[#9A9A9A] hover:text-[#1A1A1A]'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </form>

                {/* Tasks List */}
                <div className="divide-y divide-[#F0F0F0] pt-1">
                  {filteredTasks.length === 0 ? (
                    <p className="text-[12px] text-[#8C8C8C] py-4 text-center">
                      No tasks in this view.
                    </p>
                  ) : (
                    filteredTasks.map((t) => (
                      <div
                        key={t.id}
                        className="py-2 flex items-start justify-between gap-2 group"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleTask(t.id)}
                          className="flex items-start gap-2 text-left min-w-0 flex-1 cursor-pointer"
                        >
                          <span className="mt-0.5 text-[#6B6B6B]">
                            {t.completed ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-[#B0B0B0]" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span
                              className={`text-[12px] leading-tight block ${
                                t.completed
                                  ? 'line-through text-[#9A9A9A]'
                                  : 'text-[#1A1A1A] font-medium'
                              }`}
                            >
                              {t.title}
                            </span>
                            {t.dueDate && (
                              <span className="text-[10px] text-[#A0A0A0]">
                                Due {t.dueDate}
                              </span>
                            )}
                          </div>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className={`px-1 py-0.2 rounded text-[9px] uppercase font-semibold ${
                              t.priority === 'high'
                                ? 'bg-rose-50 text-rose-700'
                                : t.priority === 'medium'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {t.priority || 'med'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(t.id)}
                            className="p-1 text-[#C0C0C0] hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: WORLD TIME DASHBOARD & MEETING OVERLAP (Phase 4) */}
            {idleTab === 'worldtime' && (
              <div className="p-3.5 space-y-3.5">
                {/* Header & Controls */}
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-[#185D8F]" />
                    <span>World Time &amp; Overlap</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUse24Hour(!use24Hour)}
                    className="text-[10.5px] px-2 py-0.5 rounded border border-[#E0E0E0] bg-white hover:bg-[#F5F5F5] font-medium text-[#666666] cursor-pointer"
                  >
                    {use24Hour ? '24-Hour' : '12-Hour'}
                  </button>
                </div>

                {/* Add City Selector */}
                <div className="flex gap-1.5">
                  <select
                    value={selectedAddCityId}
                    onChange={(e) => setSelectedAddCityId(e.target.value)}
                    className="flex-1 bg-white border border-[#E0E0E0] rounded-md px-2 py-1 text-[11.5px] text-[#1A1A1A] focus:outline-none focus:border-[#185D8F]"
                  >
                    <option value="">+ Add a global city...</option>
                    {PRESET_WORLD_CITIES.filter((c) => !worldCities.some((wc) => wc.id === c.id)).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.flag} {c.name}, {c.country} ({c.timezone})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedAddCityId}
                    onClick={() => handleAddWorldCity(selectedAddCityId)}
                    className="px-2.5 py-1 bg-[#1A1A1A] text-white rounded-md text-[11px] font-medium hover:bg-[#333333] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>

                {/* World Cities List */}
                <div className="space-y-2.5">
                  {worldCities.map((city) => {
                    const info = getCityTimeInfo(city, new Date());
                    const isOverlapChecked = selectedOverlapCityIds.includes(city.id);
                    const countryCode =
                      city.id === 'mumbai'
                        ? 'IN'
                        : city.id === 'newyork' || city.id === 'sanfrancisco'
                        ? 'US'
                        : city.id === 'london'
                        ? 'GB'
                        : city.id === 'tokyo'
                        ? 'JP'
                        : city.id === 'dubai'
                        ? 'AE'
                        : city.id === 'paris'
                        ? 'FR'
                        : city.id === 'singapore'
                        ? 'SG'
                        : city.id === 'sydney'
                        ? 'AU'
                        : city.id === 'berlin'
                        ? 'DE'
                        : city.id === 'toronto'
                        ? 'CA'
                        : city.id === 'hongkong'
                        ? 'HK'
                        : city.country.slice(0, 2).toUpperCase();

                    return (
                      <div
                        key={city.id}
                        className="bg-white border border-[#EAEAEA] rounded-xl p-3 space-y-2.5 shadow-2xs hover:shadow-xs hover:border-[#D5D5D5] transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-8 h-8 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center font-bold text-[11px] text-[#374151] shrink-0 tracking-wider font-mono">
                              {countryCode}
                            </span>
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold text-[#111827] leading-tight truncate">
                                {city.name}
                              </div>
                              <div className="text-[11px] text-[#6B7280] truncate mt-0.5">
                                {city.country} · <span className="font-mono text-[10.5px]">{info.tzAbbr}</span> ({info.utcOffsetString})
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="flex items-baseline justify-end gap-1 text-[16px] font-bold text-[#111827] tabular-nums leading-tight font-mono-tabular">
                              <span>{use24Hour ? info.time24String : info.timeShortString}</span>
                              {!use24Hour && (
                                <span className="text-[10px] font-semibold text-[#6B7280] font-sans">
                                  {info.ampm}
                                </span>
                              )}
                            </div>
                            <div className="text-[10.5px] text-[#6B7280] mt-0.5 flex items-center justify-end gap-1">
                              <span>{info.dateString}</span>
                              {info.dayOffset !== 0 && (
                                <span
                                  className={`px-1.5 py-0.2 rounded-full font-semibold text-[9.5px] ${
                                    info.dayOffset > 0
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                      : 'bg-slate-100 text-slate-700 border border-slate-200/60'
                                  }`}
                                >
                                  {info.dayOffset > 0 ? '+1 Day' : '-1 Day'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status bar & Overlap toggle button */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#F2F4F7] text-[11px]">
                          <div>
                            {info.isBusinessHours ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5]/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A] animate-pulse shrink-0" />
                                <span>Business Hours</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-[#F8F9FA] text-[#667085] border border-[#E4E7EC]">
                                <Moon className="w-3 h-3 text-[#98A2B3] shrink-0" />
                                <span>{info.isDaytime ? 'Daytime Off-Hours' : 'Outside Working Hours'}</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleOverlapCity(city.id)}
                              className={`px-2 py-0.5 rounded-md text-[10.5px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                                isOverlapChecked
                                  ? 'bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]'
                                  : 'bg-transparent text-[#667085] hover:text-[#111827] border border-[#E5E7EB] hover:bg-[#F9FAFB]'
                              }`}
                            >
                              <span>{isOverlapChecked ? '✓ Compared' : '+ Compare'}</span>
                            </button>

                            {worldCities.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveWorldCity(city.id)}
                                className="text-[#9CA3AF] hover:text-rose-600 p-1 rounded hover:bg-[#FEE2E2]/40 transition-colors cursor-pointer"
                                title="Remove city"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Meeting Overlap Calculator */}
                <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] font-bold text-[#1A1A1A] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#185D8F]" />
                      <span>Meeting Overlap Calculator</span>
                    </span>
                    <span className="text-[10px] text-[#737373]">
                      {overlapCities.length} cities selected
                    </span>
                  </div>

                  {overlapAnalysis.bestWindows.length > 0 ? (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-900 space-y-0.5">
                      <div className="font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Convenient Shared Meeting Window:</span>
                      </div>
                      <div className="font-mono-tabular text-[11.5px] font-bold">
                        {overlapAnalysis.bestWindows.join(', ')}
                      </div>
                      <div className="text-[10px] text-emerald-700">
                        {overlapAnalysis.maxCommonHours} hours where 9:00 AM – 6:00 PM overlaps across all selected cities.
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
                      <div className="font-semibold">No direct 9am–6pm overlap found.</div>
                      <div className="text-[10px] text-amber-700 mt-0.5">
                        Selected locations span wide timezones. Consider early morning or evening flexibility.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: COMPLETE ASTRONOMY CALENDAR (Phase 5) */}
            {idleTab === 'astro' && (
              <div className="p-3.5 space-y-3.5">
                {/* Header & Filter Pills */}
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                    <Telescope className="w-4 h-4 text-indigo-600" />
                    <span>Astronomy &amp; Celestial</span>
                  </div>
                </div>

                <div className="flex gap-1 overflow-x-auto no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden pb-1">
                  {(['all', 'moon', 'solar', 'eclipses', 'meteors', 'planets'] as const).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setAstroSection(sec)}
                      className={`px-2 py-0.5 rounded text-[10.5px] font-medium capitalize whitespace-nowrap transition-colors cursor-pointer ${
                        astroSection === sec
                          ? 'bg-[#1A1A1A] text-white'
                          : 'bg-[#EAEAEA] text-[#666666] hover:text-[#1A1A1A]'
                      }`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>

                {/* 1. Moon Details */}
                {(astroSection === 'all' || astroSection === 'moon') && (
                  <div className="bg-white border border-[#E8E8E8] rounded-lg p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-[#1A1A1A] flex items-center gap-1.5">
                        <Moon className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Moon Phase &amp; Cycle</span>
                      </span>
                      <span className="text-[11px] font-bold text-[#185D8F] tabular-nums">
                        {detailedMoon.illuminationPercent}% Illum.
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11.5px] bg-[#FAFAFA] border border-[#F0F0F0] rounded p-2">
                      <div>
                        <div className="font-semibold text-[#1A1A1A]">{detailedMoon.phaseName}</div>
                        <div className="text-[10px] text-[#737373]">
                          Age: {detailedMoon.ageDays} days · {detailedMoon.distanceKm.toLocaleString()} km
                        </div>
                      </div>
                      {detailedMoon.isSupermoon && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9.5px] font-bold rounded">
                          SUPERMOON
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-1.5 bg-[#FAFAFA] rounded border border-[#F0F0F0]">
                        <span className="text-[#8C8C8C] block text-[9.5px]">Next New Moon</span>
                        <span className="font-semibold text-[#1A1A1A]">{detailedMoon.nextNewMoonDate}</span>
                      </div>
                      <div className="p-1.5 bg-[#FAFAFA] rounded border border-[#F0F0F0]">
                        <span className="text-[#8C8C8C] block text-[9.5px]">Next Full Moon</span>
                        <span className="font-semibold text-[#1A1A1A]">{detailedMoon.nextFullMoonDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10.5px] text-[#7A7A7A] pt-1 border-t border-[#F5F5F5]">
                      <span>Moonrise: <strong className="text-[#1A1A1A]">{detailedMoon.moonrise}</strong></span>
                      <span>Moonset: <strong className="text-[#1A1A1A]">{detailedMoon.moonset}</strong></span>
                    </div>
                  </div>
                )}

                {/* 2. Solar Almanac */}
                {(astroSection === 'all' || astroSection === 'solar') && (
                  <div className="bg-white border border-[#E8E8E8] rounded-lg p-3 space-y-2">
                    <div className="text-[12px] font-bold text-[#1A1A1A] flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Solar Almanac &amp; Twilight</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-[#FAFAFA] p-2 rounded border border-[#F0F0F0]">
                        <div className="text-[#8C8C8C] text-[9.5px]">Day / Night Length</div>
                        <div className="font-bold text-[#1A1A1A]">{solarAlmanac.dayLength} / {solarAlmanac.nightLength}</div>
                      </div>
                      <div className="bg-[#FAFAFA] p-2 rounded border border-[#F0F0F0]">
                        <div className="text-[#8C8C8C] text-[9.5px]">Solar Noon</div>
                        <div className="font-bold text-[#1A1A1A]">{solarAlmanac.solarNoon}</div>
                      </div>
                    </div>

                    <div className="text-[10.5px] space-y-1 bg-[#FAFAFA] p-2 rounded border border-[#F0F0F0]">
                      <div className="flex justify-between">
                        <span className="text-[#737373]">Golden Hour (Morning):</span>
                        <span className="font-medium text-[#1A1A1A]">{solarAlmanac.goldenHourMorning}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#737373]">Golden Hour (Evening):</span>
                        <span className="font-medium text-[#1A1A1A]">{solarAlmanac.goldenHourEvening}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#737373]">Civil Twilight:</span>
                        <span className="font-medium text-[#1A1A1A]">{solarAlmanac.civilTwilightDawn} – {solarAlmanac.civilTwilightDusk}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Celestial Eclipses */}
                {(astroSection === 'all' || astroSection === 'eclipses') && (
                  <div className="bg-white border border-[#E8E8E8] rounded-lg p-3 space-y-2">
                    <div className="text-[12px] font-bold text-[#1A1A1A] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Upcoming Eclipses (2026–2027)</span>
                      </span>
                    </div>
                    <div className="divide-y divide-[#F2F2F2] max-h-[220px] overflow-y-auto cal-scroll text-[11.5px]">
                      {ECLIPSE_CATALOG.map((ecl) => (
                        <div key={ecl.id} className="py-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#1A1A1A]">{ecl.name}</span>
                            <span className="font-mono-tabular text-[10.5px] font-bold text-[#185D8F]">{ecl.dateKey}</span>
                          </div>
                          <div className="text-[10px] text-[#737373]">{ecl.visibilityRegions}</div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-purple-800 font-medium">Totality / Peak: {ecl.peakUtc}</span>
                            <button
                              type="button"
                              onClick={() => toggleAstroReminder(ecl.id)}
                              className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold cursor-pointer ${
                                astroReminders[ecl.id] ? 'bg-indigo-100 text-indigo-700' : 'bg-[#EAEAEA] text-[#666666]'
                              }`}
                            >
                              {astroReminders[ecl.id] ? 'Reminder Set' : '+ Set Alert'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Annual Meteor Showers */}
                {(astroSection === 'all' || astroSection === 'meteors') && (
                  <div className="bg-white border border-[#E8E8E8] rounded-lg p-3 space-y-2">
                    <div className="text-[12px] font-bold text-[#1A1A1A] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        <span>Annual Meteor Showers</span>
                      </span>
                    </div>
                    <div className="divide-y divide-[#F2F2F2] max-h-[220px] overflow-y-auto cal-scroll text-[11.5px]">
                      {ANNUAL_METEOR_SHOWERS.map((ms) => (
                        <div key={ms.id} className="py-2 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#1A1A1A]">{ms.name}</span>
                            <span className="text-[10.5px] font-bold text-amber-700">Peak ZHR: {ms.expectedZhr}/hr</span>
                          </div>
                          <div className="text-[10px] text-[#737373]">
                            Peak: {ms.peakNight} · Best {ms.bestViewingHours} · Radiant: {ms.radiantConstellation}
                          </div>
                          <div className="text-[9.5px] text-[#8C8C8C]">{ms.visibilityNote}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Planetary Events */}
                {(astroSection === 'all' || astroSection === 'planets') && (
                  <div className="bg-white border border-[#E8E8E8] rounded-lg p-3 space-y-2">
                    <div className="text-[12px] font-bold text-[#1A1A1A] flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-[#185D8F]" />
                      <span>Planetary Oppositions &amp; Solstices</span>
                    </div>
                    <div className="divide-y divide-[#F2F2F2] max-h-[200px] overflow-y-auto cal-scroll text-[11.5px]">
                      {PLANETARY_EVENTS.map((pe) => (
                        <div key={pe.id} className="py-1.5 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#1A1A1A]">{pe.title}</span>
                            <span className="text-[10px] font-mono-tabular font-medium text-[#737373]">{pe.dateKey}</span>
                          </div>
                          <div className="text-[10px] text-[#555555]">{pe.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: UNIVERSAL 2-WAY DATE CONVERTER (Phase 8) */}
            {idleTab === 'converter' && (
              <div className="p-3.5 space-y-3.5">
                <div className="text-[13px] font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#185D8F]" />
                  <span>Universal Date Converter</span>
                </div>

                {/* 2-Way Conversion Form */}
                <div className="bg-white border border-[#E0E0E0] rounded-lg p-3 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <label className="text-[#8C8C8C] block text-[10px] font-medium mb-1">From Calendar:</label>
                      <select
                        value={convFromSystem}
                        onChange={(e) => setConvFromSystem(e.target.value as WorldCalendarSystemId)}
                        className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-2 py-1 text-[11px] text-[#1A1A1A] focus:outline-none"
                      >
                        {WORLD_CALENDAR_SYSTEMS.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[#8C8C8C] block text-[10px] font-medium mb-1">To Target:</label>
                      <select
                        value={convTargetSystem}
                        onChange={(e) => setConvTargetSystem(e.target.value as WorldCalendarSystemId)}
                        className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-2 py-1 text-[11px] text-[#1A1A1A] focus:outline-none"
                      >
                        {WORLD_CALENDAR_SYSTEMS.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Year, Month, Day inputs */}
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <label className="text-[#8C8C8C] block text-[9.5px]">Year</label>
                      <input
                        type="number"
                        value={convYear}
                        onChange={(e) => setConvYear(Number(e.target.value) || 2026)}
                        className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-2 py-1 font-mono-tabular"
                      />
                    </div>
                    <div>
                      <label className="text-[#8C8C8C] block text-[9.5px]">Month</label>
                      <input
                        type="number"
                        min="1"
                        max="13"
                        value={convMonth}
                        onChange={(e) => setConvMonth(Math.max(1, Math.min(13, Number(e.target.value) || 1)))}
                        className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-2 py-1 font-mono-tabular"
                      />
                    </div>
                    <div>
                      <label className="text-[#8C8C8C] block text-[9.5px]">Day</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={convDay}
                        onChange={(e) => setConvDay(Math.max(1, Math.min(31, Number(e.target.value) || 1)))}
                        className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-2 py-1 font-mono-tabular"
                      />
                    </div>
                  </div>

                  {/* Output Card */}
                  <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Converted Output:</span>
                    <div className="text-[13.5px] font-bold text-[#1E293B]">
                      {conversionResult.result.formatted}
                    </div>
                    <div className="text-[10px] text-[#64748B] flex items-center justify-between">
                      <span>Baseline: {formatDateKey(conversionResult.gregorianDate)}</span>
                      {conversionResult.isApproximate && (
                        <span className="text-amber-700 font-medium">Approximate / Sightings Dependent</span>
                      )}
                    </div>
                    <div className="text-[9.5px] text-[#94A3B8] italic">{conversionResult.methodExplanation}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(conversionResult.result.formatted);
                        } catch {}
                      }}
                      className="flex-1 py-1 px-2 border border-[#E0E0E0] bg-white hover:bg-[#F5F5F5] rounded text-[11px] font-medium text-[#1A1A1A] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Result</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onScheduleOnDate(formatDateKey(conversionResult.gregorianDate), conversionResult.result.shortLabel)}
                      className="flex-1 py-1 px-2 bg-[#1A1A1A] text-white hover:bg-[#333333] rounded text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CalendarPlus className="w-3 h-3" />
                      <span>Schedule</span>
                    </button>
                  </div>
                </div>

                {/* Multi-Calendar Grid Comparison */}
                <div className="bg-white border border-[#EBEBEB] rounded-lg p-2.5 space-y-2">
                  <div className="text-[11.5px] font-bold text-[#1A1A1A]">
                    Comparison for {formatDateKey(converterDate)}:
                  </div>
                  <div className="divide-y divide-[#F0F0F0] max-h-[220px] overflow-y-auto cal-scroll text-[11px]">
                    {convertedSystems.map(({ sys, conv }) => (
                      <div key={sys.id} className="py-1.5 flex justify-between items-baseline gap-2">
                        <span className="text-[#737373] truncate">{sys.name}</span>
                        <span className="font-semibold text-[#1A1A1A] truncate text-right tabular-nums">{conv.shortLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: TIME TRACKING & ANALYTICS (Phase 7) */}
            {idleTab === 'tracker' && (
              <div className="p-3.5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Time Tracking &amp; Analytics</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportTimeCsv}
                    className="p-1 text-[#666666] hover:text-[#1A1A1A] rounded hover:bg-[#EAEAEA] cursor-pointer flex items-center gap-1 text-[10.5px]"
                    title="Export CSV"
                  >
                    <Download className="w-3 h-3" />
                    <span>CSV</span>
                  </button>
                </div>

                {/* Live Activity Timer Card */}
                <div className="bg-white border border-[#E0E0E0] rounded-lg p-3 space-y-2">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="What are you working on?"
                      value={trackerActivity}
                      onChange={(e) => setTrackerActivity(e.target.value)}
                      className="flex-1 bg-white border border-[#E0E0E0] rounded-md px-2 py-1 text-[11.5px] text-[#1A1A1A] focus:outline-none focus:border-[#185D8F]"
                    />
                    <select
                      value={trackerCat}
                      onChange={(e) => setTrackerCat(e.target.value as TrackingCategory)}
                      className="bg-white border border-[#E0E0E0] rounded-md px-2 py-1 text-[11px] text-[#1A1A1A] focus:outline-none"
                    >
                      {(Object.keys(CATEGORY_META) as TrackingCategory[]).map((cat) => (
                        <option key={cat} value={cat}>{CATEGORY_META[cat].label}</option>
                      ))}
                    </select>
                  </div>

                  {activeTimer ? (
                    <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded p-2">
                      <div>
                        <div className="text-[10px] text-rose-700 font-semibold uppercase tracking-wider">Timer Running</div>
                        <div className="text-[12px] font-bold text-rose-900">{activeTimer.activityName}</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleStopTimer}
                        className="px-3 py-1 bg-rose-600 text-white rounded text-[11px] font-bold hover:bg-rose-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Pause className="w-3 h-3" />
                        <span>Stop</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!trackerActivity.trim()}
                      onClick={handleStartTimer}
                      className="w-full py-1.5 bg-[#1A1A1A] text-white rounded text-[11.5px] font-medium hover:bg-[#333333] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Start Timer</span>
                    </button>
                  )}
                </div>

                {/* Analytics Summary */}
                <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg p-3 space-y-2.5">
                  <span className="text-[11.5px] font-bold text-[#1A1A1A] block">Today’s Analytics</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded border border-[#E8E8E8]">
                      <div className="text-[#8C8C8C] text-[9.5px]">Total Tracked Today</div>
                      <div className="text-[13px] font-bold text-[#185D8F]">
                        {Math.floor(timeAnalytics.totalMinutesToday / 60)}h {timeAnalytics.totalMinutesToday % 60}m
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded border border-[#E8E8E8]">
                      <div className="text-[#8C8C8C] text-[9.5px]">Productive Hours</div>
                      <div className="text-[13px] font-bold text-emerald-700">
                        {timeAnalytics.productiveHoursToday} hrs
                      </div>
                    </div>
                  </div>

                  {/* Category Progress Bars */}
                  <div className="space-y-1.5 pt-1">
                    {timeAnalytics.categories.filter((c) => c.totalMinutes > 0).map((c) => (
                      <div key={c.category} className="space-y-0.5 text-[10.5px]">
                        <div className="flex justify-between">
                          <span className="font-medium text-[#333333]">{c.label}</span>
                          <span className="text-[#666666]">{c.totalHours}h ({c.percent}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#EAEAEA] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${c.percent}%`, backgroundColor: c.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Entries */}
                <div className="space-y-1">
                  <div className="text-[11.5px] font-bold text-[#1A1A1A]">Recent Logs:</div>
                  <div className="divide-y divide-[#F2F2F2] max-h-[160px] overflow-y-auto cal-scroll text-[11px] bg-white border border-[#E8E8E8] rounded-lg px-2">
                    {timeAnalytics.recentEntries.length === 0 ? (
                      <div className="py-3 text-center text-[#999999]">No time entries logged yet.</div>
                    ) : (
                      timeAnalytics.recentEntries.map((e) => (
                        <div key={e.id} className="py-1.5 flex items-center justify-between gap-1 group">
                          <div>
                            <div className="font-semibold text-[#1A1A1A]">{e.activityName}</div>
                            <div className="text-[9.5px] text-[#8C8C8C]">
                              {CATEGORY_META[e.category]?.label || e.category} · {e.durationMinutes} mins
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteTimeEntry(e.id)}
                            className="text-[#C0C0C0] hover:text-rose-600 opacity-0 group-hover:opacity-100 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
