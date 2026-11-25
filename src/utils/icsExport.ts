import { CalendarEvent, CalendarLayer, ViewMode } from '../types/calendar';
import { formatDateKey, parseDateKey } from './dateUtils';

export interface IcsExportOptions {
  calendarName?: string;
  timezone?: string;
  scope: 'current_view' | 'all' | 'custom';
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  onlyVisibleLayers?: boolean;
}

/**
 * Escapes special characters for RFC 5545 text fields:
 * backslash -> \\
 * comma -> \,
 * semicolon -> \;
 * newline -> \n
 */
function escapeIcsText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Formats a Date object as UTC string YYYYMMDDTHHMMSSZ for DTSTAMP.
 */
function formatUtcStamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
    date.getUTCHours()
  )}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

/**
 * Formats a date string YYYY-MM-DD and minutes (0..1440) as RFC 5545 local datetime string YYYYMMDDTHHMMSS.
 */
function formatLocalDateTime(dateKey: string, minutes: number): string {
  const cleanDate = dateKey.replace(/-/g, '');
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${cleanDate}T${pad(h)}${pad(m)}00`;
}

/**
 * Formats an all-day date string YYYY-MM-DD as RFC 5545 date value YYYYMMDD.
 */
function formatDateValue(dateKey: string): string {
  return dateKey.replace(/-/g, '');
}

/**
 * Adds one day to YYYY-MM-DD for exclusive DTEND in RFC 5545 for all-day events.
 */
function addOneDayKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}`;
}

/**
 * Builds an RFC 5545 VCALENDAR string from events.
 */
