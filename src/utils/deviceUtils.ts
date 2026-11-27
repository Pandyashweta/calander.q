export type DevicePlatform = 'macos' | 'windows' | 'linux' | 'ios' | 'android';

export interface DeviceInfo {
  platform: DevicePlatform;
  label: string;
  isMobile: boolean;
  appPackageName: string;
  appDownloadLabel: string;
  widgetLabel: string;
  installHint: string;
}

export type HolidayRegionCode =
  | 'IN'
  | 'US'
  | 'GB'
  | 'CA'
  | 'AU'
  | 'EU'
  | 'JP'
  | 'AE'
  | 'SG'
  | 'GLOBAL';

export interface HolidayRegionOption {
  code: HolidayRegionCode;
  label: string;
  shortLabel: string;
}

export const HOLIDAY_REGIONS: HolidayRegionOption[] = [
  { code: 'IN', label: 'India', shortLabel: 'India' },
  { code: 'US', label: 'United States', shortLabel: 'US' },
  { code: 'GB', label: 'United Kingdom', shortLabel: 'UK' },
  { code: 'CA', label: 'Canada', shortLabel: 'Canada' },
  { code: 'AU', label: 'Australia', shortLabel: 'Australia' },
  { code: 'EU', label: 'Europe (DE/FR/EU)', shortLabel: 'Europe' },
  { code: 'JP', label: 'Japan', shortLabel: 'Japan' },
  { code: 'AE', label: 'United Arab Emirates', shortLabel: 'UAE' },
  { code: 'SG', label: 'Singapore', shortLabel: 'Singapore' },
  { code: 'GLOBAL', label: 'Global / International', shortLabel: 'Global' },
];

export function detectDeviceInfo(): DeviceInfo {
  if (typeof navigator === 'undefined') {
    return {
      platform: 'macos',
      label: 'macOS Desktop',
      isMobile: false,
      appPackageName: 'calendar-q-macos-launcher.command',
      appDownloadLabel: 'Download for macOS',
      widgetLabel: 'macOS Desktop Widget',
      installHint: 'Install directly as a desktop app or save the standalone widget.',
    };
  }

  const ua = navigator.userAgent || '';
  const platformStr = (navigator.platform || '').toLowerCase();

  if (/iphone|ipad|ipod/i.test(ua) || (platformStr === 'macintel' && navigator.maxTouchPoints > 1)) {
    return {
      platform: 'ios',
      label: 'iOS (iPhone & iPad)',
      isMobile: true,
      appPackageName: 'calendar-q-ios-widget.html',
      appDownloadLabel: 'Install on iPhone / iPad',
      widgetLabel: 'iOS Home Screen Widget',
      installHint: 'Tap Share → Add to Home Screen in Safari to install the full-screen app.',
    };
  }

  if (/android/i.test(ua)) {
    return {
      platform: 'android',
      label: 'Android',
      isMobile: true,
      appPackageName: 'calendar-q-android-widget.html',
      appDownloadLabel: 'Install for Android',
      widgetLabel: 'Android Home Widget',
      installHint: 'Install natively via Chrome / Edge PWA or save the standalone mobile widget.',
    };
  }

  if (/win/i.test(platformStr) || /windows/i.test(ua)) {
    return {
      platform: 'windows',
      label: 'Windows Desktop',
      isMobile: false,
      appPackageName: 'calendar-q-windows-app.cmd',
      appDownloadLabel: 'Download for Windows',
      widgetLabel: 'Windows Desktop Widget',
      installHint: 'Install as a standalone desktop window or run the Windows app launcher.',
    };
  }

  if (/mac/i.test(platformStr) || /macintosh/i.test(ua)) {
    return {
      platform: 'macos',
      label: 'macOS Desktop',
      isMobile: false,
      appPackageName: 'calendar-q-macos-app.command',
      appDownloadLabel: 'Download for macOS',
      widgetLabel: 'macOS Desktop Widget',
      installHint: 'Install via browser App mode or double-click the macOS launcher.',
    };
  }

  return {
    platform: 'linux',
    label: 'Linux Desktop',
    isMobile: false,
    appPackageName: 'calendar-q.desktop',
    appDownloadLabel: 'Download for Linux',
    widgetLabel: 'Linux Desktop Widget',
    installHint: 'Place the .desktop launcher in ~/.local/share/applications or install as a PWA.',
  };
}

