import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  Calendar,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  CloudSun,
  Copy,
  Droplets,
  Globe,
  LocateFixed,
  MapPin,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Square,
  Sun,
  Timer,
  Trash2,
  Umbrella,
  User,
  Wind,
  X,
} from 'lucide-react';
import {
  AvailabilitySlot,
  CalendarEvent,
  CalendarLayer,
  CalendarTask,
  FestivalItem,
  GujaratiPanchang,
  TimezoneOption,
  UserAccount,
  WorldCalendarSystemId,
} from '../types/calendar';
import {
  COLOR_THEMES,
  DAY_NAMES_SHORT,
  MONTH_NAMES,
  formatDateKey,
  formatMinutesToTime,
  parseDateKey,
} from '../utils/dateUtils';
import {
  WORLD_CALENDAR_SYSTEMS,
  convertToWorldCalendar,
} from '../data/worldCalendars';
import {
  PRESET_WORLD_CITIES,
  WorldCity,
  calculateMeetingOverlap,
  getCityTimeInfo,
} from '../services/worldTimeService';
import {
  CATEGORY_META,
  TimeEntry,
  TrackingCategory,
  computeTimeAnalytics,
  deleteTimeEntry,
  loadTimeEntries,
  startLiveTimer,
  stopLiveTimer,
} from '../services/timeTrackingService';
import {
  WeatherBundle,
  WeatherUnits,
  formatTempRounded,
} from '../services/weatherService';
import { WeatherConditionIcon } from './WeatherWidget';
import { SettingsTab } from './SettingsModal';

export type RightPanelTab = 'agenda' | 'weather-time' | 'converter' | 'timer';

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
  todayFestivals: FestivalItem[];
  gujaratiScript: boolean;
  enabledWorldCalendars: WorldCalendarSystemId[];
  primaryTz: TimezoneOption;
  shareSlots: AvailabilitySlot[];
  isShareMode: boolean;
  isDrawer?: boolean;
  selection?: RightSelection;
  onClearSelection?: () => void;
  onUpdateLocalEvent?: (updated: CalendarEvent) => void;
  onRequestSaveGoogleEvent?: (event: CalendarEvent, isNewOnGoogle: boolean) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
  onDuplicateEvent?: (event: CalendarEvent) => void;
  onScheduleOnDate?: (dateKey: string, suggestedTitle?: string) => void;
  onCloseDrawer?: () => void;
  onToggleShareMode: () => void;
  onRemoveShareSlot: (slotId: string) => void;
  onClearShareSlots: () => void;
  onCopyShareText: () => void;
  onSelectEvent: (ev: CalendarEvent) => void;
  onSelectFestival: (fest: FestivalItem) => void;
  onQuickCreateEvent: (title: string) => void;
  onOpenSettings: (tab?: SettingsTab) => void;
  onOpenAuth?: () => void;
  currentUser?: UserAccount | null;
  weather: WeatherBundle | null;
  weatherLoading: boolean;
  weatherError: string | null;
  weatherUnits: WeatherUnits;
  weatherLocationQuery: string;
  onChangeWeatherUnits: (u: WeatherUnits) => void;
  onSearchWeatherCity: (q: string) => void;
  onUseWeatherGeolocation: () => void;
  onRefreshWeather: () => void;
  onJumpToDate: (d: Date) => void;
  showToast?: (msg: string) => void;
}

const TASKS_STORAGE_KEY = 'calendar_q_tasks_v3';
const CLOCK_CITIES_KEY = 'calendar_q_world_clocks_v3';

