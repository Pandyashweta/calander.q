import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  CalendarColorKey,
  CalendarEvent,
  CalendarLayer,
  GoogleUserProfile,
} from '../types/calendar';
import { addDays, formatDateKey, parseDateKey } from '../utils/dateUtils';

// Minimum required Google Calendar scopes (must stay in sync with set_up_oauth)
export const SCOPES = [
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
for (const scope of SCOPES) {
  provider.addScope(scope);
}
provider.setCustomParameters({ prompt: 'select_account' });

// Strict in-memory access token cache (never stored in localStorage/sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export function toUserProfile(user: User): GoogleUserProfile {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
}

export const initAuth = (
  onAuthSuccess?: (user: GoogleUserProfile, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Handle completed redirect sign-in (used in mobile/PWA/popup-blocked deployments)
  void getRedirectResult(auth)
    .then((result) => {
      if (result?.user) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const accessToken = credential?.accessToken || '';
        if (accessToken) {
          cachedAccessToken = accessToken;
        }
        onAuthSuccess?.(toUserProfile(result.user), accessToken);
      }
    })
    .catch(() => {
      // Ignore if no redirect result is pending
    });

  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(toUserProfile(user), cachedAccessToken);
      } else if (!isSigningIn) {
        onAuthSuccess?.(toUserProfile(user), '');
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure?.();
    }
  });
};

export const googleSignIn = async (): Promise<{
  user: GoogleUserProfile;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || '';
    if (accessToken) {
      cachedAccessToken = accessToken;
    }
    return {
      user: toUserProfile(result.user),
      accessToken,
    };
  } catch (err: any) {
    const code = err?.code || '';
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/operation-not-supported-in-this-environment'
    ) {
      // Seamless redirect fallback for deployed PWAs, mobile browsers, or strict popup blockers
      await signInWithRedirect(auth, provider);
      return null;
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new Error('Google sign-in popup was closed before completing.');
    }
    if (code === 'auth/unauthorized-domain') {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
      throw new Error(
        `Domain "${host}" is not authorized in Firebase Auth. Add it under Firebase Console → Authentication → Settings → Authorized domains.`
      );
    }
    throw new Error(err?.message || 'Google sign-in failed. Please try again.');
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => cachedAccessToken;

export const logoutGoogle = async (): Promise<void> => {
  await auth.signOut();
  cachedAccessToken = null;
};

// ======================== GOOGLE CALENDAR REST API v3 ========================

const GOOGLE_COLOR_PALETTE: CalendarColorKey[] = [
  'blue',
  'purple',
  'green',
  'amber',
  'orange',
  'coral',
  'teal',
  'indigo',
];

interface GoogleCalendarListItem {
  id: string;
  summary?: string;
  description?: string;
  backgroundColor?: string;
  primary?: boolean;
  selected?: boolean;
  accessRole?: string;
}

export async function fetchGoogleCalendars(
  accessToken: string
): Promise<CalendarLayer[]> {
  if (!accessToken) return [];
  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    throw new Error(`Google Calendar list failed (${res.status})`);
  }
  const data = (await res.json()) as { items?: GoogleCalendarListItem[] };
  const items = data.items || [];

  return items.map((item, idx) => ({
    id: `gcal:${item.id}`,
    name: item.summary || (item.primary ? 'Primary Calendar' : 'Google Calendar'),
    groupId: 'google-calendars',
    color: GOOGLE_COLOR_PALETTE[idx % GOOGLE_COLOR_PALETTE.length],
    // Keep unchecked on initial sign-in so only Holidays appear until user opts in
    visible: false,
    type: 'google',
    description: item.description,
    googleCalendarId: item.id,
    customHex: item.backgroundColor,
    primary: Boolean(item.primary),
  }));
}

interface GoogleEventResource {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  status?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
  attendees?: Array<{ email?: string; responseStatus?: string }>;
}

