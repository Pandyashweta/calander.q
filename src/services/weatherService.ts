/**
 * Google Maps Platform Weather API & Geocoding API client service.
 * Weather API Docs: https://developers.google.com/maps/documentation/weather/overview?utm_campaign=gmp_mcp_codeassist_v1_aistudio
 * Geocoding API Docs: https://developers.google.com/maps/documentation/geocoding/overview?utm_campaign=gmp_mcp_codeassist_v1_aistudio
 */

export type WeatherUnits = 'METRIC' | 'IMPERIAL';

export interface WeatherLocationPref {
  /** User-entered or timezone-derived city query (e.g. "Ahmedabad, India") */
  query: string;
  /** Optional explicit coordinates when user grants browser geolocation */
  useGeolocation?: boolean;
}

export interface ResolvedLocation {
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
}

export interface CurrentWeatherData {
  temperature: number | null;
  feelsLike: number | null;
  tempUnitSymbol: '°C' | '°F';
  conditionText: string;
  conditionType: string;
  iconBaseUri: string | null;
  isDaytime: boolean;
  humidity: number | null;
  uvIndex: number | null;
  precipPercent: number | null;
  precipType: string | null;
  windSpeed: number | null;
  windUnitLabel: string;
  windCardinal: string | null;
  cloudCover: number | null;
  high24h: number | null;
  low24h: number | null;
  timeZoneId: string | null;
}

export interface DailyForecastItem {
  /** YYYY-MM-DD */
  dateKey: string;
  year: number;
  month: number;
  day: number;
  maxTemp: number | null;
  minTemp: number | null;
  conditionText: string;
  conditionType: string;
  iconBaseUri: string | null;
  precipPercent: number | null;
  humidity: number | null;
  uvIndex: number | null;
  sunriseTime: string | null;
  sunsetTime: string | null;
}

export interface WeatherBundle {
  location: ResolvedLocation;
  units: WeatherUnits;
  current: CurrentWeatherData;
  daily: DailyForecastItem[];
  fetchedAt: number;
}

/**
 * Maps primary calendar timezone IDs to default reference city query strings.
 * Coordinates are resolved dynamically via Google Maps Geocoding API (zero hardcoded coordinates).
 */
export const TIMEZONE_DEFAULT_CITY_QUERY: Record<string, string> = {
  IST: 'New Delhi, India',
  EST: 'New York, NY, USA',
  PST: 'San Francisco, CA, USA',
  GMT: 'London, UK',
  CET: 'Berlin, Germany',
  GST: 'Dubai, UAE',
  SGT: 'Singapore',
  JST: 'Tokyo, Japan',
  AEDT: 'Sydney, Australia',
  'Asia/Kolkata': 'New Delhi, India',
  'Asia/Calcutta': 'New Delhi, India',
  'America/New_York': 'New York, NY, USA',
  'America/Los_Angeles': 'Los Angeles, CA, USA',
  'America/Chicago': 'Chicago, IL, USA',
  'America/Denver': 'Denver, CO, USA',
  'America/Toronto': 'Toronto, Canada',
  'America/Vancouver': 'Vancouver, Canada',
  'Europe/London': 'London, UK',
  'Europe/Paris': 'Paris, France',
  'Europe/Berlin': 'Berlin, Germany',
  'Asia/Dubai': 'Dubai, UAE',
  'Asia/Singapore': 'Singapore',
  'Asia/Tokyo': 'Tokyo, Japan',
  'Australia/Sydney': 'Sydney, Australia',
};

export function getDefaultCityQueryForTimezone(tzId: string): string {
  if (TIMEZONE_DEFAULT_CITY_QUERY[tzId]) {
    return TIMEZONE_DEFAULT_CITY_QUERY[tzId];
  }
  // Parse IANA timezone strings like "America/Phoenix", "Europe/Amsterdam", "Asia/Seoul"
  if (tzId && tzId.includes('/')) {
    const parts = tzId.split('/');
    const city = parts[parts.length - 1].replace(/_/g, ' ').trim();
    if (city && city.toLowerCase() !== 'utc' && city.toLowerCase() !== 'gmt') {
      return city;
    }
  }
  return 'London, UK';
}

const GMP_ATTRIBUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10-minute in-memory session cache (conserves quota)

const geocodeCache = new Map<string, ResolvedLocation>();
const weatherCache = new Map<string, WeatherBundle>();

