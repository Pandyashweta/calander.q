import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  AvailabilitySlot,
  CalendarEvent,
  CalendarLayer,
  FestivalItem,
  GujaratiPanchang,
  TimezoneOption,
  WorldCalendarSystemId,
} from '../types/calendar';
import {
  DailyForecastItem,
  formatTempRounded,
  getWeatherIconUrl,
} from '../services/weatherService';
import { getFestivalsForDate } from '../data/festivalsAndDays';
import { getGujaratiPanchang } from '../data/gujaratiPanchang';
import { convertToWorldCalendar, getWorldCalendarsForDate } from '../data/worldCalendars';
import { HolidayRegionCode } from '../utils/deviceUtils';
import {
  COLOR_THEMES,
  DAY_NAMES_SHORT,
  formatDateKey,
  formatHourLabel,
  formatMinutesToTime,
  formatSecondaryHourLabel,
  formatTimeRange,
  isSameDay,
  layoutDayEvents,
} from '../utils/dateUtils';

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface TimeGridProps {
  today: Date;
  visibleDays: Date[];
  events: CalendarEvent[];
  layers: CalendarLayer[];
  visibleLayerIds: Set<string>;
  showGujaratiCalendar: boolean;
  headerSubCalendar: WorldCalendarSystemId | 'none';
  enabledWorldCalendars?: WorldCalendarSystemId[];
  gujaratiScript: boolean;
  holidayRegion?: HolidayRegionCode;
  primaryTz: TimezoneOption;
  secondaryTz: TimezoneOption;
  selectedEventId: string | null;
  selectedFestivalId: string | null;
  shareMode: boolean;
  availabilitySlots: AvailabilitySlot[];
  isPhone?: boolean;
  isDrawerMode?: boolean;
  dailyForecastByDate?: Map<string, DailyForecastItem>;
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectFestival: (festival: FestivalItem, panchang: GujaratiPanchang) => void;
  onSelectDayPanchang: (date: Date, panchang: GujaratiPanchang) => void;
  onCreateEventFromRange: (dateKey: string, startMinutes: number, endMinutes: number) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  onAddAvailabilitySlot: (dateKey: string, startMinutes: number, endMinutes: number) => void;
  onRemoveAvailabilitySlot: (slotId: string) => void;
  onOpenTimezoneModal: () => void;
  onToggleRightPanel: () => void;
}

interface DragCreateState {
  dateKey: string;
  anchorMinutes: number;
  currentMinutes: number;
}

interface DragMoveState {
  eventId: string;
  mode: 'move' | 'resize';
  initialY: number;
  origStart: number;
  origEnd: number;
  origDateKey: string;
  currentStart: number;
  currentEnd: number;
  currentDateKey: string;
}

