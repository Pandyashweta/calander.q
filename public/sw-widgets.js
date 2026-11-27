// Windows 11 PWA Widgets Board Service Worker lifecycle handlers
// Enables calendar.q to render and refresh natively inside the Windows 11 Widgets Board (Win + W).

const WIDGET_TAG = 'calendar-q-today';
const TEMPLATE_URL = '/widgets/calendar-template.json';
const DATA_URL = '/api/widget-data';

async function refreshCalendarWidget() {
  if (!self.widgets) return;
  try {
    const [templateResp, dataResp] = await Promise.all([
      fetch(TEMPLATE_URL, { cache: 'no-cache' }),
      fetch(DATA_URL, { cache: 'no-cache' }),
    ]);
    if (!templateResp.ok || !dataResp.ok) return;
    const template = await templateResp.text();
    const data = await dataResp.text();
    await self.widgets.updateByTag(WIDGET_TAG, { template, data });
  } catch (err) {
    // Ignore transient offline widget refresh errors
  }
}

self.addEventListener('widgetinstall', (event) => {
  event.waitUntil(refreshCalendarWidget());
});

self.addEventListener('widgetresume', (event) => {
  event.waitUntil(refreshCalendarWidget());
});

self.addEventListener('widgetclick', (event) => {
  if (event.action === 'openCalendar' || !event.action) {
    event.waitUntil(self.clients.openWindow('/?open=calendar'));
  } else {
    event.waitUntil(refreshCalendarWidget());
  }
});

self.addEventListener('widgetuninstall', () => {
  // No-op cleanup hook required by Windows Widgets Host
});