/**
 * Automatically detects the user's regional holiday calendar from their device timezone and locale.
 */
export function detectLocalHolidayRegion(): HolidayRegionCode {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lang = (typeof navigator !== 'undefined' ? navigator.language : '') || '';
    const upperLang = lang.toUpperCase();

    if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta' || upperLang.endsWith('-IN')) return 'IN';
    if (tz.startsWith('America/')) {
      if (
        tz.includes('Toronto') ||
        tz.includes('Vancouver') ||
        tz.includes('Montreal') ||
        tz.includes('Edmonton') ||
        tz.includes('Winnipeg') ||
        tz.includes('Halifax') ||
        upperLang.endsWith('-CA')
      ) {
        return 'CA';
      }
      return 'US';
    }
    if (tz === 'Europe/London' || upperLang.endsWith('-GB')) return 'GB';
    if (tz.startsWith('Australia/') || upperLang.endsWith('-AU')) return 'AU';
    if (tz === 'Asia/Tokyo' || upperLang.endsWith('-JP')) return 'JP';
    if (tz === 'Asia/Dubai' || upperLang.endsWith('-AE')) return 'AE';
    if (tz === 'Asia/Singapore' || upperLang.endsWith('-SG')) return 'SG';
    if (tz.startsWith('Europe/')) return 'EU';

    if (upperLang.endsWith('-US')) return 'US';
    if (upperLang.endsWith('-DE') || upperLang.endsWith('-FR') || upperLang.endsWith('-ES') || upperLang.endsWith('-IT')) return 'EU';
  } catch {
    // Fallback
  }
  return 'GLOBAL';
}

export function getRegionLabel(code: HolidayRegionCode): string {
  return HOLIDAY_REGIONS.find((r) => r.code === code)?.label || 'Global';
}

function triggerFileDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads an OS-specific native app launcher file for Desktop,
 * or a real OS Home Screen Widget script for iPhone / Android.
 */
export function downloadPlatformAppLauncher(platform: DevicePlatform, appOrigin: string) {
  const cleanOrigin = appOrigin.replace(/\/$/, '');
  const calUrl = `${cleanOrigin}/?open=calendar`;

  if (platform === 'macos') {
    const script = `#!/bin/bash
# calendar.q — macOS Desktop App Launcher
# Opens calendar.q in a dedicated standalone desktop window
URL="${calUrl}"
if [ -d "/Applications/Google Chrome.app" ]; then
  open -na "Google Chrome" --args --app="$URL" --window-size=1360,860
elif [ -d "/Applications/Microsoft Edge.app" ]; then
  open -na "Microsoft Edge" --args --app="$URL" --window-size=1360,860
elif [ -d "/Applications/Brave Browser.app" ]; then
  open -na "Brave Browser" --args --app="$URL" --window-size=1360,860
else
  open "$URL"
fi
`;
    triggerFileDownload('calendar-q-macos-app.command', script, 'text/plain;charset=utf-8');
    return;
  }

  if (platform === 'windows') {
    const script = `@echo off
REM calendar.q — Windows Desktop App Launcher
set URL=${calUrl}
where msedge >nul 2>nul
if %ERRORLEVEL%==0 (
  start "" msedge --app="%URL%" --window-size=1360,860
  exit /b
)
where chrome >nul 2>nul
if %ERRORLEVEL%==0 (
  start "" chrome --app="%URL%" --window-size=1360,860
  exit /b
)
start "" "%URL%"
`;
    triggerFileDownload('calendar-q-windows-app.cmd', script, 'text/plain;charset=utf-8');
    return;
  }

  if (platform === 'linux') {
    const desktopEntry = `[Desktop Entry]
Version=1.0
Type=Application
Name=calendar.q
Comment=Universal Calendar, World Clocks & Holidays
Exec=xdg-open ${calUrl}
Terminal=false
Categories=Office;Calendar;Utility;
StartupNotify=true
`;
    triggerFileDownload('calendar-q.desktop', desktopEntry, 'text/plain;charset=utf-8');
    return;
  }

  if (platform === 'ios') {
    downloadIosScriptableWidget(cleanOrigin);
    return;
  }

  // Android: standalone offline-capable widget launcher
  downloadStandaloneWidgetHtml('mobile', `${cleanOrigin}/?widget=mobile&embed=1`, calUrl);
}