export const RightPanel: React.FC<RightPanelProps> = ({
  today,
  anchorDate,
  events,
  layers,
  visibleLayerIds,
  todayFestivals,
  gujaratiScript,
  enabledWorldCalendars,
  primaryTz,
  shareSlots,
  isShareMode,
  isDrawer = false,
  selection = { kind: 'none' },
  onClearSelection,
  onUpdateLocalEvent,
  onRequestSaveGoogleEvent,
  onDeleteEvent,
  onDuplicateEvent,
  onScheduleOnDate,
  onCloseDrawer,
  onToggleShareMode,
  onRemoveShareSlot,
  onClearShareSlots,
  onCopyShareText,
  onSelectEvent,
  onSelectFestival,
  onQuickCreateEvent,
  onOpenSettings,
  onOpenAuth,
  currentUser,
  weather,
  weatherLoading,
  weatherError,
  weatherUnits,
  weatherLocationQuery,
  onChangeWeatherUnits,
  onSearchWeatherCity,
  onUseWeatherGeolocation,
  onRefreshWeather,
  onJumpToDate,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<RightPanelTab>('agenda');
  const [quickTitle, setQuickTitle] = useState('');
  const [shareOpen, setShareOpen] = useState(false);

  // Unified Agenda + Tasks state (starts completely clean with ZERO fake tasks!)
  const [tasks, setTasks] = useState<CalendarTask[]>(() => {
    try {
      const raw = localStorage.getItem(TASKS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Weather + World Time state
  const [weatherCityDraft, setWeatherCityDraft] = useState('');
  const [geoBusy, setGeoBusy] = useState(false);
  const [nowTick, setNowTick] = useState(() => new Date());
  const [selectedClockIds, setSelectedClockIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(CLOCK_CITIES_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return ['newyork', 'london', 'mumbai', 'tokyo'];
  });
  const [showAddCity, setShowAddCity] = useState(false);

  // Date Converter state
  const [converterDateStr, setConverterDateStr] = useState(() => formatDateKey(anchorDate));
  const [converterFromSys, setConverterFromSys] = useState<WorldCalendarSystemId>('gregorian');
  const [converterToSys, setConverterToSys] = useState<WorldCalendarSystemId>('gujarati-vikram');

  // Time Tracker state
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(() => loadTimeEntries());
  const [timerName, setTimerName] = useState('');
  const [timerCategory, setTimerCategory] = useState<TrackingCategory>('work');

  useEffect(() => {
    setConverterDateStr(formatDateKey(anchorDate));
  }, [anchorDate]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const persistTasks = (next: CalendarTask[]) => {
    setTasks(next);
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const item: CalendarTask = {
      id: `tsk-${Date.now()}`,
      title: newTaskTitle.trim(),
      dueDate: formatDateKey(anchorDate),
      completed: false,
      priority: newTaskPriority,
      createdAt: new Date().toISOString(),
    };
    persistTasks([item, ...tasks]);
    setNewTaskTitle('');
  };

  const handleToggleTask = (id: string) => {
    persistTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const handleDeleteTask = (id: string) => {
    persistTasks(tasks.filter((t) => t.id !== id));
  };

  const handleAddClockCity = (cityId: string) => {
    if (selectedClockIds.includes(cityId)) return;
    const next = [...selectedClockIds, cityId];
    setSelectedClockIds(next);
    try {
      localStorage.setItem(CLOCK_CITIES_KEY, JSON.stringify(next));
    } catch {}
    setShowAddCity(false);
  };

  const handleRemoveClockCity = (cityId: string) => {
    const next = selectedClockIds.filter((id) => id !== cityId);
    setSelectedClockIds(next);
    try {
      localStorage.setItem(CLOCK_CITIES_KEY, JSON.stringify(next));
    } catch {}
  };

  const layerMap = useMemo(() => {
    const m = new Map<string, CalendarLayer>();
    layers.forEach((l) => m.set(l.id, l));
    return m;
  }, [layers]);

  const anchorKey = formatDateKey(anchorDate);
  const todayKey = formatDateKey(today);

  const dayEvents = useMemo(
    () =>
      events
        .filter(
          (ev) =>
            visibleLayerIds.has(ev.calendarId) &&
            ev.startDate <= anchorKey &&
            ev.endDate >= anchorKey
        )
        .sort((a, b) => {
          if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
          return a.startMinutes - b.startMinutes;
        }),
    [events, visibleLayerIds, anchorKey]
  );

  const activeCities = useMemo(
    () =>
      selectedClockIds
        .map((id) => PRESET_WORLD_CITIES.find((c) => c.id === id))
        .filter((c): c is WorldCity => Boolean(c)),
    [selectedClockIds]
  );

  const overlapInfo = useMemo(
    () => (activeCities.length >= 2 ? calculateMeetingOverlap(activeCities) : null),
    [activeCities]
  );

  const converterDateObj = useMemo(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(converterDateStr)) {
      return parseDateKey(converterDateStr);
    }
    return anchorDate;
  }, [converterDateStr, anchorDate]);

  const fromConversion = useMemo(
    () => convertToWorldCalendar(converterDateObj, converterFromSys, gujaratiScript),
    [converterDateObj, converterFromSys, gujaratiScript]
  );
  const toConversion = useMemo(
    () => convertToWorldCalendar(converterDateObj, converterToSys, gujaratiScript),
    [converterDateObj, converterToSys, gujaratiScript]
  );

  const runningTimer = useMemo(
    () => timeEntries.find((e) => e.isRunning) || null,
    [timeEntries]
  );
  const timerAnalytics = useMemo(
    () => computeTimeAnalytics(timeEntries, nowTick),
    [timeEntries, nowTick]
  );

  const runningElapsedStr = useMemo(() => {
    if (!runningTimer) return '00:00:00';
    const sec = Math.max(
      0,
      Math.floor((nowTick.getTime() - new Date(runningTimer.startTime).getTime()) / 1000)
    );
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [runningTimer, nowTick]);

  const pendingTaskCount = tasks.filter((t) => !t.completed).length;

  const todayForecast =
    weather?.daily.find((d) => d.dateKey === todayKey) || weather?.daily[0];

  const handleWeatherCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weatherCityDraft.trim()) return;
    onSearchWeatherCity(weatherCityDraft.trim());
    setWeatherCityDraft('');
  };

  return (
    <aside
      className={
        isDrawer
          ? 'fixed inset-y-0 right-0 z-50 w-[min(92vw,340px)] h-full bg-[#FBFBFB] dark:bg-[#111114] border-l border-[#EBEBEB] dark:border-[#242429] shadow-2xl flex flex-col transition-colors'
          : 'w-[308px] shrink-0 h-full bg-[#FBFBFB] dark:bg-[#111114] border-l border-[#EBEBEB] dark:border-[#242429] flex flex-col transition-colors'
      }
    >
      {/* Clean Top Bar: Compact Weather trigger + Settings + Account */}
      <div className="h-[44px] px-3.5 border-b border-[#EBEBEB] dark:border-[#242429] flex items-center justify-between gap-2 shrink-0 bg-[#FBFBFB] dark:bg-[#111114]">
        <button
          type="button"
          onClick={() => setActiveTab('weather-time')}
          title="Open Weather & World Clocks"
          className={`h-[28px] px-2 rounded-md border text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer min-w-0 ${
            activeTab === 'weather-time'
              ? 'bg-[#EFEFEF] dark:bg-[#23232A] border-[#DCDCDC] dark:border-[#3A3A44] text-[#1A1A1A] dark:text-[#F4F4F5]'
              : 'bg-white dark:bg-[#18181D] border-[#E4E4E4] dark:border-[#2C2C34] text-[#3F3F3F] dark:text-[#D4D4D8] hover:bg-[#F3F3F3] dark:hover:bg-[#23232A]'
          }`}
        >
          {weather ? (
            <>
              <WeatherConditionIcon
                iconBaseUri={weather.current.iconBaseUri}
                conditionType={weather.current.conditionType}
                isDaytime={weather.current.isDaytime}
                alt={weather.current.conditionText}
                className="w-3.5 h-3.5"
              />
              <span className="font-semibold text-[#1A1A1A] dark:text-[#F4F4F5] tabular-nums">
                {formatTempRounded(weather.current.temperature)}
              </span>
              <span className="text-[#737373] dark:text-[#A1A1AA] truncate max-w-[92px]">
                {weather.location.name}
              </span>
            </>
          ) : (
            <>
              <CloudSun className="w-3.5 h-3.5 text-[#737373] dark:text-[#A1A1AA]" />
              <span className="text-[#666666] dark:text-[#A1A1AA] truncate">
                {weatherLoading ? 'Loading...' : 'Weather'}
              </span>
            </>
          )}
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onOpenSettings('display')}
            title="Settings, Appearance, .ics Sync & Shortcuts"
            aria-label="Open Settings"
            className="p-1.5 rounded-md text-[#666666] dark:text-[#A1A1AA] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-[#EFEFEF] dark:hover:bg-[#1E1E24] transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          {onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              title={currentUser ? `${currentUser.name} (${currentUser.email})` : 'Sign in'}
              aria-label="Account"
              className="h-[28px] px-2 rounded-md border border-[#E4E4E4] dark:border-[#2C2C34] bg-white dark:bg-[#18181D] hover:bg-[#F3F3F3] dark:hover:bg-[#23232A] text-[11.5px] font-medium text-[#1A1A1A] dark:text-[#F4F4F5] inline-flex items-center gap-1.5 cursor-pointer"
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded-full"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-[#525252] dark:text-[#A1A1AA]" />
              )}
              <span className="max-w-[74px] truncate">
                {currentUser ? currentUser.name.split(' ')[0] : 'Sign in'}
              </span>
            </button>
          )}

          {isDrawer && onCloseDrawer && (
            <button
              type="button"
              onClick={onCloseDrawer}
              aria-label="Close right panel"
              className="p-1.5 rounded-md text-[#666666] dark:text-[#A1A1AA] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-[#EFEFEF] dark:hover:bg-[#1E1E24] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Focused Selection Inspector (Event Editor / Festival Details / Day Panchang) */}
      {selection && selection.kind !== 'none' ? (
        <div className="flex-1 overflow-y-auto cal-scroll p-3.5 space-y-3.5 bg-white dark:bg-[#111114]">
          <div className="flex items-center justify-between pb-2 border-b border-[#EFEFEF] dark:border-[#242429]">
            <button
              type="button"
              onClick={() => onClearSelection?.()}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#525252] dark:text-[#A1A1AA] hover:text-[#1A1A1A] dark:hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to panel</span>
            </button>
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#8C8C8C] dark:text-[#71717A]">
              {selection.kind === 'event'
                ? 'Event Details'
                : selection.kind === 'festival'
                ? 'Holiday / Festival'
                : 'Date & World Calendars'}
            </span>
          </div>

          {selection.kind === 'event' && (() => {
            const ev = events.find((e) => e.id === selection.eventId);
            if (!ev) {
              return (
                <div className="text-[12px] text-[#8C8C8C] py-6 text-center">
                  Event no longer exists.
                </div>
              );
            }
            const editableLayers = layers.filter(
              (l) => l.type === 'personal' || l.type === 'custom' || l.type === 'google'
            );
            const targetLayer = layers.find((l) => l.id === ev.calendarId);
            const isGoogleTarget = targetLayer?.type === 'google';

            const updateField = (patch: Partial<CalendarEvent>) => {
              const next: CalendarEvent = { ...ev, ...patch };
              if (ev.source === 'google' || isGoogleTarget) {
                onUpdateLocalEvent?.(next);
              } else {
                onUpdateLocalEvent?.(next);
              }
            };

            const timeOptions: number[] = [];
            for (let m = 0; m <= 1440; m += 30) timeOptions.push(m);

            return (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#737373] dark:text-[#A1A1AA] mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={ev.title}
                    onChange={(e) => updateField({ title: e.target.value })}
                    className="w-full h-[34px] px-2.5 rounded-lg border border-[#E0E0E0] dark:border-[#2E2E36] bg-white dark:bg-[#18181D] text-[13px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#F4F4F5]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-[#737373] dark:text-[#A1A1AA] mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={ev.startDate}
                      onChange={(e) =>
                        updateField({ startDate: e.target.value, endDate: e.target.value })
                      }
                      className="w-full h-[32px] px-2 rounded-lg border border-[#E0E0E0] dark:border-[#2E2E36] bg-white dark:bg-[#18181D] text-[12px] text-[#1A1A1A] dark:text-[#F4F4F5] tabular-nums focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#F4F4F5]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#737373] dark:text-[#A1A1AA] mb-1">
                      Calendar
                    </label>
                    <select
                      value={ev.calendarId}
                      onChange={(e) => updateField({ calendarId: e.target.value })}
                      className="w-full h-[32px] px-2 rounded-lg border border-[#E0E0E0] dark:border-[#2E2E36] text-[12px] bg-white dark:bg-[#18181D] text-[#1A1A1A] dark:text-[#F4F4F5] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#F4F4F5]"
                    >
                      {editableLayers.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-[12px] text-[#3A3A3A] dark:text-[#D4D4D8] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ev.allDay}
                    onChange={(e) => updateField({ allDay: e.target.checked })}
                    className="rounded border-[#D0D0D0] dark:border-[#3A3A44]"
                  />
                  <span>All-day event</span>
                </label>

                {!ev.allDay && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-[#737373] dark:text-[#A1A1AA] mb-1">
                        Start
                      </label>
                      <select
                        value={ev.startMinutes}
                        onChange={(e) => {
                          const s = Number(e.target.value);
                          updateField({
                            startMinutes: s,
                            endMinutes: Math.max(s + 30, ev.endMinutes),
                          });
                        }}
                        className="w-full h-[32px] px-2 rounded-lg border border-[#E0E0E0] dark:border-[#2E2E36] text-[12px] bg-white dark:bg-[#18181D] text-[#1A1A1A] dark:text-[#F4F4F5] tabular-nums"
                      >
                        {timeOptions.slice(0, -1).map((m) => (
                          <option key={m} value={m}>
                            {formatMinutesToTime(m)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#737373] dark:text-[#A1A1AA] mb-1">
                        End
                      </label>
                      <select
                        value={ev.endMinutes}
                        onChange={(e) => updateField({ endMinutes: Number(e.target.value) })}
                        className="w-full h-[32px] px-2 rounded-lg border border-[#E0E0E0] dark:border-[#2E2E36] text-[12px] bg-white dark:bg-[#18181D] text-[#1A1A1A] dark:text-[#F4F4F5] tabular-nums"
                      >
                        {timeOptions
                          .filter((m) => m > ev.startMinutes)
                          .map((m) => (
                            <option key={m} value={m}>
                              {formatMinutesToTime(m)}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-[#737373] dark:text-[#A1A1AA] mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={ev.location || ''}
                    onChange={(e) => updateField({ location: e.target.value })}
                    placeholder="Add location or meeting link"
                    className="w-full h-[32px] px-2.5 rounded-lg border border-[#E0E0E0] dark:border-[#2E2E36] bg-white dark:bg-[#18181D] text-[12px] text-[#1A1A1A] dark:text-[#F4F4F5] placeholder:text-[#A3A3A3] dark:placeholder:text-[#71717A] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#F4F4F5]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#737373] dark:text-[#A1A1AA] mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={ev.notes || ''}
                    onChange={(e) => updateField({ notes: e.target.value })}
                    placeholder="Add description or agenda..."
                    className="w-full p-2.5 rounded-lg border border-[#E0E0E0] dark:border-[#2E2E36] bg-white dark:bg-[#18181D] text-[12px] text-[#1A1A1A] dark:text-[#F4F4F5] placeholder:text-[#A3A3A3] dark:placeholder:text-[#71717A] resize-none focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#F4F4F5]"
                  />
                </div>

                <div className="pt-2 border-t border-[#EFEFEF] dark:border-[#242429] space-y-2">
                  {(ev.source === 'google' || isGoogleTarget) && onRequestSaveGoogleEvent && (
                    <button
                      type="button"
                      onClick={() =>
                        onRequestSaveGoogleEvent(ev, ev.source !== 'google')
                      }
                      className="w-full h-[34px] rounded-lg bg-[#1A1A1A] dark:bg-[#F4F4F5] hover:bg-[#333333] dark:hover:bg-white text-white dark:text-[#09090B] text-[12px] font-medium transition-colors cursor-pointer"
                    >
                      {ev.source === 'google'
                        ? 'Save Changes to Google Calendar'
                        : 'Sync Event to Google Calendar'}
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    {onDuplicateEvent && (
                      <button
                        type="button"
                        onClick={() => onDuplicateEvent(ev)}
                        className="flex-1 h-[32px] rounded-lg border border-[#E0E0E0] dark:border-[#2E2E36] bg-white dark:bg-[#18181D] hover:bg-[#F5F5F5] dark:hover:bg-[#23232A] text-[11.5px] font-medium text-[#3A3A3A] dark:text-[#E4E4E7] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Duplicate</span>
                      </button>
                    )}
                    {onDeleteEvent && (
                      <button
                        type="button"
                        onClick={() => onDeleteEvent(ev)}
                        className="flex-1 h-[32px] rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-950/80 text-[11.5px] font-medium text-red-700 dark:text-red-300 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {selection.kind === 'festival' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-[#ECECEC] dark:border-[#27272E] bg-[#FAFAFA] dark:bg-[#18181D]">
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#8C8C8C] dark:text-[#71717A]">
                  {selection.festival.categoryLabel}
                </div>
                <div className="text-[16px] font-bold text-[#1A1A1A] dark:text-[#F4F4F5] mt-1">
                  {gujaratiScript && selection.festival.gujaratiTitle
                    ? selection.festival.gujaratiTitle
                    : selection.festival.title}
                </div>
                {selection.festival.gujaratiTitle && !gujaratiScript && (
                  <div className="text-[12.5px] text-[#737373] dark:text-[#A1A1AA] font-gujarati mt-0.5">
                    {selection.festival.gujaratiTitle}
                  </div>
                )}
                <div className="text-[12px] text-[#525252] dark:text-[#A1A1AA] mt-2 tabular-nums">
                  {(() => {
                    const d = parseDateKey(selection.festival.date);
                    return `${DAY_NAMES_SHORT[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
                  })()}
                </div>
                {selection.festival.description && (
                  <p className="text-[12px] text-[#555555] dark:text-[#D4D4D8] mt-2 leading-relaxed">
                    {selection.festival.description}
                  </p>
                )}
              </div>

              {onScheduleOnDate && (
                <button
                  type="button"
                  onClick={() =>
                    onScheduleOnDate(selection.festival.date, selection.festival.title)
                  }
                  className="w-full h-[34px] rounded-lg bg-[#1A1A1A] dark:bg-[#F4F4F5] hover:bg-[#333333] dark:hover:bg-white text-white dark:text-[#09090B] text-[12px] font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add personal event on this day</span>
                </button>
              )}
            </div>
          )}

          {selection.kind === 'panchang' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-[#ECECEC] dark:border-[#27272E] bg-[#FAFAFA] dark:bg-[#18181D]">
                <div className="text-[14px] font-bold text-[#1A1A1A] dark:text-[#F4F4F5]">
                  {DAY_NAMES_SHORT[selection.date.getDay()]}, {MONTH_NAMES[selection.date.getMonth()]}{' '}
                  {selection.date.getDate()}, {selection.date.getFullYear()}
                </div>
                <div className="text-[11.5px] text-[#666666] dark:text-[#A1A1AA] mt-1">
                  Gujarati Vikram Samvat {selection.panchang.vikramSamvat} · {selection.panchang.monthEn}{' '}
                  {selection.panchang.pakshaEn} {selection.panchang.tithiEn}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#8C8C8C] dark:text-[#71717A]">
                  Active World Calendars
                </div>
                {(enabledWorldCalendars.length > 0
                  ? enabledWorldCalendars
                  : (['gujarati-vikram', 'islamic-hijri', 'hebrew', 'chinese'] as WorldCalendarSystemId[])
                ).map((id) => {
                  const val = convertToWorldCalendar(selection.date, id, gujaratiScript);
                  return (
                    <div
                      key={id}
                      className="p-2.5 rounded-lg border border-[#ECECEC] dark:border-[#27272E] bg-white dark:bg-[#18181D] flex items-center justify-between gap-2"
                    >
                      <span className="text-[11.5px] font-medium text-[#525252] dark:text-[#A1A1AA] truncate">
                        {val.name}
                      </span>
                      <span className="text-[12px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5] text-right">
                        {val.formatted}
                      </span>
                    </div>
                  );
                })}
              </div>

              {onScheduleOnDate && (
                <button
                  type="button"
                  onClick={() => onScheduleOnDate(formatDateKey(selection.date))}
                  className="w-full h-[34px] rounded-lg border border-[#E0E0E0] dark:border-[#2E2E36] bg-white dark:bg-[#18181D] hover:bg-[#F5F5F5] dark:hover:bg-[#23232A] text-[12px] font-medium text-[#1A1A1A] dark:text-[#F4F4F5] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create event on this date</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 4 Evenly-Spaced Clean Tabs — Zero Horizontal Overflow or Squeezing */}
          <div className="px-2.5 py-2 border-b border-[#EBEBEB] dark:border-[#242429] grid grid-cols-4 gap-1 shrink-0 bg-[#FBFBFB] dark:bg-[#111114]">
            {(
              [
                { id: 'agenda', label: 'Agenda', icon: CheckSquare },
                { id: 'weather-time', label: 'Weather', icon: CloudSun },
                { id: 'converter', label: 'Convert', icon: ArrowLeftRight },
                { id: 'timer', label: 'Timer', icon: Timer },
              ] as const
            ).map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`py-1.5 px-1 rounded-md text-[11px] font-medium flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                    active
                      ? 'bg-white dark:bg-[#1E1E25] text-[#1A1A1A] dark:text-[#F4F4F5] border border-[#E2E2E2] dark:border-[#32323B] shadow-2xs'
                      : 'text-[#737373] dark:text-[#A1A1AA] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-[#F0F0F0] dark:hover:bg-[#1A1A20] border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Scrollable Tab Body */}
          <div className="flex-1 overflow-y-auto cal-scroll p-3.5 space-y-4">
            {/* ================= TAB 1: UNIFIED AGENDA & TASKS ================= */}
            {activeTab === 'agenda' && (
              <>
                {/* Selected Day Header */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-[13px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
                      {DAY_NAMES_SHORT[anchorDate.getDay()]}, {MONTH_NAMES[anchorDate.getMonth()].slice(0, 3)}{' '}
                      {anchorDate.getDate()}
                </div>
                <div className="text-[11px] text-[#7A7A7A] dark:text-[#A1A1AA]">
                  {anchorKey === todayKey ? 'Today' : `${anchorDate.getFullYear()}`} · {primaryTz.abbr}
                </div>
              </div>
              <span className="text-[11px] text-[#7A7A7A] dark:text-[#A1A1AA] tabular-nums">
                {dayEvents.length + todayFestivals.length} items
              </span>
            </div>

            {/* Quick Add Event */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!quickTitle.trim()) return;
                onQuickCreateEvent(quickTitle.trim());
                setQuickTitle('');
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="Quick add event..."
                className="flex-1 min-w-0 h-[32px] px-2.5 rounded-md bg-white dark:bg-[#18181D] border border-[#E2E2E2] dark:border-[#2C2C34] text-[12px] text-[#1A1A1A] dark:text-[#F4F4F5] placeholder:text-[#A3A3A3] dark:placeholder:text-[#71717A] focus:outline-none focus:border-[#3B9AE1]"
              />
              <button
                type="submit"
                disabled={!quickTitle.trim()}
                aria-label="Add event"
                className="h-[32px] px-2.5 rounded-md bg-[#1A1A1A] dark:bg-[#F4F4F5] hover:bg-[#333333] dark:hover:bg-white disabled:opacity-40 text-white dark:text-[#09090B] text-[12px] font-medium cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Day Schedule & Holidays */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-[#737373] dark:text-[#A1A1AA] uppercase tracking-wider">
                Schedule &amp; Holidays
              </div>

              {todayFestivals.length === 0 && dayEvents.length === 0 ? (
                <div className="p-3 rounded-lg bg-white dark:bg-[#16161B] border border-[#EFEFEF] dark:border-[#242429] text-[12px] text-[#8C8C8C] dark:text-[#71717A]">
                  Clear day — no events or holidays scheduled.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {todayFestivals.map((fest) => {
                    const layer = layerMap.get(fest.layerId);
                    const theme = COLOR_THEMES[layer?.color || 'crimson'];
                    return (
                      <button
                        key={fest.id}
                        type="button"
                        onClick={() => onSelectFestival(fest)}
                        className="w-full p-2.5 rounded-lg bg-white dark:bg-[#16161B] border border-[#ECECEC] dark:border-[#26262E] hover:border-[#D4D4D4] dark:hover:border-[#3A3A44] text-left flex items-start gap-2.5 transition-colors cursor-pointer"
                      >
                        <span
                          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: theme.dot }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[12.5px] font-medium text-[#1A1A1A] dark:text-[#F4F4F5] truncate">
                            {gujaratiScript && fest.gujaratiTitle ? fest.gujaratiTitle : fest.title}
                          </div>
                          <div className="text-[11px] text-[#7A7A7A] dark:text-[#A1A1AA] truncate">
                            {fest.categoryLabel}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {dayEvents.map((ev) => {
                    const layer = layerMap.get(ev.calendarId);
                    const theme = COLOR_THEMES[ev.color || layer?.color || 'blue'];
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => onSelectEvent(ev)}
                        className="w-full p-2.5 rounded-lg bg-white dark:bg-[#16161B] border border-[#ECECEC] dark:border-[#26262E] hover:border-[#D4D4D4] dark:hover:border-[#3A3A44] text-left flex items-start gap-2.5 transition-colors cursor-pointer"
                      >
                        <span
                          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: layer?.customHex || theme.dot }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[12.5px] font-medium text-[#1A1A1A] dark:text-[#F4F4F5] truncate">
                            {ev.title}
                          </div>
                          <div className="text-[11px] text-[#7A7A7A] dark:text-[#A1A1AA] tabular-nums">
                            {ev.allDay
                              ? 'All day'
                              : `${formatMinutesToTime(ev.startMinutes)} – ${formatMinutesToTime(ev.endMinutes)}`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Unified Tasks Section (inside Agenda) */}
            <div className="pt-3 border-t border-[#EAEAEA] dark:border-[#242429] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#737373] dark:text-[#A1A1AA] uppercase tracking-wider">
                  Tasks
                </span>
                <span className="text-[11px] text-[#8C8C8C] dark:text-[#71717A] tabular-nums">
                  {pendingTaskCount} open
                </span>
              </div>

              <form onSubmit={handleAddTask} className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add a task..."
                    className="flex-1 min-w-0 h-[32px] px-2.5 rounded-md bg-white dark:bg-[#18181D] border border-[#E2E2E2] dark:border-[#2C2C34] text-[12px] text-[#1A1A1A] dark:text-[#F4F4F5] placeholder:text-[#A3A3A3] dark:placeholder:text-[#71717A] focus:outline-none focus:border-[#3B9AE1]"
                  />
                  <select
                    value={newTaskPriority}
                    onChange={(e) =>
                      setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')
                    }
                    aria-label="Task priority"
                    className="h-[32px] px-1.5 rounded-md bg-white dark:bg-[#18181D] border border-[#E2E2E2] dark:border-[#2C2C34] text-[11px] text-[#525252] dark:text-[#D4D4D8]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Med</option>
                    <option value="high">High</option>
                  </select>
                  <button
                    type="submit"
                    disabled={!newTaskTitle.trim()}
                    aria-label="Add task"
                    className="h-[32px] px-2.5 rounded-md bg-[#1A1A1A] dark:bg-[#F4F4F5] hover:bg-[#333333] dark:hover:bg-white disabled:opacity-40 text-white dark:text-[#09090B] cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              {tasks.length === 0 ? (
                <p className="text-[12px] text-[#8C8C8C] dark:text-[#71717A] py-1">
                  No tasks yet. Add one above to track alongside your agenda.
                </p>
              ) : (
                <div className="space-y-1">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="group flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-[#16161B] border border-[#EFEFEF] dark:border-[#26262E] hover:border-[#DCDCDC] dark:hover:border-[#3A3A44]"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task.id)}
                        aria-label={`Toggle ${task.title}`}
                        className={`mt-0.5 w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                          task.completed
                            ? 'bg-[#1A1A1A] dark:bg-[#F4F4F5] border-[#1A1A1A] dark:border-[#F4F4F5] text-white dark:text-[#09090B]'
                            : 'border-[#CCCCCC] dark:border-[#3A3A44] bg-white dark:bg-[#111114] hover:border-[#1A1A1A] dark:hover:border-[#F4F4F5]'
                        }`}
                      >
                        {task.completed && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-[12.5px] leading-snug break-words ${
                            task.completed
                              ? 'line-through text-[#9A9A9A] dark:text-[#71717A]'
                              : 'text-[#1A1A1A] dark:text-[#F4F4F5]'
                          }`}
                        >
                          {task.title}
                        </div>
                        {task.dueDate && (
                          <div className="text-[10.5px] text-[#8C8C8C] dark:text-[#71717A] tabular-nums mt-0.5">
                            {task.dueDate}
                            {task.priority === 'high' ? ' · High priority' : ''}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        aria-label="Delete task"
                        className="p-1 rounded text-[#A3A3A3] dark:text-[#71717A] hover:text-[#C92A2A] dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Collapsible Share Availability */}
            <div className="pt-3 border-t border-[#EAEAEA] dark:border-[#242429]">
              <button
                type="button"
                onClick={() => setShareOpen((v) => !v)}
                className="w-full flex items-center justify-between text-[11.5px] font-semibold text-[#666666] dark:text-[#A1A1AA] hover:text-[#1A1A1A] dark:hover:text-white cursor-pointer"
              >
                <span>Share Availability ({shareSlots.length})</span>
                {shareOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>

              {(shareOpen || isShareMode || shareSlots.length > 0) && (
                <div className="mt-2.5 space-y-2">
                  <button
                    type="button"
                    onClick={onToggleShareMode}
                    className={`w-full py-1.5 px-2.5 rounded-md text-[12px] font-medium border transition-colors cursor-pointer ${
                      isShareMode
                        ? 'bg-[#1A1A1A] dark:bg-[#F4F4F5] text-white dark:text-[#09090B] border-[#1A1A1A] dark:border-[#F4F4F5]'
                        : 'bg-white dark:bg-[#18181D] text-[#1A1A1A] dark:text-[#F4F4F5] border-[#DCDCDC] dark:border-[#2E2E36] hover:bg-[#F3F3F3] dark:hover:bg-[#23232A]'
                    }`}
                  >
                    {isShareMode ? 'Done selecting slots' : 'Pick open slots on grid'}
                  </button>

                  {shareSlots.length > 0 && (
                    <div className="space-y-1">
                      {shareSlots.map((slot) => (
                        <div
                          key={slot.id}
                          className="px-2.5 py-1.5 rounded bg-white dark:bg-[#16161B] border border-[#EAEAEA] dark:border-[#26262E] text-[#1A1A1A] dark:text-[#F4F4F5] flex items-center justify-between text-[11.5px] tabular-nums"
                        >
                          <span>
                            {slot.dateKey} · {formatMinutesToTime(slot.startMinutes)}–
                            {formatMinutesToTime(slot.endMinutes)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveShareSlot(slot.id)}
                            className="text-[#9A9A9A] dark:text-[#71717A] hover:text-[#C92A2A] dark:hover:text-red-400 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={onCopyShareText}
                          className="flex-1 py-1.5 rounded-md bg-[#1A1A1A] dark:bg-[#F4F4F5] text-white dark:text-[#09090B] text-[11.5px] font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy times</span>
                        </button>
                        <button
                          type="button"
                          onClick={onClearShareSlots}
                          className="px-2.5 py-1.5 rounded-md border border-[#DCDCDC] dark:border-[#2E2E36] text-[11.5px] text-[#666666] dark:text-[#A1A1AA] hover:bg-[#F3F3F3] dark:hover:bg-[#23232A] cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ================= TAB 2: UNIFIED WEATHER + WORLD TIME ================= */}
        {activeTab === 'weather-time' && (
          <div className="space-y-4">
            {/* Live Local Weather Card */}
            <div className="rounded-xl bg-white dark:bg-[#16161B] border border-[#E6E6E6] dark:border-[#26262E] p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-[#737373] dark:text-[#A1A1AA] shrink-0" />
                  <span className="text-[12.5px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5] truncate">
                    {weather?.location.name || weatherLocationQuery.split(',')[0]}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <div className="inline-flex rounded border border-[#E2E2E2] dark:border-[#2E2E36] overflow-hidden text-[10.5px] font-medium">
                    <button
                      type="button"
                      onClick={() => onChangeWeatherUnits('METRIC')}
                      className={`px-1.5 py-0.5 cursor-pointer ${
                        weatherUnits === 'METRIC'
                          ? 'bg-[#1A1A1A] dark:bg-[#F4F4F5] text-white dark:text-[#09090B]'
                          : 'bg-white dark:bg-[#1C1C22] text-[#666666] dark:text-[#A1A1AA]'
                      }`}
                    >
                      °C
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeWeatherUnits('IMPERIAL')}
                      className={`px-1.5 py-0.5 cursor-pointer ${
                        weatherUnits === 'IMPERIAL'
                          ? 'bg-[#1A1A1A] dark:bg-[#F4F4F5] text-white dark:text-[#09090B]'
                          : 'bg-white dark:bg-[#1C1C22] text-[#666666] dark:text-[#A1A1AA]'
                      }`}
                    >
                      °F
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={onRefreshWeather}
                    disabled={weatherLoading}
                    aria-label="Refresh weather"
                    className="p-1 rounded hover:bg-[#F2F2F2] dark:hover:bg-[#23232A] text-[#737373] dark:text-[#A1A1AA] cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${weatherLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {weatherError && (
                <div className="p-2.5 rounded-lg bg-[#FFF5F5] dark:bg-red-950/60 border border-[#F5C2C7] dark:border-red-800/60 text-[11.5px] text-[#8A1520] dark:text-red-300">
                  {weatherError}
                </div>
              )}

              {weatherLoading && !weather && (
                <div className="py-5 text-center text-[12px] text-[#7A7A7A] dark:text-[#A1A1AA]">
                  Loading live forecast...
                </div>
              )}

              {weather && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[#FAFAFA] dark:bg-[#1E1E25] border border-[#EFEFEF] dark:border-[#2C2C34] flex items-center justify-center shrink-0">
                        <WeatherConditionIcon
                          iconBaseUri={weather.current.iconBaseUri}
                          conditionType={weather.current.conditionType}
                          isDaytime={weather.current.isDaytime}
                          alt={weather.current.conditionText}
                          className="w-6 h-6"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[24px] font-bold text-[#1A1A1A] dark:text-[#F4F4F5] leading-none tabular-nums">
                          {formatTempRounded(weather.current.temperature)}
                          <span className="text-[12px] font-normal text-[#737373] dark:text-[#A1A1AA] ml-0.5">
                            {weather.current.tempUnitSymbol}
                          </span>
                        </div>
                        <div className="text-[11.5px] text-[#525252] dark:text-[#A1A1AA] truncate mt-1">
                          {weather.current.conditionText}
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-[#737373] dark:text-[#A1A1AA] tabular-nums shrink-0">
                      {weather.current.feelsLike !== null && (
                        <div>Feels {formatTempRounded(weather.current.feelsLike)}</div>
                      )}
                      <div>
                        H:{formatTempRounded(todayForecast?.maxTemp ?? weather.current.high24h)} · L:
                        {formatTempRounded(todayForecast?.minTemp ?? weather.current.low24h)}
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-4 gap-1 text-center pt-2 border-t border-[#F2F2F2] dark:border-[#242429]">
                    <div className="py-1 rounded bg-[#FAFAFA] dark:bg-[#1C1C22]">
                      <div className="text-[9.5px] text-[#8C8C8C] dark:text-[#71717A] flex items-center justify-center gap-0.5">
                        <Umbrella className="w-2.5 h-2.5" />
                        <span>Rain</span>
                      </div>
                      <div className="text-[11.5px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5] tabular-nums">
                        {weather.current.precipPercent !== null
                          ? `${weather.current.precipPercent}%`
                          : '--'}
                      </div>
                    </div>
                    <div className="py-1 rounded bg-[#FAFAFA] dark:bg-[#1C1C22]">
                      <div className="text-[9.5px] text-[#8C8C8C] dark:text-[#71717A] flex items-center justify-center gap-0.5">
                        <Droplets className="w-2.5 h-2.5" />
                        <span>Humid</span>
                      </div>
                      <div className="text-[11.5px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5] tabular-nums">
                        {weather.current.humidity !== null ? `${weather.current.humidity}%` : '--'}
                      </div>
                    </div>
                    <div className="py-1 rounded bg-[#FAFAFA] dark:bg-[#1C1C22]">
                      <div className="text-[9.5px] text-[#8C8C8C] dark:text-[#71717A] flex items-center justify-center gap-0.5">
                        <Wind className="w-2.5 h-2.5" />
                        <span>Wind</span>
                      </div>
                      <div className="text-[11.5px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5] tabular-nums truncate px-0.5">
                        {weather.current.windSpeed !== null
                          ? `${Math.round(weather.current.windSpeed)}`
                          : '--'}
                      </div>
                    </div>
                    <div className="py-1 rounded bg-[#FAFAFA] dark:bg-[#1C1C22]">
                      <div className="text-[9.5px] text-[#8C8C8C] dark:text-[#71717A] flex items-center justify-center gap-0.5">
                        <Sun className="w-2.5 h-2.5" />
                        <span>UV</span>
                      </div>
                      <div className="text-[11.5px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5] tabular-nums">
                        {weather.current.uvIndex !== null ? weather.current.uvIndex : '--'}
                      </div>
                    </div>
                  </div>

                  {/* 5-Day Forecast */}
                  {weather.daily.length > 0 && (
                    <div className="pt-2 border-t border-[#F2F2F2] dark:border-[#242429] divide-y divide-[#F5F5F5] dark:divide-[#242429]">
                      {weather.daily.slice(0, 5).map((day) => {
                        const d = parseDateKey(day.dateKey);
                        const isToday = day.dateKey === todayKey;
                        return (
                          <button
                            key={day.dateKey}
                            type="button"
                            onClick={() => onJumpToDate(d)}
                            className="w-full py-1.5 flex items-center justify-between gap-2 text-[11.5px] hover:bg-[#FAFAFA] dark:hover:bg-[#1E1E25] rounded px-1 -mx-1 cursor-pointer"
                          >
                            <span
                              className={`w-[54px] text-left shrink-0 ${
                                isToday ? 'font-semibold text-[#DC2626]' : 'font-medium text-[#262626] dark:text-[#E4E4E7]'
                              }`}
                            >
                              {isToday ? 'Today' : `${DAY_NAMES_SHORT[d.getDay()]} ${d.getDate()}`}
                            </span>
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <WeatherConditionIcon
                                iconBaseUri={day.iconBaseUri}
                                conditionType={day.conditionType}
                                isDaytime
                                alt={day.conditionText}
                                className="w-3.5 h-3.5"
                              />
                              <span className="text-[#666666] dark:text-[#A1A1AA] truncate">{day.conditionText}</span>
                            </div>
                            <span className="tabular-nums text-[#1A1A1A] dark:text-[#F4F4F5] font-medium shrink-0">
                              <span className="text-[#8C8C8C] dark:text-[#71717A] font-normal mr-1">
                                {formatTempRounded(day.minTemp)}
                              </span>
                              {formatTempRounded(day.maxTemp)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Switch City / GPS */}
              <div className="pt-2 border-t border-[#F2F2F2] dark:border-[#242429] space-y-1.5">
                <form onSubmit={handleWeatherCitySubmit} className="flex items-center gap-1.5">
                  <div className="relative flex-1 min-w-0">
                    <Search className="w-3 h-3 text-[#9A9A9A] dark:text-[#71717A] absolute left-2 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={weatherCityDraft}
                      onChange={(e) => setWeatherCityDraft(e.target.value)}
                      placeholder="Change city..."
                      className="w-full h-[28px] pl-6 pr-2 rounded border border-[#E2E2E2] dark:border-[#2E2E36] bg-white dark:bg-[#111114] text-[11.5px] text-[#1A1A1A] dark:text-[#F4F4F5] placeholder:text-[#A3A3A3] dark:placeholder:text-[#71717A] focus:outline-none focus:border-[#3B9AE1]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!weatherCityDraft.trim() || weatherLoading}
                    className="h-[28px] px-2.5 rounded bg-[#1A1A1A] dark:bg-[#F4F4F5] text-white dark:text-[#09090B] text-[11px] font-medium disabled:opacity-40 cursor-pointer"
                  >
                    Set
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => {
                    setGeoBusy(true);
                    onUseWeatherGeolocation();
                    window.setTimeout(() => setGeoBusy(false), 1200);
                  }}
                  disabled={geoBusy || weatherLoading}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#185D8F] dark:text-[#60A5FA] hover:underline cursor-pointer"
                >
                  <LocateFixed className="w-3 h-3" />
                  <span>{geoBusy ? 'Locating...' : 'Use my GPS location'}</span>
                </button>
              </div>
            </div>

            {/* Unified World Clocks Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#525252] dark:text-[#A1A1AA]" />
                  <span className="text-[11px] font-semibold text-[#737373] dark:text-[#A1A1AA] uppercase tracking-wider">
                    World Clocks
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCity((v) => !v)}
                  className="text-[11px] font-medium text-[#185D8F] dark:text-[#60A5FA] hover:underline cursor-pointer"
                >
                  {showAddCity ? 'Close' : '+ Add city'}
                </button>
              </div>

              {showAddCity && (
                <div className="p-2 rounded-lg bg-white dark:bg-[#16161B] border border-[#E2E2E2] dark:border-[#26262E] flex flex-wrap gap-1">
                  {PRESET_WORLD_CITIES.filter((c) => !selectedClockIds.includes(c.id)).map(
                    (city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => handleAddClockCity(city.id)}
                        className="px-2 py-1 rounded bg-[#F5F5F5] dark:bg-[#1E1E25] hover:bg-[#EAEAEA] dark:hover:bg-[#272730] text-[11px] text-[#1A1A1A] dark:text-[#F4F4F5] cursor-pointer"
                      >
                        {city.name}
                      </button>
                    )
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                {activeCities.map((city) => {
                  const info = getCityTimeInfo(city, nowTick);
                  return (
                    <div
                      key={city.id}
                      className="group p-2.5 rounded-lg bg-white dark:bg-[#16161B] border border-[#ECECEC] dark:border-[#26262E] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5] truncate">
                          {city.name}
                        </div>
                        <div className="text-[10.5px] text-[#7A7A7A] dark:text-[#A1A1AA] truncate">
                          {info.dateString} · {info.utcOffsetString}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right tabular-nums">
                          <div className="text-[13.5px] font-semibold font-mono text-[#1A1A1A] dark:text-[#F4F4F5]">
                            {info.timeShortString}{' '}
                            <span className="text-[10px] font-sans font-medium text-[#737373] dark:text-[#A1A1AA]">
                              {info.ampm}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#8C8C8C] dark:text-[#71717A]">
                            {info.isBusinessHours ? 'Work hours' : info.isDaytime ? 'Day' : 'Night'}
                          </div>
                        </div>
                        {activeCities.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveClockCity(city.id)}
                            aria-label={`Remove ${city.name}`}
                            className="p-0.5 text-[#A3A3A3] dark:text-[#71717A] hover:text-[#C92A2A] dark:hover:text-red-400 opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {overlapInfo && overlapInfo.bestWindows.length > 0 && (
                <div className="p-2.5 rounded-lg bg-[#F5F7FA] dark:bg-[#161922] border border-[#E2E8F0] dark:border-[#262E3F] text-[11.5px] text-[#334155] dark:text-[#CBD5E1]">
                  <span className="font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">Overlap window: </span>
                  <span className="font-mono tabular-nums">
                    {overlapInfo.bestWindows.slice(0, 2).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: UNIVERSAL DATE CONVERTER ================= */}
        {activeTab === 'converter' && (
          <div className="space-y-3.5">
            <div className="p-3 rounded-xl bg-white dark:bg-[#16161B] border border-[#E6E6E6] dark:border-[#26262E] space-y-3">
              <div className="text-[12px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]">
                Universal Date Converter
              </div>

              <div>
                <label className="block text-[11px] text-[#737373] dark:text-[#A1A1AA] mb-1">Gregorian Date</label>
                <input
                  type="date"
                  value={converterDateStr}
                  onChange={(e) => setConverterDateStr(e.target.value)}
                  className="w-full h-[32px] px-2.5 rounded-md border border-[#DCDCDC] dark:border-[#2E2E36] bg-white dark:bg-[#111114] text-[12px] text-[#1A1A1A] dark:text-[#F4F4F5] font-mono tabular-nums"
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-[11px] text-[#737373] dark:text-[#A1A1AA] mb-1">Source System</label>
                  <select
                    value={converterFromSys}
                    onChange={(e) => setConverterFromSys(e.target.value as WorldCalendarSystemId)}
                    className="w-full h-[32px] px-2 rounded-md border border-[#DCDCDC] dark:border-[#2E2E36] bg-white dark:bg-[#111114] text-[12px] text-[#1A1A1A] dark:text-[#F4F4F5]"
                  >
                    {WORLD_CALENDAR_SYSTEMS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-[12px] font-medium text-[#1A1A1A] dark:text-[#F4F4F5] bg-[#FAFAFA] dark:bg-[#1C1C22] px-2.5 py-1.5 rounded border border-[#EFEFEF] dark:border-[#27272E]">
                    {fromConversion.formatted}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[#737373] dark:text-[#A1A1AA] mb-1">Target System</label>
                  <select
                    value={converterToSys}
                    onChange={(e) => setConverterToSys(e.target.value as WorldCalendarSystemId)}
                    className="w-full h-[32px] px-2 rounded-md border border-[#DCDCDC] dark:border-[#2E2E36] bg-white dark:bg-[#111114] text-[12px] text-[#1A1A1A] dark:text-[#F4F4F5]"
                  >
                    {WORLD_CALENDAR_SYSTEMS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-[12px] font-semibold text-[#185D8F] dark:text-sky-300 bg-[#F0F9FF] dark:bg-sky-950/40 px-2.5 py-1.5 rounded border border-[#CBE7FA] dark:border-sky-800/50">
                    {toConversion.formatted}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onJumpToDate(converterDateObj)}
                className="w-full py-1.5 rounded-md bg-[#1A1A1A] dark:bg-[#F4F4F5] hover:bg-[#333333] dark:hover:bg-white text-white dark:text-[#09090B] text-[12px] font-medium cursor-pointer"
              >
                Jump Calendar to This Date
              </button>
            </div>

            {enabledWorldCalendars.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#737373] dark:text-[#A1A1AA] uppercase tracking-wider">
                    Active World Calendars
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenSettings('world')}
                    className="text-[11px] text-[#185D8F] dark:text-[#60A5FA] hover:underline cursor-pointer"
                  >
                    Manage
                  </button>
                </div>
                <div className="divide-y divide-[#F0F0F0] dark:divide-[#242429] rounded-lg bg-white dark:bg-[#16161B] border border-[#ECECEC] dark:border-[#26262E] px-3">
                  {enabledWorldCalendars.map((sysId) => {
                    const val = convertToWorldCalendar(converterDateObj, sysId, gujaratiScript);
                    return (
                      <div key={sysId} className="py-2">
                        <div className="text-[11px] text-[#737373] dark:text-[#A1A1AA]">{val.name}</div>
                        <div className="text-[12px] font-medium text-[#1A1A1A] dark:text-[#F4F4F5] mt-0.5">
                          {val.formatted}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: TIME TRACKER ================= */}
        {activeTab === 'timer' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#16161B] border border-[#E6E6E6] dark:border-[#26262E] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#737373] dark:text-[#A1A1AA] uppercase tracking-wider">
                  Focus Timer
                </span>
                <span className="text-[18px] font-bold font-mono tabular-nums text-[#1A1A1A] dark:text-[#F4F4F5]">
                  {runningElapsedStr}
                </span>
              </div>

              {runningTimer ? (
                <div className="space-y-2">
                  <div className="text-[12.5px] font-medium text-[#1A1A1A] dark:text-[#F4F4F5] truncate">
                    {runningTimer.activityName}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = stopLiveTimer();
                      setTimeEntries(next);
                      showToast?.('Timer stopped and logged.');
                    }}
                    className="w-full py-2 rounded-md bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[12px] font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop &amp; Save Session</span>
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const next = startLiveTimer(timerName || 'Focus Session', timerCategory);
                    setTimeEntries(next);
                    setTimerName('');
                  }}
                  className="space-y-2"
                >
                  <input
                    type="text"
                    value={timerName}
                    onChange={(e) => setTimerName(e.target.value)}
                    placeholder="What are you working on?"
                    className="w-full h-[32px] px-2.5 rounded-md border border-[#DCDCDC] dark:border-[#2E2E36] bg-white dark:bg-[#111114] text-[12px] text-[#1A1A1A] dark:text-[#F4F4F5] placeholder:text-[#A3A3A3] dark:placeholder:text-[#71717A]"
                  />
                  <div className="flex items-center gap-1.5">
                    <select
                      value={timerCategory}
                      onChange={(e) => setTimerCategory(e.target.value as TrackingCategory)}
                      className="flex-1 h-[32px] px-2 rounded-md border border-[#DCDCDC] dark:border-[#2E2E36] bg-white dark:bg-[#111114] text-[12px] text-[#1A1A1A] dark:text-[#F4F4F5]"
                    >
                      {(Object.keys(CATEGORY_META) as TrackingCategory[]).map((k) => (
                        <option key={k} value={k}>
                          {CATEGORY_META[k].label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="h-[32px] px-3 rounded-md bg-[#1A1A1A] dark:bg-[#F4F4F5] hover:bg-[#333333] dark:hover:bg-white text-white dark:text-[#09090B] text-[12px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Start</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#16161B] border border-[#ECECEC] dark:border-[#26262E]">
                <div className="text-[10.5px] text-[#8C8C8C] dark:text-[#71717A]">Today</div>
                <div className="text-[14px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5] tabular-nums mt-0.5">
                  {(timerAnalytics.totalMinutesToday / 60).toFixed(1)}h
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#16161B] border border-[#ECECEC] dark:border-[#26262E]">
                <div className="text-[10.5px] text-[#8C8C8C] dark:text-[#71717A]">This Week</div>
                <div className="text-[14px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5] tabular-nums mt-0.5">
                  {(timerAnalytics.totalMinutesWeek / 60).toFixed(1)}h
                </div>
              </div>
            </div>

            {timerAnalytics.recentEntries.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-[#737373] dark:text-[#A1A1AA] uppercase tracking-wider">
                  Recent Sessions
                </div>
                <div className="space-y-1">
                  {timerAnalytics.recentEntries.slice(0, 6).map((entry) => (
                    <div
                      key={entry.id}
                      className="group p-2 rounded-lg bg-white dark:bg-[#16161B] border border-[#EFEFEF] dark:border-[#26262E] flex items-center justify-between gap-2 text-[12px]"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-[#1A1A1A] dark:text-[#F4F4F5] truncate">
                          {entry.activityName}
                        </div>
                        <div className="text-[10.5px] text-[#8C8C8C] dark:text-[#71717A] tabular-nums">
                          {CATEGORY_META[entry.category].label} · {entry.durationMinutes}m
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTimeEntries(deleteTimeEntry(entry.id))}
                        aria-label="Delete session"
                        className="p-1 text-[#A3A3A3] dark:text-[#71717A] hover:text-[#C92A2A] dark:hover:text-red-400 opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
        </>
      )}
    </aside>
  );
};