function mapGoogleEventToLocal(
  item: GoogleEventResource,
  googleCalendarId: string
): CalendarEvent | null {
  if (!item.start || item.status === 'cancelled') return null;
  const layerId = `gcal:${googleCalendarId}`;

  if (item.start.date) {
    const startDate = item.start.date;
    // Google all-day end.date is exclusive, subtract 1 day
    let endDate = startDate;
    if (item.end?.date) {
      const endObj = addDays(parseDateKey(item.end.date), -1);
      const formattedEnd = formatDateKey(endObj);
      endDate = formattedEnd >= startDate ? formattedEnd : startDate;
    }
    return {
      id: `gev:${googleCalendarId}:${item.id}`,
      title: item.summary || '(Untitled event)',
      calendarId: layerId,
      startDate,
      endDate,
      allDay: true,
      startMinutes: 0,
      endMinutes: 0,
      status: item.status === 'tentative' ? 'tentative' : 'confirmed',
      location: item.location,
      notes: item.description,
      source: 'google',
      googleCalendarId,
      googleEventId: item.id,
    };
  }

  if (item.start.dateTime) {
    const startDt = new Date(item.start.dateTime);
    const endDt = item.end?.dateTime
      ? new Date(item.end.dateTime)
      : new Date(startDt.getTime() + 60 * 60000);

    const startDate = formatDateKey(startDt);
    const endDate = formatDateKey(endDt);
    const startMinutes = startDt.getHours() * 60 + startDt.getMinutes();
    let endMinutes = endDt.getHours() * 60 + endDt.getMinutes();
    if (endDate === startDate && endMinutes <= startMinutes) {
      endMinutes = Math.min(1440, startMinutes + 30);
    }

    return {
      id: `gev:${googleCalendarId}:${item.id}`,
      title: item.summary || '(Untitled event)',
      calendarId: layerId,
      startDate,
      endDate: startDate, // timed events render cleanly on startDate
      allDay: false,
      startMinutes,
      endMinutes: endDate !== startDate ? 1440 : endMinutes,
      status: item.status === 'tentative' ? 'tentative' : 'confirmed',
      location: item.location,
      notes: item.description,
      source: 'google',
      googleCalendarId,
      googleEventId: item.id,
    };
  }

  return null;
}

export async function fetchGoogleEventsRange(
  accessToken: string,
  googleCalendarIds: string[],
  timeMin: Date,
  timeMax: Date
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: '250',
  });

  const results = await Promise.all(
    googleCalendarIds.map(async (calId) => {
      try {
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
            calId
          )}/events?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (!res.ok) return [] as CalendarEvent[];
        const json = (await res.json()) as { items?: GoogleEventResource[] };
        return (json.items || [])
          .map((item) => mapGoogleEventToLocal(item, calId))
          .filter((e): e is CalendarEvent => Boolean(e));
      } catch {
        return [] as CalendarEvent[];
      }
    })
  );

  return results.flat();
}

function buildGoogleEventPayload(ev: CalendarEvent) {
  const categoryPrefix =
    ev.category && ev.category !== 'event'
      ? `[${ev.category.charAt(0).toUpperCase() + ev.category.slice(1)}] `
      : '';
  const description = ev.notes
    ? `${categoryPrefix}${ev.notes}`
    : categoryPrefix.trim() || undefined;

  if (ev.allDay) {
    // Google Calendar all-day end date is exclusive
    const exclusiveEnd = formatDateKey(addDays(parseDateKey(ev.endDate), 1));
    return {
      summary: ev.title,
      location: ev.location || undefined,
      description,
      start: { date: ev.startDate },
      end: { date: exclusiveEnd },
    };
  }

  const startBase = parseDateKey(ev.startDate);
  const startDt = new Date(
    startBase.getFullYear(),
    startBase.getMonth(),
    startBase.getDate(),
    Math.floor(ev.startMinutes / 60),
    ev.startMinutes % 60
  );
  const endBase = parseDateKey(ev.startDate);
  const endDt = new Date(
    endBase.getFullYear(),
    endBase.getMonth(),
    endBase.getDate(),
    Math.floor(ev.endMinutes / 60),
    ev.endMinutes % 60
  );

  return {
    summary: ev.title,
    location: ev.location || undefined,
    description,
    start: { dateTime: startDt.toISOString() },
    end: { dateTime: endDt.toISOString() },
  };
}

export async function createGoogleEvent(
  accessToken: string,
  googleCalendarId: string,
  event: CalendarEvent
): Promise<CalendarEvent> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      googleCalendarId
    )}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildGoogleEventPayload(event)),
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to create Google Calendar event (${res.status})`);
  }
  const created = (await res.json()) as GoogleEventResource;
  return (
    mapGoogleEventToLocal(created, googleCalendarId) || {
      ...event,
      source: 'google',
      googleCalendarId,
      googleEventId: created.id,
    }
  );
}

export async function updateGoogleEvent(
  accessToken: string,
  googleCalendarId: string,
  googleEventId: string,
  event: CalendarEvent
): Promise<CalendarEvent> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      googleCalendarId
    )}/events/${encodeURIComponent(googleEventId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildGoogleEventPayload(event)),
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to update Google Calendar event (${res.status})`);
  }
  const updated = (await res.json()) as GoogleEventResource;
  return mapGoogleEventToLocal(updated, googleCalendarId) || event;
}

export async function deleteGoogleEvent(
  accessToken: string,
  googleCalendarId: string,
  googleEventId: string
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      googleCalendarId
    )}/events/${encodeURIComponent(googleEventId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok && res.status !== 410) {
    throw new Error(`Failed to delete Google Calendar event (${res.status})`);
  }
}
