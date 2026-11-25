/**
 * Personal Time Tracking & Analytics Service for calendar.q (Phase 7)
 */

export type TrackingCategory =
  | 'work'
  | 'study'
  | 'sleep'
  | 'exercise'
  | 'personal'
  | 'meeting'
  | 'project'
  | 'custom';

export interface TimeEntry {
  id: string;
  activityName: string;
  category: TrackingCategory;
  projectName?: string;
  startTime: string; // ISO string
  endTime?: string; // ISO string or undefined if running
  durationMinutes: number;
  notes?: string;
  dateKey: string; // YYYY-MM-DD
  isRunning: boolean;
}

export interface CategorySummary {
  category: TrackingCategory;
  label: string;
  totalMinutes: number;
  totalHours: number;
  percent: number;
  color: string;
}

export interface TimeAnalytics {
  totalMinutesToday: number;
  totalMinutesWeek: number;
  productiveHoursToday: number;
  meetingHoursToday: number;
  categories: CategorySummary[];
  recentEntries: TimeEntry[];
}

const STORAGE_KEY = 'calendar_q_time_entries_v2';
const LEGACY_KEY = 'calander_q_time_entries_v2';

export const CATEGORY_META: Record<TrackingCategory, { label: string; color: string; isProductive: boolean }> = {
  work: { label: 'Work', color: '#185D8F', isProductive: true },
  study: { label: 'Study', color: '#7A4C00', isProductive: true },
  sleep: { label: 'Sleep', color: '#5B4EB1', isProductive: false },
  exercise: { label: 'Exercise', color: '#1B8752', isProductive: true },
  personal: { label: 'Personal', color: '#9C3489', isProductive: false },
  meeting: { label: 'Meetings', color: '#BA4D00', isProductive: true },
  project: { label: 'Project', color: '#0F766E', isProductive: true },
  custom: { label: 'Custom', color: '#4B5563', isProductive: false },
};

export function loadTimeEntries(): TimeEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveTimeEntries(entries: TimeEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

export function startLiveTimer(
  activityName: string,
  category: TrackingCategory = 'work',
  projectName?: string
): TimeEntry[] {
  const entries = loadTimeEntries();
  // Stop any currently running timer
  const now = new Date();
  const nowIso = now.toISOString();

  const updated = entries.map((e) => {
    if (e.isRunning) {
      const startMs = new Date(e.startTime).getTime();
      const dur = Math.max(1, Math.round((now.getTime() - startMs) / 60000));
      return { ...e, isRunning: false, endTime: nowIso, durationMinutes: dur };
    }
    return e;
  });

  const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const newEntry: TimeEntry = {
    id: `te-${Date.now()}`,
    activityName: activityName.trim() || 'Untitled Activity',
    category,
    projectName: projectName?.trim(),
    startTime: nowIso,
    durationMinutes: 0,
    dateKey,
    isRunning: true,
  };

  const next = [newEntry, ...updated];
  saveTimeEntries(next);
  return next;
}

export function stopLiveTimer(): TimeEntry[] {
  const entries = loadTimeEntries();
  const now = new Date();
  const nowIso = now.toISOString();

  const next = entries.map((e) => {
    if (e.isRunning) {
      const startMs = new Date(e.startTime).getTime();
      const dur = Math.max(1, Math.round((now.getTime() - startMs) / 60000));
      return { ...e, isRunning: false, endTime: nowIso, durationMinutes: dur };
    }
    return e;
  });

  saveTimeEntries(next);
  return next;
}

export function addManualTimeEntry(entry: Omit<TimeEntry, 'id' | 'isRunning'>): TimeEntry[] {
  const entries = loadTimeEntries();
  const newEntry: TimeEntry = {
    ...entry,
    id: `te-${Date.now()}`,
    isRunning: false,
  };
  const next = [newEntry, ...entries];
  saveTimeEntries(next);
  return next;
}

export function deleteTimeEntry(id: string): TimeEntry[] {
  const entries = loadTimeEntries();
  const next = entries.filter((e) => e.id !== id);
  saveTimeEntries(next);
  return next;
}

export function computeTimeAnalytics(entries: TimeEntry[], targetDate = new Date()): TimeAnalytics {
  const targetKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;

  // Find start of week (Monday)
  const day = targetDate.getDay();
  const diffToMonday = targetDate.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(targetDate.setDate(diffToMonday));
  monday.setHours(0, 0, 0, 0);

  let totalMinutesToday = 0;
  let totalMinutesWeek = 0;
  let productiveMinsToday = 0;
  let meetingMinsToday = 0;

  const categoryTotals: Record<TrackingCategory, number> = {
    work: 0,
    study: 0,
    sleep: 0,
    exercise: 0,
    personal: 0,
    meeting: 0,
    project: 0,
    custom: 0,
  };

  const nowMs = Date.now();

  for (const entry of entries) {
    let dur = entry.durationMinutes;
    if (entry.isRunning) {
      dur = Math.max(1, Math.round((nowMs - new Date(entry.startTime).getTime()) / 60000));
    }

    const entryDate = new Date(entry.startTime);
    if (entry.dateKey === targetKey) {
      totalMinutesToday += dur;
      categoryTotals[entry.category] += dur;
      if (CATEGORY_META[entry.category].isProductive) {
        productiveMinsToday += dur;
      }
      if (entry.category === 'meeting') {
        meetingMinsToday += dur;
      }
    }

    if (entryDate >= monday) {
      totalMinutesWeek += dur;
    }
  }

  const categories: CategorySummary[] = (Object.keys(CATEGORY_META) as TrackingCategory[]).map((cat) => {
    const mins = categoryTotals[cat];
    const percent = totalMinutesToday > 0 ? Math.round((mins / totalMinutesToday) * 100) : 0;
    return {
      category: cat,
      label: CATEGORY_META[cat].label,
      totalMinutes: mins,
      totalHours: Math.round((mins / 60) * 10) / 10,
      percent,
      color: CATEGORY_META[cat].color,
    };
  });

  return {
    totalMinutesToday,
    totalMinutesWeek,
    productiveHoursToday: Math.round((productiveMinsToday / 60) * 10) / 10,
    meetingHoursToday: Math.round((meetingMinsToday / 60) * 10) / 10,
    categories,
    recentEntries: entries.slice(0, 10),
  };
}

export function exportTimeCsv(entries: TimeEntry[]): string {
  const headers = ['ID', 'Date', 'Activity', 'Category', 'Project', 'Start Time', 'End Time', 'Duration (Minutes)', 'Notes'];
  const rows = entries.map((e) => [
    e.id,
    e.dateKey,
    `"${(e.activityName || '').replace(/"/g, '""')}"`,
    e.category,
    `"${(e.projectName || '').replace(/"/g, '""')}"`,
    e.startTime,
    e.endTime || 'Running',
    e.durationMinutes,
    `"${(e.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