/**
 * Downloads a real native iOS Home Screen & Lock Screen Widget script for Scriptable.
 * Users add this to their iPhone/iPad Home Screen (Small 2x2, Medium 4x2, or Large 4x4)
 * outside the browser and tap it anytime to launch calendar.q.
 */
export function downloadIosScriptableWidget(appOrigin: string) {
  const cleanOrigin = appOrigin.replace(/\/$/, '');
  const calUrl = `${cleanOrigin}/?open=calendar`;
  const script = `// calendar.q — Native iOS Home Screen Widget (for Scriptable)
// How to add to your iPhone / iPad Home Screen:
// 1. Install the free "Scriptable" app from the Apple App Store.
// 2. Open this file in Scriptable (or paste into a new script named "calendar.q").
// 3. Long-press your iPhone Home Screen -> tap "+" -> choose "Scriptable" -> pick Small, Medium, or Large.
// 4. Tap the widget -> Edit Widget -> set Script to "calendar.q".

const APP_URL = "${calUrl}";
const now = new Date();
const family = config.widgetFamily || "medium";

const w = new ListWidget();
w.url = APP_URL;
w.backgroundColor = new Color("#0D0D10");
w.setPadding(14, 16, 14, 16);

const weekdayFmt = new DateFormatter();
weekdayFmt.dateFormat = "EEEE";
const monthFmt = new DateFormatter();
monthFmt.dateFormat = "MMMM yyyy";

const topRow = w.addStack();
topRow.layoutHorizontally();
topRow.centerAlignContent();

const wd = topRow.addText(weekdayFmt.string(now).toUpperCase());
wd.font = Font.boldSystemFont(11);
wd.textColor = new Color("#F04422");

topRow.addSpacer();

const brand = topRow.addText("calendar.q");
brand.font = Font.semiboldSystemFont(11);
brand.textColor = new Color("#A1A1AA");

w.addSpacer(4);

const dateRow = w.addStack();
dateRow.layoutHorizontally();
dateRow.bottomAlignContent();

const dayNum = dateRow.addText(String(now.getDate()));
dayNum.font = Font.boldSystemFont(family === "small" ? 42 : 46);
dayNum.textColor = Color.white();

dateRow.addSpacer(10);

const metaCol = dateRow.addStack();
metaCol.layoutVertically();
const mLabel = metaCol.addText(monthFmt.string(now));
mLabel.font = Font.mediumSystemFont(13);
mLabel.textColor = new Color("#D4D4D8");

const sub = metaCol.addText("Tap to open full month");
sub.font = Font.regularSystemFont(11);
sub.textColor = new Color("#71717A");

if (family === "large") {
  w.addSpacer(12);
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const headerStack = w.addStack();
  headerStack.layoutHorizontally();
  for (const d of days) {
    const cell = headerStack.addStack();
    cell.size = new Size(38, 18);
    cell.centerAlignContent();
    const t = cell.addText(d);
    t.font = Font.boldSystemFont(10);
    t.textColor = new Color("#71717A");
  }
  const y = now.getFullYear(), m = now.getMonth(), todayD = now.getDate();
  const firstDow = new Date(y, m, 1).getDay();
  const totalDays = new Date(y, m + 1, 0).getDate();
  let cells = [];
  for (let i = 0; i < firstDow; i++) cells.push("");
  for (let d = 1; d <= totalDays; d++) cells.push(String(d));
  while (cells.length % 7 !== 0) cells.push("");
  for (let row = 0; row < cells.length; row += 7) {
    const rStack = w.addStack();
    rStack.layoutHorizontally();
    for (let col = 0; col < 7; col++) {
      const val = cells[row + col];
      const cell = rStack.addStack();
      cell.size = new Size(38, 22);
      cell.centerAlignContent();
      const t = cell.addText(val);
      t.font = val === String(todayD) ? Font.boldSystemFont(12) : Font.regularSystemFont(11);
      t.textColor = val === String(todayD) ? new Color("#F04422") : Color.white();
    }
  }
}

w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
if (config.runsInWidget) {
  Script.setWidget(w);
} else {
  w.presentMedium();
}
Script.complete();
`;
  triggerFileDownload('calendar-q-ios-widget.js', script, 'text/javascript;charset=utf-8');
}

