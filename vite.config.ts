import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'favicon-16x16.png',
          'favicon-32x32.png',
          'apple-touch-icon.png',
          'android-chrome-192x192.png',
          'android-chrome-512x512.png',
          'widgets/calendar-template.json',
          'sw-widgets.js',
        ],
        manifest: {
          id: '/',
          lang: 'en',
          dir: 'ltr',
          name: 'Calander.Q — Universal Calendar',
          short_name: 'Calander.Q',
          description:
            'Universal calendar platform with 33 world calendars, regional holidays, weather, and astronomy.',
          start_url: '/?open=calendar',
          scope: '/',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
          orientation: 'any',
          theme_color: '#0A0908',
          background_color: '#0A0908',
          prefer_related_applications: false,
          categories: ['productivity', 'utilities'],
          launch_handler: {
            client_mode: ['focus-existing', 'auto'],
          },
          edge_side_panel: {
            preferred_width: 420,
          },
          icons: [
            {
              src: '/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          screenshots: [
            {
              src: '/screenshots/workspace-month-dark.png',
              sizes: '1440x900',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Full-month calendar workspace with regional holidays',
            },
            {
              src: '/screenshots/widget-mobile.png',
              sizes: '860x1640',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Mobile calendar and home screen widget',
            },
          ],
          shortcuts: [
            {
              name: 'Open Calendar',
              short_name: 'Calendar',
              description: 'Jump directly to your full-month calendar workspace',
              url: '/?open=calendar',
              icons: [
                {
                  src: '/android-chrome-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
              ],
            },
            {
              name: 'Desktop Widget',
              short_name: 'Desktop Widget',
              description: 'Open the glanceable desktop calendar widget',
              url: '/?widget=desktop&embed=1',
              icons: [
                {
                  src: '/android-chrome-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
              ],
            },
            {
              name: 'Mobile Widget',
              short_name: 'Mobile Widget',
              description: 'Open the glanceable mobile calendar widget',
              url: '/?widget=mobile&embed=1',
              icons: [
                {
                  src: '/android-chrome-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
              ],
            },
          ],
          // W3C / Windows 11 Native PWA Widgets Board declaration
          widgets: [
            {
              name: 'Calander.Q Today & Month',
              short_name: 'Calander.Q',
              tag: 'calendar-q-today',
              description: 'Glanceable today card, regional holidays, and quick jump into Calander.Q.',
              ms_ac_template: '/widgets/calendar-template.json',
              data: '/api/widget-data',
              type: 'application/json',
              screenshots: [
                {
                  src: '/screenshots/widget-desktop-dark.png',
                  sizes: '1440x900',
                  label: 'Calander.Q Desktop Widget',
                },
              ],
              icons: [
                {
                  src: '/android-chrome-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
                {
                  src: '/android-chrome-512x512.png',
                  sizes: '512x512',
                  type: 'image/png',
                },
              ],
              update: 3600,
              multiple: false,
            },
          ],
        } as Record<string, unknown>,
        workbox: {
          importScripts: ['/sw-widgets.js'],
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
          globIgnores: ['screenshots/**', 'videos/**', 'assets/aistudio/**'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/downloads\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60,
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
