import { CalendarEvent, CalendarGroup, CalendarLayer } from '../types/calendar';

export const INITIAL_GROUPS: CalendarGroup[] = [
  { id: 'cultural-festivals', label: 'Holidays & Festivals', isCulturalGroup: true },
  { id: 'local-calendars', label: 'My Calendars (Local)' },
  { id: 'google-calendars', label: 'Google Calendar', isGoogleGroup: true },
];

export const INITIAL_LAYERS: CalendarLayer[] = [
  // Holidays & Festivals (ONLY Holidays & Indian Festivals live here; ONLY Holidays is selected by default)
  {
    id: 'national-holidays',
    name: 'Local Holidays',
    groupId: 'cultural-festivals',
    color: 'crimson',
    visible: true,
    type: 'cultural',
    description: 'Public & national holidays tailored to your local region',
  },
  {
    id: 'indian-festivals',
    name: 'Indian Festivals',
    groupId: 'cultural-festivals',
    color: 'saffron',
    visible: false,
    type: 'cultural',
    description: 'Diwali, Holi, Navratri, Janmashtami, Ganesh Chaturthi, Eid, Pongal, Onam, Gurpurab & more',
  },

  // World Calendar Overlay Layers (organized inside the World Calendars section, OFF by default)
  {
    id: 'world-observances',
    name: 'World Calendar Festivals',
    groupId: 'world-calendars',
    color: 'teal',
    visible: false,
    type: 'world',
    description: 'Chinese New Year, Rosh Hashanah, Ramadan, Nowruz, Parsi Navroz, Losar, Songkran & more',
  },
  {
    id: 'global-days',
    name: 'International Days',
    groupId: 'world-calendars',
    color: 'indigo',
    visible: false,
    type: 'world',
    description: 'UN observances, global awareness, science & cultural days worldwide',
  },
  {
    id: 'gujarati-calendar',
    name: 'Gujarati Calendar & Tithis',
    groupId: 'world-calendars',
    color: 'marigold',
    visible: false,
    type: 'world',
    description: 'Vikram Samvat Tithi (Sud/Vad), Uttarayan, Bestu Varas, Agiyaras, Poonam, Amas & Vrats',
  },

  // Clean Local Calendars (stored on this device; unchecked on clean sign-in, auto-enabled when adding an event)
  {
    id: 'personal',
    name: 'Personal Events',
    groupId: 'local-calendars',
    color: 'blue',
    visible: false,
    type: 'personal',
    icon: 'calendar',
  },
  {
    id: 'birthdays',
    name: 'Birthdays',
    groupId: 'local-calendars',
    color: 'amber',
    visible: false,
    type: 'personal',
    icon: 'cake',
  },
  {
    id: 'memorials',
    name: 'Memorials & Funeral Dates',
    groupId: 'local-calendars',
    color: 'gray',
    visible: false,
    type: 'personal',
    icon: 'flower',
  },
  {
    id: 'workspace',
    name: 'Workspace & Plans',
    groupId: 'local-calendars',
    color: 'purple',
    visible: false,
    type: 'personal',
    icon: 'briefcase',
  },
];

/**
 * Starts completely clean with zero fake sample events.
 */
export function buildInitialEvents(): CalendarEvent[] {
  return [];
}
