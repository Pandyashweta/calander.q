import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import * as authService from './server/authService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const GMP_ATTRIBUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';

function getMapsApiKey(): string | undefined {
  return (
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    undefined
  );
}

function isQuotaError(status: number, payload: unknown): boolean {
  if (status === 429) return true;
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const err = obj.error as Record<string, unknown> | undefined;
    if (err?.status === 'RESOURCE_EXHAUSTED') return true;
    if (obj.status === 'OVER_QUERY_LIMIT' || obj.status === 'OVER_DAILY_LIMIT') {
      return true;
    }
  }
  return false;
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json());

  // Helper to extract session user from header
  const getSessionUser = (req: express.Request): authService.StoredUser | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return null;
    return authService.getUserByToken(token);
  };

  // ==================== AUTHENTICATION & ACCOUNT ENDPOINTS ====================
  app.post('/api/auth/signup', (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        res.status(400).json({ error: { message: 'Valid email address is required.' } });
        return;
      }
      if (!password || typeof password !== 'string' || password.length < 8) {
        res.status(400).json({ error: { message: 'Password must be at least 8 characters long.' } });
        return;
      }
      const result = authService.signUp(name || '', email, password);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: { message: err?.message || 'Failed to sign up.' } });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: { message: 'Email and password are required.' } });
        return;
      }
      const result = authService.signIn(email, password);
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ error: { message: err?.message || 'Invalid credentials.' } });
    }
  });

  app.post('/api/auth/oauth', (req, res) => {
    try {
      const { email, name, provider, avatar } = req.body;
      if (!email || !provider || (provider !== 'google' && provider !== 'apple')) {
        res.status(400).json({ error: { message: 'Valid email and provider (google or apple) are required.' } });
        return;
      }
      const result = authService.oauthSignIn(email, name || '', provider, avatar);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: { message: err?.message || 'OAuth sign-in failed.' } });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    const user = getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: { message: 'Unauthenticated.' } });
      return;
    }
    res.json({ user });
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
    if (token) {
      authService.logout(token);
    }
    res.json({ success: true });
  });

  app.post('/api/auth/verify-email', (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        res.status(400).json({ error: { message: 'Email and verification code are required.' } });
        return;
      }
      authService.verifyEmail(email, code);
      res.json({ success: true, message: 'Email verified successfully.' });
    } catch (err: any) {
      res.status(400).json({ error: { message: err?.message || 'Verification failed.' } });
    }
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: { message: 'Email is required.' } });
        return;
      }
      const msg = authService.forgotPassword(email);
      res.json({ success: true, message: msg });
    } catch (err: any) {
      res.status(400).json({ error: { message: err?.message || 'Failed to request password reset.' } });
    }
  });

  app.post('/api/auth/reset-password', (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword || newPassword.length < 8) {
        res.status(400).json({ error: { message: 'Reset token and new password (min 8 chars) are required.' } });
        return;
      }
      authService.resetPassword(token, newPassword);
      res.json({ success: true, message: 'Password has been reset successfully.' });
    } catch (err: any) {
      res.status(400).json({ error: { message: err?.message || 'Password reset failed.' } });
    }
  });

  app.post('/api/auth/profile', (req, res) => {
    const user = getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: { message: 'Unauthenticated.' } });
      return;
    }
    try {
      const updated = authService.updateProfile(user.id, req.body || {});
      res.json({ user: updated });
    } catch (err: any) {
      res.status(400).json({ error: { message: err?.message || 'Profile update failed.' } });
    }
  });

  app.delete('/api/auth/account', (req, res) => {
    const user = getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: { message: 'Unauthenticated.' } });
      return;
    }
    authService.deleteAccount(user.id);
    res.json({ success: true, message: 'Account permanently deleted.' });
  });

  // ==================== TRANSACTIONAL EMAIL & OUTBOX ====================
  app.get('/api/email/outbox', (req, res) => {
    const user = getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: { message: 'Unauthenticated.' } });
      return;
    }
    const emails = authService.getEmailsForUser(user.email);
    res.json({ emails });
  });

  app.post('/api/email/send', (req, res) => {
    try {
      const { to, subject, body, type } = req.body;
      if (!to || !subject || !body) {
        res.status(400).json({ error: { message: 'Recipient, subject, and body are required.' } });
        return;
      }
      const sent = authService.sendTransactionalEmail({
        to,
        subject,
        body,
        type: type || 'reminder',
      });
      res.json({ success: true, email: sent });
    } catch (err: any) {
      res.status(500).json({ error: { message: err?.message || 'Failed to dispatch email.' } });
    }
  });

  // ==================== USER DATA & PREFERENCE SYNC ====================
  app.get('/api/sync/events', (req, res) => {
    const user = getSessionUser(req);
    if (!user) {
      res.json({ events: [] });
      return;
    }
    const events = authService.getUserEvents(user.id);
    res.json({ events });
  });

  app.post('/api/sync/events', (req, res) => {
    const user = getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: { message: 'Unauthenticated.' } });
      return;
    }
    if (Array.isArray(req.body.events)) {
      authService.saveUserEvents(user.id, req.body.events);
    }
    res.json({ success: true });
  });

  app.get('/api/sync/preferences', (req, res) => {
    const user = getSessionUser(req);
    if (!user) {
      res.json({ preferences: {} });
      return;
    }
    const prefs = authService.getUserPreferences(user.id);
    res.json({ preferences: prefs });
  });

  app.post('/api/sync/preferences', (req, res) => {
    const user = getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: { message: 'Unauthenticated.' } });
      return;
    }
    if (req.body.preferences && typeof req.body.preferences === 'object') {
      authService.saveUserPreferences(user.id, req.body.preferences);
    }
    res.json({ success: true });
  });

  function degreesToCardinal(deg?: number): string {
    if (typeof deg !== 'number' || !Number.isFinite(deg)) return 'N';
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  }

  function mapWmoWeather(code: number) {
    if (code === 0) return { text: 'Clear Sky', type: 'CLEAR', icon: null };
    if (code <= 3) {
      return {
        text: code === 1 ? 'Mainly Clear' : code === 2 ? 'Partly Cloudy' : 'Overcast',
        type: code === 3 ? 'CLOUDY' : 'PARTLY_CLOUDY',
        icon: null,
      };
    }
    if (code === 45 || code === 48) return { text: 'Foggy', type: 'FOG', icon: null };
    if (code >= 51 && code <= 57) return { text: 'Drizzle', type: 'LIGHT_RAIN', icon: null };
    if (code >= 61 && code <= 67) return { text: 'Rain', type: 'RAIN', icon: null };
    if (code >= 71 && code <= 77) return { text: 'Snow', type: 'SNOW', icon: null };
    if (code >= 80 && code <= 82) return { text: 'Rain Showers', type: 'RAIN_SHOWERS', icon: null };
    if (code >= 95) return { text: 'Thunderstorm', type: 'THUNDERSTORM', icon: null };
    return { text: 'Clear', type: 'CLEAR', icon: null };
  }

  const FALLBACK_CITY_DICT: Record<string, { lat: number; lng: number; name: string }> = {
    ahmedabad: { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad, Gujarat, India' },
    mumbai: { lat: 19.076, lng: 72.8777, name: 'Mumbai, Maharashtra, India' },
    delhi: { lat: 28.6139, lng: 77.209, name: 'New Delhi, India' },
    'new delhi': { lat: 28.6139, lng: 77.209, name: 'New Delhi, India' },
    bengaluru: { lat: 12.9716, lng: 77.5946, name: 'Bengaluru, Karnataka, India' },
    bangalore: { lat: 12.9716, lng: 77.5946, name: 'Bengaluru, Karnataka, India' },
    kolkata: { lat: 22.5726, lng: 88.3639, name: 'Kolkata, West Bengal, India' },
    chennai: { lat: 13.0827, lng: 80.2707, name: 'Chennai, Tamil Nadu, India' },
    hyderabad: { lat: 17.385, lng: 78.4867, name: 'Hyderabad, Telangana, India' },
    surat: { lat: 21.1702, lng: 72.8311, name: 'Surat, Gujarat, India' },
    pune: { lat: 18.5204, lng: 73.8567, name: 'Pune, Maharashtra, India' },
    'new york': { lat: 40.7128, lng: -74.006, name: 'New York, NY, USA' },
    'los angeles': { lat: 34.0522, lng: -118.2437, name: 'Los Angeles, CA, USA' },
    'san francisco': { lat: 37.7749, lng: -122.4194, name: 'San Francisco, CA, USA' },
    chicago: { lat: 41.8781, lng: -87.6298, name: 'Chicago, IL, USA' },
    seattle: { lat: 47.6062, lng: -122.3321, name: 'Seattle, WA, USA' },
    denver: { lat: 39.7392, lng: -104.9903, name: 'Denver, CO, USA' },
    miami: { lat: 25.7617, lng: -80.1918, name: 'Miami, FL, USA' },
    toronto: { lat: 43.6532, lng: -79.3832, name: 'Toronto, Canada' },
    vancouver: { lat: 49.2827, lng: -123.1207, name: 'Vancouver, Canada' },
    london: { lat: 51.5074, lng: -0.1278, name: 'London, United Kingdom' },
    paris: { lat: 48.8566, lng: 2.3522, name: 'Paris, France' },
    berlin: { lat: 52.52, lng: 13.405, name: 'Berlin, Germany' },
    amsterdam: { lat: 52.3676, lng: 4.9041, name: 'Amsterdam, Netherlands' },
    madrid: { lat: 40.4168, lng: -3.7038, name: 'Madrid, Spain' },
    rome: { lat: 41.9028, lng: 12.4964, name: 'Rome, Italy' },
    zurich: { lat: 47.3769, lng: 8.5417, name: 'Zurich, Switzerland' },
    dubai: { lat: 25.2048, lng: 55.2708, name: 'Dubai, UAE' },
    singapore: { lat: 1.3521, lng: 103.8198, name: 'Singapore' },
    tokyo: { lat: 35.6762, lng: 139.6503, name: 'Tokyo, Japan' },
    seoul: { lat: 37.5665, lng: 126.978, name: 'Seoul, South Korea' },
    'hong kong': { lat: 22.3193, lng: 114.1694, name: 'Hong Kong' },
    sydney: { lat: -33.8688, lng: 151.2093, name: 'Sydney, Australia' },
    melbourne: { lat: -37.8136, lng: 144.9631, name: 'Melbourne, Australia' },
    auckland: { lat: -36.8485, lng: 174.7633, name: 'Auckland, New Zealand' },
  };

  async function geocodeWithOpenMeteo(address: string, latRaw: string, lngRaw: string) {
    if (address) {
      const candidates = [address, address.split(',')[0].trim()].filter(
        (v, i, arr) => Boolean(v) && arr.indexOf(v) === i
      );
      for (const candidate of candidates) {
        try {
          const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(candidate)}&count=3&language=en&format=json`;
          const gRes = await fetch(geoUrl);
          if (gRes.ok) {
            const gData = (await gRes.json().catch(() => ({}))) as any;
            if (gData?.results?.length > 0) {
              // Prefer result matching country/region text if present in address
              const lowerAddr = address.toLowerCase();
              const item =
                gData.results.find((r: any) =>
                  [r.country, r.admin1, r.country_code]
                    .filter(Boolean)
                    .some((part: string) => lowerAddr.includes(part.toLowerCase()))
                ) || gData.results[0];
              return {
                name: item.name,
                formattedAddress: [item.name, item.admin1, item.country].filter(Boolean).join(', '),
                lat: item.latitude,
                lng: item.longitude,
              };
            }
          }
        } catch {
          // try next candidate
        }
      }

      const cityKey = address.split(',')[0].trim().toLowerCase();
      const matched =
        FALLBACK_CITY_DICT[address.toLowerCase()] || FALLBACK_CITY_DICT[cityKey];
      if (matched) {
        return {
          name: matched.name.split(',')[0],
          formattedAddress: matched.name,
          lat: matched.lat,
          lng: matched.lng,
        };
      }
      return null;
    }

    if (latRaw && lngRaw) {
      const lat = Number(latRaw);
      const lng = Number(lngRaw);
      try {
        const revRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(String(lat))}&longitude=${encodeURIComponent(String(lng))}&localityLanguage=en`
        );
        if (revRes.ok) {
          const revData = (await revRes.json().catch(() => ({}))) as any;
          const city = revData.city || revData.locality || revData.principalSubdivision;
          if (city) {
            return {
              name: city,
              formattedAddress: [city, revData.principalSubdivision, revData.countryName]
                .filter(Boolean)
                .join(', '),
              lat,
              lng,
            };
          }
        }
      } catch {
        // fallback below
      }
      return {
        name: 'Current Location',
        formattedAddress: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
        lat,
        lng,
      };
    }

    return null;
  }

  async function fetchWeatherFromOpenMeteo(lat: number, lng: number, units: 'METRIC' | 'IMPERIAL', days: number) {
    const isImp = units === 'IMPERIAL';
    const tempParam = isImp ? '&temperature_unit=fahrenheit&wind_speed_unit=mph' : '';
    const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max&timezone=auto&forecast_days=${Math.max(5, days)}${tempParam}`;
    const omRes = await fetch(omUrl);
    if (!omRes.ok) return null;

    const omData = (await omRes.json().catch(() => ({}))) as any;
    const wCode = omData.current?.weather_code ?? 0;
    const cond = mapWmoWeather(wCode);

    const formatClock = (iso?: string) => {
      if (!iso) return null;
      const parts = iso.split('T');
      if (parts.length < 2) return iso;
      const [hStr, mStr] = parts[1].split(':');
      const h = Number(hStr);
      const m = Number(mStr);
      if (!Number.isFinite(h) || !Number.isFinite(m)) return iso;
      const suffix = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
    };

    const forecastDays = (omData.daily?.time || []).slice(0, days).map((timeStr: string, idx: number) => {
      const [y, m, d] = timeStr.split('-').map(Number);
      const dayCode = omData.daily?.weather_code?.[idx] ?? 0;
      const dayCond = mapWmoWeather(dayCode);
      return {
        displayDate: { year: y, month: m, day: d },
        daytimeForecast: {
          weatherCondition: {
            description: { text: dayCond.text },
            type: dayCond.type,
            iconBaseUri: dayCond.icon,
          },
          relativeHumidity: omData.current?.relative_humidity_2m ?? 50,
          uvIndex: Math.round(omData.daily?.uv_index_max?.[idx] ?? 5),
          precipitation: { probability: { percent: omData.daily?.precipitation_probability_max?.[idx] ?? 0 } },
        },
        maxTemperature: { degrees: Math.round(omData.daily?.temperature_2m_max?.[idx] ?? (isImp ? 80 : 27)) },
        minTemperature: { degrees: Math.round(omData.daily?.temperature_2m_min?.[idx] ?? (isImp ? 62 : 17)) },
        sunEvents: {
          sunriseTime: formatClock(omData.daily?.sunrise?.[idx]) || '6:30 AM',
          sunsetTime: formatClock(omData.daily?.sunset?.[idx]) || '6:30 PM',
        },
      };
    });

    const todayHigh = omData.daily?.temperature_2m_max?.[0];
    const todayLow = omData.daily?.temperature_2m_min?.[0];
    const todayUv = omData.daily?.uv_index_max?.[0];
    const todayPrecip = omData.daily?.precipitation_probability_max?.[0];

    return {
      current: {
        temperature: { degrees: Math.round(omData.current?.temperature_2m ?? (isImp ? 72 : 22)), unit: isImp ? 'FAHRENHEIT' : 'CELSIUS' },
        feelsLikeTemperature: { degrees: Math.round(omData.current?.apparent_temperature ?? omData.current?.temperature_2m ?? (isImp ? 72 : 22)) },
        weatherCondition: {
          description: { text: cond.text },
          type: cond.type,
          iconBaseUri: cond.icon,
        },
        isDaytime: omData.current?.is_day !== 0,
        relativeHumidity: omData.current?.relative_humidity_2m ?? 48,
        uvIndex: typeof todayUv === 'number' ? Math.round(todayUv) : null,
        cloudCover: omData.current?.cloud_cover ?? null,
        precipitation: {
          probability: {
            percent: typeof todayPrecip === 'number' ? todayPrecip : (omData.current?.precipitation ?? 0) > 0 ? 60 : 0,
          },
        },
        wind: {
          speed: {
            value: Math.round(omData.current?.wind_speed_10m ?? 10),
            unit: isImp ? 'MILES_PER_HOUR' : 'KILOMETERS_PER_HOUR',
          },
          direction: { cardinal: degreesToCardinal(omData.current?.wind_direction_10m) },
        },
        currentConditionsHistory: {
          maxTemperature: { degrees: typeof todayHigh === 'number' ? Math.round(todayHigh) : null },
          minTemperature: { degrees: typeof todayLow === 'number' ? Math.round(todayLow) : null },
        },
        timeZone: { id: omData.timezone || null },
      },
      forecast: {
        forecastDays,
      },
      fetchedAt: Date.now(),
    };
  }

  /**
   * Server-side proxy for Geocoding (Google Maps Platform with seamless Open-Meteo fallback).
   */
  app.get('/api/geocode', async (req, res) => {
    const address = typeof req.query.address === 'string' ? req.query.address.trim() : '';
    const latRaw = typeof req.query.lat === 'string' ? req.query.lat.trim() : '';
    const lngRaw = typeof req.query.lng === 'string' ? req.query.lng.trim() : '';

    if (!address && !(latRaw && lngRaw)) {
      res.status(400).json({ error: { message: 'Provide either address or lat and lng parameters.' } });
      return;
    }

    if (address.length > 160) {
      res.status(400).json({ error: { message: 'Location query is too long.' } });
      return;
    }

    const apiKey = getMapsApiKey();
    if (apiKey && apiKey !== 'MY_GOOGLE_MAPS_API_KEY') {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('key', apiKey);
      url.searchParams.set('language', 'en');
      if (address) {
        url.searchParams.set('address', address);
      } else {
        const lat = Number(latRaw);
        const lng = Number(lngRaw);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          res.status(400).json({ error: { message: 'Invalid latitude or longitude.' } });
          return;
        }
        url.searchParams.set('latlng', `${lat},${lng}`);
        url.searchParams.set('result_type', 'locality|administrative_area_level_1');
      }

      try {
        const upstream = await fetch(url.toString(), {
          method: 'GET',
          headers: { 'X-Goog-Maps-Solution-ID': GMP_ATTRIBUTION_ID },
        });
        const data = (await upstream.json().catch(() => ({}))) as Record<string, unknown>;

        if (isQuotaError(upstream.status, data)) {
          res.status(429).json({
            error: { status: 'RESOURCE_EXHAUSTED', message: 'Google Maps Platform quota exceeded.' },
          });
          return;
        }

        const statusStr = typeof data.status === 'string' ? data.status : '';
        const results = Array.isArray(data.results) ? data.results : [];
        if (upstream.ok && statusStr === 'OK' && results.length > 0) {
          const first = results[0] as Record<string, unknown>;
          const geometry = first?.geometry as Record<string, unknown> | undefined;
          const loc = geometry?.location as Record<string, unknown> | undefined;
          const lat = typeof loc?.lat === 'number' ? loc.lat : undefined;
          const lng = typeof loc?.lng === 'number' ? loc.lng : undefined;
          if (lat !== undefined && lng !== undefined) {
            const components = Array.isArray(first?.address_components)
              ? (first.address_components as Array<{ long_name?: string; types?: string[] }>)
              : [];
            const locality = components.find((c) => c.types?.includes('locality'))?.long_name;
            const admin1 = components.find((c) => c.types?.includes('administrative_area_level_1'))?.long_name;
            const country = components.find((c) => c.types?.includes('country'))?.long_name;
            const formattedAddress =
              typeof first?.formatted_address === 'string'
                ? first.formatted_address
                : [locality, country].filter(Boolean).join(', ');
            const shortName = locality || admin1 || formattedAddress.split(',')[0] || address;
            res.json({ name: shortName, formattedAddress, lat, lng });
            return;
          }
        }
      } catch (err) {
        console.warn('Google Geocode failed, falling back to Open-Meteo:', err);
      }
    }

    const fallback = await geocodeWithOpenMeteo(address, latRaw, lngRaw);
    if (fallback) {
      res.json(fallback);
      return;
    }

    res.status(404).json({
      error: { status: 'ZERO_RESULTS', message: `Could not find "${address}". Try a city name like London or New York.` },
    });
  });

  /**
   * Server-side proxy for Weather (Google Maps Weather API with reliable Open-Meteo fallback).
   */
  app.get('/api/weather', async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      res.status(400).json({ error: { message: 'Invalid latitude or longitude.' } });
      return;
    }

    const units: 'METRIC' | 'IMPERIAL' = req.query.units === 'IMPERIAL' ? 'IMPERIAL' : 'METRIC';
    const rawDays = Number(req.query.days ?? 5);
    const days = Number.isFinite(rawDays)
      ? Math.max(1, Math.min(10, Math.round(rawDays)))
      : 5;

    const apiKey = getMapsApiKey();
    if (apiKey && apiKey !== 'MY_GOOGLE_MAPS_API_KEY') {
      const currentUrl = new URL('https://weather.googleapis.com/v1/currentConditions:lookup');
      currentUrl.searchParams.set('key', apiKey);
      currentUrl.searchParams.set('location.latitude', String(lat));
      currentUrl.searchParams.set('location.longitude', String(lng));
      currentUrl.searchParams.set('unitsSystem', units);

      const forecastUrl = new URL('https://weather.googleapis.com/v1/forecast/days:lookup');
      forecastUrl.searchParams.set('key', apiKey);
      forecastUrl.searchParams.set('location.latitude', String(lat));
      forecastUrl.searchParams.set('location.longitude', String(lng));
      forecastUrl.searchParams.set('days', String(days));
      forecastUrl.searchParams.set('pageSize', String(Math.min(days, 5)));
      forecastUrl.searchParams.set('unitsSystem', units);

      const headers = { 'X-Goog-Maps-Solution-ID': GMP_ATTRIBUTION_ID };
      try {
        const [currentResp, forecastResp] = await Promise.all([
          fetch(currentUrl.toString(), { method: 'GET', headers }),
          fetch(forecastUrl.toString(), { method: 'GET', headers }),
        ]);

        const [currentData, forecastData] = await Promise.all([
          currentResp.json().catch(() => ({})),
          forecastResp.json().catch(() => ({})),
        ]);

        if (
          isQuotaError(currentResp.status, currentData) ||
          isQuotaError(forecastResp.status, forecastData)
        ) {
          res.status(429).json({
            error: { status: 'RESOURCE_EXHAUSTED', message: 'Google Maps Platform Weather API quota exceeded.' },
          });
          return;
        }

        if (currentResp.ok) {
          res.json({
            current: currentData,
            forecast: forecastResp.ok ? forecastData : { forecastDays: [] },
            fetchedAt: Date.now(),
          });
          return;
        }
      } catch (err) {
        console.warn('Google Weather API failed, falling back to Open-Meteo:', err);
      }
    }

    try {
      const omPayload = await fetchWeatherFromOpenMeteo(lat, lng, units, days);
      if (omPayload) {
        res.json(omPayload);
        return;
      }
    } catch (err) {
      console.warn('Open-Meteo weather fetch error:', err);
    }

    res.status(503).json({
      error: { message: 'Weather forecast temporarily unavailable. Please try refreshing.' },
    });
  });

  // Live data feed for Windows 11 PWA Widgets Board & external OS home-screen widgets
  app.get('/api/widget-data', (req, res) => {
    const now = new Date();
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const host = req.headers.host || `localhost:${PORT}`;
    const appUrl = `${proto}://${host}/?open=calendar`;
    res.setHeader('Cache-Control', 'no-cache');
    res.json({
      day: String(now.getDate()),
      weekday: now.toLocaleDateString('en-US', { weekday: 'long' }),
      monthYear: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      isoDate: now.toISOString().slice(0, 10),
      summary: '33 World Calendars · Universal Calendar',
      appUrl,
    });
  });

  // Landing page waitlist sign-up endpoint
  app.post('/api/waitlist', (req, res) => {
    try {
      const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!rawEmail || !emailRegex.test(rawEmail) || rawEmail.length > 254) {
        res.status(400).json({ error: { message: 'Please enter a valid email address.' } });
        return;
      }

      const dataDir = path.resolve(__dirname, 'data');
      const waitlistFile = path.join(dataDir, 'waitlist.json');
      fs.mkdirSync(dataDir, { recursive: true });

      let entries: Array<{ email: string; joinedAt: string }> = [];
      if (fs.existsSync(waitlistFile)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(waitlistFile, 'utf8'));
          if (Array.isArray(parsed)) entries = parsed;
        } catch {
          entries = [];
        }
      }

      const alreadyJoined = entries.some((entry) => entry.email === rawEmail);
      if (!alreadyJoined) {
        entries.push({ email: rawEmail, joinedAt: new Date().toISOString() });
        fs.writeFileSync(waitlistFile, JSON.stringify(entries, null, 2), 'utf8');
      }

      res.json({
        success: true,
        alreadyJoined,
        email: rawEmail,
      });
    } catch (err) {
      console.error('Waitlist signup error:', err);
      res.status(500).json({ error: { message: 'Unable to save waitlist signup right now.' } });
    }
  });

  // Compiled Desktop Installer Downloads (e.g. calander-q-setup-windows-amd64.exe)
  const releaseDir = path.resolve(__dirname, 'release');
  app.get('/api/downloads/available', (_req, res) => {
    const winExe = 'calander-q-setup-windows-amd64.exe';
    const winPath = path.join(releaseDir, winExe);
    const hasWinExe = fs.existsSync(winPath);
    res.json({
      windows: hasWinExe
        ? {
            filename: winExe,
            url: `/downloads/${winExe}`,
            sizeBytes: fs.statSync(winPath).size,
          }
        : null,
    });
  });

  app.get('/downloads/:filename', (req, res) => {
    const safeName = path.basename(req.params.filename || '');
    if (!safeName || !/\.(exe|msi|dmg|AppImage|deb|zip|apk)$/i.test(safeName)) {
      res.status(404).send('Installer not found.');
      return;
    }
    const filePath = path.join(releaseDir, safeName);
    if (!fs.existsSync(filePath)) {
      res.status(404).send('Installer not built yet. Run npm run desktop:build.');
      return;
    }
    res.download(filePath, safeName);
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : true,
        ws: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`calendar.q server running on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