/**
 * Downloads a floating desktop widget launcher (frameless compact desktop window)
 * for Windows, macOS, or Linux so the widget runs OUTSIDE the browser on the desktop.
 */
export function downloadFloatingDesktopWidget(
  platform: 'windows' | 'macos' | 'linux',
  appOrigin: string
) {
  const cleanOrigin = appOrigin.replace(/\/$/, '');
  const embedUrl = `${cleanOrigin}/?widget=desktop&embed=1`;

  if (platform === 'windows') {
    const cmd = `@echo off
REM calendar.q — Floating Windows Desktop Widget (380x480 chromeless window)
set URL=${embedUrl}
where msedge >nul 2>nul
if %ERRORLEVEL%==0 (
  start "" msedge --app="%URL%" --window-size=400,500 --window-position=40,40
  exit /b
)
where chrome >nul 2>nul
if %ERRORLEVEL%==0 (
  start "" chrome --app="%URL%" --window-size=400,500 --window-position=40,40
  exit /b
)
start "" "%URL%"
`;
    triggerFileDownload('calendar-q-windows-widget.cmd', cmd, 'text/plain;charset=utf-8');
    return;
  }

  if (platform === 'macos') {
    const cmd = `#!/bin/bash
# calendar.q — Floating macOS Desktop Widget (compact chromeless window)
URL="${embedUrl}"
if [ -d "/Applications/Google Chrome.app" ]; then
  open -na "Google Chrome" --args --app="$URL" --window-size=400,500 --window-position=40,60
elif [ -d "/Applications/Microsoft Edge.app" ]; then
  open -na "Microsoft Edge" --args --app="$URL" --window-size=400,500 --window-position=40,60
elif [ -d "/Applications/Brave Browser.app" ]; then
  open -na "Brave Browser" --args --app="$URL" --window-size=400,500 --window-position=40,60
else
  open "$URL"
fi
`;
    triggerFileDownload('calendar-q-macos-widget.command', cmd, 'text/plain;charset=utf-8');
    return;
  }

  const sh = `#!/usr/bin/env bash
# calendar.q — Floating Linux Desktop Widget
URL="${embedUrl}"
if command -v google-chrome >/dev/null 2>&1; then
  google-chrome --app="$URL" --window-size=400,500 &
elif command -v chromium >/dev/null 2>&1; then
  chromium --app="$URL" --window-size=400,500 &
else
  xdg-open "$URL" &
fi
`;
  triggerFileDownload('calendar-q-linux-widget.sh', sh, 'text/plain;charset=utf-8');
}

/**
 * Generates and downloads a crisp self-contained Desktop or Mobile Widget HTML file
 * that works offline, shows live clock, month calendar, local date, and opens calendar.q.
 */
