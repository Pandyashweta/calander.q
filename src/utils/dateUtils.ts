import { CalendarColorKey, CalendarEvent, TimezoneOption, ViewMode } from '../types/calendar';

export const COLOR_THEMES: Record<
  CalendarColorKey,
  {
    dot: string;
    bar: string;
    bg: string;
    bgHover: string;
    text: string;
    subtext: string;
    borderDashed: string;
    ring: string;
  }
> = {
  blue: {
    dot: '#3B9AE1',
    bar: '#3B9AE1',
    bg: '#E1F2FC',
    bgHover: '#D4EBFA',
    text: '#14588A',
    subtext: '#2B72A6',
    borderDashed: '#7BBCEB',
    ring: 'rgba(59, 154, 225, 0.35)',
  },
  purple: {
    dot: '#9B51E0',
    bar: '#9B51E0',
    bg: '#EFE5FA',
    bgHover: '#E5D6F7',
    text: '#5A2591',
    subtext: '#7A45B0',
    borderDashed: '#BA85EB',
    ring: 'rgba(155, 81, 224, 0.35)',
  },
  green: {
    dot: '#34B36E',
    bar: '#34B36E',
    bg: '#E2F5EA',
    bgHover: '#D2EEDE',
    text: '#1C6B40',
    subtext: '#2D8555',
    borderDashed: '#75D19E',
    ring: 'rgba(52, 179, 110, 0.35)',
  },
  amber: {
    dot: '#E6B422',
    bar: '#DBA314',
    bg: '#FBF0C9',
    bgHover: '#F7E6B0',
    text: '#734F00',
    subtext: '#91680D',
    borderDashed: '#E5BE53',
    ring: 'rgba(230, 180, 34, 0.35)',
  },
  orange: {
    dot: '#F0753C',
    bar: '#E8682C',
    bg: '#FDE7DA',
    bgHover: '#FBDAC6',
    text: '#8F3611',
    subtext: '#B04A1E',
    borderDashed: '#F49D72',
    ring: 'rgba(240, 117, 60, 0.35)',
  },
  coral: {
    dot: '#DF5A49',
    bar: '#D64836',
    bg: '#F8DFD6',
    bgHover: '#F4CFC2',
    text: '#8C2A1C',
    subtext: '#A83F30',
    borderDashed: '#E58A7E',
    ring: 'rgba(223, 90, 73, 0.35)',
  },
  gray: {
    dot: '#9E9E9E',
    bar: '#8C8C8C',
    bg: '#EFEFEF',
    bgHover: '#E5E5E5',
    text: '#3F3F3F',
    subtext: '#666666',
    borderDashed: '#B8B8B8',
    ring: 'rgba(158, 158, 158, 0.35)',
  },
  crimson: {
    dot: '#E12D39',
    bar: '#D62839',
    bg: '#FDE2E4',
    bgHover: '#FBD0D3',
    text: '#8A1520',
    subtext: '#AD2431',
    borderDashed: '#EB7882',
    ring: 'rgba(225, 45, 57, 0.35)',
  },
  saffron: {
    dot: '#E86A17',
    bar: '#DD5E0C',
    bg: '#FFF0E2',
    bgHover: '#FFE2C7',
    text: '#8B3505',
    subtext: '#AD480D',
    borderDashed: '#F29A5E',
    ring: 'rgba(232, 106, 23, 0.35)',
  },
  marigold: {
    dot: '#D98E04',
    bar: '#CC8200',
    bg: '#FEF5D9',
    bgHover: '#FCEBB8',
    text: '#7A4C00',
    subtext: '#9B6408',
    borderDashed: '#E5B24C',
    ring: 'rgba(217, 142, 4, 0.35)',
  },
  indigo: {
    dot: '#5568D9',
    bar: '#4B5ED1',
    bg: '#E8ECFC',
    bgHover: '#DAE1FA',
    text: '#28358A',
    subtext: '#4250A8',
    borderDashed: '#8E9CE6',
    ring: 'rgba(85, 104, 217, 0.35)',
  },
  teal: {
    dot: '#0D9488',
    bar: '#0F766E',
    bg: '#DFF7F4',
    bgHover: '#C9F0EC',
    text: '#115E59',
    subtext: '#1D7A74',
    borderDashed: '#5EEAD4',
    ring: 'rgba(13, 148, 136, 0.35)',
  },
};

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { id: 'IST', abbr: 'IST', label: 'India Standard Time (UTC+5:30)', offsetMinutes: 330 },
  { id: 'UTC', abbr: 'UTC', label: 'Coordinated Universal Time (UTC+0)', offsetMinutes: 0 },
  { id: 'GMT', abbr: 'GMT', label: 'Greenwich Mean Time (UTC+0)', offsetMinutes: 0 },
  { id: 'BST_UK', abbr: 'BST', label: 'British Summer Time (UTC+1)', offsetMinutes: 60 },
  { id: 'CET', abbr: 'CET', label: 'Central European Time (UTC+1)', offsetMinutes: 60 },
  { id: 'EET', abbr: 'EET', label: 'Eastern European Time (UTC+2)', offsetMinutes: 120 },
  { id: 'MSK', abbr: 'MSK', label: 'Moscow Standard Time (UTC+3)', offsetMinutes: 180 },
  { id: 'GST', abbr: 'GST', label: 'Gulf Standard Time (UTC+4)', offsetMinutes: 240 },
  { id: 'PKT', abbr: 'PKT', label: 'Pakistan Standard Time (UTC+5)', offsetMinutes: 300 },
  { id: 'BST_BD', abbr: 'BST', label: 'Bangladesh Standard Time (UTC+6)', offsetMinutes: 360 },
  { id: 'ICT', abbr: 'ICT', label: 'Indochina Time (UTC+7)', offsetMinutes: 420 },
  { id: 'SGT', abbr: 'SGT', label: 'Singapore / China Standard Time (UTC+8)', offsetMinutes: 480 },
  { id: 'JST', abbr: 'JST', label: 'Japan / Korea Standard Time (UTC+9)', offsetMinutes: 540 },
  { id: 'ACST', abbr: 'ACST', label: 'Australian Central Standard Time (UTC+9:30)', offsetMinutes: 570 },
  { id: 'AEST', abbr: 'AEST', label: 'Australian Eastern Standard Time (UTC+10)', offsetMinutes: 600 },
  { id: 'AEDT', abbr: 'AEDT', label: 'Australian Eastern Daylight Time (UTC+11)', offsetMinutes: 660 },
  { id: 'NZST', abbr: 'NZST', label: 'New Zealand Standard Time (UTC+12)', offsetMinutes: 720 },
  { id: 'HST', abbr: 'HST', label: 'Hawaii Standard Time (UTC-10)', offsetMinutes: -600 },
  { id: 'AKST', abbr: 'AKST', label: 'Alaska Standard Time (UTC-9)', offsetMinutes: -540 },
  { id: 'PST', abbr: 'PST', label: 'Pacific Standard Time (UTC-8)', offsetMinutes: -480 },
  { id: 'MST', abbr: 'MST', label: 'Mountain Standard Time (UTC-7)', offsetMinutes: -420 },
  { id: 'CST', abbr: 'CST', label: 'Central Standard Time (UTC-6)', offsetMinutes: -360 },
  { id: 'EST', abbr: 'EST', label: 'Eastern Standard Time (UTC-5)', offsetMinutes: -300 },
  { id: 'AST', abbr: 'AST', label: 'Atlantic Standard Time (UTC-4)', offsetMinutes: -240 },
  { id: 'BRT', abbr: 'BRT', label: 'Brasília Time (UTC-3)', offsetMinutes: -180 },
];

