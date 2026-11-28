export type DevicePlatform = 'macos' | 'windows' | 'linux' | 'ios' | 'android';

export interface DeviceInfo {
  platform: DevicePlatform;
  label: string;
  isMobile: boolean;
  appPackageName: string;
  appDownloadLabel: string;
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
      installHint: 'Install directly as a standalone desktop app.',
    };
  }

  const ua = navigator.userAgent || '';
  const platformStr = (navigator.platform || '').toLowerCase();

  if (/iphone|ipad|ipod/i.test(ua) || (platformStr === 'macintel' && navigator.maxTouchPoints > 1)) {
    return {
      platform: 'ios',
      label: 'iOS (iPhone & iPad)',
      isMobile: true,
      appPackageName: 'calendar-q-ios',
      appDownloadLabel: 'Install on iPhone / iPad',
      installHint: 'Tap Share → Add to Home Screen in Safari to install the full-screen app.',
    };
  }

  if (/android/i.test(ua)) {
    return {
      platform: 'android',
      label: 'Android',
      isMobile: true,
      appPackageName: 'calendar-q-android',
      appDownloadLabel: 'Install for Android',
      installHint: 'Install natively via Chrome / Edge PWA to your Home Screen.',
    };
  }

  if (/win/i.test(platformStr) || /windows/i.test(ua)) {
    return {
      platform: 'windows',
      label: 'Windows Desktop',
      isMobile: false,
      appPackageName: 'calendar-q-windows-app.cmd',
      appDownloadLabel: 'Download for Windows',
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
      installHint: 'Install via browser App mode or double-click the macOS launcher.',
    };
  }

  return {
    platform: 'linux',
    label: 'Linux Desktop',
    isMobile: false,
    appPackageName: 'calendar-q.desktop',
    appDownloadLabel: 'Download for Linux',
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
 * Generates and downloads an OS-specific native app launcher file for Desktop.
 */
export function downloadPlatformAppLauncher(platform: DevicePlatform, appOrigin: string) {
  const cleanOrigin = appOrigin.replace(/\/$/, '');
  const calUrl = `${cleanOrigin}/?open=calendar`;

  if (platform === 'macos') {
    const script = `#!/bin/bash
# calendar.q — macOS Desktop App Launcher
# Opens calendar.q in a dedicated standalone desktop window (zero browser tabs)
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
    const iconUrl = `${cleanOrigin}/favicon.ico`;
    const script = `@echo off
setlocal
REM Calander.Q — Windows Standalone Desktop App Installer & Launcher
set "URL=${calUrl}"
set "ICON_URL=${iconUrl}"
set "APP_DIR=%LocalAppData%\\Calander.Q"
set "ICON_PATH=%APP_DIR%\\calander-q.ico"
set "BROWSER_EXE="

if not exist "%APP_DIR%" mkdir "%APP_DIR%" >nul 2>nul
if not exist "%ICON_PATH%" (
  where curl.exe >nul 2>nul && curl.exe -fsSL "%ICON_URL%" -o "%ICON_PATH%" >nul 2>nul
)
if not exist "%ICON_PATH%" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -Uri '%ICON_URL%' -OutFile '%ICON_PATH%' -UseBasicParsing } catch {}" >nul 2>nul
)

for %%B in (
  "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"
  "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"
  "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
  "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
  "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe"
  "%ProgramFiles%\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  "%ProgramFiles(x86)%\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  "%LocalAppData%\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
) do (
  if not defined BROWSER_EXE if exist %%B set "BROWSER_EXE=%%~B"
)

if not defined BROWSER_EXE (
  for %%N in (msedge.exe chrome.exe brave.exe) do (
    if not defined BROWSER_EXE (
      for /f "delims=" %%P in ('where %%N 2^>nul') do (
        if not defined BROWSER_EXE set "BROWSER_EXE=%%P"
      )
    )
  )
)

if defined BROWSER_EXE (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; foreach ($dir in @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'))) { if ($dir) { $lnk = $ws.CreateShortcut((Join-Path $dir 'Calander.Q.lnk')); $lnk.TargetPath = '%BROWSER_EXE%'; $lnk.Arguments = '--app=\"%URL%\" --window-size=1360,860'; $lnk.WorkingDirectory = '%APP_DIR%'; $lnk.Description = 'Calander.Q — Universal Calendar'; if (Test-Path '%ICON_PATH%') { $lnk.IconLocation = '%ICON_PATH%,0' }; $lnk.Save() } }" >nul 2>nul
  start "" "%BROWSER_EXE%" --app="%URL%" --window-size=1360,860
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
Name=Calander.Q
Comment=Universal Calendar, World Clocks & Holidays
Icon=x-office-calendar
Exec=sh -c 'for b in google-chrome microsoft-edge brave-browser chromium chromium-browser; do if command -v "$b" >/dev/null 2>&1; then exec "$b" --app="${calUrl}" --window-size=1360,860; fi; done; exec xdg-open "${calUrl}"'
Terminal=false
Categories=Office;Calendar;Utility;
StartupNotify=true
`;
    triggerFileDownload('calendar-q.desktop', desktopEntry, 'text/plain;charset=utf-8');
    return;
  }
}
