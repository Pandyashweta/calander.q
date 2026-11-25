import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CalendarPlus,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  MapPin,
  Search,
  SlidersHorizontal,
  Trash2,
  User,
  X,
} from 'lucide-react';
import {
  AvailabilitySlot,
  CalendarEvent,
  CalendarLayer,
  EventCategory,
  FestivalItem,
  GoogleUserProfile,
  GujaratiPanchang,
  TimezoneOption,
  WorldCalendarSystemId,
} from '../types/calendar';
import { getAllFestivalsForYear, getFestivalsForDate } from '../data/festivalsAndDays';
import { getGujaratiPanchang } from '../data/gujaratiPanchang';
import { getWorldCalendarsForDate } from '../data/worldCalendars';
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
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [meetQuery, setMeetQuery] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [draftEvent, setDraftEvent] = useState<CalendarEvent | null>(null);
  const copyTimerRef = useRef<number | null>(null);

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
          : 'w-[282px] shrink-0 h-full bg-[#FBFBFB] border-l border-[#EBEBEB] flex flex-col select-none'
      }
    >
      {/* Top Search Bar */}
      <div className="h-[46px] px-3.5 border-b border-[#EFEFEF] flex items-center gap-2 shrink-0">
        <Search className="w-[14px] h-[14px] text-[#9A9A9A] shrink-0" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search events, festivals, days..."
          className="flex-1 min-w-0 bg-transparent text-[13px] text-[#1A1A1A] placeholder:text-[#A3A3A3] focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
            className="p-0.5 rounded hover:bg-[#EAEAEA] text-[#8C8C8C] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {isDrawer && onClosePanel && (
          <button
            type="button"
            onClick={onClosePanel}
            aria-label="Close panel"
            className="p-1 rounded-md hover:bg-[#EAEAEA] text-[#6B6B6B] hover:text-[#1A1A1A] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
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
          <div className="divide-y divide-[#EFEFEF]">
            {/* 1. Upcoming Meetings */}
            <section className="px-4 py-4">
              {upcomingMeetings.length === 0 ? (
                <div className="space-y-1">
                  <div className="text-[13px] font-semibold text-[#1F1F1F]">
                    No upcoming meetings
                  </div>
                  {!googleUser && (
                    <p className="text-[11.5px] text-[#8C8C8C] leading-snug">
                      Connect Google Calendar or drag on the grid to add events, birthdays, memorials, or plans.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="text-[12px] font-semibold text-[#1F1F1F]">
                    Upcoming today
                  </div>
                  <div className="space-y-1.5">
                    {upcomingMeetings.map((ev) => {
                      const layer = layerById.get(ev.calendarId);
                      const theme = COLOR_THEMES[layer?.color || 'blue'];
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => onSelectEvent(ev)}
                          className="w-full text-left p-2 rounded-md bg-white border border-[#ECECEC] hover:border-[#D6D6D6] transition-colors flex items-start gap-2 cursor-pointer"
                        >
                          <span
                            className="w-[3px] self-stretch rounded-full shrink-0"
                            style={{ backgroundColor: layer?.customHex || theme.bar }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-[12.5px] font-semibold text-[#1A1A1A] truncate">
                              {ev.title}
                            </div>
                            <div className="text-[11px] text-[#737373] tabular-nums mt-0.5">
                              {formatTimeRange(ev.startMinutes, ev.endMinutes)}
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
                <div className="mt-3 pt-3 border-t border-[#F0F0F0] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#7A7A7A]">
                      Today across calendars
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenSettings('world')}
                      className="text-[10.5px] font-medium text-[#185D8F] hover:underline cursor-pointer"
                    >
                      Configure
                    </button>
                  </div>

                  {todayWorldDates.slice(0, 4).map((wc) => (
                    <div
                      key={wc.id}
                      className="flex items-baseline justify-between gap-2 text-[11.5px]"
                    >
                      <span className="text-[#8C8C8C] shrink-0">{wc.name.split(' ')[0]}</span>
                      <span
                        className={`font-medium text-[#2E2E2E] text-right truncate tabular-nums ${
                          wc.id === 'gujarati-vikram' && gujaratiScript
                            ? 'font-gujarati text-[#7A4C00]'
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
                      className="text-[11px] text-[#737373] hover:text-[#1A1A1A] cursor-pointer"
                    >
                      +{todayWorldDates.length - 4} more calendars…
                    </button>
                  )}

                  {anyCulturalVisible &&
                    todayFestivals.slice(0, 2).map((fest) => (
                      <button
                        key={fest.id}
                        type="button"
                        onClick={() => onSelectFestival(fest, todayPanchang)}
                        className="w-full text-left text-[11.5px] text-[#4A4A4A] hover:text-[#1A1A1A] truncate block cursor-pointer pt-0.5"
                      >
                        {fest.categoryLabel} ·{' '}
                        <span className="font-medium">{fest.title}</span>
                      </button>
                    ))}
                </div>
              )}
            </section>

            {/* 2. Scheduling snippet */}
            <section className="px-4 py-4 space-y-2.5">
              <div className="text-[12.5px] font-semibold text-[#1F1F1F]">
                Scheduling snippet
              </div>

              <button
                type="button"
                onClick={onToggleShareMode}
                className={`w-full h-[34px] px-3 rounded-[6px] border text-[12.5px] font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  shareMode
                    ? 'bg-[#E1F2FC] border-[#3B9AE1] text-[#14588A]'
                    : 'bg-white border-[#E4E4E4] text-[#1F1F1F] hover:bg-[#F5F5F5]'
                }`}
              >
                <span className="flex-1 text-center pl-4">
                  {shareMode ? 'Done selecting slots' : 'Share availability'}
                </span>
                <kbd className="w-[18px] h-[18px] rounded-[4px] bg-[#F2F2F2] border border-[#E5E5E5] text-[10.5px] font-mono-tabular text-[#7A7A7A] flex items-center justify-center shrink-0">
                  S
                </kbd>
              </button>

              {shareMode && (
                <div className="space-y-2 pt-1">
                  {availabilitySlots.length === 0 ? (
                    <p className="text-[11.5px] text-[#7A7A7A] leading-snug">
                      Drag across open hours on the calendar grid to pick time slots to share.
                    </p>
                  ) : (
                    <>
                      <div className="space-y-1 max-h-[120px] overflow-y-auto cal-scroll">
                        {availabilitySlots.map((slot) => {
                          const d = parseDateKey(slot.dateKey);
                          return (
                            <div
                              key={slot.id}
                              className="flex items-center justify-between gap-2 text-[11.5px] bg-white border border-[#EAEAEA] rounded px-2 py-1"
                            >
                              <span className="truncate tabular-nums text-[#2E2E2E]">
                                {DAY_NAMES_SHORT[d.getDay()]} {d.getDate()} ·{' '}
                                {formatTimeRange(slot.startMinutes, slot.endMinutes)}
                              </span>
                              <button
                                type="button"
                                onClick={() => onRemoveAvailabilitySlot(slot.id)}
                                className="text-[#9A9A9A] hover:text-[#1A1A1A] cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleCopySnippet}
                          className="flex-1 py-1.5 px-2.5 rounded-md bg-[#1A1A1A] text-white text-[11.5px] font-medium hover:bg-[#333333] transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {copiedSnippet ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied</span>
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
                          className="py-1.5 px-2 rounded-md border border-[#E2E2E2] bg-white text-[11.5px] text-[#6B6B6B] hover:text-[#1A1A1A] cursor-pointer"
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
            <section className="px-4 py-4 space-y-2.5">
              <div className="text-[12.5px] font-semibold text-[#1F1F1F]">
                Quick add event
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const trimmed = meetQuery.trim();
                  if (!trimmed) return;
                  onQuickCreateMeeting(trimmed);
                  setMeetQuery('');
                }}
                className="flex items-center gap-2 h-[32px] px-2 -mx-2 rounded-md hover:bg-[#F2F2F2] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#D9D9D9] transition-colors"
              >
                <User className="w-3.5 h-3.5 text-[#9A9A9A] shrink-0" />
                <input
                  ref={meetInputRef}
                  type="text"
                  value={meetQuery}
                  onChange={(e) => setMeetQuery(e.target.value)}
                  placeholder="Event, birthday, memorial..."
                  className="flex-1 min-w-0 bg-transparent text-[12.5px] text-[#1A1A1A] placeholder:text-[#9E9E9E] focus:outline-none"
                />
                <kbd className="w-[18px] h-[18px] rounded-[4px] bg-[#EFEFEF] border border-[#E3E3E3] text-[10.5px] font-mono-tabular text-[#7A7A7A] flex items-center justify-center shrink-0">
                  F
                </kbd>
              </form>
            </section>

            {/* 4. Useful shortcuts */}
            <section className="px-4 py-4 space-y-2.5">
              <div className="text-[12.5px] font-semibold text-[#1F1F1F]">
                Useful shortcuts
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={onOpenCommandMenu}
                  className="w-full flex items-center justify-between py-1 px-1.5 -mx-1.5 rounded hover:bg-[#EFEFEF] text-[12.5px] text-[#787878] hover:text-[#1F1F1F] transition-colors cursor-pointer"
                >
                  <span>Command menu</span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 h-[19px] rounded-[4px] bg-[#EFEFEF] border border-[#E4E4E4] text-[10.5px] font-mono-tabular text-[#7A7A7A] inline-flex items-center justify-center">
                      ⌘
                    </kbd>
                    <kbd className="px-1.5 h-[19px] rounded-[4px] bg-[#EFEFEF] border border-[#E4E4E4] text-[10.5px] font-mono-tabular text-[#7A7A7A] inline-flex items-center justify-center">
                      K
                    </kbd>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenSettings('festivals')}
                  className="w-full flex items-center justify-between py-1 px-1.5 -mx-1.5 rounded hover:bg-[#EFEFEF] text-[12.5px] text-[#787878] hover:text-[#1F1F1F] transition-colors cursor-pointer"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>Settings &amp; World Calendars</span>
                  </span>
                  <kbd className="px-1.5 h-[19px] rounded-[4px] bg-[#EFEFEF] border border-[#E4E4E4] text-[10.5px] font-mono-tabular text-[#7A7A7A] inline-flex items-center justify-center">
                    ,
                  </kbd>
                </button>

                <button
                  type="button"
                  onClick={onToggleAllCultural}
                  className="w-full flex items-center justify-between py-1 px-1.5 -mx-1.5 rounded hover:bg-[#EFEFEF] text-[12.5px] text-[#787878] hover:text-[#1F1F1F] transition-colors cursor-pointer"
                >
                  <span>
                    {anyCulturalVisible ? 'Hide festivals & days' : 'Show festivals & days'}
                  </span>
                  <kbd className="px-1.5 h-[19px] rounded-[4px] bg-[#EFEFEF] border border-[#E4E4E4] text-[10.5px] font-mono-tabular text-[#7A7A7A] inline-flex items-center justify-center">
                    H
                  </kbd>
                </button>

                <button
                  type="button"
                  onClick={onToggleGujaratiLayer}
                  className="w-full flex items-center justify-between py-1 px-1.5 -mx-1.5 rounded hover:bg-[#EFEFEF] text-[12.5px] text-[#787878] hover:text-[#1F1F1F] transition-colors cursor-pointer"
                >
                  <span>
                    {showGujaratiCalendar
                      ? 'Hide Gujarati calendar'
                      : 'Show Gujarati calendar'}
                  </span>
                  <kbd className="px-1.5 h-[19px] rounded-[4px] bg-[#EFEFEF] border border-[#E4E4E4] text-[10.5px] font-mono-tabular text-[#7A7A7A] inline-flex items-center justify-center">
                    G
                  </kbd>
                </button>

                <button
                  type="button"
                  onClick={onOpenGoToDate}
                  className="w-full flex items-center justify-between py-1 px-1.5 -mx-1.5 rounded hover:bg-[#EFEFEF] text-[12.5px] text-[#787878] hover:text-[#1F1F1F] transition-colors cursor-pointer"
                >
                  <span>Go to date</span>
                  <kbd className="px-1.5 h-[19px] rounded-[4px] bg-[#EFEFEF] border border-[#E4E4E4] text-[10.5px] font-mono-tabular text-[#7A7A7A] inline-flex items-center justify-center">
                    .
                  </kbd>
                </button>

                <button
                  type="button"
                  onClick={onOpenShortcuts}
                  className="w-full flex items-center justify-between py-1 px-1.5 -mx-1.5 rounded hover:bg-[#EFEFEF] text-[12.5px] text-[#787878] hover:text-[#1F1F1F] transition-colors cursor-pointer"
                >
                  <span>All keyboard shortcuts</span>
                  <kbd className="px-1.5 h-[19px] rounded-[4px] bg-[#EFEFEF] border border-[#E4E4E4] text-[10.5px] font-mono-tabular text-[#7A7A7A] inline-flex items-center justify-center">
                    ?
                  </kbd>
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </aside>
  );
};