function dispatchQuotaExceeded(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
}

function checkQuotaAndThrow(status: number, payload: unknown): void {
  const errObj =
    payload && typeof payload === 'object'
      ? ((payload as Record<string, unknown>).error as Record<string, unknown> | undefined)
      : undefined;

  if (
    status === 429 ||
    errObj?.status === 'RESOURCE_EXHAUSTED' ||
    (payload as Record<string, unknown>)?.status === 'OVER_QUERY_LIMIT'
  ) {
    dispatchQuotaExceeded();
    throw new Error('Google Maps Platform weather quota reached.');
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function parseCurrentConditions(
  raw: Record<string, unknown>,
  units: WeatherUnits
): CurrentWeatherData {
  const tempObj = raw?.temperature as { degrees?: number; unit?: string } | undefined;
  const feelsObj = raw?.feelsLikeTemperature as { degrees?: number } | undefined;
  const condObj = raw?.weatherCondition as
    | {
        iconBaseUri?: string;
        description?: { text?: string };
        type?: string;
      }
    | undefined;
  const precipObj = raw?.precipitation as
    | { probability?: { percent?: number; type?: string } }
    | undefined;
  const windObj = raw?.wind as
    | {
        speed?: { value?: number; unit?: string };
        direction?: { cardinal?: string };
      }
    | undefined;
  const histObj = raw?.currentConditionsHistory as
    | {
        maxTemperature?: { degrees?: number };
        minTemperature?: { degrees?: number };
      }
    | undefined;
  const tzObj = raw?.timeZone as { id?: string } | undefined;

  const isImperial = units === 'IMPERIAL' || tempObj?.unit === 'FAHRENHEIT';
  const windUnit =
    windObj?.speed?.unit === 'MILES_PER_HOUR' || isImperial ? 'mph' : 'km/h';

  return {
    temperature: typeof tempObj?.degrees === 'number' ? tempObj.degrees : null,
    feelsLike: typeof feelsObj?.degrees === 'number' ? feelsObj.degrees : null,
    tempUnitSymbol: isImperial ? '°F' : '°C',
    conditionText: condObj?.description?.text || 'Current conditions',
    conditionType: condObj?.type || 'TYPE_UNSPECIFIED',
    iconBaseUri: typeof condObj?.iconBaseUri === 'string' ? condObj.iconBaseUri : null,
    isDaytime: raw?.isDaytime !== false,
    humidity: typeof raw?.relativeHumidity === 'number' ? raw.relativeHumidity : null,
    uvIndex: typeof raw?.uvIndex === 'number' ? raw.uvIndex : null,
    precipPercent:
      typeof precipObj?.probability?.percent === 'number'
        ? precipObj.probability.percent
        : null,
    precipType: precipObj?.probability?.type || null,
    windSpeed: typeof windObj?.speed?.value === 'number' ? windObj.speed.value : null,
    windUnitLabel: windUnit,
    windCardinal: windObj?.direction?.cardinal || null,
    cloudCover: typeof raw?.cloudCover === 'number' ? raw.cloudCover : null,
    high24h:
      typeof histObj?.maxTemperature?.degrees === 'number'
        ? histObj.maxTemperature.degrees
        : null,
    low24h:
      typeof histObj?.minTemperature?.degrees === 'number'
        ? histObj.minTemperature.degrees
        : null,
    timeZoneId: tzObj?.id || null,
  };
}

function parseDailyForecast(raw: Record<string, unknown>): DailyForecastItem[] {
  const days = Array.isArray(raw?.forecastDays) ? raw.forecastDays : [];
  const parsed: DailyForecastItem[] = [];

  for (const item of days) {
    if (!item || typeof item !== 'object') continue;
    const d = item as Record<string, unknown>;
    const disp = d?.displayDate as
      | { year?: number; month?: number; day?: number }
      | undefined;
    if (!disp?.year || !disp?.month || !disp?.day) continue;

    const daytime = d?.daytimeForecast as
      | {
          weatherCondition?: {
            iconBaseUri?: string;
            description?: { text?: string };
            type?: string;
          };
          relativeHumidity?: number;
          uvIndex?: number;
          precipitation?: { probability?: { percent?: number } };
        }
      | undefined;
    const maxObj = d?.maxTemperature as { degrees?: number } | undefined;
    const minObj = d?.minTemperature as { degrees?: number } | undefined;
    const sunObj = d?.sunEvents as
      | { sunriseTime?: string; sunsetTime?: string }
      | undefined;

    parsed.push({
      dateKey: `${disp.year}-${pad2(disp.month)}-${pad2(disp.day)}`,
      year: disp.year,
      month: disp.month,
      day: disp.day,
      maxTemp: typeof maxObj?.degrees === 'number' ? maxObj.degrees : null,
      minTemp: typeof minObj?.degrees === 'number' ? minObj.degrees : null,
      conditionText: daytime?.weatherCondition?.description?.text || 'Forecast',
      conditionType: daytime?.weatherCondition?.type || 'TYPE_UNSPECIFIED',
      iconBaseUri:
        typeof daytime?.weatherCondition?.iconBaseUri === 'string'
          ? daytime.weatherCondition.iconBaseUri
          : null,
      precipPercent:
        typeof daytime?.precipitation?.probability?.percent === 'number'
          ? daytime.precipitation.probability.percent
          : null,
      humidity:
        typeof daytime?.relativeHumidity === 'number' ? daytime.relativeHumidity : null,
      uvIndex: typeof daytime?.uvIndex === 'number' ? daytime.uvIndex : null,
      sunriseTime: sunObj?.sunriseTime || null,
      sunsetTime: sunObj?.sunsetTime || null,
    });
  }

  return parsed;
}

export async function geocodeLocationQuery(query: string): Promise<ResolvedLocation> {
  const clean = query.trim();
  if (!clean) {
    throw new Error('Please enter a city or location name.');
  }

  const cacheKey = clean.toLowerCase();
  const cached = geocodeCache.get(cacheKey);
  if (cached) return cached;

  const res = await fetch(`/api/geocode?address=${encodeURIComponent(clean)}`);
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  checkQuotaAndThrow(res.status, data);

  if (!res.ok) {
    const errObj = data?.error as { message?: string } | undefined;
    throw new Error(errObj?.message || `Could not locate "${clean}".`);
  }

  const lat = typeof data?.lat === 'number' ? data.lat : null;
  const lng = typeof data?.lng === 'number' ? data.lng : null;
  if (lat === null || lng === null) {
    throw new Error(`No coordinates returned for "${clean}".`);
  }

  const resolved: ResolvedLocation = {
    name: typeof data?.name === 'string' && data.name ? data.name : clean,
    formattedAddress:
      typeof data?.formattedAddress === 'string' && data.formattedAddress
        ? data.formattedAddress
        : clean,
    lat,
    lng,
  };

  geocodeCache.set(cacheKey, resolved);
  return resolved;
}

export async function reverseGeocodeCoords(
  lat: number,
  lng: number
): Promise<ResolvedLocation> {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      `/api/geocode?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(
        String(lng)
      )}`
    );
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    checkQuotaAndThrow(res.status, data);

    if (res.ok && typeof data?.name === 'string' && data.name) {
      const resolved: ResolvedLocation = {
        name: data.name,
        formattedAddress:
          typeof data.formattedAddress === 'string' ? data.formattedAddress : data.name,
        lat,
        lng,
      };
      geocodeCache.set(cacheKey, resolved);
      return resolved;
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('quota')) {
      throw err;
    }
    // Fall back to coordinate label if reverse geocoding is unavailable
  }

  return {
    name: 'Current Location',
    formattedAddress: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
    lat,
    lng,
  };
}

