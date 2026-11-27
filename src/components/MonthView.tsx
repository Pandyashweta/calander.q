import React, { useMemo } from 'react';
import {
  CalendarEvent,
  CalendarLayer,
  FestivalItem,
  GujaratiPanchang,
  WorldCalendarSystemId,
} from '../types/calendar';
import { getFestivalsForDate } from '../data/festivalsAndDays';
import { getGujaratiPanchang } from '../data/gujaratiPanchang';
import { getWorldCalendarsForDate } from '../data/worldCalendars';
import { HolidayRegionCode } from '../utils/deviceUtils';
import {
  COLOR_THEMES,
  DAY_NAMES_SHORT,
  formatDateKey,
  formatMinutesToTime,
  getMonthGrid,
  isSameDay,
} from '../utils/dateUtils';

interface MonthViewProps {
  today: Date;
  anchorDate: Date;
  events: CalendarEvent[];
  layers: CalendarLayer[];
  visibleLayerIds: Set<string>;
  showGujaratiCalendar: boolean;
  headerSubCalendar: WorldCalendarSystemId | 'none';
  enabledWorldCalendars?: WorldCalendarSystemId[];
  gujaratiScript: boolean;
  holidayRegion?: HolidayRegionCode;
  selectedEventId: string | null;
  selectedFestivalId: string | null;
  isPhone?: boolean;
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectFestival: (festival: FestivalItem, panchang: GujaratiPanchang) => void;
  onSelectDayPanchang: (date: Date, panchang: GujaratiPanchang) => void;
  onCreateEventOnDate: (dateKey: string) => void;
  onZoomToDay: (date: Date) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  today,
  anchorDate,
  events,
  layers,
  visibleLayerIds,
  showGujaratiCalendar,
  headerSubCalendar,
  enabledWorldCalendars = [],
  gujaratiScript,
  holidayRegion = 'IN',
  selectedEventId,
  selectedFestivalId,
  isPhone = false,
  onSelectEvent,
  onSelectFestival,
  onSelectDayPanchang,
  onCreateEventOnDate,
  onZoomToDay,
}) => {
  const days = useMemo(
    () => getMonthGrid(anchorDate.getFullYear(), anchorDate.getMonth()),
    [anchorDate.getFullYear(), anchorDate.getMonth()]
  );

  const layerById = useMemo(() => {
    const m = new Map<string, CalendarLayer>();
    for (const l of layers) m.set(l.id, l);
    return m;
  }, [layers]);

  const visibleEvents = useMemo(
    () => events.filter((e) => visibleLayerIds.has(e.calendarId)),
    [events, visibleLayerIds]
  );

  const activeWorldCalendarIds = useMemo(() => {
    const list: WorldCalendarSystemId[] = [];
    if (headerSubCalendar !== 'none') list.push(headerSubCalendar);
    for (const id of enabledWorldCalendars) {
      if (!list.includes(id)) list.push(id);
    }
    if (showGujaratiCalendar && !list.includes('gujarati-vikram')) {
      list.push('gujarati-vikram');
    }
    return list;
  }, [headerSubCalendar, enabledWorldCalendars, showGujaratiCalendar]);

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-[#F4F5F7] dark:bg-[#09090B] overflow-hidden select-none transition-colors duration-200">
      {/* Clean unbordered weekday header aligned over elevated day cards */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 px-2 sm:px-3 pt-2.5 pb-1.5 shrink-0 bg-[#F4F5F7] dark:bg-[#09090B]">
        {DAY_NAMES_SHORT.map((d) => (
          <div
            key={d}
            className="px-1.5 sm:px-2 text-center sm:text-left text-[11px] sm:text-[11.5px] font-semibold tracking-[0.01em] text-[#6B7280] dark:text-[#8E8E99]"
          >
            {isPhone ? d[0] : d}
          </div>
        ))}
      </div>

      {/* Elevated Surface Card Month Grid — zero solid cell borders, uniform soft shadow */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-1.5 sm:gap-2 px-2 sm:px-3 pb-2.5 sm:pb-3 pt-0.5 min-h-0 overflow-hidden bg-[#F4F5F7] dark:bg-[#09090B]">
        {days.map((day) => {
          const dateKey = formatDateKey(day);
          const isCurrentMonth = day.getMonth() === anchorDate.getMonth();
          const isToday = isSameDay(day, today);
          const panchang = getGujaratiPanchang(day);
          const dayCalVals = getWorldCalendarsForDate(
            day,
            activeWorldCalendarIds,
            gujaratiScript
          );

          const festivals = getFestivalsForDate(day, visibleLayerIds, holidayRegion);
          const dayEvents = visibleEvents
            .filter((e) => e.startDate <= dateKey && e.endDate >= dateKey)
            .sort((a, b) => {
              if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
              return a.startMinutes - b.startMinutes;
            });

          const totalItems = festivals.length + dayEvents.length;
          const maxVisible = isPhone ? 2 : 3;
          const combined: Array<
            | { kind: 'festival'; festival: FestivalItem }
            | { kind: 'event'; event: CalendarEvent }
          > = [
            ...festivals.map((festival) => ({ kind: 'festival' as const, festival })),
            ...dayEvents.map((event) => ({ kind: 'event' as const, event })),
          ];

          return (
            <div
              key={dateKey}
              onDoubleClick={() => onCreateEventOnDate(dateKey)}
              className={`rounded-[10px] sm:rounded-[12px] p-1 sm:p-2 flex flex-col min-h-0 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.05),0_3px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_14px_rgba(15,23,42,0.09)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.48),0_4px_12px_rgba(0,0,0,0.34)] dark:hover:shadow-[0_6px_18px_rgba(0,0,0,0.55)] transition-all duration-150 ${
                isToday
                  ? 'bg-white dark:bg-[#17171C] ring-1 ring-[#F04422]/30 dark:ring-[#F04422]/50'
                  : isCurrentMonth
                  ? 'bg-white dark:bg-[#131317]'
                  : 'bg-[#F9FAFB]/90 dark:bg-[#0E0E12]'
              }`}
            >
              <div className="flex items-start justify-between gap-0.5 sm:gap-1 mb-0.5 sm:mb-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onZoomToDay(day)}
                  title="Open day view"
                  className={`text-[11px] sm:text-[12px] tabular-nums leading-none cursor-pointer transition-colors ${
                    isToday
                      ? 'bg-[#F04422] text-white font-semibold px-[5px] sm:px-[6px] py-[3px] rounded-[5px] sm:rounded-[6px]'
                      : isCurrentMonth
                      ? 'text-[#1F1F1F] dark:text-[#F4F4F5] font-semibold hover:bg-[#F1F2F4] dark:hover:bg-[#23232A] px-1 py-0.5 rounded-[5px]'
                      : 'text-[#B4B8C0] dark:text-[#52525B] font-medium hover:bg-[#EFEFF2] dark:hover:bg-[#1C1C22] px-1 py-0.5 rounded-[5px]'
                  }`}
                >
                  {day.getDate()}
                </button>

                {dayCalVals.length > 0 && !isPhone && (
                  <div className="flex items-center gap-0.5 max-w-[72%] overflow-hidden">
                    {dayCalVals.slice(0, 2).map((calVal) => {
                      const isHighlighted =
                        calVal.id === 'gujarati-vikram' &&
                        (panchang.tithiNum === 15 || panchang.tithiNum === 11);

                      const badgeStyle =
                        calVal.id === 'gujarati-vikram'
                          ? isHighlighted
                            ? 'text-[#9A5B00] bg-[#FEF5D9]'
                            : 'text-[#8A6D2D] bg-[#FDF8EC]'
                          : calVal.id === 'islamic-hijri'
                          ? 'text-[#1D6F42] bg-[#EAF7EE]'
                          : calVal.id === 'hebrew'
                          ? 'text-[#1B5E8A] bg-[#E8F3FA]'
                          : calVal.id === 'chinese'
                          ? 'text-[#A02828] bg-[#FCEAEA]'
                          : calVal.id === 'solar-hijri'
                          ? 'text-[#B25900] bg-[#FFF2E2]'
                          : calVal.id === 'iso-week'
                          ? 'text-[#4A4A4A] bg-[#F0F0F0] font-mono-tabular'
                          : calVal.id === 'academic'
                          ? 'text-[#8C2A1C] bg-[#F8DFD6]'
                          : calVal.id === 'fiscal'
                          ? 'text-[#525252] bg-[#EFEFEF]'
                          : 'text-[#616161] bg-[#F4F4F4]';

                      return (
                        <button
                          key={calVal.id}
                          type="button"
                          onClick={() => onSelectDayPanchang(day, panchang)}
                          title={`${calVal.name}: ${calVal.formatted} · ${calVal.detail}`}
                          className={`text-[9.5px] truncate max-w-[85px] px-1 py-[0.5px] rounded leading-tight cursor-pointer ${
                            calVal.id === 'gujarati-vikram' && gujaratiScript
                              ? 'font-gujarati'
                              : ''
                          } ${badgeStyle}`}
                        >
                          {calVal.shortLabel}
                        </button>
                      );
                    })}
                    {dayCalVals.length > 2 && (
                      <button
                        type="button"
                        onClick={() => onSelectDayPanchang(day, panchang)}
                        title={dayCalVals.map((c) => `${c.name}: ${c.formatted}`).join('\n')}
                        className="text-[9px] text-[#737373] bg-[#EFEFEF] hover:bg-[#E0E0E0] px-1 py-[0.5px] rounded cursor-pointer shrink-0"
                      >
                        +{dayCalVals.length - 2}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-[2.5px] flex-1 min-h-0 overflow-hidden">
                {combined.slice(0, maxVisible).map((item) => {
                  if (item.kind === 'festival') {
                    const layer = layerById.get(item.festival.layerId);
                    const theme = COLOR_THEMES[layer?.color || 'saffron'];
                    const isSelected = selectedFestivalId === item.festival.id;
                    const label =
                      gujaratiScript && item.festival.gujaratiTitle
                        ? item.festival.gujaratiTitle
                        : item.festival.title;

                    return (
                      <button
                        key={item.festival.id}
                        type="button"
                        onClick={() => onSelectFestival(item.festival, panchang)}
                        style={{
                          backgroundColor: theme.bg,
                          color: theme.text,
                          boxShadow: isSelected ? `0 0 0 1px ${theme.bar}` : undefined,
                        }}
                        className="w-full h-[19px] rounded-[3.5px] flex items-center gap-1 px-1 text-left cursor-pointer overflow-hidden hover:brightness-[0.97]"
                      >
                        <span
                          className="w-[2.5px] h-[11px] rounded-full shrink-0"
                          style={{ backgroundColor: theme.bar }}
                        />
                        <span
                          className={`text-[10.5px] font-medium truncate ${
                            gujaratiScript && item.festival.gujaratiTitle
                              ? 'font-gujarati'
                              : ''
                          }`}
                        >
                          {label}
                        </span>
                      </button>
                    );
                  }

                  const ev = item.event;
                  const layer = layerById.get(ev.calendarId);
                  const theme = COLOR_THEMES[layer?.color || 'blue'];
                  const barColor = layer?.customHex || theme.bar;
                  const isSelected = selectedEventId === ev.id;

                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => onSelectEvent(ev)}
                      style={{
                        backgroundColor: ev.status === 'tentative' ? '#FFFFFF' : theme.bg,
                        color: theme.text,
                        border:
                          ev.status === 'tentative'
                            ? `1px dashed ${theme.borderDashed}`
                            : undefined,
                        boxShadow: isSelected ? `0 0 0 1px ${barColor}` : undefined,
                      }}
                      className="w-full h-[19px] rounded-[3.5px] flex items-center gap-1 px-1 text-left cursor-pointer overflow-hidden hover:brightness-[0.97]"
                    >
                      {ev.status !== 'tentative' && (
                        <span
                          className="w-[2.5px] h-[11px] rounded-full shrink-0"
                          style={{ backgroundColor: barColor }}
                        />
                      )}
                      <span className="text-[10.5px] font-semibold truncate flex-1">
                        {ev.title}
                      </span>
                      {!ev.allDay && !isPhone && (
                        <span
                          style={{ color: theme.subtext }}
                          className="text-[9.5px] tabular-nums shrink-0 opacity-85"
                        >
                          {formatMinutesToTime(ev.startMinutes, true)}
                        </span>
                      )}
                    </button>
                  );
                })}

                {totalItems > maxVisible && (
                  <button
                    type="button"
                    onClick={() => onZoomToDay(day)}
                    className="w-full text-left px-1 text-[10px] font-medium text-[#737373] hover:text-[#1A1A1A] cursor-pointer"
                  >
                    +{totalItems - maxVisible} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
