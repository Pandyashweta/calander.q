import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Calendar,
  Clock,
  CloudSun,
  Download,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { CalendarEvent, CalendarTask } from '../types/calendar';
import { getFestivalsForDate } from '../data/festivalsAndDays';
import { DAY_NAMES_MINI, MONTH_NAMES, formatDateKey, getMonthGrid, isSameDay } from '../utils/dateUtils';
import {
  HolidayRegionCode,
  detectLocalHolidayRegion,
  downloadStandaloneWidgetHtml,
  getRegionLabel,
} from '../utils/deviceUtils';
import { WeatherBundle, formatTempRounded } from '../services/weatherService';

interface WidgetViewProps {
  mode: 'desktop' | 'mobile';
  events: CalendarEvent[];
  weather: WeatherBundle | null;
  holidayRegion?: HolidayRegionCode;
  onOpenCalendar: () => void;
  onSwitchMode: (mode: 'desktop' | 'mobile') => void;
}

type WidgetSize = 'small' | 'medium' | 'large';

export const WidgetView: React.FC<WidgetViewProps> = ({
  mode,
  events,
  weather,
  holidayRegion = detectLocalHolidayRegion(),
  onOpenCalendar,
  onSwitchMode,
}) => {
  const [size, setSize] = useState<WidgetSize>(mode === 'mobile' ? 'medium' : 'large');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const todayKey = formatDateKey(now);
  const holidaysOnlySet = useMemo(() => new Set(['national-holidays']), []);
  const todayHolidays = useMemo(
    () => getFestivalsForDate(now, holidaysOnlySet, holidayRegion),
    [now, holidaysOnlySet, holidayRegion]
  );

  const todayEvents = useMemo(
    () => events.filter((e) => e.startDate <= todayKey && e.endDate >= todayKey),
    [events, todayKey]
  );

  const openTasks = useMemo<CalendarTask[]>(() => {
    try {
      const raw = localStorage.getItem('calendar_q_tasks_v3');
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CalendarTask[];
      return parsed.filter((t) => !t.completed).slice(0, 4);
    } catch {
      return [];
    }
  }, [now.getMinutes()]);

  const miniDays = useMemo(
    () => getMonthGrid(now.getFullYear(), now.getMonth()),
    [now.getFullYear(), now.getMonth()]
  );

  const timeFormatted = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const weekdayLabel = now.toLocaleDateString([], { weekday: 'long' });
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-[#F5F5F4] text-[#171717] flex flex-col">
      {/* Compact Widget Toolbar */}
      <header className="px-4 sm:px-6 py-3 bg-white border-b border-[#E5E5E5] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <img src="/icon.svg" alt="" className="w-5 h-5 rounded-[5px]" />
          <span className="text-[14px] font-bold tracking-tight">
            calendar<span className="text-[#DC2626]">.q</span>
          </span>
          <span className="text-[12px] text-[#737373]">
            · {mode === 'desktop' ? 'Desktop Widget' : 'Mobile Widget'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-[#E2E2E2] bg-[#FAFAFA] p-0.5 text-[11.5px] font-medium">
            <button
              type="button"
              onClick={() => onSwitchMode('desktop')}
              className={`px-2.5 py-1 rounded-md inline-flex items-center gap-1 cursor-pointer ${
                mode === 'desktop' ? 'bg-white text-[#171717] shadow-2xs' : 'text-[#737373]'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => onSwitchMode('mobile')}
              className={`px-2.5 py-1 rounded-md inline-flex items-center gap-1 cursor-pointer ${
                mode === 'mobile' ? 'bg-white text-[#171717] shadow-2xs' : 'text-[#737373]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
          </div>

          <div className="inline-flex rounded-lg border border-[#E2E2E2] bg-[#FAFAFA] p-0.5 text-[11.5px] font-medium">
            {(['small', 'medium', 'large'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`px-2 py-1 rounded-md capitalize cursor-pointer ${
                  size === s ? 'bg-white text-[#171717] shadow-2xs' : 'text-[#737373]'
                }`}
              >
                {s === 'small' ? '2×2' : s === 'medium' ? '4×2' : '4×4'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              downloadStandaloneWidgetHtml(
                mode,
                `${origin}/?widget=${mode}`,
                `${origin}/?open=calendar`
              )
            }
            className="px-3 py-1.5 rounded-lg border border-[#DCDCDC] bg-white hover:bg-[#F5F5F5] text-[12px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save Offline Widget</span>
          </button>

          <button
            type="button"
            onClick={onOpenCalendar}
            className="px-3 py-1.5 rounded-lg bg-[#171717] hover:bg-[#333333] text-white text-[12px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Full Calendar</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Live Interactive Widget Canvas */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div
          className={`bg-white border border-[#E5E5E5] rounded-[24px] shadow-xl p-5 transition-all ${
            size === 'small'
              ? 'w-[216px]'
              : size === 'medium'
              ? 'w-full max-w-[384px]'
              : 'w-full max-w-[440px]'
          }`}
        >
          {/* Top Row */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-[#DC2626]">
              <span>{weekdayLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-mono text-[#525252] tabular-nums">
              <Clock className="w-3.5 h-3.5 text-[#8C8C8C]" />
              <span>{timeFormatted}</span>
            </div>
          </div>

          {/* Date Hero + Weather */}
          <div className="flex items-end justify-between gap-4 pb-4 border-b border-[#F0F0F0]">
            <div>
              <div className="text-[48px] font-bold leading-none tracking-tight tabular-nums text-[#171717]">
                {now.getDate()}
              </div>
              <div className="text-[12.5px] text-[#525252] mt-1">{monthLabel}</div>
            </div>

            {weather && (
              <div className="text-right">
                <div className="inline-flex items-center gap-1 text-[18px] font-bold text-[#171717] tabular-nums">
                  <CloudSun className="w-4 h-4 text-[#D98E04]" />
                  <span>{formatTempRounded(weather.current.temperature)}</span>
                </div>
                <div className="text-[11px] text-[#737373] truncate max-w-[120px]">
                  {weather.location.name}
                </div>
              </div>
            )}
          </div>

          {/* Medium & Large: Holidays + Events + Tasks */}
          {size !== 'small' && (
            <div className="py-3.5 space-y-2 border-b border-[#F0F0F0]">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#737373] uppercase tracking-wider">
                <span>Today ({getRegionLabel(holidayRegion)})</span>
                <span className="tabular-nums">
                  {todayHolidays.length + todayEvents.length + openTasks.length} items
                </span>
              </div>

              {todayHolidays.length === 0 && todayEvents.length === 0 && openTasks.length === 0 ? (
                <div className="text-[12.5px] text-[#8C8C8C]">No holidays or events today.</div>
              ) : (
                <div className="space-y-1.5">
                  {todayHolidays.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center gap-2 text-[12.5px] font-medium text-[#171717]"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#DC2626] shrink-0" />
                      <span className="truncate">{h.title}</span>
                    </div>
                  ))}
                  {todayEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center gap-2 text-[12.5px] text-[#262626]"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0" />
                      <span className="truncate">{ev.title}</span>
                    </div>
                  ))}
                  {openTasks.slice(0, 2).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 text-[12px] text-[#525252]"
                    >
                      <span className="w-2 h-2 rounded-xs border border-[#737373] shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Large 4x4: Mini Month Grid */}
          {size === 'large' && (
            <div className="pt-3.5 pb-1">
              <div className="grid grid-cols-7 mb-1 text-center text-[10px] font-semibold text-[#A3A3A3]">
                {DAY_NAMES_MINI.map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-1 text-center text-[11.5px] tabular-nums">
                {miniDays.slice(0, 35).map((day) => {
                  const isToday = isSameDay(day, now);
                  const inMonth = day.getMonth() === now.getMonth();
                  return (
                    <div
                      key={formatDateKey(day)}
                      className="flex items-center justify-center h-[24px]"
                    >
                      <span
                        className={`w-[22px] h-[22px] rounded-md flex items-center justify-center ${
                          isToday
                            ? 'bg-[#171717] text-white font-bold'
                            : inMonth
                            ? 'text-[#262626]'
                            : 'text-[#D4D4D4]'
                        }`}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Quick Open */}
          <div className="pt-3 mt-1 flex items-center justify-between text-[11.5px]">
            <span className="text-[#8C8C8C] inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Local-first sync</span>
            </span>
            <button
              type="button"
              onClick={onOpenCalendar}
              className="font-semibold text-[#171717] hover:underline cursor-pointer"
            >
              Open calendar.q →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
