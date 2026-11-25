import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  HelpCircle,
  PanelLeft,
  PanelRight,
  Search,
  SlidersHorizontal,
  User,
} from 'lucide-react';
import {
  AvailabilitySlot,
  CalendarColorKey,
  CalendarEvent,
  CalendarLayer,
  FestivalItem,
  GoogleUserProfile,
  PendingGoogleMutation,
  TimezoneOption,
  UserAccount,
  ViewMode,
  WorldCalendarSystemId,
} from './types/calendar';
import { INITIAL_GROUPS, INITIAL_LAYERS, buildInitialEvents } from './data/initialData';
import { getGujaratiPanchang } from './data/gujaratiPanchang';
import {
  DEFAULT_ENABLED_WORLD_CALENDARS,
  WORLD_CALENDAR_SYSTEMS,
  convertToWorldCalendar,
} from './data/worldCalendars';
import {
  createGoogleEvent,
  deleteGoogleEvent,
  fetchGoogleCalendars,
  fetchGoogleEventsRange,
  getAccessToken,
  googleSignIn,
  initAuth,
  logoutGoogle,
  updateGoogleEvent,
} from './services/googleCalendar';
import {
  MONTH_NAMES,
  TIMEZONE_OPTIONS,
  addDays,
  formatDateKey,
  formatTimeRange,
  getLocalDeviceTimezoneOption,
  getVisibleDays,
  isSameDay,
  parseDateKey,
} from './utils/dateUtils';
import { LeftSidebar } from './components/LeftSidebar';
import { TimeGrid } from './components/TimeGrid';
import { MonthView } from './components/MonthView';
import { RightPanel, RightSelection } from './components/RightPanel';
import { ActiveModal, Modals } from './components/Modals';
import { SettingsModal, SettingsTab } from './components/SettingsModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { WeatherWidget } from './components/WeatherWidget';
import { useViewport } from './hooks/useViewport';
import { ExportModal } from './components/ExportModal';
import { ShortcutsHelpModal } from './components/ShortcutsHelpModal';
import { AuthModal } from './components/AuthModal';
import { LegalDocId, LegalModal } from './components/LegalModal';
import { fetchCurrentAccount, getStoredUser } from './services/authClient';
import {
  DailyForecastItem,
  ResolvedLocation,
  WeatherBundle,
  WeatherUnits,
  fetchWeatherForCityQuery,
  fetchWeatherForCoords,
  getDefaultCityQueryForTimezone,
  reverseGeocodeCoords,
} from './services/weatherService';

const STORAGE_EVENTS_KEY = 'calendar_q_events_v2';
const STORAGE_LAYERS_KEY = 'calendar_q_layers_v2';
const STORAGE_PREFS_KEY = 'calendar_q_prefs_v2';

const VIEW_LABELS: Record<ViewMode, string> = {
  day: 'Day',
  '3days': '3 days',
  '5days': '5 days',
  week: 'Week',
  month: 'Month',
};

