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

export type CalendarLayerType = 'personal' | 'cultural' | 'google';

export type EventCategory =
  | 'event'
  | 'birthday'
  | 'memorial'
  | 'workspace'
  | 'plan';

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
  | 'aztec';

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
