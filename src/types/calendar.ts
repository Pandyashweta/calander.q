export type ViewMode = 'day' | '3days' | '5days' | 'week' | 'month';

export type CalendarColorKey =
  | 'blue'
  | 'purple'
  | 'green'
  | 'amber'
  | 'orange'
  | 'coral'
  | 'gray'
  | 'crimson'
  | 'saffron'
  | 'marigold'
  | 'indigo'
  | 'teal';

export type CalendarLayerType = 'personal' | 'cultural' | 'google' | 'world' | 'custom';

export type EventCategory =
  | 'event'
  | 'birthday'
  | 'memorial'
  | 'workspace'
  | 'plan';

export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface EventRecurrence {
  frequency: RecurrenceFrequency;
  interval?: number;
  daysOfWeek?: number[]; // 0 = Sun, 1 = Mon, ...
  until?: string; // YYYY-MM-DD
  count?: number;
}

export interface EventReminder {
  id: string;
  minutes: number;
  method: 'popup' | 'notification' | 'email';
}

export interface EventAttendee {
  email: string;
  name?: string;
  status?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
}

export interface CalendarLayer {
  id: string;
  name: string;
  groupId: string;
  color: CalendarColorKey;
  visible: boolean;
  type: CalendarLayerType;
  icon?: 'plane' | 'check' | 'calendar' | 'cake' | 'flower' | 'briefcase';
  description?: string;
  /** Original Google Calendar ID & hex color if synced from Google */
  googleCalendarId?: string;
  customHex?: string;
  primary?: boolean;
}

export interface CalendarGroup {
  id: string;
  label: string;
  isCulturalGroup?: boolean;
  isGoogleGroup?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  calendarId: string;
  category?: EventCategory;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD (inclusive, same as startDate for single-day) */
  endDate: string;
  allDay: boolean;
  /** Minutes from midnight (0 - 1440) when allDay is false */
  startMinutes: number;
  endMinutes: number;
  status?: 'confirmed' | 'tentative';
  location?: string;
  notes?: string;
  attendees?: string[];
  attendeesList?: EventAttendee[];
  recurrence?: EventRecurrence;
  reminders?: EventReminder[];
  color?: CalendarColorKey;
  timezone?: string;
  source?: 'local' | 'google';
  googleCalendarId?: string;
  googleEventId?: string;
}

export type FestivalLayerId =
  | 'indian-festivals'
  | 'gujarati-calendar'
  | 'global-days'
  | 'world-observances'
  | 'national-holidays';

export interface FestivalItem {
  id: string;
  title: string;
  gujaratiTitle?: string;
  /** YYYY-MM-DD */
  date: string;
  layerId: FestivalLayerId;
  categoryLabel: string;
  description: string;
  region?: string;
  isMajor?: boolean;
}

export interface GujaratiPanchang {
  dateKey: string;
  vikramSamvat: number;
  shakaYear: number;
  monthEn: string;
  monthGu: string;
  isAdhik: boolean;
  pakshaEn: 'Sud' | 'Vad';
  pakshaGu: 'સુદ' | 'વદ';
  tithiNum: number; // 1..15
  tithiEn: string;
  tithiGu: string;
  vaarEn: string;
  vaarGu: string;
  nakshatraEn: string;
  nakshatraGu: string;
  yogaEn: string;
  karanaEn: string;
  rituEn: string;
  samvatsaraEn: string;
  rahuKaal: string;
  abhijitMuhurat: string;
  moonIllumination: number; // 0..100
  moonPhaseLabel: string;
  specialTithi?: {
    nameEn: string;
    nameGu: string;
    significance: string;
  };
  shortLabelEn: string;
  shortLabelGu: string;
}

export type WorldCalendarGroupId =
  | 'indian'
  | 'religious'
  | 'asian'
  | 'historical';

export type WorldCalendarSystemId =
  // Indian
  | 'gujarati-vikram'
  | 'hindu-purnimanta'
  | 'indian-saka'
  | 'nepali-bs'
  | 'tamil'
  | 'malayalam'
  | 'bengali'
  | 'nanakshahi'
  | 'zoroastrian-parsi'
  | 'jain-vira'
  // Religious & Middle Eastern
  | 'islamic-hijri'
  | 'hebrew'
  | 'solar-hijri'
  | 'bahai'
  | 'coptic'
  | 'ethiopian'
  // East & Southeast Asian
  | 'chinese'
  | 'japanese'
  | 'korean'
  | 'vietnamese'
  | 'tibetan'
  | 'buddhist'
  | 'thai-solar'
  | 'javanese'
  | 'balinese-saka'
  // Western & Historical
  | 'gregorian'
  | 'julian'
  | 'french-republican'
  | 'maya'
  | 'aztec'
  // Civic, Standard & Organizational
  | 'iso-week'
  | 'academic'
  | 'fiscal';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'email' | 'google' | 'apple';
  emailVerified: boolean;
  primaryCalendarId?: string;
  timezone?: string;
  createdAt: string;
}

export interface CalendarTask {
  id: string;
  title: string;
  dueDate?: string;
  dueTime?: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  category?: string;
  createdAt: string;
}

export interface WorldCalendarSystemMeta {
  id: WorldCalendarSystemId;
  name: string;
  group: WorldCalendarGroupId;
  region: string;
  wikiUrl: string;
  defaultEnabled: boolean;
}

export interface WorldCalendarDateValue {
  id: WorldCalendarSystemId;
  name: string;
  group: WorldCalendarGroupId;
  formatted: string;
  shortLabel: string;
  detail: string;
  wikiUrl: string;
}

export interface TimezoneOption {
  id: string;
  abbr: string;
  label: string;
  offsetMinutes: number;
}

export interface AvailabilitySlot {
  id: string;
  dateKey: string;
  startMinutes: number;
  endMinutes: number;
}

export interface GoogleUserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface PendingGoogleMutation {
  type: 'create' | 'update' | 'delete';
  title: string;
  calendarName: string;
  dateSummary: string;
  details?: string;
  onConfirm: () => Promise<void>;
}
