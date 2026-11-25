export interface WorldCity {
  id: string;
  name: string;
  country: string;
  timezone: string;
  flag: string;
}

export const PRESET_WORLD_CITIES: WorldCity[] = [
  { id: 'mumbai', name: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata', flag: '🇮🇳' },
  { id: 'newyork', name: 'New York', country: 'United States', timezone: 'America/New_York', flag: '🇺🇸' },
  { id: 'london', name: 'London', country: 'United Kingdom', timezone: 'Europe/London', flag: '🇬🇧' },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo', flag: '🇯🇵' },
  { id: 'sanfrancisco', name: 'San Francisco', country: 'United States', timezone: 'America/Los_Angeles', flag: '🇺🇸' },
  { id: 'dubai', name: 'Dubai', country: 'UAE', timezone: 'Asia/Dubai', flag: '🇦🇪' },
  { id: 'paris', name: 'Paris', country: 'France', timezone: 'Europe/Paris', flag: '🇫🇷' },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore', flag: '🇸🇬' },
  { id: 'sydney', name: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney', flag: '🇦🇺' },
  { id: 'berlin', name: 'Berlin', country: 'Germany', timezone: 'Europe/Berlin', flag: '🇩🇪' },
  { id: 'toronto', name: 'Toronto', country: 'Canada', timezone: 'America/Toronto', flag: '🇨🇦' },
  { id: 'hongkong', name: 'Hong Kong', country: 'China', timezone: 'Asia/Hong_Kong', flag: '🇭🇰' },
];

export interface CityTimeInfo {
  city: WorldCity;
  timeString: string;
  time24String: string;
  timeShortString: string;
  ampm: string;
  dateString: string;
  tzAbbr: string;
  utcOffsetMinutes: number;
  utcOffsetString: string;
  isDaytime: boolean;
  isBusinessHours: boolean; // 9:00 - 18:00
  hour24: number;
  minute: number;
  dayOffset: number; // -1, 0, +1 day relative to UTC/local
}

export function getCityTimeInfo(city: WorldCity, referenceDate = new Date()): CityTimeInfo {
  // Extract time parts in target timezone
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: city.timezone,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
  });

  const dtf24 = new Intl.DateTimeFormat('en-US', {
    timeZone: city.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const dtfDate = new Intl.DateTimeFormat('en-US', {
    timeZone: city.timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const dtfTz = new Intl.DateTimeFormat('en-US', {
    timeZone: city.timezone,
    timeZoneName: 'short',
  });

  // Calculate UTC offset
  const partsTz = dtfTz.formatToParts(referenceDate);
  const tzAbbr = partsTz.find((p) => p.type === 'timeZoneName')?.value || city.timezone;

  // Exact UTC offset in minutes
  const utcDate = new Date(referenceDate.toLocaleString('en-US', { timeZone: 'UTC' }));
  const cityDate = new Date(referenceDate.toLocaleString('en-US', { timeZone: city.timezone }));
  const diffMinutes = Math.round((cityDate.getTime() - utcDate.getTime()) / 60000);

  const sign = diffMinutes >= 0 ? '+' : '-';
  const absHours = Math.floor(Math.abs(diffMinutes) / 60);
  const absMins = Math.abs(diffMinutes) % 60;
  const utcOffsetString =
    absMins === 0 ? `UTC${sign}${absHours}` : `UTC${sign}${absHours}:${String(absMins).padStart(2, '0')}`;

  const hour24 = cityDate.getHours();
  const minute = cityDate.getMinutes();
  const isDaytime = hour24 >= 6 && hour24 < 18;
  const isBusinessHours = hour24 >= 9 && hour24 < 18;

  // Day offset compared to local user date
  const localDay = referenceDate.getDate();
  const targetDay = cityDate.getDate();
  let dayOffset = 0;
  if (targetDay > localDay || (localDay >= 28 && targetDay === 1)) {
    dayOffset = 1;
  } else if (targetDay < localDay || (targetDay >= 28 && localDay === 1)) {
    dayOffset = -1;
  }

  const hour12 = hour24 % 12 || 12;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  const timeShortString = `${hour12}:${String(minute).padStart(2, '0')}`;

  return {
    city,
    timeString: dtf.format(referenceDate),
    time24String: dtf24.format(referenceDate),
    timeShortString,
    ampm,
    dateString: dtfDate.format(referenceDate),
    tzAbbr,
    utcOffsetMinutes: diffMinutes,
    utcOffsetString,
    isDaytime,
    isBusinessHours,
    hour24,
    minute,
    dayOffset,
  };
}

export interface OverlapSlot {
  utcHour: number;
  isCommonBusinessHour: boolean;
  cityTimes: Array<{
    cityId: string;
    localHour: number;
    formattedTime: string;
    isBusinessHour: boolean;
    dayOffset: number;
  }>;
}

/**
 * Computes meeting overlap for multiple selected cities across the 24 hours of UTC.
 */
export function calculateMeetingOverlap(cities: WorldCity[]): {
  slots: OverlapSlot[];
  bestWindows: string[];
  maxCommonHours: number;
} {
  if (cities.length === 0) return { slots: [], bestWindows: [], maxCommonHours: 0 };

  const now = new Date();
  const slots: OverlapSlot[] = [];

  for (let utcHour = 0; utcHour < 24; utcHour++) {
    const testUtcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), utcHour, 0, 0));

    let commonBusiness = true;
    const cityTimes = cities.map((c) => {
      const cityDate = new Date(testUtcDate.toLocaleString('en-US', { timeZone: c.timezone }));
      const h = cityDate.getHours();
      const isBiz = h >= 9 && h < 18;
      if (!isBiz) commonBusiness = false;
      const formatted = `${h % 12 || 12}:00 ${h >= 12 ? 'PM' : 'AM'}`;
      const dayOffset = cityDate.getDate() > testUtcDate.getUTCDate() ? 1 : cityDate.getDate() < testUtcDate.getUTCDate() ? -1 : 0;
      return {
        cityId: c.id,
        localHour: h,
        formattedTime: formatted,
        isBusinessHour: isBiz,
        dayOffset,
      };
    });

    slots.push({
      utcHour,
      isCommonBusinessHour: commonBusiness,
      cityTimes,
    });
  }

  // Find contiguous best windows of common business hours
  const bestWindows: string[] = [];
  let inWindow = false;
  let winStart = 0;

  for (let i = 0; i <= 24; i++) {
    const isCommon = i < 24 && slots[i].isCommonBusinessHour;
    if (isCommon && !inWindow) {
      inWindow = true;
      winStart = i;
    } else if (!isCommon && inWindow) {
      inWindow = false;
      bestWindows.push(`${winStart}:00 – ${i}:00 UTC`);
    }
  }

  const commonCount = slots.filter((s) => s.isCommonBusinessHour).length;

  return {
    slots,
    bestWindows,
    maxCommonHours: commonCount,
  };
}