export const TimeGrid: React.FC<TimeGridProps> = ({
  today,
  visibleDays,
  events,
  layers,
  visibleLayerIds,
  showGujaratiCalendar,
  headerSubCalendar,
  enabledWorldCalendars = [],
  gujaratiScript,
  holidayRegion = 'IN',
  primaryTz,
  secondaryTz,
  selectedEventId,
  selectedFestivalId,
  shareMode,
  availabilitySlots,
  isPhone = false,
  isDrawerMode = false,
  dailyForecastByDate,
  onSelectEvent,
  onSelectFestival,
  onSelectDayPanchang,
  onCreateEventFromRange,
  onUpdateEvent,
  onAddAvailabilitySlot,
  onRemoveAvailabilitySlot,
  onOpenTimezoneModal,
  onToggleRightPanel,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const gridBodyRef = useRef<HTMLDivElement>(null);

  const [nowMinutes, setNowMinutes] = useState<number>(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });

  const [expandedAllDay, setExpandedAllDay] = useState(false);
  const [dragCreate, setDragCreate] = useState<DragCreateState | null>(null);
  const [dragMove, setDragMove] = useState<DragMoveState | null>(null);

  useEffect(() => {
    const updateNow = () => {
      const n = new Date();
      setNowMinutes(n.getHours() * 60 + n.getMinutes());
    };
    const interval = setInterval(updateNow, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 7.75 * HOUR_HEIGHT;
    }
  }, []);

  const layerById = useMemo(() => {
    const map = new Map<string, CalendarLayer>();
    for (const l of layers) map.set(l.id, l);
    return map;
  }, [layers]);

  const visibleDateKeys = useMemo(() => visibleDays.map(formatDateKey), [visibleDays]);

  const panchangByDay = useMemo(
    () => visibleDays.map((d) => getGujaratiPanchang(d)),
    [visibleDays]
  );

  const effectiveSubCal: WorldCalendarSystemId | 'none' = headerSubCalendar;

  const subCalByDay = useMemo(() => {
    if (effectiveSubCal === 'none') return null;
    return visibleDays.map((d) =>
      convertToWorldCalendar(d, effectiveSubCal, gujaratiScript)
    );
  }, [visibleDays, effectiveSubCal, gujaratiScript]);

  const multiCalsByDay = useMemo(() => {
    const activeList: WorldCalendarSystemId[] = [];
    if (effectiveSubCal !== 'none') activeList.push(effectiveSubCal);
    for (const id of enabledWorldCalendars) {
      if (!activeList.includes(id)) activeList.push(id);
    }
    if (showGujaratiCalendar && !activeList.includes('gujarati-vikram')) {
      activeList.push('gujarati-vikram');
    }
    return visibleDays.map((d) =>
      getWorldCalendarsForDate(d, activeList, gujaratiScript)
    );
  }, [visibleDays, enabledWorldCalendars, effectiveSubCal, showGujaratiCalendar, gujaratiScript]);

  const { spanningAllDayEvents, perDayAllDayItems } = useMemo(() => {
    const firstKey = visibleDateKeys[0];
    const lastKey = visibleDateKeys[visibleDateKeys.length - 1];
    const visibleEvents = events.filter((e) => visibleLayerIds.has(e.calendarId));

    const spanning: {
      event: CalendarEvent;
      startCol: number;
      span: number;
    }[] = [];

    const singleDayEventsMap = new Map<string, CalendarEvent[]>();
    for (const k of visibleDateKeys) singleDayEventsMap.set(k, []);

    for (const ev of visibleEvents) {
      if (!ev.allDay) continue;
      if (ev.endDate < firstKey || ev.startDate > lastKey) continue;

      if (ev.startDate !== ev.endDate) {
        const startCol = Math.max(
          0,
          visibleDateKeys.findIndex((k) => k >= ev.startDate)
        );
        let endCol = visibleDateKeys.length - 1;
        for (let i = visibleDateKeys.length - 1; i >= 0; i--) {
          if (visibleDateKeys[i] <= ev.endDate) {
            endCol = i;
            break;
          }
        }
        if (startCol <= endCol) {
          spanning.push({ event: ev, startCol, span: endCol - startCol + 1 });
        }
      } else {
        const list = singleDayEventsMap.get(ev.startDate);
        if (list) list.push(ev);
      }
    }

    const perDay = visibleDays.map((day, idx) => {
      const key = visibleDateKeys[idx];
      const userAllDay = singleDayEventsMap.get(key) || [];
      const festivals = getFestivalsForDate(day, visibleLayerIds, holidayRegion);
      return {
        dateKey: key,
        panchang: panchangByDay[idx],
        userAllDay,
        festivals,
      };
    });

    return { spanningAllDayEvents: spanning, perDayAllDayItems: perDay };
  }, [events, visibleDays, visibleDateKeys, visibleLayerIds, panchangByDay, holidayRegion]);

  const maxPerDayAllDayCount = useMemo(
    () =>
      perDayAllDayItems.reduce(
        (max, d) => Math.max(max, d.userAllDay.length + d.festivals.length),
        0
      ),
    [perDayAllDayItems]
  );

  const MAX_COLLAPSED_ITEMS = 3;

  const timedByDay = useMemo(() => {
    const visibleTimed = events.filter(
      (e) => !e.allDay && visibleLayerIds.has(e.calendarId)
    );
    return visibleDateKeys.map((key) => {
      const dayEvents = visibleTimed
        .map((e) => {
          if (dragMove && dragMove.eventId === e.id) {
            return {
              ...e,
              startDate: dragMove.currentDateKey,
              endDate: dragMove.currentDateKey,
              startMinutes: dragMove.currentStart,
              endMinutes: dragMove.currentEnd,
            };
          }
          return e;
        })
        .filter((e) => e.startDate === key);
      return layoutDayEvents(dayEvents);
    });
  }, [events, visibleDateKeys, visibleLayerIds, dragMove]);

  const snap15 = (mins: number) =>
    Math.max(0, Math.min(1440, Math.round(mins / 15) * 15));

  const getMinutesFromClientY = (clientY: number): number => {
    const el = gridBodyRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const y = clientY - rect.top;
    return snap15((y / HOUR_HEIGHT) * 60);
  };

  const getDateKeyFromClientX = (clientX: number): string => {
    const el = gridBodyRef.current;
    if (!el) return visibleDateKeys[0];
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width - 1, clientX - rect.left));
    const colIdx = Math.floor((x / rect.width) * visibleDateKeys.length);
    return visibleDateKeys[Math.max(0, Math.min(visibleDateKeys.length - 1, colIdx))];
  };

  useEffect(() => {
    if (!dragCreate && !dragMove) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragCreate) {
        const mins = getMinutesFromClientY(e.clientY);
        setDragCreate((prev) => (prev ? { ...prev, currentMinutes: mins } : null));
      } else if (dragMove) {
        const deltaY = e.clientY - dragMove.initialY;
        const deltaMins = Math.round(((deltaY / HOUR_HEIGHT) * 60) / 15) * 15;

        if (dragMove.mode === 'move') {
          const duration = dragMove.origEnd - dragMove.origStart;
          const nextStart = Math.max(
            0,
            Math.min(1440 - duration, dragMove.origStart + deltaMins)
          );
          const nextDateKey = getDateKeyFromClientX(e.clientX);
          setDragMove((prev) =>
            prev
              ? {
                  ...prev,
                  currentStart: nextStart,
                  currentEnd: nextStart + duration,
                  currentDateKey: nextDateKey,
                }
              : null
          );
        } else {
          const nextEnd = Math.max(
            dragMove.origStart + 15,
            Math.min(1440, dragMove.origEnd + deltaMins)
          );
          setDragMove((prev) => (prev ? { ...prev, currentEnd: nextEnd } : null));
        }
      }
    };

    const handleMouseUp = () => {
      if (dragCreate) {
        const s = Math.min(dragCreate.anchorMinutes, dragCreate.currentMinutes);
        let e = Math.max(dragCreate.anchorMinutes, dragCreate.currentMinutes);
        if (e - s < 30) {
          e = Math.min(1440, s + 60);
        }
        if (shareMode) {
          onAddAvailabilitySlot(dragCreate.dateKey, s, e);
        } else {
          onCreateEventFromRange(dragCreate.dateKey, s, e);
        }
        setDragCreate(null);
      } else if (dragMove) {
        const moved =
          dragMove.currentStart !== dragMove.origStart ||
          dragMove.currentEnd !== dragMove.origEnd ||
          dragMove.currentDateKey !== dragMove.origDateKey;
        if (moved) {
          const target = events.find((ev) => ev.id === dragMove.eventId);
          if (target) {
            onUpdateEvent({
              ...target,
              startDate: dragMove.currentDateKey,
              endDate: dragMove.currentDateKey,
              startMinutes: dragMove.currentStart,
              endMinutes: dragMove.currentEnd,
            });
          }
        }
        setDragMove(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    dragCreate,
    dragMove,
    events,
    shareMode,
    onAddAvailabilitySlot,
    onCreateEventFromRange,
    onUpdateEvent,
  ]);

  const todayColIdx = visibleDays.findIndex((d) => isSameDay(d, today));
  const gutterWidthClass = isPhone ? 'w-[50px]' : 'w-[92px]';
  const showRightToggleRail = !isDrawerMode;
  const rightPadClass = showRightToggleRail ? 'pr-[24px]' : 'pr-1.5';
  const needsHorizontalScroll = isPhone && visibleDays.length >= 5;
  const minGridWidthStyle = needsHorizontalScroll
    ? { minWidth: `${visibleDays.length * 108}px` }
    : undefined;

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-white dark:bg-[#09090B] overflow-hidden select-none transition-colors">
      <div
        className={`flex-1 flex flex-col min-h-0 ${
          needsHorizontalScroll ? 'overflow-x-auto cal-scroll' : 'overflow-hidden'
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0" style={minGridWidthStyle}>
          {/* Sticky Day Column Headers */}
          <div className="shrink-0 border-b border-[#EFEFEF] dark:border-[#242429] bg-white dark:bg-[#111114] z-20">
            <div className="flex items-stretch">
              <div
                className={`${gutterWidthClass} shrink-0 flex items-end justify-end gap-1.5 sm:gap-2 pr-1.5 sm:pr-2.5 pb-1.5 text-[10px] font-medium text-[#8C8C8C] dark:text-[#71717A] tracking-wide`}
              >
                {!isPhone && (
                  <button
                    type="button"
                    onClick={onOpenTimezoneModal}
                    title="Configure dual timezones"
                    aria-label="Configure dual timezones"
                    className="p-0.5 rounded hover:bg-[#F0F0F0] dark:hover:bg-[#1E1E24] text-[#8C8C8C] dark:text-[#71717A] hover:text-[#1F1F1F] dark:hover:text-white transition-colors cursor-pointer mr-auto ml-1.5"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
                {!isPhone && (
                  <button
                    type="button"
                    onClick={onOpenTimezoneModal}
                    className="hover:text-[#1F1F1F] dark:hover:text-white transition-colors cursor-pointer tabular-nums"
                    title={secondaryTz.label}
                  >
                    {secondaryTz.abbr}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenTimezoneModal}
                  className="hover:text-[#1F1F1F] dark:hover:text-white transition-colors cursor-pointer tabular-nums"
                  title={primaryTz.label}
                >
                  {primaryTz.abbr}
                </button>
              </div>

              <div
                className="flex-1 grid min-w-0"
                style={{
                  gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))`,
                }}
              >
                {visibleDays.map((day, idx) => {
                  const dateKey = formatDateKey(day);
                  const isToday = isSameDay(day, today);
                  const panchang = panchangByDay[idx];
                  const subCalVal = subCalByDay ? subCalByDay[idx] : null;
                  const forecast = dailyForecastByDate?.get(dateKey) || null;
                  const forecastIcon = forecast ? getWeatherIconUrl(forecast.iconBaseUri) : null;
                  const isHighlightedGujTithi =
                    effectiveSubCal === 'gujarati-vikram' &&
                    (panchang.tithiNum === 15 || panchang.tithiNum === 11);

                  return (
                    <div
                      key={dateKey}
                      className="flex flex-col items-center justify-center py-1.5 px-0.5 sm:px-1 min-w-0"
                    >
                      <div className="flex items-center justify-center gap-1 max-w-full">
                        <button
                          type="button"
                          onClick={() => onSelectDayPanchang(day, panchang)}
                          title="Inspect date across all enabled World Calendars"
                          className="flex items-center gap-1 sm:gap-1.5 rounded px-1 sm:px-1.5 py-0.5 hover:bg-[#F5F5F5] dark:hover:bg-[#1E1E24] transition-colors cursor-pointer"
                        >
                          <span
                            className={`text-[12.5px] sm:text-[13.5px] ${
                              isToday
                                ? 'font-semibold text-[#1A1A1A] dark:text-[#F4F4F5]'
                                : 'font-normal text-[#737373] dark:text-[#A1A1AA]'
                            }`}
                          >
                            {DAY_NAMES_SHORT[day.getDay()]}
                          </span>
                          <span
                            className={`text-[12.5px] sm:text-[13.5px] tabular-nums leading-none ${
                              isToday
                                ? 'bg-[#F04422] text-white font-semibold px-[5px] sm:px-[6px] py-[2.5px] sm:py-[3px] rounded-[5px]'
                                : 'text-[#737373] dark:text-[#A1A1AA] font-normal'
                            }`}
                          >
                            {day.getDate()}
                          </span>
                        </button>

                        {forecast && forecast.maxTemp !== null && !isPhone && (
                          <span
                            title={`${forecast.conditionText} · High ${formatTempRounded(
                              forecast.maxTemp
                            )} / Low ${formatTempRounded(forecast.minTemp)}`}
                            className="hidden md:inline-flex items-center gap-0.5 text-[10.5px] text-[#7A7A7A] dark:text-[#A1A1AA] tabular-nums shrink-0"
                          >
                            {forecastIcon && (
                              <img
                                src={forecastIcon}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-3.5 h-3.5 object-contain"
                              />
                            )}
                            <span>{formatTempRounded(forecast.maxTemp)}</span>
                          </span>
                        )}
                      </div>

                      {/* Unified Multi-Calendar Secondary Date Badges */}
                      {multiCalsByDay[idx] && multiCalsByDay[idx].length > 0 && (
                        <div className="mt-1 flex flex-wrap items-center justify-center gap-1 max-w-full px-0.5">
                          {multiCalsByDay[idx].slice(0, 2).map((calVal) => {
                            const isHighlighted =
                              calVal.id === 'gujarati-vikram' &&
                              (panchang.tithiNum === 15 || panchang.tithiNum === 11);

                            const badgeStyle =
                              calVal.id === 'gujarati-vikram'
                                ? isHighlighted
                                  ? 'text-[#9A5B00] bg-[#FEF5D9] hover:bg-[#FCEBB8] font-medium'
                                  : 'text-[#8A6D2D] bg-[#FDF8EC] hover:bg-[#F9EFC7]'
                                : calVal.id === 'islamic-hijri'
                                ? 'text-[#1D6F42] bg-[#EAF7EE] hover:bg-[#D5EEDD]'
                                : calVal.id === 'hebrew'
                                ? 'text-[#1B5E8A] bg-[#E8F3FA] hover:bg-[#D2E7F5]'
                                : calVal.id === 'chinese'
                                ? 'text-[#A02828] bg-[#FCEAEA] hover:bg-[#F8D2D2]'
                                : calVal.id === 'solar-hijri'
                                ? 'text-[#B25900] bg-[#FFF2E2] hover:bg-[#FFE3C2]'
                                : calVal.id === 'iso-week'
                                ? 'text-[#4A4A4A] bg-[#F0F0F0] hover:bg-[#E4E4E4] font-mono-tabular'
                                : calVal.id === 'academic'
                                ? 'text-[#8C2A1C] bg-[#F8DFD6] hover:bg-[#F4CFC2]'
                                : calVal.id === 'fiscal'
                                ? 'text-[#525252] bg-[#EFEFEF] hover:bg-[#E2E2E2]'
                                : 'text-[#5C5C5C] bg-[#F4F4F4] hover:bg-[#EAEAEA]';

                            return (
                              <button
                                key={calVal.id}
                                type="button"
                                onClick={() => onSelectDayPanchang(day, panchang)}
                                title={`${calVal.name}: ${calVal.formatted} · ${calVal.detail}`}
                                className={`max-w-full truncate px-1.5 py-[1px] rounded text-[9.5px] sm:text-[10px] leading-tight transition-colors cursor-pointer ${
                                  calVal.id === 'gujarati-vikram' && gujaratiScript
                                    ? 'font-gujarati'
                                    : ''
                                } ${badgeStyle}`}
                              >
                                {calVal.shortLabel}
                              </button>
                            );
                          })}
                          {multiCalsByDay[idx].length > 2 && (
                            <button
                              type="button"
                              onClick={() => onSelectDayPanchang(day, panchang)}
                              title={multiCalsByDay[idx].map((c) => `${c.name}: ${c.formatted}`).join('\n')}
                              className="text-[9px] text-[#737373] bg-[#EFEFEF] hover:bg-[#E0E0E0] px-1 py-[1px] rounded cursor-pointer shrink-0 transition-colors"
                            >
                              +{multiCalsByDay[idx].length - 2}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {showRightToggleRail && (
                <div className="w-[24px] shrink-0 flex items-end justify-center pb-1.5">
                  <button
                    type="button"
                    onClick={onToggleRightPanel}
                    title="Toggle context panel (])"
                    aria-label="Toggle context panel"
                    className="text-[12px] text-[#9A9A9A] dark:text-[#71717A] hover:text-[#1F1F1F] dark:hover:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#1E1E24] rounded px-1 transition-colors cursor-pointer"
                  >
                    ±
                  </button>
                </div>
              )}
            </div>

            {/* All-Day Events & Synced Festivals/Days Banner Area */}
            <div className="flex items-stretch border-t border-[#F2F2F2] dark:border-[#242429] bg-white dark:bg-[#111114]">
              <div
                className={`${gutterWidthClass} shrink-0 flex flex-col items-end justify-start pr-1.5 sm:pr-2.5 pt-2 pb-1.5`}
              >
                <span className="text-[10px] sm:text-[10.5px] font-medium text-[#8C8C8C] dark:text-[#71717A]">
                  {isPhone ? 'All' : 'All-day'}
                </span>
                {maxPerDayAllDayCount > MAX_COLLAPSED_ITEMS && (
                  <button
                    type="button"
                    onClick={() => setExpandedAllDay((v) => !v)}
                    className="mt-1 text-[10px] font-medium text-[#737373] dark:text-[#A1A1AA] hover:text-[#1A1A1A] dark:hover:text-white cursor-pointer"
                  >
                    {expandedAllDay ? 'Less' : 'More'}
                  </button>
                )}
              </div>

              <div className={`flex-1 min-w-0 py-1 ${rightPadClass}`}>
            {spanningAllDayEvents.length > 0 && (
              <div
                className="grid gap-y-1 mb-1"
                style={{
                  gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))`,
                }}
              >
                {spanningAllDayEvents.map(({ event, startCol, span }) => {
                  const layer = layerById.get(event.calendarId);
                  const theme = COLOR_THEMES[layer?.color || 'purple'];
                  const barColor = layer?.customHex || theme.bar;
                  const isSelected = selectedEventId === event.id;

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onSelectEvent(event)}
                      style={{
                        gridColumn: `${startCol + 1} / span ${span}`,
                        backgroundColor: theme.bg,
                        color: theme.text,
                        boxShadow: isSelected ? `0 0 0 1.5px ${barColor}` : undefined,
                      }}
                      className="mx-[2px] h-[22px] rounded-[4px] flex items-center gap-1.5 px-1.5 text-left transition-all hover:brightness-[0.97] cursor-pointer overflow-hidden"
                    >
                      <span
                        className="w-[3px] h-[14px] rounded-full shrink-0"
                        style={{ backgroundColor: barColor }}
                      />
                      <span className="text-[11.5px] font-semibold truncate">
                        {event.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))`,
              }}
            >
              {perDayAllDayItems.map((col) => {
                const combined: Array<
                  | { kind: 'event'; event: CalendarEvent }
                  | { kind: 'festival'; festival: FestivalItem }
                > = [
                  ...col.userAllDay.map((event) => ({ kind: 'event' as const, event })),
                  ...col.festivals.map((festival) => ({
                    kind: 'festival' as const,
                    festival,
                  })),
                ];

                const visibleItems = expandedAllDay
                  ? combined
                  : combined.slice(0, MAX_COLLAPSED_ITEMS);
                const hiddenCount = combined.length - visibleItems.length;

                return (
                  <div
                    key={col.dateKey}
                    className="px-[2px] space-y-[3px] min-h-[26px] border-l border-[#F5F5F5] dark:border-[#1E1E24] first:border-l-0"
                  >
                    {visibleItems.map((item) => {
                      if (item.kind === 'event') {
                        const layer = layerById.get(item.event.calendarId);
                        const theme = COLOR_THEMES[layer?.color || 'blue'];
                        const barColor = layer?.customHex || theme.bar;
                        const isSelected = selectedEventId === item.event.id;
                        return (
                          <button
                            key={item.event.id}
                            type="button"
                            onClick={() => onSelectEvent(item.event)}
                            style={{
                              backgroundColor: theme.bg,
                              color: theme.text,
                              boxShadow: isSelected
                                ? `0 0 0 1.5px ${barColor}`
                                : undefined,
                            }}
                            className="w-full h-[22px] rounded-[4px] flex items-center gap-1.5 px-1.5 text-left transition-all hover:brightness-[0.97] cursor-pointer overflow-hidden"
                          >
                            <span
                              className="w-[3px] h-[14px] rounded-full shrink-0"
                              style={{ backgroundColor: barColor }}
                            />
                            <span className="text-[11.5px] font-semibold truncate">
                              {item.event.title}
                            </span>
                          </button>
                        );
                      }

                      const layer = layerById.get(item.festival.layerId);
                      const theme = COLOR_THEMES[layer?.color || 'saffron'];
                      const isSelected = selectedFestivalId === item.festival.id;
                      const displayTitle =
                        gujaratiScript && item.festival.gujaratiTitle
                          ? item.festival.gujaratiTitle
                          : item.festival.title;

                      return (
                        <button
                          key={item.festival.id}
                          type="button"
                          onClick={() => onSelectFestival(item.festival, col.panchang)}
                          title={`${item.festival.title} (${item.festival.categoryLabel})`}
                          style={{
                            backgroundColor: theme.bg,
                            color: theme.text,
                            boxShadow: isSelected ? `0 0 0 1.5px ${theme.bar}` : undefined,
                          }}
                          className="w-full h-[22px] rounded-[4px] flex items-center gap-1.5 px-1.5 text-left transition-all hover:brightness-[0.97] cursor-pointer overflow-hidden"
                        >
                          <span
                            className="w-[3px] h-[14px] rounded-full shrink-0"
                            style={{ backgroundColor: theme.bar }}
                          />
                          <span
                            className={`text-[11.5px] font-medium truncate ${
                              gujaratiScript && item.festival.gujaratiTitle
                                ? 'font-gujarati'
                                : ''
                            }`}
                          >
                            {displayTitle}
                          </span>
                        </button>
                      );
                    })}

                    {hiddenCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedAllDay(true)}
                        className="w-full text-left px-1.5 py-0.5 text-[10.5px] font-medium text-[#737373] dark:text-[#A1A1AA] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-[#F5F5F5] dark:hover:bg-[#1E1E24] rounded cursor-pointer"
                      >
                        +{hiddenCount} more
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {shareMode && (
        <div className="shrink-0 bg-[#F4F8FD] dark:bg-sky-950/40 border-b border-[#D6E6F9] dark:border-sky-800/50 px-4 py-1.5 flex items-center justify-between text-[12px] text-[#185D8F] dark:text-sky-300">
          <span>
            <strong>Share availability mode:</strong> Click and drag across open time slots to build your scheduling snippet.
          </span>
          <span className="text-[11px] font-medium tabular-nums">
            {availabilitySlots.length} {availabilitySlots.length === 1 ? 'slot' : 'slots'} selected
          </span>
        </div>
      )}

      {/* Scrollable 24-Hour Time Grid */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden cal-scroll relative bg-white dark:bg-[#09090B]"
      >
        <div className="flex relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          <div
            className={`${gutterWidthClass} shrink-0 relative border-r border-[#F0F0F0] dark:border-[#1E1E24] bg-white dark:bg-[#0D0D10]`}
          >
            {HOURS.map((hour) => {
              if (hour === 0) return null;
              const topPx = hour * HOUR_HEIGHT;
              const nearNow = Math.abs(topPx - nowMinutes) < 15;

              return (
                <div
                  key={hour}
                  style={{ top: `${topPx - 7}px` }}
                  className={`absolute left-0 right-0 pr-1.5 sm:pr-2.5 flex items-center justify-end gap-2 text-[10px] text-[#9A9A9A] dark:text-[#71717A] tabular-nums pointer-events-none transition-opacity ${
                    nearNow ? 'opacity-20' : 'opacity-100'
                  }`}
                >
                  {!isPhone && (
                    <span className="w-[34px] text-right">
                      {formatSecondaryHourLabel(
                        hour,
                        primaryTz.offsetMinutes,
                        secondaryTz.offsetMinutes
                      )}
                    </span>
                  )}
                  <span className="w-[34px] text-right">
                    {formatHourLabel(hour)}
                  </span>
                </div>
              );
            })}

            <div
              style={{ top: `${nowMinutes - 7}px` }}
              className="absolute right-1.5 sm:right-2.5 z-30 bg-white dark:bg-[#0D0D10] px-0.5 text-[9.5px] sm:text-[10px] font-semibold text-[#1A1A1A] dark:text-[#F4F4F5] tabular-nums leading-none pointer-events-none"
            >
              {formatMinutesToTime(nowMinutes)}
            </div>
          </div>

          <div ref={gridBodyRef} className={`flex-1 relative min-w-0 ${rightPadClass}`}>
            <div className="absolute inset-0 pointer-events-none">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                  className="absolute left-0 right-0 border-t border-[#F1F1F1] dark:border-[#1B1B21]"
                />
              ))}
            </div>

            <div
              className="relative h-full grid"
              style={{
                gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))`,
              }}
            >
              {visibleDays.map((day, dayIdx) => {
                const dateKey = visibleDateKeys[dayIdx];
                const positioned = timedByDay[dayIdx] || [];
                const daySlots = availabilitySlots.filter((s) => s.dateKey === dateKey);

                return (
                  <div
                    key={dateKey}
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      if ((e.target as HTMLElement).closest('[data-event-block="true"]')) {
                        return;
                      }
                      const mins = getMinutesFromClientY(e.clientY);
                      setDragCreate({
                        dateKey,
                        anchorMinutes: mins,
                        currentMinutes: mins + 60,
                      });
                    }}
                    className={`relative h-full border-l border-[#F1F1F1] dark:border-[#1B1B21] first:border-l-0 ${
                      shareMode ? 'cursor-crosshair' : 'cursor-default'
                    }`}
                  >
                    {dragCreate && dragCreate.dateKey === dateKey && (
                      <div
                        style={{
                          top: `${Math.min(dragCreate.anchorMinutes, dragCreate.currentMinutes)}px`,
                          height: `${Math.max(
                            30,
                            Math.abs(dragCreate.currentMinutes - dragCreate.anchorMinutes)
                          )}px`,
                        }}
                        className={`absolute left-[3px] right-[4px] rounded-[5px] z-30 pointer-events-none px-2 py-1 text-[11.5px] font-medium ${
                          shareMode
                            ? 'bg-[#E1F2FC]/90 border border-dashed border-[#3B9AE1] text-[#14588A]'
                            : 'bg-[#E1F2FC]/90 border border-[#3B9AE1] text-[#14588A] shadow-xs'
                        }`}
                      >
                        <div className="truncate font-semibold">
                          {shareMode ? 'Available slot' : 'New event'}
                        </div>
                        <div className="text-[10.5px] opacity-80 tabular-nums">
                          {formatTimeRange(
                            Math.min(dragCreate.anchorMinutes, dragCreate.currentMinutes),
                            Math.max(
                              Math.min(dragCreate.anchorMinutes, dragCreate.currentMinutes) +
                                30,
                              Math.max(dragCreate.anchorMinutes, dragCreate.currentMinutes)
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {shareMode &&
                      daySlots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          data-event-block="true"
                          onClick={() => onRemoveAvailabilitySlot(slot.id)}
                          title="Click to remove availability slot"
                          style={{
                            top: `${slot.startMinutes}px`,
                            height: `${Math.max(24, slot.endMinutes - slot.startMinutes)}px`,
                          }}
                          className="absolute left-[3px] right-[4px] rounded-[5px] bg-[#E2F5EA]/90 border border-dashed border-[#34B36E] text-[#1C6B40] px-2 py-1 text-left z-20 hover:bg-[#D2EEDE] transition-colors cursor-pointer"
                        >
                          <div className="text-[11px] font-semibold truncate">
                            Available
                          </div>
                          <div className="text-[10px] tabular-nums">
                            {formatTimeRange(slot.startMinutes, slot.endMinutes)}
                          </div>
                        </button>
                      ))}

                    {positioned.map(({ event, col, totalCols }) => {
                      const layer = layerById.get(event.calendarId);
                      const theme = COLOR_THEMES[layer?.color || 'blue'];
                      const barColor = layer?.customHex || theme.bar;
                      const isSelected = selectedEventId === event.id;
                      const isTentative = event.status === 'tentative';
                      const duration = Math.max(20, event.endMinutes - event.startMinutes);
                      const isShort = duration <= 35;

                      const widthPct = 100 / totalCols;
                      const leftPct = col * widthPct;

                      return (
                        <div
                          key={event.id}
                          data-event-block="true"
                          onMouseDown={(e) => {
                            if (e.button !== 0 || shareMode) return;
                            e.stopPropagation();
                            setDragMove({
                              eventId: event.id,
                              mode: 'move',
                              initialY: e.clientY,
                              origStart: event.startMinutes,
                              origEnd: event.endMinutes,
                              origDateKey: event.startDate,
                              currentStart: event.startMinutes,
                              currentEnd: event.endMinutes,
                              currentDateKey: event.startDate,
                            });
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(event);
                          }}
                          style={{
                            top: `${event.startMinutes + 1}px`,
                            height: `${duration - 2}px`,
                            left: `calc(${leftPct}% + 2px)`,
                            width: `calc(${widthPct}% - 5px)`,
                            backgroundColor: isTentative ? '#FFFFFF' : theme.bg,
                            border: isTentative
                              ? `1px dashed ${theme.borderDashed}`
                              : isSelected
                              ? `1.5px solid ${barColor}`
                              : '1px solid transparent',
                            boxShadow:
                              isSelected && isTentative
                                ? `0 0 0 1.5px ${barColor}`
                                : undefined,
                          }}
                          className={`absolute rounded-[5px] overflow-hidden z-10 hover:z-20 group transition-shadow cursor-pointer ${
                            dragMove?.eventId === event.id ? 'opacity-85 shadow-md z-30' : ''
                          }`}
                        >
                          {!isTentative && (
                            <span
                              className="absolute left-[3px] top-[3px] bottom-[3px] w-[3px] rounded-full"
                              style={{ backgroundColor: barColor }}
                            />
                          )}

                          <div
                            className={`h-full ${
                              isTentative ? 'pl-2 pr-1.5' : 'pl-[11px] pr-1.5'
                            } ${isShort ? 'py-0.5 flex items-center gap-1.5' : 'py-[4px]'}`}
                          >
                            <div
                              style={{ color: isTentative ? theme.subtext : theme.text }}
                              className={`text-[11.5px] font-semibold leading-[1.25] ${
                                isShort ? 'truncate' : 'line-clamp-2'
                              }`}
                            >
                              {event.title}
                            </div>
                            <div
                              style={{ color: theme.subtext }}
                              className={`text-[10.5px] leading-[1.25] tabular-nums ${
                                isShort ? 'shrink-0 opacity-85' : 'mt-0.5 truncate'
                              }`}
                            >
                              {formatTimeRange(event.startMinutes, event.endMinutes)}
                            </div>
                          </div>

                          {!shareMode && (
                            <div
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setDragMove({
                                  eventId: event.id,
                                  mode: 'resize',
                                  initialY: e.clientY,
                                  origStart: event.startMinutes,
                                  origEnd: event.endMinutes,
                                  origDateKey: event.startDate,
                                  currentStart: event.startMinutes,
                                  currentEnd: event.endMinutes,
                                  currentDateKey: event.startDate,
                                });
                              }}
                              className="absolute bottom-0 left-0 right-0 h-[6px] cursor-ns-resize opacity-0 group-hover:opacity-100"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Signature Current-Time Horizontal Line */}
            <div
              style={{ top: `${nowMinutes}px` }}
              className={`absolute left-0 ${
                showRightToggleRail ? 'right-[24px]' : 'right-1.5'
              } z-20 pointer-events-none flex items-center`}
            >
              <span className="w-[1.5px] h-[9px] bg-[#1A1A1A] dark:bg-[#F04422] shrink-0" />
              {todayColIdx >= 0 ? (
                <div
                  className="flex-1 grid items-center"
                  style={{
                    gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))`,
                  }}
                >
                  {visibleDays.map((d, idx) => (
                    <div key={formatDateKey(d)} className="relative flex items-center">
                      <div
                        className={`w-full ${
                          idx === todayColIdx
                            ? 'h-[2px] bg-[#1A1A1A] dark:bg-[#F04422]'
                            : 'h-[1px] bg-[#1A1A1A]/15 dark:bg-white/15'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 h-[1px] bg-[#1A1A1A]/20 dark:bg-white/20" />
              )}
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};
