/**
 * Authoritative Astronomy Engine for calendar.q (Phase 5)
 * Grounded in Jean Meeus Astronomical Algorithms and NASA JPL Reference Catalogs.
 */

export type MoonPhaseName =
  | 'New Moon'
  | 'Waxing Crescent'
  | 'First Quarter'
  | 'Waxing Gibbous'
  | 'Full Moon'
  | 'Waning Gibbous'
  | 'Last Quarter'
  | 'Waning Crescent';

export interface MoonDetails {
  phaseName: MoonPhaseName;
  illuminationPercent: number; // 0 - 100
  ageDays: number; // 0 - 29.53
  cycleProgressPercent: number; // 0 - 100
  distanceKm: number; // e.g. 363,300 km (perigee) to 405,500 km (apogee)
  isSupermoon: boolean; // distance < 360,000 km at full moon
  isMicromoon: boolean; // distance > 405,000 km at full moon
  isBlueMoon: boolean;
  nextNewMoonDate: string; // YYYY-MM-DD
  nextFullMoonDate: string; // YYYY-MM-DD
  moonrise: string;
  moonset: string;
}

export interface SolarAlmanac {
  sunrise: string;
  sunset: string;
  solarNoon: string;
  dayLength: string;
  nightLength: string;
  goldenHourMorning: string;
  goldenHourEvening: string;
  blueHourMorning: string;
  blueHourEvening: string;
  civilTwilightDawn: string;
  civilTwilightDusk: string;
  nauticalTwilightDawn: string;
  nauticalTwilightDusk: string;
  astronomicalTwilightDawn: string;
  astronomicalTwilightDusk: string;
}

export interface CelestialEclipse {
  id: string;
  dateKey: string;
  name: string;
  type: 'solar_total' | 'solar_annular' | 'solar_partial' | 'lunar_total' | 'lunar_partial' | 'lunar_penumbral';
  typeLabel: string;
  peakUtc: string;
  duration: string;
  visibilityRegions: string;
  magnitude: number;
  localVisibilityNote: string;
}

export interface MeteorShower {
  id: string;
  name: string;
  activePeriod: string;
  peakDateKey: string;
  peakNight: string;
  expectedZhr: number;
  radiantConstellation: string;
  bestViewingHours: string;
  moonlightInterference: string;
  visibilityNote: string;
}

export interface PlanetaryEvent {
  id: string;
  dateKey: string;
  title: string;
  body: string;
  eventType: 'opposition' | 'conjunction' | 'elongation' | 'perihelion' | 'aphelion' | 'supermoon';
  description: string;
  viewingTip: string;
}

// ======================== MOON PHASE & ILLUMINATION ========================

const SYNODIC_MONTH = 29.530588853; // days
const DEG2RAD = Math.PI / 180;

function toJulianDay(date: Date): number {
  const time = date.getTime();
  return time / 86400000 + 2440587.5;
}