export function buildIcs(
  events: CalendarEvent[],
  layers: CalendarLayer[],
  options: IcsExportOptions
): string {
  const now = new Date();
  const dtStamp = formatUtcStamp(now);
  const calName = options.calendarName || 'calendar.q';
  const tz = options.timezone || 'UTC';

  const layerMap = new Map<string, CalendarLayer>();
  for (const l of layers) layerMap.set(l.id, l);

  // Filter events by date range if specified
  const filteredEvents = events.filter((ev) => {
    if (options.scope === 'custom') {
      if (options.startDate && ev.endDate < options.startDate) return false;
      if (options.endDate && ev.startDate > options.endDate) return false;
    }
    return true;
  });

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//calendar.q//calendar.q v2.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calName)}`,
    `X-WR-TIMEZONE:${escapeIcsText(tz)}`,
  ];

  for (const ev of filteredEvents) {
    const layer = layerMap.get(ev.calendarId);
    const category = ev.category || 'event';
    const uid = ev.googleEventId || `calendar-q-${ev.id}@calendar.q`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtStamp}`);

    if (ev.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${formatDateValue(ev.startDate)}`);
      // In RFC 5545, DTEND for all-day is exclusive, so add 1 day to endDate
      lines.push(`DTEND;VALUE=DATE:${addOneDayKey(ev.endDate)}`);
    } else {
      lines.push(`DTSTART;TZID=${tz}:${formatLocalDateTime(ev.startDate, ev.startMinutes)}`);
      lines.push(`DTEND;TZID=${tz}:${formatLocalDateTime(ev.endDate, ev.endMinutes)}`);
    }

    lines.push(`SUMMARY:${escapeIcsText(ev.title)}`);

    if (ev.notes) {
      lines.push(`DESCRIPTION:${escapeIcsText(ev.notes)}`);
    }

    if (ev.location) {
      lines.push(`LOCATION:${escapeIcsText(ev.location)}`);
    }

    if (category) {
      lines.push(`CATEGORIES:${escapeIcsText(category.toUpperCase())}`);
    }

    lines.push(`STATUS:${ev.status === 'tentative' ? 'TENTATIVE' : 'CONFIRMED'}`);

    if (layer?.name) {
      lines.push(`X-CALENDAR-Q-CALENDAR:${escapeIcsText(layer.name)}`);
    }

    // Recurrence rule
    if (ev.recurrence && ev.recurrence.frequency !== 'none') {
      let rrule = `RRULE:FREQ=${ev.recurrence.frequency.toUpperCase()}`;
      if (ev.recurrence.interval && ev.recurrence.interval > 1) {
        rrule += `;INTERVAL=${ev.recurrence.interval}`;
      }
      if (ev.recurrence.count) {
        rrule += `;COUNT=${ev.recurrence.count}`;
      }
      if (ev.recurrence.until) {
        rrule += `;UNTIL=${ev.recurrence.until.replace(/-/g, '')}T235959Z`;
      }
      if (ev.recurrence.daysOfWeek && ev.recurrence.daysOfWeek.length > 0) {
        const daysMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        const daysStr = ev.recurrence.daysOfWeek.map((d) => daysMap[d]).join(',');
        rrule += `;BYDAY=${daysStr}`;
      }
      lines.push(rrule);
    }

    // Attendees
    const allAttendees: Array<{ name?: string; email: string }> = [];
    if (ev.attendeesList && ev.attendeesList.length > 0) {
      allAttendees.push(...ev.attendeesList);
    }
    if (ev.attendees && ev.attendees.length > 0) {
      for (const att of ev.attendees) {
        if (!allAttendees.some((a) => a.email === att)) {
          allAttendees.push({ email: att, name: att });
        }
      }
    }
    for (const att of allAttendees) {
      const email = att.email.trim();
      const cn = att.name || email;
      if (email) {
        lines.push(
          `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN=${escapeIcsText(
            cn
          )}:mailto:${email}`
        );
      }
    }

    // Reminders
    if (ev.reminders && ev.reminders.length > 0) {
      for (const rem of ev.reminders) {
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push(`DESCRIPTION:${escapeIcsText(ev.title)}`);
        lines.push(`TRIGGER:-PT${rem.minutes}M`);
        lines.push('END:VALARM');
      }
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Triggers a browser file download of the generated .ics content.
 */
export function downloadIcs(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Parses basic iCalendar (.ics) string into partial CalendarEvent objects.
 */
export function parseIcsEvents(icsText: string, defaultCalendarId = 'personal'): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = icsText.replace(/\r\n /g, '').split(/\r?\n/);

  let inEvent = false;
  let current: Partial<CalendarEvent> = {};

  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      inEvent = true;
      current = {
        id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        calendarId: defaultCalendarId,
        allDay: false,
        startMinutes: 9 * 60,
        endMinutes: 10 * 60,
        status: 'confirmed',
      };
      continue;
    }

    if (line.startsWith('END:VEVENT')) {
      if (inEvent && current.title && current.startDate) {
        events.push({
          id: current.id || `import-${Date.now()}`,
          title: current.title || 'Untitled Event',
          calendarId: current.calendarId || defaultCalendarId,
          startDate: current.startDate,
          endDate: current.endDate || current.startDate,
          allDay: Boolean(current.allDay),
          startMinutes: current.startMinutes ?? 540,
          endMinutes: current.endMinutes ?? 600,
          location: current.location,
          notes: current.notes,
          status: current.status || 'confirmed',
          category: current.category || 'event',
        });
      }
      inEvent = false;
      current = {};
      continue;
    }

    if (!inEvent) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const propKeyRaw = line.slice(0, colonIdx);
    const propValRaw = line.slice(colonIdx + 1);
    const propKey = propKeyRaw.split(';')[0].trim().toUpperCase();

    switch (propKey) {
      case 'SUMMARY':
        current.title = unescapeIcsText(propValRaw);
        break;
      case 'DESCRIPTION':
        current.notes = unescapeIcsText(propValRaw);
        break;
      case 'LOCATION':
        current.location = unescapeIcsText(propValRaw);
        break;
      case 'DTSTART': {
        const parsed = parseIcsDateTime(propKeyRaw, propValRaw);
        if (parsed) {
          current.startDate = parsed.dateKey;
          current.startMinutes = parsed.minutes;
          if (parsed.allDay) current.allDay = true;
        }
        break;
      }
      case 'DTEND': {
        const parsed = parseIcsDateTime(propKeyRaw, propValRaw);
        if (parsed) {
          current.endDate = parsed.dateKey;
          current.endMinutes = parsed.minutes;
        }
        break;
      }
      case 'STATUS':
        current.status = propValRaw.toUpperCase() === 'TENTATIVE' ? 'tentative' : 'confirmed';
        break;
      case 'CATEGORIES': {
        const cat = propValRaw.toLowerCase();
        if (cat.includes('birthday')) current.category = 'birthday';
        else if (cat.includes('workspace') || cat.includes('work')) current.category = 'workspace';
        else if (cat.includes('memorial')) current.category = 'memorial';
        else if (cat.includes('plan')) current.category = 'plan';
        break;
      }
    }
  }

  return events;
}

function unescapeIcsText(str: string): string {
  return str
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function parseIcsDateTime(
  keyPart: string,
  val: string
): { dateKey: string; minutes: number; allDay: boolean } | null {
  const cleanVal = val.trim();
  const isDateOnly = keyPart.toUpperCase().includes('VALUE=DATE') || cleanVal.length === 8;

  if (isDateOnly) {
    const y = cleanVal.slice(0, 4);
    const m = cleanVal.slice(4, 6);
    const d = cleanVal.slice(6, 8);
    return { dateKey: `${y}-${m}-${d}`, minutes: 0, allDay: true };
  }

  // DateTime format: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  const tIdx = cleanVal.indexOf('T');
  if (tIdx >= 8) {
    const y = cleanVal.slice(0, 4);
    const m = cleanVal.slice(4, 6);
    const d = cleanVal.slice(6, 8);
    const timePart = cleanVal.slice(tIdx + 1);
    const hour = Number(timePart.slice(0, 2)) || 0;
    const min = Number(timePart.slice(2, 4)) || 0;
    return { dateKey: `${y}-${m}-${d}`, minutes: hour * 60 + min, allDay: false };
  }

  return null;
}
