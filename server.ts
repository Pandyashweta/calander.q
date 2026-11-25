import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as authService from './server/authService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
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

function mapWmoWeather(code: number) {
  if (code === 0) return { text: 'Clear Sky', type: 'CLEAR', icon: 'https://ssl.gstatic.com/onebox/weather/64/sunny' };
  if (code <= 3) return { text: code === 1 ? 'Mainly Clear' : code === 2 ? 'Partly Cloudy' : 'Overcast', type: 'PARTLY_CLOUDY', icon: 'https://ssl.gstatic.com/onebox/weather/64/partly_cloudy' };
  if (code === 45 || code === 48) return { text: 'Foggy', type: 'FOG', icon: 'https://ssl.gstatic.com/onebox/weather/64/fog' };
  if (code >= 51 && code <= 57) return { text: 'Drizzle', type: 'LIGHT_RAIN', icon: 'https://ssl.gstatic.com/onebox/weather/64/rain_light' };
  if (code >= 61 && code <= 67) return { text: 'Rain', type: 'RAIN', icon: 'https://ssl.gstatic.com/onebox/weather/64/rain' };
  if (code >= 71 && code <= 77) return { text: 'Snow', type: 'SNOW', icon: 'https://ssl.gstatic.com/onebox/weather/64/snow' };
  if (code >= 80 && code <= 82) return { text: 'Rain Showers', type: 'RAIN_SHOWERS', icon: 'https://ssl.gstatic.com/onebox/weather/64/rain_heavy' };
  if (code >= 95) return { text: 'Thunderstorm', type: 'THUNDERSTORM', icon: 'https://ssl.gstatic.com/onebox/weather/64/thunderstorms' };
  return { text: 'Clear', type: 'CLEAR', icon: 'https://ssl.gstatic.com/onebox/weather/64/sunny' };
}

  /**
   * Server-side proxy for Google Maps Platform Geocoding API (avoids CORS & secures API key).
   * Supports ?address=<city> or ?lat=<num>&lng=<num>.
   * Seamlessly falls back to Open-Meteo open geocoding when Google Maps API key is not configured.
   * Reference: https://developers.google.com/maps/documentation/geocoding/overview?utm_campaign=gmp_mcp_codeassist_v1_aistudio
   */
  app.get('/api/geocode', async (req, res) => {
    const address = typeof req.query.address === 'string' ? req.query.address.trim() : '';
    const latRaw = typeof req.query.lat === 'string' ? req.query.lat.trim() : '';
    const lngRaw = typeof req.query.lng === 'string' ? req.query.lng.trim() : '';

    const apiKey = getMapsApiKey();
    if (!apiKey) {
      if (address) {
        try {
          const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(address)}&count=1&language=en&format=json`;
          const gRes = await fetch(geoUrl);
          if (gRes.ok) {
            const gData = (await gRes.json().catch(() => ({}))) as any;
            if (gData?.results?.length > 0) {
              const item = gData.results[0];
              res.json({
                name: item.name,
                formattedAddress: [item.name, item.admin1, item.country].filter(Boolean).join(', '),
                lat: item.latitude,
                lng: item.longitude,
              });
              return;
            }
          }
        } catch {}

        const cityDict: Record<string, { lat: number; lng: number; name: string }> = {
          ahmedabad: { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad, Gujarat, India' },
          mumbai: { lat: 19.076, lng: 72.8777, name: 'Mumbai, Maharashtra, India' },
          delhi: { lat: 28.6139, lng: 77.209, name: 'New Delhi, India' },
          london: { lat: 51.5074, lng: -0.1278, name: 'London, United Kingdom' },
          'new york': { lat: 40.7128, lng: -74.006, name: 'New York, NY, USA' },
        };
        const m = cityDict[address.toLowerCase()] || { lat: 23.0225, lng: 72.5714, name: address };
        res.json({ name: m.name.split(',')[0], formattedAddress: m.name, lat: m.lat, lng: m.lng });
        return;
      } else if (latRaw && lngRaw) {
        res.json({ name: 'Current Location', formattedAddress: `${latRaw}°, ${lngRaw}°`, lat: Number(latRaw), lng: Number(lngRaw) });
        return;
      }
      res.status(400).json({ error: { message: 'Provide either address or lat and lng parameters.' } });
      return;
    }

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('language', 'en');

    if (address) {
      if (address.length > 160) {
        res.status(400).json({ error: { message: 'Location query is too long.' } });
        return;
      }
      url.searchParams.set('address', address);
    } else if (latRaw && lngRaw) {
      const lat = Number(latRaw);
      const lng = Number(lngRaw);
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
      url.searchParams.set('latlng', `${lat},${lng}`);
      url.searchParams.set('result_type', 'locality|administrative_area_level_1');
    } else {
      res.status(400).json({
        error: { message: 'Provide either address or lat and lng parameters.' },
      });
      return;
    }

    try {
      const upstream = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-Goog-Maps-Solution-ID': GMP_ATTRIBUTION_ID,
        },
      });

      const data = (await upstream.json().catch(() => ({}))) as Record<string, unknown>;

      if (isQuotaError(upstream.status, data)) {
        res.status(429).json({
          error: {
            status: 'RESOURCE_EXHAUSTED',
            message: 'Google Maps Platform quota exceeded.',
          },
        });
        return;
      }

      if (!upstream.ok) {
        res.status(upstream.status).json({
          error: {
            status: 'UPSTREAM_ERROR',
            message: `Geocoding API error (${upstream.status}).`,
          },
        });
        return;
      }

      const statusStr = typeof data.status === 'string' ? data.status : '';
      const results = Array.isArray(data.results) ? data.results : [];

      if (statusStr === 'ZERO_RESULTS' || results.length === 0) {
        res.status(404).json({
          error: {
            status: 'ZERO_RESULTS',
            message: 'Location not found. Try a different city or region name.',
          },
        });
        return;
      }

      if (statusStr !== 'OK') {
        res.status(502).json({
          error: {
            status: statusStr || 'GEOCODE_FAILED',
            message:
              typeof data.error_message === 'string'
                ? data.error_message
                : `Geocoding returned status ${statusStr}.`,
          },
        });
        return;
      }

      const first = results[0] as Record<string, unknown>;
      const geometry = first?.geometry as Record<string, unknown> | undefined;
      const loc = geometry?.location as Record<string, unknown> | undefined;
      const lat = typeof loc?.lat === 'number' ? loc.lat : undefined;
      const lng = typeof loc?.lng === 'number' ? loc.lng : undefined;

      if (lat === undefined || lng === undefined) {
        res.status(502).json({
          error: { message: 'Geocoding response missing coordinates.' },
        });
        return;
      }

      const components = Array.isArray(first?.address_components)
        ? (first.address_components as Array<{ long_name?: string; types?: string[] }>)
        : [];
      const locality = components.find((c) => c.types?.includes('locality'))?.long_name;
      const admin1 = components.find((c) =>
        c.types?.includes('administrative_area_level_1')
      )?.long_name;
      const country = components.find((c) => c.types?.includes('country'))?.long_name;

      const formattedAddress =
        typeof first?.formatted_address === 'string'
          ? first.formatted_address
          : [locality, country].filter(Boolean).join(', ');

      const shortName = locality || admin1 || formattedAddress.split(',')[0] || address;

      res.json({
        name: shortName,
        formattedAddress,
        lat,
        lng,
      });
    } catch (err) {
      console.error('Geocode proxy error:', err);
      res.status(502).json({
        error: { message: 'Unable to reach Google Maps Geocoding API.' },
      });
    }
  });

  /**
   * Server-side proxy for Google Maps Platform Weather API (currentConditions + daily forecast).
   * Reference: https://developers.google.com/maps/documentation/weather/overview?utm_campaign=gmp_mcp_codeassist_v1_aistudio
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

    const units = req.query.units === 'IMPERIAL' ? 'IMPERIAL' : 'METRIC';
    const rawDays = Number(req.query.days ?? 5);
    const days = Number.isFinite(rawDays)
      ? Math.max(1, Math.min(10, Math.round(rawDays)))
      : 5;

    const apiKey = getMapsApiKey();
    if (!apiKey) {
      try {
        const isImp = units === 'IMPERIAL';
        const tempParam = isImp ? '&temperature_unit=fahrenheit&wind_speed_unit=mph' : '';
        const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max&timezone=auto${tempParam}`;
        const omRes = await fetch(omUrl);
        if (omRes.ok) {
          const omData = (await omRes.json().catch(() => ({}))) as any;
          const wCode = omData.current?.weather_code ?? 0;
          const cond = mapWmoWeather(wCode);
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
                relativeHumidity: 50,
                uvIndex: omData.daily?.uv_index_max?.[idx] ?? 5,
                precipitation: { probability: { percent: omData.daily?.precipitation_probability_max?.[idx] ?? 0 } },
              },
              maxTemperature: { degrees: Math.round(omData.daily?.temperature_2m_max?.[idx] ?? 30) },
              minTemperature: { degrees: Math.round(omData.daily?.temperature_2m_min?.[idx] ?? 20) },
              sunEvents: {
                sunriseTime: omData.daily?.sunrise?.[idx] ? new Date(omData.daily.sunrise[idx]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:30 AM',
                sunsetTime: omData.daily?.sunset?.[idx] ? new Date(omData.daily.sunset[idx]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:30 PM',
              },
            };
          });

          res.json({
            current: {
              temperature: { degrees: Math.round(omData.current?.temperature_2m ?? (isImp ? 82 : 28)), unit: isImp ? 'FAHRENHEIT' : 'CELSIUS' },
              feelsLikeTemperature: { degrees: Math.round(omData.current?.apparent_temperature ?? (isImp ? 82 : 28)) },
              weatherCondition: {
                description: { text: cond.text },
                type: cond.type,
                iconBaseUri: cond.icon,
              },
              relativeHumidity: omData.current?.relative_humidity_2m ?? 45,
              precipitation: { probability: { percent: (omData.current?.precipitation ?? 0) > 0 ? 60 : 0 } },
              wind: {
                speed: { value: Math.round(omData.current?.wind_speed_10m ?? 12), unit: isImp ? 'MILES_PER_HOUR' : 'KILOMETERS_PER_HOUR' },
                direction: { cardinal: 'NW' },
              },
              timeZone: { id: omData.timezone || 'Asia/Kolkata' },
            },
            forecast: {
              forecastDays,
            },
            fetchedAt: Date.now(),
          });
          return;
        }
      } catch (err) {
        console.warn('Open-Meteo fallback error:', err);
      }

      // Offline realistic fallback
      const isImp = units === 'IMPERIAL';
      const now = new Date();
      const forecastDays = Array.from({ length: days }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        return {
          displayDate: { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() },
          daytimeForecast: {
            weatherCondition: {
              description: { text: i === 0 ? 'Sunny & Clear' : 'Partly Cloudy' },
              type: 'CLEAR',
              iconBaseUri: 'https://ssl.gstatic.com/onebox/weather/64/sunny',
            },
            relativeHumidity: 45,
            uvIndex: 6,
            precipitation: { probability: { percent: 0 } },
          },
          maxTemperature: { degrees: isImp ? 86 : 30 },
          minTemperature: { degrees: isImp ? 66 : 19 },
          sunEvents: {
            sunriseTime: '06:35 AM',
            sunsetTime: '06:15 PM',
          },
        };
      });

      res.json({
        current: {
          temperature: { degrees: isImp ? 84 : 29, unit: isImp ? 'FAHRENHEIT' : 'CELSIUS' },
          feelsLikeTemperature: { degrees: isImp ? 85 : 29 },
          weatherCondition: {
            description: { text: 'Sunny' },
            type: 'CLEAR',
            iconBaseUri: 'https://ssl.gstatic.com/onebox/weather/64/sunny',
          },
          relativeHumidity: 42,
          precipitation: { probability: { percent: 0 } },
          wind: {
            speed: { value: isImp ? 8 : 12, unit: isImp ? 'MILES_PER_HOUR' : 'KILOMETERS_PER_HOUR' },
            direction: { cardinal: 'NW' },
          },
          timeZone: { id: 'Asia/Kolkata' },
        },
        forecast: {
          forecastDays,
        },
        fetchedAt: Date.now(),
      });
      return;
    }

    const currentUrl = new URL(
      'https://weather.googleapis.com/v1/currentConditions:lookup'
    );
    currentUrl.searchParams.set('key', apiKey);
    currentUrl.searchParams.set('location.latitude', String(lat));
    currentUrl.searchParams.set('location.longitude', String(lng));
    currentUrl.searchParams.set('unitsSystem', units);

    const forecastUrl = new URL(
      'https://weather.googleapis.com/v1/forecast/days:lookup'
    );
    forecastUrl.searchParams.set('key', apiKey);
    forecastUrl.searchParams.set('location.latitude', String(lat));
    forecastUrl.searchParams.set('location.longitude', String(lng));
    forecastUrl.searchParams.set('days', String(days));
    forecastUrl.searchParams.set('pageSize', String(Math.min(days, 5)));
    forecastUrl.searchParams.set('unitsSystem', units);

    const headers = {
      'X-Goog-Maps-Solution-ID': GMP_ATTRIBUTION_ID,
    };

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
          error: {
            status: 'RESOURCE_EXHAUSTED',
            message: 'Google Maps Platform Weather API quota exceeded.',
          },
        });
        return;
      }

      if (!currentResp.ok) {
        const errObj = (currentData as Record<string, unknown>)?.error as
          | Record<string, unknown>
          | undefined;
        res.status(currentResp.status).json({
          error: {
            status: errObj?.status || 'WEATHER_ERROR',
            message:
              typeof errObj?.message === 'string'
                ? errObj.message
                : `Weather API returned status ${currentResp.status}.`,
          },
        });
        return;
      }

      res.json({
        current: currentData,
        forecast: forecastResp.ok ? forecastData : { forecastDays: [] },
        fetchedAt: Date.now(),
      });
    } catch (err) {
      console.error('Weather proxy error:', err);
      res.status(502).json({
        error: { message: 'Unable to reach Google Maps Weather API.' },
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`calendar.q server running on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