/**
 * Fetches current weather & 5-day daily forecast from Google Maps Platform Weather API.
 * Uses server-side proxy (/api/weather) with optional direct client fallback if server key is absent.
 */
export async function fetchWeatherForCoords(
  location: ResolvedLocation,
  units: WeatherUnits,
  forceRefresh = false
): Promise<WeatherBundle> {
  const cacheKey = `${location.lat.toFixed(3)},${location.lng.toFixed(3)}:${units}`;
  const cached = weatherCache.get(cacheKey);
  if (!forceRefresh && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { ...cached, location };
  }

  let currentRaw: Record<string, unknown> | null = null;
  let forecastRaw: Record<string, unknown> = { forecastDays: [] };

  const proxyUrl = `/api/weather?lat=${encodeURIComponent(
    String(location.lat)
  )}&lng=${encodeURIComponent(String(location.lng))}&units=${units}&days=5`;

  const proxyRes = await fetch(proxyUrl);
  const proxyJson = (await proxyRes.json().catch(() => ({}))) as Record<string, unknown>;

  checkQuotaAndThrow(proxyRes.status, proxyJson);

  if (proxyRes.ok && proxyJson?.current) {
    currentRaw = proxyJson.current as Record<string, unknown>;
    forecastRaw = (proxyJson.forecast as Record<string, unknown>) || {
      forecastDays: [],
    };
  } else {
    // Fallback to direct Weather API call ONLY if server didn't have key and Vite client env has it
    const clientKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
    if (clientKey && clientKey !== 'MY_GOOGLE_MAPS_API_KEY') {
      const cUrl = new URL(
        'https://weather.googleapis.com/v1/currentConditions:lookup'
      );
      cUrl.searchParams.set('key', clientKey);
      cUrl.searchParams.set('location.latitude', String(location.lat));
      cUrl.searchParams.set('location.longitude', String(location.lng));
      cUrl.searchParams.set('unitsSystem', units);

      const fUrl = new URL('https://weather.googleapis.com/v1/forecast/days:lookup');
      fUrl.searchParams.set('key', clientKey);
      fUrl.searchParams.set('location.latitude', String(location.lat));
      fUrl.searchParams.set('location.longitude', String(location.lng));
      fUrl.searchParams.set('days', '5');
      fUrl.searchParams.set('pageSize', '5');
      fUrl.searchParams.set('unitsSystem', units);

      const headers = { 'X-Goog-Maps-Solution-ID': GMP_ATTRIBUTION_ID };
      const [cRes, fRes] = await Promise.all([
        fetch(cUrl.toString(), { method: 'GET', headers }),
        fetch(fUrl.toString(), { method: 'GET', headers }),
      ]);
      const [cData, fData] = await Promise.all([
        cRes.json().catch(() => ({})),
        fRes.json().catch(() => ({})),
      ]);

      checkQuotaAndThrow(cRes.status, cData);
      checkQuotaAndThrow(fRes.status, fData);

      if (!cRes.ok) {
        const errObj = (cData as Record<string, unknown>)?.error as
          | { message?: string }
          | undefined;
        throw new Error(errObj?.message || `Weather API error (${cRes.status}).`);
      }

      currentRaw = cData as Record<string, unknown>;
      forecastRaw = fRes.ok
        ? (fData as Record<string, unknown>)
        : { forecastDays: [] };
    } else {
      const errObj = proxyJson?.error as { message?: string } | undefined;
      throw new Error(
        errObj?.message || `Unable to load weather forecast (${proxyRes.status}).`
      );
    }
  }

  const current = parseCurrentConditions(currentRaw || {}, units);
  const daily = parseDailyForecast(forecastRaw);

  // If reverse geocode returned generic "Current Location" and Weather API returned an IANA timezone city, enrich nicely
  let finalLocation = location;
  if (location.name === 'Current Location' && current.timeZoneId) {
    const tzCity = current.timeZoneId.split('/').pop()?.replace(/_/g, ' ');
    if (tzCity) {
      finalLocation = { ...location, name: tzCity };
    }
  }

  const bundle: WeatherBundle = {
    location: finalLocation,
    units,
    current,
    daily,
    fetchedAt: Date.now(),
  };

  weatherCache.set(cacheKey, bundle);
  return bundle;
}

export async function fetchWeatherForCityQuery(
  query: string,
  units: WeatherUnits,
  forceRefresh = false
): Promise<WeatherBundle> {
  const resolved = await geocodeLocationQuery(query);
  return fetchWeatherForCoords(resolved, units, forceRefresh);
}

export function formatTempRounded(degrees: number | null): string {
  if (degrees === null || !Number.isFinite(degrees)) return '--';
  return `${Math.round(degrees)}°`;
}

export function getWeatherIconUrl(iconBaseUri: string | null): string | null {
  if (!iconBaseUri) return null;
  if (iconBaseUri.endsWith('.svg') || iconBaseUri.endsWith('.png')) {
    return iconBaseUri;
  }
  return `${iconBaseUri}.svg`;
}

export function getForecastForDateKey(
  bundle: WeatherBundle | null,
  dateKey: string
): DailyForecastItem | null {
  if (!bundle) return null;
  return bundle.daily.find((d) => d.dateKey === dateKey) || null;
}