/**
 * Returns the detected local device timezone with real-time DST offset.
 */
export function getLocalDeviceTimezoneOption(): TimezoneOption {
  if (typeof window === 'undefined') return TIMEZONE_OPTIONS[0];
  try {
    const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
    const now = new Date();
    const offsetMinutes = -now.getTimezoneOffset();
    const shortFormatter = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short',
      timeZone: tzName,
    });
    const parts = shortFormatter.formatToParts(now);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    const abbr = tzPart ? tzPart.value : tzName.split('/').pop()?.slice(0, 4) || 'LOC';
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const mins = Math.abs(offsetMinutes) % 60;
    const offsetStr = `UTC${sign}${hours}${mins ? `:${String(mins).padStart(2, '0')}` : ''}`;
    const cleanName = tzName.replace(/_/g, ' ');
    return {
      id: tzName,
      abbr,
      label: `Local (${cleanName}, ${offsetStr})`,
      offsetMinutes,
    };
  } catch {
    return TIMEZONE_OPTIONS[0];
  }
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_NAMES_MINI = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
export const DAY_NAMES_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfWeek(date: Date, weekStartsOn: 0 | 1 = 1): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

export function getVisibleDays(anchorDate: Date, viewMode: ViewMode): Date[] {
  if (viewMode === 'day') {
    return [new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate())];
  }
  if (viewMode === '3days') {
    const start = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate());
    return [0, 1, 2].map((i) => addDays(start, i));
  }
  if (viewMode === '5days') {
    // Anchor to Monday of the current week for crisp Mon-Fri workweek view (or if weekend, show Mon-Fri of that week)
    const mon = startOfWeek(anchorDate, 1);
    return [0, 1, 2, 3, 4].map((i) => addDays(mon, i));
  }
  if (viewMode === 'week') {
    const sun = startOfWeek(anchorDate, 0);
    return [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(sun, i));
  }
  // Month view
  return getMonthGrid(anchorDate.getFullYear(), anchorDate.getMonth());
}

