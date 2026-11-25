import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

  /**
   * Server-side proxy for Google Maps Platform Geocoding API (avoids CORS & secures API key).
   * Supports ?address=<city> or ?lat=<num>&lng=<num>.
   * Reference: https://developers.google.com/maps/documentation/geocoding/overview?utm_campaign=gmp_mcp_codeassist_v1_aistudio
   */
  app.get('/api/geocode', async (req, res) => {
    const apiKey = getMapsApiKey();
    if (!apiKey) {
      res.status(503).json({
        error: {
          status: 'API_KEY_MISSING',
          message: 'Google Maps API key is not configured on the server.',
        },
      });
      return;
    }

    const address = typeof req.query.address === 'string' ? req.query.address.trim() : '';
    const latRaw = typeof req.query.lat === 'string' ? req.query.lat.trim() : '';
    const lngRaw = typeof req.query.lng === 'string' ? req.query.lng.trim() : '';

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
    const apiKey = getMapsApiKey();
    if (!apiKey) {
      res.status(503).json({
        error: {
          status: 'API_KEY_MISSING',
          message: 'Google Maps API key is not configured on the server.',
        },
      });
      return;
    }

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
    console.log(`Samay Calendar server running on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