export default function App() {
  const [today, setToday] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  const viewport = useViewport();
  const prevWidthRef = useRef<number>(viewport.width);

  const [anchorDate, setAnchorDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [viewMode, setViewMode] = useState<ViewMode>('5days');
  const [mobileViewOverride, setMobileViewOverride] = useState<ViewMode | null>(null);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);

  // Automatic midnight detection & daylight saving update
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      const cur = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      setToday((prev) => {
        if (prev.getTime() !== cur.getTime()) {
          setAnchorDate((prevAnchor) => (isSameDay(prevAnchor, prev) ? cur : prevAnchor));
          return cur;
        }
        return prev;
      });
    };

    const timer = setInterval(checkMidnight, 10000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkMidnight();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', checkMidnight);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', checkMidnight);
    };
  }, []);

  const [leftOpen, setLeftOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [rightOpen, setRightOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1200 : true
  );
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  const [layers, setLayers] = useState<CalendarLayer[]>(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_LAYERS_KEY) ||
        localStorage.getItem('calander_q_layers_v2') ||
        localStorage.getItem('samay_calendar_layers_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const savedIds = new Set(parsed.map((l: CalendarLayer) => l.id));
          const missingInitial = INITIAL_LAYERS.filter((l) => !savedIds.has(l.id));
          return [...parsed, ...missingInitial];
        } else if (typeof parsed === 'object' && parsed !== null) {
          const map = parsed as Record<string, boolean>;
          return INITIAL_LAYERS.map((l) =>
            typeof map[l.id] === 'boolean' ? { ...l, visible: map[l.id] } : l
          );
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_LAYERS;
  });

  // Local events (starts cleanly empty — zero fake sample events!)
  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_EVENTS_KEY) ||
        localStorage.getItem('calander_q_events_v2') ||
        localStorage.getItem('samay_calendar_events_v2');
      if (saved) {
        const parsed = JSON.parse(saved) as CalendarEvent[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return buildInitialEvents();
  });

  // Google Calendar real synced state (access token cached strictly in memory inside googleCalendar.ts)
  const [googleUser, setGoogleUser] = useState<GoogleUserProfile | null>(null);
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [pendingMutation, setPendingMutation] =
    useState<PendingGoogleMutation | null>(null);
  const [mutationBusy, setMutationBusy] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFS_KEY);
      if (saved && JSON.parse(saved).selectedLanguage) {
        return JSON.parse(saved).selectedLanguage;
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  const [gujaratiScript, setGujaratiScript] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFS_KEY);
      if (saved) return Boolean(JSON.parse(saved).gujaratiScript);
    } catch {
      // ignore
    }
    return false;
  });

  const [enabledWorldCalendars, setEnabledWorldCalendars] = useState<
    WorldCalendarSystemId[]
  >(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFS_KEY);
      if (saved) {
        const arr = JSON.parse(saved).enabledWorldCalendars;
        // Only restore saved selection if the user explicitly chose ≤ 3 calendars.
        // If more than 3 are stored it means the old default-all behaviour populated
        // them — reset to empty so the UI starts clean.
        if (Array.isArray(arr) && arr.length <= 3) return arr;
        if (Array.isArray(arr) && arr.length > 3) return [];
      }
    } catch {
      // ignore
    }
    return DEFAULT_ENABLED_WORLD_CALENDARS; // now [] since all defaultEnabled: false
  });

  const [headerSubCalendar, setHeaderSubCalendar] = useState<
    WorldCalendarSystemId | 'none'
  >(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFS_KEY);
      if (saved && JSON.parse(saved).headerSubCalendar) {
        return JSON.parse(saved).headerSubCalendar;
      }
    } catch {
      // ignore
    }
    return 'gujarati-vikram';
  });

  const [primaryTz, setPrimaryTz] = useState<TimezoneOption>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFS_KEY);
      if (saved) {
        const id = JSON.parse(saved).primaryTzId;
        const found = TIMEZONE_OPTIONS.find((t) => t.id === id);
        if (found) return found;
      }
    } catch {
      // ignore
    }
    return getLocalDeviceTimezoneOption();
  });

  const [secondaryTz, setSecondaryTz] = useState<TimezoneOption>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFS_KEY);
      if (saved) {
        const id = JSON.parse(saved).secondaryTzId;
        const found = TIMEZONE_OPTIONS.find((t) => t.id === id);
        if (found) return found;
      }
    } catch {
      // ignore
    }
    return TIMEZONE_OPTIONS[2]; // PST
  });

  // Weather preferences (primary calendar location query & units)
  const [weatherUnits, setWeatherUnits] = useState<WeatherUnits>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFS_KEY);
      if (saved) {
        const u = JSON.parse(saved).weatherUnits;
        if (u === 'IMPERIAL' || u === 'METRIC') return u;
      }
    } catch {
      // ignore
    }
    return 'METRIC';
  });

  const [customWeatherCity, setCustomWeatherCity] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFS_KEY);
      if (saved && typeof JSON.parse(saved).customWeatherCity === 'string') {
        const city = JSON.parse(saved).customWeatherCity.trim();
        return city || null;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [geoLocation, setGeoLocation] = useState<ResolvedLocation | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherBundle | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const weatherLocationQuery = useMemo(
    () => customWeatherCity || getDefaultCityQueryForTimezone(primaryTz.id),
    [customWeatherCity, primaryTz.id]
  );

  const [activeCalendarId, setActiveCalendarId] = useState<string>('personal');
  const [selection, setSelection] = useState<RightSelection>({ kind: 'none' });
  const [shareMode, setShareMode] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('festivals');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalInitialDoc, setLegalInitialDoc] = useState<LegalDocId>('privacy');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getStoredUser());

  useEffect(() => {
    fetchCurrentAccount().then((user) => {
      if (user) setCurrentUser(user);
    });
  }, []);

  const viewMenuRef = useRef<HTMLDivElement>(null);
  const meetInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 2400);
  }, []);

  const handleImportEvents = useCallback((imported: CalendarEvent[]) => {
    setLocalEvents((prev) => [...prev, ...imported]);
    showToast(`Successfully imported ${imported.length} events`);
  }, [showToast]);

  const handleSelectLanguage = useCallback((code: string) => {
    setSelectedLanguage(code);
    if (code === 'gu') {
      setGujaratiScript(true);
    }
    showToast(`Language set to ${code.toUpperCase()}`);
  }, [showToast]);

  const openSettings = useCallback((tab: SettingsTab = 'festivals') => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  }, []);

  // Combined events (local + synced Google Calendar events)
  const allEvents = useMemo(
    () => [...localEvents, ...googleEvents],
    [localEvents, googleEvents]
  );

  // Persist local events, non-Google layer toggles, and preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(localEvents));
    } catch {
      // ignore
    }
  }, [localEvents]);

  useEffect(() => {
    try {
      const nonGoogle = layers.filter((l) => l.type !== 'google');
      localStorage.setItem(STORAGE_LAYERS_KEY, JSON.stringify(nonGoogle));
    } catch {
      // ignore
    }
  }, [layers]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_PREFS_KEY,
        JSON.stringify({
          selectedLanguage,
          gujaratiScript,
          enabledWorldCalendars,
          headerSubCalendar,
          primaryTzId: primaryTz.id,
          secondaryTzId: secondaryTz.id,
          weatherUnits,
          customWeatherCity,
        })
      );
    } catch {
      // ignore
    }
  }, [
    selectedLanguage,
    gujaratiScript,
    enabledWorldCalendars,
    headerSubCalendar,
    primaryTz,
    secondaryTz,
    weatherUnits,
    customWeatherCity,
  ]);

  // Listen for Google Maps Platform Demo Key quota exceeded events (Tier 1 & Tier 2)
  useEffect(() => {
    const onQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  // Gracefully collapse/restore sidebars when resizing across responsive breakpoints
  useEffect(() => {
    const prevW = prevWidthRef.current;
    const nextW = viewport.width;
    prevWidthRef.current = nextW;

    if (prevW >= 1200 && nextW < 1200) {
      setRightOpen(false);
    }
    if (prevW >= 1024 && nextW < 1024) {
      setLeftOpen(false);
      setRightOpen(false);
    } else if (prevW < 1024 && nextW >= 1024) {
      setLeftOpen(true);
    }
    if (nextW >= 720 && mobileViewOverride !== null) {
      setMobileViewOverride(null);
    }
  }, [viewport.width, mobileViewOverride]);

  // Fetch live weather forecast from Google Maps Platform Weather API
  const loadWeather = useCallback(
    async (forceRefresh = false) => {
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        const bundle = geoLocation
          ? await fetchWeatherForCoords(geoLocation, weatherUnits, forceRefresh)
          : await fetchWeatherForCityQuery(
              weatherLocationQuery,
              weatherUnits,
              forceRefresh
            );
        setWeatherData(bundle);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Unable to load weather forecast.';
        setWeatherError(msg);
      } finally {
        setWeatherLoading(false);
      }
    },
    [geoLocation, weatherLocationQuery, weatherUnits]
  );

  useEffect(() => {
    void loadWeather(false);
  }, [loadWeather]);

  const handleSetWeatherCity = useCallback(
    (city: string) => {
      const cleaned = city.trim();
      if (!cleaned) return;
      setGeoLocation(null);
      setCustomWeatherCity(cleaned);
      showToast(`Weather location updated to ${cleaned}`);
    },
    [showToast]
  );

  const handleUseWeatherGeolocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setWeatherError('Geolocation is not supported in this browser.');
      return;
    }
    setWeatherLoading(true);
    setWeatherError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const resolved = await reverseGeocodeCoords(
            pos.coords.latitude,
            pos.coords.longitude
          );
          setGeoLocation(resolved);
          showToast(`Weather synced to ${resolved.name}`);
        } catch (err: unknown) {
          setWeatherError(
            err instanceof Error ? err.message : 'Could not resolve your location.'
          );
          setWeatherLoading(false);
        }
      },
      (geoErr) => {
        setWeatherLoading(false);
        setWeatherError(
          geoErr.code === geoErr.PERMISSION_DENIED
            ? 'Location permission was declined. Enter a city name instead.'
            : 'Unable to determine current location.'
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, [showToast]);

  const dailyForecastByDate = useMemo(() => {
    const map = new Map<string, DailyForecastItem>();
    if (weatherData?.daily) {
      for (const item of weatherData.daily) {
        map.set(item.dateKey, item);
      }
    }
    return map;
  }, [weatherData]);

  // Sync Google Calendar list + events around anchorDate
  const syncGoogleCalendarData = useCallback(
    async (explicitToken?: string, refDate?: Date) => {
      const token = explicitToken || getAccessToken();
      if (!token) return;
      setGoogleSyncing(true);
      setGoogleError(null);
      try {
        const gLayers = await fetchGoogleCalendars(token);
        setLayers((prev) => {
          const nonGoogle = prev.filter((l) => l.type !== 'google');
          const prevVis = new Map(
            prev.filter((l) => l.type === 'google').map((l) => [l.id, l.visible])
          );
          const mergedGoogle = gLayers.map((gl) => ({
            ...gl,
            visible: prevVis.has(gl.id) ? Boolean(prevVis.get(gl.id)) : gl.visible,
          }));
          return [...mergedGoogle, ...nonGoogle];
        });

        const base = refDate || anchorDate;
        const timeMin = addDays(base, -45);
        const timeMax = addDays(base, 60);
        const calIds = gLayers
          .map((l) => l.googleCalendarId)
          .filter((id): id is string => Boolean(id));
        const fetched = await fetchGoogleEventsRange(token, calIds, timeMin, timeMax);
        setGoogleEvents(fetched);

        // Set primary Google calendar as active default if user just signed in
        const primaryCal = gLayers.find((l) => l.primary) || gLayers[0];
        if (primaryCal && explicitToken) {
          setActiveCalendarId(primaryCal.id);
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Failed to sync Google Calendar.';
        setGoogleError(msg);
      } finally {
        setGoogleSyncing(false);
      }
    },
    [anchorDate]
  );

  // Initialize Firebase Auth listener (clears in-memory token on sign-out)
  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setGoogleUser(user);
        void syncGoogleCalendarData(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleEvents([]);
        setLayers((prev) => prev.filter((l) => l.type !== 'google'));
      }
    );
    return () => unsub();
  }, [syncGoogleCalendarData]);

  // Re-fetch Google events smoothly when user navigates across months
  const anchorMonthKey = `${anchorDate.getFullYear()}-${anchorDate.getMonth()}`;
  useEffect(() => {
    const token = getAccessToken();
    if (googleUser && token) {
      void syncGoogleCalendarData(token, anchorDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorMonthKey]);

  const handleGoogleSignIn = useCallback(async () => {
    setGoogleError(null);
    setGoogleSyncing(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        await syncGoogleCalendarData(res.accessToken);
        showToast(`Connected ${res.user.email || 'Google Calendar'}`);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Google sign-in was cancelled or failed.';
      setGoogleError(msg);
      setGoogleSyncing(false);
    }
  }, [syncGoogleCalendarData, showToast]);

  const handleGoogleLogout = useCallback(async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setGoogleEvents([]);
    setLayers((prev) => prev.filter((l) => l.type !== 'google'));
    setActiveCalendarId('personal');
    setSelection({ kind: 'none' });
    showToast('Disconnected Google Calendar');
  }, [showToast]);

  useEffect(() => {
    if (!viewMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setViewMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [viewMenuOpen]);

  // Gracefully adapt event grid columns on narrow mobile screens
  const effectiveViewMode: ViewMode = useMemo(() => {
    if (viewMode === 'month') return 'month';
    if (mobileViewOverride) return mobileViewOverride;
    if (viewport.width < 520 && (viewMode === '5days' || viewMode === 'week')) {
      return 'day';
    }
    if (viewport.width < 720 && (viewMode === '5days' || viewMode === 'week')) {
      return '3days';
    }
    return viewMode;
  }, [viewMode, mobileViewOverride, viewport.width]);

  const visibleDays = useMemo(
    () => getVisibleDays(anchorDate, effectiveViewMode),
    [anchorDate, effectiveViewMode]
  );

  const visibleLayerIds = useMemo(
    () => new Set(layers.filter((l) => l.visible).map((l) => l.id)),
    [layers]
  );

  const showGujaratiCalendar = visibleLayerIds.has('gujarati-calendar');
  const anyCulturalVisible = layers.some((l) => l.type === 'cultural' && l.visible);

  const headerInfo = useMemo(() => {
    const firstDay = effectiveViewMode === 'month' ? anchorDate : visibleDays[0];
    const lastDay =
      effectiveViewMode === 'month'
        ? new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0)
        : visibleDays[visibleDays.length - 1];

    const monthTitle =
      firstDay.getMonth() === lastDay.getMonth()
        ? MONTH_NAMES[firstDay.getMonth()]
        : `${MONTH_NAMES[firstDay.getMonth()].slice(0, 3)} – ${MONTH_NAMES[
            lastDay.getMonth()
          ].slice(0, 3)}`;

    const yearSuffix =
      firstDay.getFullYear() !== today.getFullYear()
        ? ` ${firstDay.getFullYear()}`
        : '';

    let subCaption = '';
    if (headerSubCalendar === 'gujarati-vikram' && showGujaratiCalendar) {
      const pStart = getGujaratiPanchang(firstDay);
      const pEnd = getGujaratiPanchang(lastDay);
      subCaption =
        pStart.monthEn === pEnd.monthEn
          ? gujaratiScript
            ? `${pStart.monthGu} · વિક્રમ સંવત ${pStart.vikramSamvat}`
            : `${pStart.monthEn} · VS ${pStart.vikramSamvat}`
          : gujaratiScript
          ? `${pStart.monthGu}–${pEnd.monthGu} · વિ.સં. ${pEnd.vikramSamvat}`
          : `${pStart.monthEn}–${pEnd.monthEn} · VS ${pEnd.vikramSamvat}`;
    } else if (headerSubCalendar !== 'none' && headerSubCalendar !== 'gujarati-vikram') {
      const val = convertToWorldCalendar(firstDay, headerSubCalendar, gujaratiScript);
      subCaption = `${val.name} · ${val.formatted}`;
    }

    return {
      title: `${monthTitle}${yearSuffix}`,
      subCaption,
    };
  }, [
    anchorDate,
    visibleDays,
    effectiveViewMode,
    today,
    headerSubCalendar,
    showGujaratiCalendar,
    gujaratiScript,
  ]);

  const handleSelectViewMode = useCallback(
    (nextMode: ViewMode) => {
      setViewMode(nextMode);
      if (viewport.width < 720) {
        setMobileViewOverride(nextMode);
      } else {
        setMobileViewOverride(null);
      }
      setViewMenuOpen(false);
    },
    [viewport.width]
  );

  const handlePrev = useCallback(() => {
    setAnchorDate((prev) => {
      if (effectiveViewMode === 'day') return addDays(prev, -1);
      if (effectiveViewMode === '3days') return addDays(prev, -3);
      if (effectiveViewMode === '5days' || effectiveViewMode === 'week')
        return addDays(prev, -7);
      return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
    });
  }, [effectiveViewMode]);

  const handleNext = useCallback(() => {
    setAnchorDate((prev) => {
      if (effectiveViewMode === 'day') return addDays(prev, 1);
      if (effectiveViewMode === '3days') return addDays(prev, 3);
      if (effectiveViewMode === '5days' || effectiveViewMode === 'week')
        return addDays(prev, 7);
      return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
    });
  }, [effectiveViewMode]);

  const handleToday = useCallback(() => {
    setAnchorDate(today);
  }, [today]);

  const handleToggleLayer = useCallback((layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  }, []);

  const handleToggleAllCultural = useCallback(() => {
    setLayers((prev) => {
      const anyOn = prev.some((l) => l.type === 'cultural' && l.visible);
      const nextVal = !anyOn;
      showToast(
        nextVal
          ? 'Showing festivals, holidays & Gujarati calendar'
          : 'Hidden all festivals, holidays & Gujarati calendar'
      );
      return prev.map((l) =>
        l.type === 'cultural' ? { ...l, visible: nextVal } : l
      );
    });
  }, [showToast]);

  const handleToggleWorldCalendar = useCallback((id: WorldCalendarSystemId) => {
    setEnabledWorldCalendars((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleEnableAllWorldCalendars = useCallback((enable: boolean) => {
    setEnabledWorldCalendars(
      enable ? WORLD_CALENDAR_SYSTEMS.map((s) => s.id) : []
    );
  }, []);

  const handleAddCustomCalendar = useCallback(
    (name: string, color: CalendarColorKey) => {
      const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      const newLayer: CalendarLayer = {
        id,
        name,
        groupId: 'local-calendars',
        color,
        visible: true,
        type: 'custom',
        icon: 'calendar',
      };
      setLayers((prev) => [...prev, newLayer]);
      setActiveCalendarId(id);
      showToast(`Created calendar "${name}"`);
    },
    [showToast]
  );

  // Local event creation (or draft creation targeting Google Calendar — requires confirmation when saving to Google!)
  const handleCreateEventFromRange = useCallback(
    (dateKey: string, startMinutes: number, endMinutes: number, customTitle?: string) => {
      const targetLayer = layers.find((l) => l.id === activeCalendarId);
      const safeCalId = targetLayer ? targetLayer.id : 'personal';
      const newEvt: CalendarEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: customTitle || 'New event',
        calendarId: safeCalId,
        category: 'event',
        startDate: dateKey,
        endDate: dateKey,
        allDay: false,
        startMinutes,
        endMinutes,
        status: 'confirmed',
        source: 'local',
      };
      setLayers((prev) =>
        prev.map((l) => (l.id === safeCalId ? { ...l, visible: true } : l))
      );
      setLocalEvents((prev) => [...prev, newEvt]);
      setSelection({ kind: 'event', eventId: newEvt.id });
      setRightOpen(true);
    },
    [activeCalendarId, layers]
  );

  const handleCreateEventNow = useCallback(() => {
    const now = new Date();
    const startMins = Math.min(
      22 * 60,
      Math.ceil((now.getHours() * 60 + now.getMinutes()) / 30) * 30
    );
    handleCreateEventFromRange(
      formatDateKey(anchorDate),
      startMins,
      startMins + 60,
      'New event'
    );
  }, [anchorDate, handleCreateEventFromRange]);

  const handleQuickCreateMeeting = useCallback(
    (title: string) => {
      const now = new Date();
      const startMins = Math.min(
        22 * 60,
        Math.ceil((now.getHours() * 60 + now.getMinutes()) / 30) * 30
      );
      handleCreateEventFromRange(formatDateKey(today), startMins, startMins + 30, title);
      setAnchorDate(today);
      showToast(`Created "${title}"`);
    },
    [today, handleCreateEventFromRange, showToast]
  );

  const handleUpdateLocalEvent = useCallback((updated: CalendarEvent) => {
    setLocalEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  }, []);

  // Mandatory explicit confirmation dialog before ANY Google Calendar create / update / delete!
  const requestSaveGoogleEvent = useCallback(
    (event: CalendarEvent, isNewOnGoogle: boolean) => {
      const token = getAccessToken();
      if (!token) {
        showToast('Please sign in with Google to sync changes.');
        openSettings('google');
        return;
      }

      const targetLayer = layers.find((l) => l.id === event.calendarId);
      const gCalId =
        targetLayer?.googleCalendarId || event.googleCalendarId || 'primary';
      const calName = targetLayer?.name || 'Google Calendar';
      const d = parseDateKey(event.startDate);
      const dateSummary = `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${
        event.allDay ? 'All-day' : formatTimeRange(event.startMinutes, event.endMinutes)
      }`;

      setPendingMutation({
        type: isNewOnGoogle ? 'create' : 'update',
        title: event.title || '(Untitled event)',
        calendarName: calName,
        dateSummary,
        details: event.location ? `Location: ${event.location}` : undefined,
        onConfirm: async () => {
          if (isNewOnGoogle || !event.googleEventId) {
            const created = await createGoogleEvent(token, gCalId, event);
            // Remove local draft and insert real Google event
            setLocalEvents((prev) => prev.filter((e) => e.id !== event.id));
            setGoogleEvents((prev) => [...prev, created]);
            setSelection({ kind: 'event', eventId: created.id });
            showToast('Added to Google Calendar');
          } else {
            const updated = await updateGoogleEvent(
              token,
              gCalId,
              event.googleEventId,
              event
            );
            setGoogleEvents((prev) =>
              prev.map((e) => (e.id === event.id ? updated : e))
            );
            setSelection({ kind: 'event', eventId: updated.id });
            showToast('Updated in Google Calendar');
          }
        },
      });
    },
    [layers, openSettings, showToast]
  );

  // Drag-move or resize on TimeGrid: local updates immediately; Google Calendar asks explicit confirmation first!
  const handleGridUpdateEvent = useCallback(
    (updated: CalendarEvent) => {
      if (updated.source === 'google') {
        requestSaveGoogleEvent(updated, false);
      } else {
        handleUpdateLocalEvent(updated);
      }
    },
    [handleUpdateLocalEvent, requestSaveGoogleEvent]
  );

  const handleDeleteEvent = useCallback(
    (event: CalendarEvent) => {
      if (event.source === 'google' && event.googleCalendarId && event.googleEventId) {
        const token = getAccessToken();
        if (!token) {
          showToast('Sign in with Google to delete this Google Calendar event.');
          openSettings('google');
          return;
        }
        const layer = layers.find((l) => l.id === event.calendarId);
        const d = parseDateKey(event.startDate);
        setPendingMutation({
          type: 'delete',
          title: event.title,
          calendarName: layer?.name || 'Google Calendar',
          dateSummary: `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
          onConfirm: async () => {
            await deleteGoogleEvent(
              token,
              event.googleCalendarId!,
              event.googleEventId!
            );
            setGoogleEvents((prev) => prev.filter((e) => e.id !== event.id));
            setSelection({ kind: 'none' });
            showToast('Deleted from Google Calendar');
          },
        });
        return;
      }

      setLocalEvents((prev) => prev.filter((e) => e.id !== event.id));
      setSelection({ kind: 'none' });
      showToast('Event deleted');
    },
    [layers, openSettings, showToast]
  );

  const handleDuplicateEvent = useCallback(
    (event: CalendarEvent) => {
      const copy: CalendarEvent = {
        ...event,
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: `${event.title} (Copy)`,
        startMinutes: event.allDay ? 0 : Math.min(1380, event.startMinutes + 60),
        endMinutes: event.allDay ? 0 : Math.min(1440, event.endMinutes + 60),
        source: 'local',
        googleCalendarId: undefined,
        googleEventId: undefined,
        calendarId: event.source === 'google' ? 'personal' : event.calendarId,
      };
      setLocalEvents((prev) => [...prev, copy]);
      setSelection({ kind: 'event', eventId: copy.id });
      showToast('Event duplicated locally');
    },
    [showToast]
  );

  const executePendingMutation = async () => {
    if (!pendingMutation) return;
    setMutationBusy(true);
    try {
      await pendingMutation.onConfirm();
      setPendingMutation(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Google Calendar request failed.';
      setGoogleError(msg);
      showToast(msg);
      setPendingMutation(null);
    } finally {
      setMutationBusy(false);
    }
  };

  const handleAddAvailabilitySlot = useCallback(
    (dateKey: string, startMinutes: number, endMinutes: number) => {
      setAvailabilitySlots((prev) => [
        ...prev,
        {
          id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          dateKey,
          startMinutes,
          endMinutes,
        },
      ]);
    },
    []
  );

  const handleRemoveAvailabilitySlot = useCallback((slotId: string) => {
    setAvailabilitySlots((prev) => prev.filter((s) => s.id !== slotId));
  }, []);

  const handleJumpToFestival = useCallback((festival: FestivalItem) => {
    const d = parseDateKey(festival.date);
    setAnchorDate(d);
    setLayers((prev) =>
      prev.map((l) => (l.id === festival.layerId ? { ...l, visible: true } : l))
    );
    setSelection({
      kind: 'festival',
      festival,
      panchang: getGujaratiPanchang(d),
    });
    setRightOpen(true);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSettingsOpen(false);
        setActiveModal((prev) => (prev === 'command' ? null : 'command'));
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setExportModalOpen((prev) => !prev);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setActiveModal(null);
        setSettingsOpen((prev) => !prev);
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
        return;
      }

      if (
        isInput ||
        activeModal ||
        settingsOpen ||
        pendingMutation ||
        exportModalOpen ||
        shortcutsModalOpen ||
        authModalOpen ||
        legalModalOpen
      )
        return;

      const key = e.key.toLowerCase();
      if (key === 't') {
        e.preventDefault();
        handleToday();
      } else if (key === ',') {
        e.preventDefault();
        openSettings('festivals');
      } else if (key === 'h') {
        e.preventDefault();
        handleToggleAllCultural();
      } else if (key === 'g') {
        e.preventDefault();
        handleToggleLayer('gujarati-calendar');
      } else if (key === 's') {
        e.preventDefault();
        setShareMode((v) => !v);
        setSelection({ kind: 'none' });
        setRightOpen(true);
      } else if (key === 'f') {
        e.preventDefault();
        setRightOpen(true);
        setSelection({ kind: 'none' });
        setTimeout(() => meetInputRef.current?.focus(), 20);
      } else if (key === 'c') {
        e.preventDefault();
        handleCreateEventNow();
      } else if (key === '.') {
        e.preventDefault();
        setActiveModal('goto');
      } else if (e.key === '?') {
        e.preventDefault();
        setActiveModal('shortcuts');
      } else if (key === '1') {
        setViewMode('day');
      } else if (key === '3') {
        setViewMode('3days');
      } else if (key === '5') {
        setViewMode('5days');
      } else if (key === 'w') {
        setViewMode('week');
      } else if (key === 'm') {
        setViewMode('month');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === '[') {
        setLeftOpen((v) => !v);
      } else if (e.key === ']') {
        setRightOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setSelection({ kind: 'none' });
        setShareMode(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activeModal,
    settingsOpen,
    pendingMutation,
    exportModalOpen,
    shortcutsModalOpen,
    authModalOpen,
    legalModalOpen,
    handleToday,
    openSettings,
    handleToggleAllCultural,
    handleToggleLayer,
    handleCreateEventNow,
    handlePrev,
    handleNext,
  ]);

  const openLeftDrawer = useCallback(() => {
    setLeftOpen(true);
    if (viewport.isDrawerMode) setRightOpen(false);
  }, [viewport.isDrawerMode]);

  const openRightDrawer = useCallback(() => {
    setRightOpen(true);
    if (viewport.isDrawerMode) setLeftOpen(false);
  }, [viewport.isDrawerMode]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-white text-[#1A1A1A]">
      {/* Mandatory Demo Key Quota Banner (Google Maps Platform Case A) */}
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm shrink-0">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        {/* Translucent Backdrop for Mobile/Tablet Slide-Over Drawers */}
        {viewport.isDrawerMode && (leftOpen || rightOpen) && (
          <div
            onClick={() => {
              setLeftOpen(false);
              setRightOpen(false);
            }}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px]"
          />
        )}

        {leftOpen && (
          <LeftSidebar
            today={today}
            anchorDate={anchorDate}
            visibleDays={visibleDays}
            viewMode={effectiveViewMode}
            groups={INITIAL_GROUPS}
            layers={layers}
            activeCalendarId={activeCalendarId}
            gujaratiScript={gujaratiScript}
            enabledWorldCount={enabledWorldCalendars.length}
            enabledWorldCalendars={enabledWorldCalendars}
            onToggleWorldCalendar={handleToggleWorldCalendar}
            onAddCustomCalendar={handleAddCustomCalendar}
            googleUser={googleUser}
            googleSyncing={googleSyncing}
            isDrawer={viewport.isDrawerMode}
            onSelectDate={(d) => {
              setAnchorDate(d);
              if (viewport.isDrawerMode) setLeftOpen(false);
            }}
            onToggleLayer={handleToggleLayer}
            onSetActiveCalendar={setActiveCalendarId}
            onToggleAllCultural={handleToggleAllCultural}
            onToggleGujaratiScript={() => setGujaratiScript((v) => !v)}
            onCollapseSidebar={() => setLeftOpen(false)}
            onGoogleSignIn={handleGoogleSignIn}
            onGoogleSync={() => void syncGoogleCalendarData()}
            onGoogleLogout={handleGoogleLogout}
            onOpenSettings={(tab) => {
              if (viewport.isDrawerMode) setLeftOpen(false);
              openSettings(tab);
            }}
          />
        )}

        <main className="flex-1 flex flex-col min-w-0 h-full bg-white overflow-hidden">
          {/* Top Bar (Exact Cron / Notion Calendar proportions, gracefully compact on mobile) */}
          <header className="h-[52px] sm:h-[54px] px-3 sm:px-5 flex items-center justify-between gap-3 shrink-0 bg-white border-b border-[#EFEFEF]">
            {/* Left: Navigation & Calendar Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {(!leftOpen || viewport.isDrawerMode) && (
                <button
                  type="button"
                  onClick={openLeftDrawer}
                  title="Open sidebar ([)"
                  aria-label="Open sidebar"
                  className="p-1.5 -ml-0.5 rounded-md text-[#787878] hover:text-[#1A1A1A] hover:bg-[#F2F2F2] transition-colors cursor-pointer shrink-0"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>
              )}

              {/* Today Button */}
              <button
                type="button"
                onClick={handleToday}
                className="h-[30px] px-2.5 sm:px-3 rounded-[6px] border border-[#E4E4E4] bg-white hover:bg-[#F5F5F5] text-[12px] sm:text-[12.5px] font-medium text-[#1F1F1F] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
              >
                Today
              </button>

              {/* Prev / Next Chevrons */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous period"
                  className="w-[28px] h-[28px] rounded-[6px] hover:bg-[#F2F2F2] text-[#737373] hover:text-[#1A1A1A] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next period"
                  className="w-[28px] h-[28px] rounded-[6px] hover:bg-[#F2F2F2] text-[#737373] hover:text-[#1A1A1A] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Title */}
              <h1 className="text-[18px] sm:text-[22px] font-bold tracking-[-0.025em] text-[#1A1A1A] leading-none whitespace-nowrap truncate ml-1 sm:ml-2">
                {headerInfo.title}
              </h1>

              {/* Secondary Calendar Subcaption */}
              {headerInfo.subCaption && (
                <button
                  type="button"
                  onClick={() => openSettings('world')}
                  title="Configure secondary calendar display"
                  className={`text-[12px] font-medium text-[#8C7A5B] hover:text-[#1A1A1A] truncate hidden lg:inline cursor-pointer transition-colors ${
                    headerSubCalendar === 'gujarati-vikram' && gujaratiScript
                      ? 'font-gujarati'
                      : ''
                  }`}
                >
                  {headerInfo.subCaption}
                </button>
              )}
            </div>

            {/* Right: View Switcher & Side Panel Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* View Switcher Dropdown ("5 days ▾" — shows adapted view on mobile) */}
              <div ref={viewMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setViewMenuOpen((v) => !v)}
                  className="h-[30px] px-2 sm:px-2.5 rounded-[6px] border border-[#E4E4E4] bg-white hover:bg-[#F5F5F5] text-[12px] sm:text-[12.5px] font-medium text-[#1F1F1F] inline-flex items-center gap-1 sm:gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                >
                  <span>{VIEW_LABELS[effectiveViewMode]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#7A7A7A]" />
                </button>

                {viewMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-[152px] bg-white border border-[#E4E4E4] rounded-lg shadow-lg py-1 z-40">
                    {(
                      [
                        { id: 'day', label: 'Day', key: '1' },
                        { id: '3days', label: '3 days', key: '3' },
                        { id: '5days', label: '5 days', key: '5' },
                        { id: 'week', label: 'Week', key: 'W' },
                        { id: 'month', label: 'Month', key: 'M' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectViewMode(opt.id)}
                        className={`w-full px-3 py-1.5 text-[12.5px] flex items-center justify-between hover:bg-[#F4F4F4] transition-colors cursor-pointer ${
                          effectiveViewMode === opt.id
                            ? 'font-semibold text-[#1A1A1A] bg-[#F7F7F7]'
                            : 'text-[#4A4A4A]'
                        }`}
                      >
                        <span>{opt.label}</span>
                        <kbd className="text-[10.5px] font-mono-tabular text-[#8C8C8C]">
                          {opt.key}
                        </kbd>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Side Panel Toggle */}
              <button
                type="button"
                onClick={() => setRightOpen((v) => !v)}
                title={rightOpen ? 'Hide side panel (])' : 'Show side panel (])'}
                aria-label="Toggle side panel"
                className={`h-[30px] px-2 sm:px-2.5 rounded-[6px] border text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs ${
                  rightOpen
                    ? 'bg-[#F2F4F7] border-[#D1D5DB] text-[#111827]'
                    : 'bg-white border-[#E4E4E4] text-[#4B5563] hover:bg-[#F5F5F5] hover:text-[#111827]'
                }`}
              >
                <PanelRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{rightOpen ? 'Panel' : 'Open Panel'}</span>
              </button>
            </div>
          </header>

          {/* Main Calendar Canvas */}
          {effectiveViewMode === 'month' ? (
            <MonthView
              today={today}
              anchorDate={anchorDate}
              events={allEvents}
              layers={layers}
              visibleLayerIds={visibleLayerIds}
              showGujaratiCalendar={showGujaratiCalendar}
              headerSubCalendar={headerSubCalendar}
              enabledWorldCalendars={enabledWorldCalendars}
              gujaratiScript={gujaratiScript}
              selectedEventId={selection.kind === 'event' ? selection.eventId : null}
              selectedFestivalId={
                selection.kind === 'festival' ? selection.festival.id : null
              }
              isPhone={viewport.isPhone}
              onSelectEvent={(ev) => {
                setSelection({ kind: 'event', eventId: ev.id });
                openRightDrawer();
              }}
              onSelectFestival={(festival, panchang) => {
                setSelection({ kind: 'festival', festival, panchang });
                openRightDrawer();
              }}
              onSelectDayPanchang={(date, panchang) => {
                setSelection({ kind: 'panchang', date, panchang });
                openRightDrawer();
              }}
              onCreateEventOnDate={(dateKey) =>
                handleCreateEventFromRange(dateKey, 10 * 60, 11 * 60)
              }
              onZoomToDay={(d) => {
                setAnchorDate(d);
                handleSelectViewMode(viewport.isPhone ? 'day' : '5days');
              }}
            />
          ) : (
            <TimeGrid
              today={today}
              visibleDays={visibleDays}
              events={allEvents}
              layers={layers}
              visibleLayerIds={visibleLayerIds}
              showGujaratiCalendar={showGujaratiCalendar}
              headerSubCalendar={headerSubCalendar}
              enabledWorldCalendars={enabledWorldCalendars}
              gujaratiScript={gujaratiScript}
              primaryTz={primaryTz}
              secondaryTz={secondaryTz}
              selectedEventId={selection.kind === 'event' ? selection.eventId : null}
              selectedFestivalId={
                selection.kind === 'festival' ? selection.festival.id : null
              }
              shareMode={shareMode}
              availabilitySlots={availabilitySlots}
              isPhone={viewport.isPhone}
              isDrawerMode={viewport.isDrawerMode}
              dailyForecastByDate={dailyForecastByDate}
              onSelectEvent={(ev) => {
                setSelection({ kind: 'event', eventId: ev.id });
                openRightDrawer();
              }}
              onSelectFestival={(festival, panchang) => {
                setSelection({ kind: 'festival', festival, panchang });
                openRightDrawer();
              }}
              onSelectDayPanchang={(date, panchang) => {
                setSelection({ kind: 'panchang', date, panchang });
                openRightDrawer();
              }}
              onCreateEventFromRange={handleCreateEventFromRange}
              onUpdateEvent={handleGridUpdateEvent}
              onAddAvailabilitySlot={handleAddAvailabilitySlot}
              onRemoveAvailabilitySlot={handleRemoveAvailabilitySlot}
              onOpenTimezoneModal={() => openSettings('display')}
              onToggleRightPanel={() => setRightOpen((v) => !v)}
            />
          )}
        </main>

        {rightOpen && (
          <RightPanel
            today={today}
            anchorDate={anchorDate}
            events={allEvents}
            layers={layers}
            visibleLayerIds={visibleLayerIds}
            showGujaratiCalendar={showGujaratiCalendar}
            anyCulturalVisible={anyCulturalVisible}
            gujaratiScript={gujaratiScript}
            enabledWorldCalendars={enabledWorldCalendars}
            primaryTz={primaryTz}
            secondaryTz={secondaryTz}
            googleUser={googleUser}
            selection={selection}
            shareMode={shareMode}
            availabilitySlots={availabilitySlots}
            meetInputRef={meetInputRef}
            searchInputRef={searchInputRef}
            isDrawer={viewport.isDrawerMode}
            onClosePanel={() => setRightOpen(false)}
            onClearSelection={() => setSelection({ kind: 'none' })}
            onSelectEvent={(ev) => setSelection({ kind: 'event', eventId: ev.id })}
            onSelectFestival={(festival, panchang) =>
              setSelection({ kind: 'festival', festival, panchang })
            }
            onUpdateLocalEvent={handleUpdateLocalEvent}
            onRequestSaveGoogleEvent={requestSaveGoogleEvent}
            onDeleteEvent={handleDeleteEvent}
            onDuplicateEvent={handleDuplicateEvent}
            onQuickCreateMeeting={handleQuickCreateMeeting}
            onScheduleOnDate={(dateKey, suggestedTitle) =>
              handleCreateEventFromRange(dateKey, 10 * 60, 11 * 60, suggestedTitle)
            }
            onToggleShareMode={() => {
              setShareMode((v) => !v);
              setSelection({ kind: 'none' });
            }}
            onRemoveAvailabilitySlot={handleRemoveAvailabilitySlot}
            onClearAvailabilitySlots={() => setAvailabilitySlots([])}
            onJumpToDate={(d) => {
              setAnchorDate(d);
              if (viewport.isDrawerMode) setRightOpen(false);
            }}
            onOpenCommandMenu={() => setActiveModal('command')}
            onOpenGoToDate={() => setActiveModal('goto')}
            onOpenShortcuts={() => setActiveModal('shortcuts')}
            onOpenSettings={(tab) => {
              if (viewport.isDrawerMode) setRightOpen(false);
              openSettings(tab);
            }}
            onToggleAllCultural={handleToggleAllCultural}
            onToggleGujaratiLayer={() => handleToggleLayer('gujarati-calendar')}
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
            onOpenExport={() => setExportModalOpen(true)}
            weatherData={weatherData}
            weatherLoading={weatherLoading}
            weatherError={weatherError}
            weatherUnits={weatherUnits}
            weatherLocationQuery={weatherLocationQuery}
            onChangeWeatherUnits={setWeatherUnits}
            onSearchWeatherCity={handleSetWeatherCity}
            onUseWeatherGeolocation={handleUseWeatherGeolocation}
            onRefreshWeather={() => void loadWeather(true)}
          />
        )}
      </div>

      {/* Command Palette, Go-To-Date, Timezone & Shortcuts Modals */}
      <Modals
        activeModal={activeModal}
        anchorDate={anchorDate}
        layers={layers}
        viewMode={effectiveViewMode}
        anyCulturalVisible={anyCulturalVisible}
        showGujaratiCalendar={showGujaratiCalendar}
        gujaratiScript={gujaratiScript}
        primaryTz={primaryTz}
        secondaryTz={secondaryTz}
        onClose={() => setActiveModal(null)}
        onJumpToDate={(d) => setAnchorDate(d)}
        onJumpToFestival={handleJumpToFestival}
        onChangeView={handleSelectViewMode}
        onToggleLayer={handleToggleLayer}
        onToggleAllCultural={handleToggleAllCultural}
        onToggleGujaratiScript={() => setGujaratiScript((v) => !v)}
        onCreateEventNow={handleCreateEventNow}
        onSetPrimaryTz={setPrimaryTz}
        onSetSecondaryTz={setSecondaryTz}
      />

      {/* Dedicated Settings Menu with Toggle Switches for Festivals, 29 World Calendars, Weather & Google Calendar */}
      <SettingsModal
        open={settingsOpen}
        initialTab={settingsTab}
        anchorDate={anchorDate}
        layers={layers}
        gujaratiScript={gujaratiScript}
        enabledWorldCalendars={enabledWorldCalendars}
        headerSubCalendar={headerSubCalendar}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={handleSelectLanguage}
        primaryTz={primaryTz}
        secondaryTz={secondaryTz}
        googleUser={googleUser}
        googleSyncing={googleSyncing}
        googleError={googleError}
        weatherLocationQuery={weatherLocationQuery}
        weatherUnits={weatherUnits}
        onClose={() => setSettingsOpen(false)}
        onToggleLayer={handleToggleLayer}
        onToggleAllCultural={handleToggleAllCultural}
        onToggleGujaratiScript={() => setGujaratiScript((v) => !v)}
        onToggleWorldCalendar={handleToggleWorldCalendar}
        onEnableAllWorldCalendars={handleEnableAllWorldCalendars}
        onSetHeaderSubCalendar={setHeaderSubCalendar}
        onSetPrimaryTz={setPrimaryTz}
        onSetSecondaryTz={setSecondaryTz}
        onSetWeatherLocationQuery={handleSetWeatherCity}
        onSetWeatherUnits={setWeatherUnits}
        onUseWeatherGeolocation={handleUseWeatherGeolocation}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSync={() => void syncGoogleCalendarData()}
        onGoogleLogout={handleGoogleLogout}
      />

      {/* Export / Import Modal (.ics) */}
      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        events={allEvents}
        layers={layers}
        anchorDate={anchorDate}
        visibleDays={visibleDays}
        visibleLayerIds={visibleLayerIds}
        viewMode={effectiveViewMode}
        timezone={primaryTz.id}
        onImportEvents={handleImportEvents}
      />

      {/* Searchable Keyboard Shortcuts Modal */}
      <ShortcutsHelpModal
        open={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      {/* Authentication & Profile Modal */}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        showToast={showToast}
      />

      {/* Legal & Compliance Modal */}
      <LegalModal
        open={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialDoc={legalInitialDoc}
      />

      {/* Footer Copyright Banner & Legal Navigation */}
      <footer className="h-[26px] px-3 bg-[#FAFAFA] border-t border-[#EFEFEF] flex items-center justify-between text-[11px] text-[#8C8C8C] shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span>© 2026 calendar.q. All rights reserved.</span>
          <span className="hidden md:inline text-[#D4D4D4]">·</span>
          <span className="hidden md:inline text-[#A0A0A0]">Unified Multi-Calendar Platform</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setLegalInitialDoc('privacy');
              setLegalModalOpen(true);
            }}
            className="hover:text-[#1A1A1A] hover:underline cursor-pointer"
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => {
              setLegalInitialDoc('terms');
              setLegalModalOpen(true);
            }}
            className="hover:text-[#1A1A1A] hover:underline cursor-pointer"
          >
            Terms
          </button>
          <button
            type="button"
            onClick={() => {
              setLegalInitialDoc('data-deletion');
              setLegalModalOpen(true);
            }}
            className="hover:text-[#1A1A1A] hover:underline cursor-pointer"
          >
            Data Deletion
          </button>
          <button
            type="button"
            onClick={() => {
              setLegalInitialDoc('licenses');
              setLegalModalOpen(true);
            }}
            className="hover:text-[#1A1A1A] hover:underline cursor-pointer"
          >
            Licenses
          </button>
        </div>
      </footer>

      {/* Mandatory Explicit Confirmation Dialog for Google Calendar Mutations */}
      <ConfirmDialog
        pending={pendingMutation}
        busy={mutationBusy}
        onCancel={() => setPendingMutation(null)}
        onConfirm={() => void executePendingMutation()}
      />

      {toastMsg && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-3.5 py-2 rounded-lg bg-[#1A1A1A] text-white text-[12px] font-medium shadow-lg pointer-events-none">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