export function getMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay(); // Sunday = 0
  const gridStart = new Date(year, month, 1 - startOffset);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(addDays(gridStart, i));
  }
  return days;
}

export function formatMinutesToTime(totalMinutes: number, compact = false): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(normalized / 60);
  const m = normalized % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  if (compact && m === 0) {
    return `${h12} ${period}`;
  }
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatTimeRange(startMinutes: number, endMinutes: number): string {
  const sNorm = ((startMinutes % 1440) + 1440) % 1440;
  const eNorm = ((endMinutes % 1440) + 1440) % 1440;
  const sH24 = Math.floor(sNorm / 60);
  const sM = sNorm % 60;
  const eH24 = Math.floor(eNorm / 60);
  const eM = eNorm % 60;

  const sPeriod = sH24 >= 12 ? 'PM' : 'AM';
  const ePeriod = eH24 >= 12 ? 'PM' : 'AM';
  const sH12 = sH24 % 12 === 0 ? 12 : sH24 % 12;
  const eH12 = eH24 % 12 === 0 ? 12 : eH24 % 12;

  const sStr = sM === 0 ? `${sH12}` : `${sH12}:${String(sM).padStart(2, '0')}`;
  const eStr = eM === 0 ? `${eH12}` : `${eH12}:${String(eM).padStart(2, '0')}`;

  if (sPeriod === ePeriod) {
    return `${sStr}–${eStr} ${ePeriod}`;
  }
  return `${sStr} ${sPeriod}–${eStr} ${ePeriod}`;
}

export function formatHourLabel(hour24: number): string {
  const h = ((hour24 % 24) + 24) % 24;
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

export function formatSecondaryHourLabel(
  primaryHour24: number,
  primaryOffsetMinutes: number,
  secondaryOffsetMinutes: number
): string {
  const diffMinutes = secondaryOffsetMinutes - primaryOffsetMinutes;
  const totalMinutes = ((primaryHour24 * 60 + diffMinutes) % 1440 + 1440) % 1440;
  const h24 = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  if (m === 0) {
    return `${h12} ${period}`;
  }
  return `${h12}:${String(m).padStart(2, '0')}`;
}

export interface PositionedEvent {
  event: CalendarEvent;
  col: number;
  totalCols: number;
}

/**
 * Computes side-by-side column geometry for overlapping timed events on a single day.
 */
export function layoutDayEvents(events: CalendarEvent[]): PositionedEvent[] {
  if (events.length === 0) return [];
  const sorted = [...events].sort((a, b) => {
    if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes;
    return b.endMinutes - a.endMinutes;
  });

  const clusters: CalendarEvent[][] = [];
  let currentCluster: CalendarEvent[] = [];
  let clusterEnd = -1;

  for (const ev of sorted) {
    if (currentCluster.length === 0 || ev.startMinutes < clusterEnd) {
      currentCluster.push(ev);
      clusterEnd = Math.max(clusterEnd, ev.endMinutes);
    } else {
      clusters.push(currentCluster);
      currentCluster = [ev];
      clusterEnd = ev.endMinutes;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const result: PositionedEvent[] = [];

  for (const cluster of clusters) {
    const colEnds: number[] = [];
    const placements: { event: CalendarEvent; col: number }[] = [];

    for (const ev of cluster) {
      let placedCol = -1;
      for (let c = 0; c < colEnds.length; c++) {
        if (colEnds[c] <= ev.startMinutes) {
          placedCol = c;
          colEnds[c] = ev.endMinutes;
          break;
        }
      }
      if (placedCol === -1) {
        placedCol = colEnds.length;
        colEnds.push(ev.endMinutes);
      }
      placements.push({ event: ev, col: placedCol });
    }

    const totalCols = colEnds.length;
    for (const p of placements) {
      result.push({
        event: p.event,
        col: p.col,
        totalCols,
      });
    }
  }

  return result;
}
