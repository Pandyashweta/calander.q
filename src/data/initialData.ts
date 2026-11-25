import { CalendarEvent, CalendarGroup, CalendarLayer } from '../types/calendar';

export const INITIAL_GROUPS: CalendarGroup[] = [
  { id: 'google-calendars', label: 'Google Calendar', isGoogleGroup: true },
  { id: 'cultural-festivals', label: 'Festivals, Holidays & Panchang', isCulturalGroup: true },
  { id: 'local-calendars', label: 'My Calendars (Local)' },
];

export const INITIAL_LAYERS: CalendarLayer[] = [
  // Synced Cultural, Indian, Gujarati, International & World Calendar Layers (all individually & master toggleable)
  {
    id: 'indian-festivals',
    name: 'Indian Festivals',
    groupId: 'cultural-festivals',
    color: 'saffron',
    visible: true,
    type: 'cultural',
    description: 'Diwali, Holi, Navratri, Janmashtami, Ganesh Chaturthi, Eid, Pongal, Onam, Gurpurab & more',
  },
  {
    id: 'gujarati-calendar',
    name: 'Gujarati Calendar & Tithis',
    groupId: 'cultural-festivals',
    color: 'marigold',
    visible: true,
    type: 'cultural',
    description: 'Vikram Samvat Tithi (Sud/Vad), Uttarayan, Bestu Varas, Agiyaras, Poonam, Amas & Vrats',
  },
  {
    id: 'global-days',
    name: 'International Holidays & Days',
    groupId: 'cultural-festivals',
    color: 'indigo',
    visible: true,
    type: 'cultural',
    description: 'UN observances, global awareness, science, cultural & special days worldwide',
  },
  {
    id: 'world-observances',
    name: 'World Calendar Festivals',
    groupId: 'cultural-festivals',
    color: 'teal',
    visible: true,
    type: 'cultural',
    description: 'Chinese New Year, Rosh Hashanah, Ramadan, Nowruz, Parsi Navroz, Losar, Songkran & more',
  },
  {
    id: 'national-holidays',
    name: 'National Holidays',
    groupId: 'cultural-festivals',
    color: 'crimson',
    visible: true,
    type: 'cultural',
    description: 'Gazetted Indian & major public holidays',
  },

  // Clean Local Calendars (for adding personal events, birthdays, memorials/funeral dates, workspace & plans without pre-filled sample junk)
  {
    id: 'personal',
    name: 'Personal Events',
    groupId: 'local-calendars',
    color: 'blue',
    visible: true,
    type: 'personal',
    icon: 'calendar',
  },
  {
    id: 'birthdays',
    name: 'Birthdays',
    groupId: 'local-calendars',
    color: 'amber',
    visible: true,
    type: 'personal',
    icon: 'cake',
  },
  {
    id: 'memorials',
    name: 'Memorials & Funeral Dates',
    groupId: 'local-calendars',
    color: 'gray',
    visible: true,
    type: 'personal',
    icon: 'flower',
  },
  {
    id: 'workspace',
    name: 'Workspace & Plans',
    groupId: 'local-calendars',
    color: 'purple',
    visible: true,
    type: 'personal',
    icon: 'briefcase',
  },
];

/**
 * Starts completely clean with zero fake sample events or emails, per user instruction.
 * Users can connect Google Calendar or add their own events, birthdays, memorials, and workspace plans.
 */
export function buildInitialEvents(): CalendarEvent[] {
  return [];
}