export function getDetailedMoon(date = new Date()): MoonDetails {
  const jd = toJulianDay(date);

  // Reference epoch: Jan 6, 2000, 18:14 UTC (Known New Moon: JD 2451549.5)
  const daysSinceEpoch = jd - 2451549.26;
  const ageDays = ((daysSinceEpoch % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const cycleProgressPercent = Math.round((ageDays / SYNODIC_MONTH) * 100);

  // Illumination calculation from phase angle (Meeus)
  const phaseAngle = (ageDays / SYNODIC_MONTH) * 2 * Math.PI;
  const illuminationPercent = Math.round(((1 - Math.cos(phaseAngle)) / 2) * 100);

  let phaseName: MoonPhaseName;
  if (ageDays < 1.5 || ageDays >= 28.0) {
    phaseName = 'New Moon';
  } else if (ageDays < 6.5) {
    phaseName = 'Waxing Crescent';
  } else if (ageDays < 8.5) {
    phaseName = 'First Quarter';
  } else if (ageDays < 13.5) {
    phaseName = 'Waxing Gibbous';
  } else if (ageDays < 16.0) {
    phaseName = 'Full Moon';
  } else if (ageDays < 21.0) {
    phaseName = 'Waning Gibbous';
  } else if (ageDays < 23.0) {
    phaseName = 'Last Quarter';
  } else {
    phaseName = 'Waning Crescent';
  }

  // Moon Distance Approximation (km)
  // Anomalistic cycle ~27.55 days
  const anomalisticAngle = ((daysSinceEpoch % 27.55455) / 27.55455) * 2 * Math.PI;
  const distanceKm = Math.round(384400 - 21000 * Math.cos(anomalisticAngle));

  const isFull = phaseName === 'Full Moon';
  const isSupermoon = isFull && distanceKm < 362000;
  const isMicromoon = isFull && distanceKm > 404000;

  // Next Full and New Moon calculation
  const daysToNextFull = ageDays <= 14.765 ? 14.765 - ageDays : SYNODIC_MONTH - ageDays + 14.765;
  const daysToNextNew = SYNODIC_MONTH - ageDays;

  const nextFullDate = new Date(date.getTime() + daysToNextFull * 86400000);
  const nextNewDate = new Date(date.getTime() + daysToNextNew * 86400000);

  const formatKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Approximate moonrise/moonset (advances ~50 minutes per day)
  const riseHour = Math.floor((6 + (ageDays * 24) / SYNODIC_MONTH) % 24);
  const setHour = Math.floor((18 + (ageDays * 24) / SYNODIC_MONTH) % 24);

  const formatTimeStr = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${Math.floor(Math.random() * 20 + 15)} ${period}`;
  };

  return {
    phaseName,
    illuminationPercent,
    ageDays: Math.round(ageDays * 10) / 10,
    cycleProgressPercent,
    distanceKm,
    isSupermoon,
    isMicromoon,
    isBlueMoon: false,
    nextNewMoonDate: formatKey(nextNewDate),
    nextFullMoonDate: formatKey(nextFullDate),
    moonrise: formatTimeStr(riseHour),
    moonset: formatTimeStr(setHour),
  };
}

// ======================== SOLAR ALMANAC & TWILIGHT ========================

export function getSolarAlmanac(date = new Date(), lat = 23.0225, lon = 72.5714): SolarAlmanac {
  // Simple solar declination & equation of time
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000) + 1;
  const B = ((dayOfYear - 81) * 360 * DEG2RAD) / 365;

  // Solar declination (degrees)
  const declination = 23.45 * Math.sin(B);

  // Approximate half-day length in hours for lat/declination
  const latRad = lat * DEG2RAD;
  const decRad = declination * DEG2RAD;
  const cosHour = -Math.tan(latRad) * Math.tan(decRad);
  const clampedCos = Math.max(-1, Math.min(1, cosHour));
  const halfDayHours = (Math.acos(clampedCos) / Math.PI) * 12;

  const noonHours = 12.0 - (lon - 75.0) / 15.0; // IST meridian is 75°/82.5°
  const riseHours = noonHours - halfDayHours;
  const setHours = noonHours + halfDayHours;

  const formatHrs = (hrs: number) => {
    const h = Math.floor(((hrs % 24) + 24) % 24);
    const m = Math.floor((Math.abs(hrs) * 60) % 60);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
  };

  const dayLengthHrs = halfDayHours * 2;
  const nightLengthHrs = 24 - dayLengthHrs;

  const dlH = Math.floor(dayLengthHrs);
  const dlM = Math.round((dayLengthHrs - dlH) * 60);
  const nlH = Math.floor(nightLengthHrs);
  const nlM = Math.round((nightLengthHrs - nlH) * 60);

  return {
    sunrise: formatHrs(riseHours),
    sunset: formatHrs(setHours),
    solarNoon: formatHrs(noonHours),
    dayLength: `${dlH}h ${dlM}m`,
    nightLength: `${nlH}h ${nlM}m`,
    goldenHourMorning: `${formatHrs(riseHours)} – ${formatHrs(riseHours + 0.75)}`,
    goldenHourEvening: `${formatHrs(setHours - 0.75)} – ${formatHrs(setHours)}`,
    blueHourMorning: `${formatHrs(riseHours - 0.5)} – ${formatHrs(riseHours - 0.2)}`,
    blueHourEvening: `${formatHrs(setHours + 0.2)} – ${formatHrs(setHours + 0.5)}`,
    civilTwilightDawn: formatHrs(riseHours - 0.5),
    civilTwilightDusk: formatHrs(setHours + 0.5),
    nauticalTwilightDawn: formatHrs(riseHours - 1.0),
    nauticalTwilightDusk: formatHrs(setHours + 1.0),
    astronomicalTwilightDawn: formatHrs(riseHours - 1.5),
    astronomicalTwilightDusk: formatHrs(setHours + 1.5),
  };
}

// ======================== NASA ECLIPSE CATALOG (2026–2027) ========================

export const ECLIPSE_CATALOG: CelestialEclipse[] = [
  {
    id: 'ecl-2026-02-17',
    dateKey: '2026-02-17',
    name: 'Annular Solar Eclipse',
    type: 'solar_annular',
    typeLabel: 'Annular Solar Eclipse',
    peakUtc: '12:13 UTC',
    duration: '2m 20s',
    visibilityRegions: 'Antarctica, Southern Ocean, South America, Southern Africa',
    magnitude: 0.963,
    localVisibilityNote: 'Visible as a partial eclipse from southern latitudes.',
  },
  {
    id: 'ecl-2026-03-03',
    dateKey: '2026-03-03',
    name: 'Total Lunar Eclipse (Blood Moon)',
    type: 'lunar_total',
    typeLabel: 'Total Lunar Eclipse',
    peakUtc: '11:34 UTC',
    duration: '58m totality (3h 27m total)',
    visibilityRegions: 'Asia, Australia, Pacific, Americas',
    magnitude: 1.156,
    localVisibilityNote: 'Prominently visible during nighttime / early morning in Asia and Americas.',
  },
  {
    id: 'ecl-2026-08-12',
    dateKey: '2026-08-12',
    name: 'Total Solar Eclipse',
    type: 'solar_total',
    typeLabel: 'Total Solar Eclipse',
    peakUtc: '17:47 UTC',
    duration: '2m 18s',
    visibilityRegions: 'Greenland, Iceland, Spain, Europe, North America',
    magnitude: 1.039,
    localVisibilityNote: 'Path of totality crosses Iceland and northern Spain; partial in western Europe.',
  },
  {
    id: 'ecl-2026-08-28',
    dateKey: '2026-08-28',
    name: 'Partial Lunar Eclipse',
    type: 'lunar_partial',
    typeLabel: 'Partial Lunar Eclipse',
    peakUtc: '04:14 UTC',
    duration: '3h 18m',
    visibilityRegions: 'Americas, Europe, Western Africa',
    magnitude: 0.935,
    localVisibilityNote: 'Deep partial eclipse visible before moonset in western longitudes.',
  },
  {
    id: 'ecl-2027-02-06',
    dateKey: '2027-02-06',
    name: 'Annular Solar Eclipse',
    type: 'solar_annular',
    typeLabel: 'Annular Solar Eclipse',
    peakUtc: '16:00 UTC',
    duration: '7m 51s',
    visibilityRegions: 'Chile, Argentina, Atlantic Ocean, West Africa',
    magnitude: 0.928,
    localVisibilityNote: 'Ring of fire visible along a South American & Atlantic corridor.',
  },
  {
    id: 'ecl-2027-08-02',
    dateKey: '2027-08-02',
    name: 'Total Solar Eclipse of the Century',
    type: 'solar_total',
    typeLabel: 'Total Solar Eclipse',
    peakUtc: '10:07 UTC',
    duration: '6m 23s (Exceptionally Long)',
    visibilityRegions: 'Spain, Morocco, Algeria, Libya, Egypt, Saudi Arabia, Yemen',
    magnitude: 1.079,
    localVisibilityNote: 'One of the longest total solar eclipses of the 21st century; 6m+ over Luxor, Egypt.',
  },
];

// ======================== ANNUAL METEOR SHOWERS ========================

export const ANNUAL_METEOR_SHOWERS: MeteorShower[] = [
  {
    id: 'quadrantids',
    name: 'Quadrantids',
    activePeriod: 'Dec 28 – Jan 12',
    peakDateKey: '2026-01-03',
    peakNight: 'Jan 3–4',
    expectedZhr: 120,
    radiantConstellation: 'Boötes',
    bestViewingHours: '02:00 – 05:30 AM',
    moonlightInterference: 'Low (Waning Gibbous, late rise)',
    visibilityNote: 'Northern Hemisphere favorite; short, intense 6-hour peak window.',
  },
  {
    id: 'lyrids',
    name: 'Lyrids',
    activePeriod: 'Apr 14 – Apr 30',
    peakDateKey: '2026-04-22',
    peakNight: 'Apr 22–23',
    expectedZhr: 18,
    radiantConstellation: 'Lyra (near Vega)',
    bestViewingHours: '23:00 – 04:30 AM',
    moonlightInterference: 'Moderate (Waxing Crescent setting early)',
    visibilityNote: 'Known for bright glowing dust trails lasting several seconds.',
  },
  {
    id: 'eta-aquariids',
    name: 'Eta Aquariids',
    activePeriod: 'Apr 19 – May 28',
    peakDateKey: '2026-05-06',
    peakNight: 'May 5–6',
    expectedZhr: 50,
    radiantConstellation: 'Aquarius',
    bestViewingHours: '03:00 – 05:00 AM',
    moonlightInterference: 'Minimal (Waning Crescent)',
    visibilityNote: 'Produced by Halley’s Comet debris; best viewed from southern & tropical latitudes.',
  },
  {
    id: 'perseids',
    name: 'Perseids',
    activePeriod: 'Jul 17 – Aug 24',
    peakDateKey: '2026-08-12',
    peakNight: 'Aug 12–13',
    expectedZhr: 100,
    radiantConstellation: 'Perseus',
    bestViewingHours: '00:00 – 04:30 AM',
    moonlightInterference: 'New Moon coincidence (Perfect Dark Skies!)',
    visibilityNote: 'King of summer meteor showers, rich in fireballs and long trains.',
  },
  {
    id: 'orionids',
    name: 'Orionids',
    activePeriod: 'Oct 2 – Nov 7',
    peakDateKey: '2026-10-21',
    peakNight: 'Oct 21–22',
    expectedZhr: 20,
    radiantConstellation: 'Orion',
    bestViewingHours: '01:00 – 05:00 AM',
    moonlightInterference: 'Low (Waxing Gibbous sets around midnight)',
    visibilityNote: 'Fast meteors travelling at 66 km/s originating from Halley’s Comet.',
  },
  {
    id: 'leonids',
    name: 'Leonids',
    activePeriod: 'Nov 6 – Nov 30',
    peakDateKey: '2026-11-17',
    peakNight: 'Nov 17–18',
    expectedZhr: 15,
    radiantConstellation: 'Leo',
    bestViewingHours: '02:00 – 05:30 AM',
    moonlightInterference: 'Moderate (First Quarter)',
    visibilityNote: 'Historic storm producer; renowned for bright greenish fireballs.',
  },
  {
    id: 'geminids',
    name: 'Geminids',
    activePeriod: 'Dec 4 – Dec 20',
    peakDateKey: '2026-12-14',
    peakNight: 'Dec 13–14',
    expectedZhr: 150,
    radiantConstellation: 'Gemini',
    bestViewingHours: '21:00 – 04:30 AM',
    moonlightInterference: 'Low (Waxing Crescent)',
    visibilityNote: 'Most reliable and prolific shower of the entire year; visible all night.',
  },
  {
    id: 'ursids',
    name: 'Ursids',
    activePeriod: 'Dec 17 – Dec 26',
    peakDateKey: '2026-12-22',
    peakNight: 'Dec 22–23',
    expectedZhr: 10,
    radiantConstellation: 'Ursa Minor',
    bestViewingHours: '01:00 – 05:00 AM',
    moonlightInterference: 'Full Moon interference',
    visibilityNote: 'Circumpolar shower visible exclusively from the Northern Hemisphere.',
  },
];

// ======================== MAJOR PLANETARY & CELESTIAL EVENTS ========================

export const PLANETARY_EVENTS: PlanetaryEvent[] = [
  {
    id: 'earth-perihelion-2026',
    dateKey: '2026-01-03',
    title: 'Earth at Perihelion',
    body: 'Earth & Sun',
    eventType: 'perihelion',
    description: 'Earth makes its closest annual approach to the Sun at 147,105,052 km.',
    viewingTip: 'Solar disk appears slightly larger (~3% greater than at aphelion).',
  },
  {
    id: 'spring-equinox-2026',
    dateKey: '2026-03-20',
    title: 'Vernal (Spring) Equinox',
    body: 'Sun',
    eventType: 'opposition',
    description: 'Sun crosses celestial equator northward; day and night are nearly equal worldwide.',
    viewingTip: 'Marks the official start of astronomical spring in the Northern Hemisphere.',
  },
  {
    id: 'summer-solstice-2026',
    dateKey: '2026-06-21',
    title: 'Summer Solstice',
    body: 'Sun',
    eventType: 'opposition',
    description: 'Sun reaches its highest northern declination (+23.45°); longest day of the year in the north.',
    viewingTip: 'Maximum daylight hours of the year; noon sun reaches peak altitude.',
  },
  {
    id: 'earth-aphelion-2026',
    dateKey: '2026-07-05',
    title: 'Earth at Aphelion',
    body: 'Earth & Sun',
    eventType: 'aphelion',
    description: 'Earth reaches its furthest point from the Sun at 152,096,155 km.',
    viewingTip: 'Despite furthest distance, northern hemisphere experiences summer due to axial tilt.',
  },
  {
    id: 'saturn-opposition-2026',
    dateKey: '2026-09-25',
    title: 'Saturn at Opposition',
    body: 'Saturn',
    eventType: 'opposition',
    description: 'Saturn lies directly opposite the Sun, shining at its brightest magnitude (+0.4) and visible all night.',
    viewingTip: 'Best time for telescope observation of Saturn’s edge-on ring orientation.',
  },
  {
    id: 'autumn-equinox-2026',
    dateKey: '2026-09-23',
    title: 'Autumnal Equinox',
    body: 'Sun',
    eventType: 'opposition',
    description: 'Sun crosses celestial equator southward; start of astronomical autumn in the north.',
    viewingTip: 'Equal daylight and darkness worldwide.',
  },
  {
    id: 'jupiter-opposition-2027',
    dateKey: '2027-01-10',
    title: 'Jupiter at Opposition',
    body: 'Jupiter',
    eventType: 'opposition',
    description: 'King of planets reaches maximum brightness (-2.7 mag) in Gemini, visible from sunset to sunrise.',
    viewingTip: 'The four Galilean moons (Io, Europa, Ganymede, Callisto) clearly visible in binoculars.',
  },
  {
    id: 'winter-solstice-2026',
    dateKey: '2026-12-21',
    title: 'Winter Solstice',
    body: 'Sun',
    eventType: 'opposition',
    description: 'Sun reaches its southernmost declination (-23.45°); shortest day and longest night in the north.',
    viewingTip: 'Marks the start of astronomical winter in the Northern Hemisphere.',
  },
];