export function downloadStandaloneWidgetHtml(
  mode: 'desktop' | 'mobile',
  widgetLiveUrl: string,
  appUrl: string
) {
  const isMobile = mode === 'mobile';
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>calendar.q — ${isMobile ? 'Mobile' : 'Desktop'} Widget</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Segoe UI", Roboto, sans-serif;
    background: #F5F5F4;
    color: #171717;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${isMobile ? '16px' : '24px'};
  }
  .widget {
    width: ${isMobile ? '100%' : '360px'};
    max-width: 390px;
    background: #FFFFFF;
    border: 1px solid #E5E5E5;
    border-radius: 22px;
    padding: 20px;
    box-shadow: 0 14px 36px rgba(0,0,0,0.08);
  }
  .top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; }
  .brand { font-weight: 700; font-size: 14px; letter-spacing: -0.02em; }
  .brand span { color: #DC2626; }
  .clock { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; color: #525252; font-variant-numeric: tabular-nums; }
  .hero { display: flex; align-items: flex-end; justify-content: space-between; padding-bottom: 14px; border-bottom: 1px solid #F0F0F0; margin-bottom: 14px; }
  .day-num { font-size: 46px; font-weight: 700; line-height: 1; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; }
  .meta { text-align: right; }
  .weekday { font-size: 13px; font-weight: 600; color: #DC2626; text-transform: uppercase; letter-spacing: 0.06em; }
  .month-year { font-size: 13px; color: #525252; margin-top: 2px; }
  .grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; font-size: 11px; margin-bottom: 16px; }
  .dow { color: #A3A3A3; font-weight: 600; padding-bottom: 4px; }
  .cell { padding: 6px 0; border-radius: 8px; font-variant-numeric: tabular-nums; color: #262626; }
  .cell.muted { color: #D4D4D4; }
  .cell.today { background: #171717; color: #FFFFFF; font-weight: 700; }
  .actions { display: flex; gap: 8px; }
  .btn { flex: 1; text-align: center; text-decoration: none; padding: 10px 12px; border-radius: 10px; font-size: 12px; font-weight: 600; }
  .btn-primary { background: #171717; color: #FFFFFF; }
  .btn-secondary { background: #F5F5F5; color: #262626; border: 1px solid #E5E5E5; }
</style>
</head>
<body>
  <div class="widget">
    <div class="top">
      <div class="brand">calendar<span>.q</span></div>
      <div class="clock" id="clock">--:--</div>
    </div>
    <div class="hero">
      <div class="day-num" id="dayNum">--</div>
      <div class="meta">
        <div class="weekday" id="weekday">---</div>
        <div class="month-year" id="monthYear">---</div>
      </div>
    </div>
    <div class="grid" id="grid"></div>
    <div class="actions">
      <a class="btn btn-primary" href="${appUrl}" target="_blank" rel="noopener">Open Full Calendar</a>
      <a class="btn btn-secondary" href="${widgetLiveUrl}" target="_blank" rel="noopener">Live Widget</a>
    </div>
  </div>
<script>
function render() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.getElementById('dayNum').textContent = String(now.getDate());
  document.getElementById('weekday').textContent = now.toLocaleDateString([], { weekday: 'long' });
  document.getElementById('monthYear').textContent = now.toLocaleDateString([], { month: 'long', year: 'numeric' });
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  ['S','M','T','W','T','F','S'].forEach(d => {
    const el = document.createElement('div');
    el.className = 'dow';
    el.textContent = d;
    grid.appendChild(el);
  });
  const y = now.getFullYear(), m = now.getMonth(), today = now.getDate();
  const firstDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();
  for (let i = firstDow - 1; i >= 0; i--) {
    const el = document.createElement('div');
    el.className = 'cell muted';
    el.textContent = String(prevDays - i);
    grid.appendChild(el);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const el = document.createElement('div');
    el.className = 'cell' + (d === today ? ' today' : '');
    el.textContent = String(d);
    grid.appendChild(el);
  }
}
render();
setInterval(render, 1000);
</script>
</body>
</html>`;
  triggerFileDownload(
    isMobile ? 'calendar-q-mobile-widget.html' : 'calendar-q-desktop-widget.html',
    html,
    'text/html;charset=utf-8'
  );
}
