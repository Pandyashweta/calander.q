import {
  WorldCalendarDateValue,
  WorldCalendarGroupId,
  WorldCalendarSystemId,
  WorldCalendarSystemMeta,
} from '../types/calendar';
import { getGujaratiPanchang } from './gujaratiPanchang';
import { DAY_NAMES_SHORT, MONTH_NAMES } from '../utils/dateUtils';

export const WORLD_CALENDAR_GROUPS: Array<{
  id: WorldCalendarGroupId;
  label: string;
}> = [
  { id: 'indian', label: 'Indian Calendars' },
  { id: 'religious', label: 'Religious & Middle Eastern' },
  { id: 'asian', label: 'East & Southeast Asian' },
  { id: 'historical', label: 'Western & Historical' },
];

export const MASTER_REFERENCE_LINKS = [
  {
    label: 'List of all calendars (Wikipedia)',
    url: 'https://en.wikipedia.org/wiki/List_of_calendars',
  },
  {
    label: 'Fourmilab Calendar Converter',
    url: 'https://www.fourmilab.ch/documents/calendar/',
  },
  {
    label: 'timeanddate.com Calendars',
    url: 'https://www.timeanddate.com/calendar/',
  },
  {
    label: 'Drik Panchang',
    url: 'https://www.drikpanchang.com',
  },
  {
    label: 'Hebcal Jewish Calendar',
    url: 'https://www.hebcal.com',
  },
];

export const WORLD_CALENDAR_SYSTEMS: WorldCalendarSystemMeta[] = [
  // Indian Calendars
  {
    id: 'gujarati-vikram',
    name: 'Gujarati (Vikram Samvat)',
    group: 'indian',
    region: 'Gujarat, India',
    wikiUrl: 'https://en.wikipedia.org/wiki/Vikram_Samvat',
    defaultEnabled: true,
  },
  {
    id: 'hindu-purnimanta',
    name: 'Hindu Panchang (North Indian)',
    group: 'indian',
    region: 'India',
    wikiUrl: 'https://en.wikipedia.org/wiki/Hindu_calendar',
    defaultEnabled: false,
  },
  {
    id: 'indian-saka',
    name: 'Indian National (Saka)',
    group: 'indian',
    region: 'India (Official Civil)',
    wikiUrl: 'https://en.wikipedia.org/wiki/Indian_national_calendar',
    defaultEnabled: false,
  },
  {
    id: 'nepali-bs',
    name: 'Nepali (Bikram Sambat)',
    group: 'indian',
    region: 'Nepal',
    wikiUrl: 'https://en.wikipedia.org/wiki/Bikram_Sambat',
    defaultEnabled: false,
  },
  {
    id: 'tamil',
    name: 'Tamil Calendar',
    group: 'indian',
    region: 'Tamil Nadu, Sri Lanka',
    wikiUrl: 'https://en.wikipedia.org/wiki/Tamil_calendar',
    defaultEnabled: false,
  },
  {
    id: 'malayalam',
    name: 'Malayalam (Kollavarsham)',
    group: 'indian',
    region: 'Kerala, India',
    wikiUrl: 'https://en.wikipedia.org/wiki/Malayalam_calendar',
    defaultEnabled: false,
  },
  {
    id: 'bengali',
    name: 'Bengali (Bangabda)',
    group: 'indian',
    region: 'West Bengal & Bangladesh',
    wikiUrl: 'https://en.wikipedia.org/wiki/Bengali_calendar',
    defaultEnabled: false,
  },
  {
    id: 'nanakshahi',
    name: 'Nanakshahi (Sikh)',
    group: 'indian',
    region: 'Punjab & Global Sikh',
    wikiUrl: 'https://en.wikipedia.org/wiki/Nanakshahi_calendar',
    defaultEnabled: false,
  },
  {
    id: 'zoroastrian-parsi',
    name: 'Zoroastrian / Parsi',
    group: 'indian',
    region: 'Parsi & Irani Communities',
    wikiUrl: 'https://en.wikipedia.org/wiki/Zoroastrian_calendar',
    defaultEnabled: false,
  },
  {
    id: 'jain-vira',
    name: 'Jain (Vira Nirvana Samvat)',
    group: 'indian',
    region: 'India & Global Jain',
    wikiUrl: 'https://en.wikipedia.org/wiki/Hindu_calendar',
    defaultEnabled: false,
  },

  // Religious & Middle Eastern
  {
    id: 'islamic-hijri',
    name: 'Islamic (Hijri)',
    group: 'religious',
    region: 'Global Islamic',
    wikiUrl: 'https://en.wikipedia.org/wiki/Islamic_calendar',
    defaultEnabled: false,
  },
  {
    id: 'hebrew',
    name: 'Hebrew (Jewish)',
    group: 'religious',
    region: 'Israel & Global Jewish',
    wikiUrl: 'https://en.wikipedia.org/wiki/Hebrew_calendar',
    defaultEnabled: false,
  },
  {
    id: 'solar-hijri',
    name: 'Solar Hijri (Persian)',
    group: 'religious',
    region: 'Iran & Afghanistan',
    wikiUrl: 'https://en.wikipedia.org/wiki/Solar_Hijri_calendar',
    defaultEnabled: false,
  },
  {
    id: 'bahai',
    name: 'Baháʼí (Badíʻ)',
    group: 'religious',
    region: 'Global Baháʼí',
    wikiUrl: 'https://en.wikipedia.org/wiki/Bah%C3%A1%CA%BC%C3%AD_calendar',
    defaultEnabled: false,
  },
  {
    id: 'coptic',
    name: 'Coptic Calendar',
    group: 'religious',
    region: 'Egypt',
    wikiUrl: 'https://en.wikipedia.org/wiki/Coptic_calendar',
    defaultEnabled: false,
  },
  {
    id: 'ethiopian',
    name: 'Ethiopian (Geʻez)',
    group: 'religious',
    region: 'Ethiopia & Eritrea',
    wikiUrl: 'https://en.wikipedia.org/wiki/Ethiopian_calendar',
    defaultEnabled: false,
  },

  // East & Southeast Asian
  {
    id: 'chinese',
    name: 'Chinese Lunar',
    group: 'asian',
    region: 'China & Sinosphere',
    wikiUrl: 'https://en.wikipedia.org/wiki/Chinese_calendar',
    defaultEnabled: false,
  },
  {
    id: 'japanese',
    name: 'Japanese Era (Reiwa)',
    group: 'asian',
    region: 'Japan',
    wikiUrl: 'https://en.wikipedia.org/wiki/Japanese_calendar',
    defaultEnabled: false,
  },
  {
    id: 'korean',
    name: 'Korean (Dangi)',
    group: 'asian',
    region: 'Korea',
    wikiUrl: 'https://en.wikipedia.org/wiki/Korean_calendar',
    defaultEnabled: false,
  },
  {
    id: 'vietnamese',
    name: 'Vietnamese Lunar',
    group: 'asian',
    region: 'Vietnam',
    wikiUrl: 'https://en.wikipedia.org/wiki/Vietnamese_calendar',
    defaultEnabled: false,
  },
  {
    id: 'tibetan',
    name: 'Tibetan (Rabjung)',
    group: 'asian',
    region: 'Tibet & Himalayan Region',
    wikiUrl: 'https://en.wikipedia.org/wiki/Tibetan_calendar',
    defaultEnabled: false,
  },
  {
    id: 'buddhist',
    name: 'Buddhist Era (BE)',
    group: 'asian',
    region: 'Southeast & South Asia',
    wikiUrl: 'https://en.wikipedia.org/wiki/Buddhist_calendar',
    defaultEnabled: false,
  },
  {
    id: 'thai-solar',
    name: 'Thai Solar (BE)',
    group: 'asian',
    region: 'Thailand',
    wikiUrl: 'https://en.wikipedia.org/wiki/Thai_solar_calendar',
    defaultEnabled: false,
  },
  {
    id: 'javanese',
    name: 'Javanese (Saka & Pasaran)',
    group: 'asian',
    region: 'Java, Indonesia',
    wikiUrl: 'https://en.wikipedia.org/wiki/Javanese_calendar',
    defaultEnabled: false,
  },
  {
    id: 'balinese-saka',
    name: 'Balinese Saka & Pawukon',
    group: 'asian',
    region: 'Bali, Indonesia',
    wikiUrl: 'https://en.wikipedia.org/wiki/Balinese_saka_calendar',
    defaultEnabled: false,
  },

  // Western & Historical
  {
    id: 'gregorian',
    name: 'Gregorian',
    group: 'historical',
    region: 'International Standard',
    wikiUrl: 'https://en.wikipedia.org/wiki/Gregorian_calendar',
    defaultEnabled: false,
  },
  {
    id: 'julian',
    name: 'Julian Calendar',
    group: 'historical',
    region: 'Historical & Eastern Orthodox',
    wikiUrl: 'https://en.wikipedia.org/wiki/Julian_calendar',
    defaultEnabled: false,
  },
  {
    id: 'french-republican',
    name: 'French Republican',
    group: 'historical',
    region: 'Historical France (1793)',
    wikiUrl: 'https://en.wikipedia.org/wiki/French_Republican_calendar',
    defaultEnabled: false,
  },
  {
    id: 'maya',
    name: 'Maya (Long Count & Haabʼ)',
    group: 'historical',
    region: 'Mesoamerica',
    wikiUrl: 'https://en.wikipedia.org/wiki/Maya_calendar',
    defaultEnabled: false,
  },
  {
    id: 'aztec',
    name: 'Aztec (Tonalpohualli)',
    group: 'historical',
    region: 'Central Mexico',
    wikiUrl: 'https://en.wikipedia.org/wiki/Aztec_calendar',
    defaultEnabled: false,
  },
  {
    id: 'iso-week',
    name: 'ISO Week Calendar (ISO 8601)',
    group: 'historical',
    region: 'International (Standard ISO 8601)',
    wikiUrl: 'https://en.wikipedia.org/wiki/ISO_week_date',
    defaultEnabled: false,
  },
  {
    id: 'academic',
    name: 'Academic Calendar (Semesters)',
    group: 'historical',
    region: 'Academic & Universities',
    wikiUrl: 'https://en.wikipedia.org/wiki/Academic_term',
    defaultEnabled: false,
  },
  {
    id: 'fiscal',
    name: 'Fiscal / Financial Calendar (FY)',
    group: 'historical',
    region: 'Corporate & Government Finance',
    wikiUrl: 'https://en.wikipedia.org/wiki/Fiscal_year',
    defaultEnabled: false,
  },
];

export const DEFAULT_ENABLED_WORLD_CALENDARS: WorldCalendarSystemId[] =
  WORLD_CALENDAR_SYSTEMS.filter((c) => c.defaultEnabled).map((c) => c.id);

// ======================== ASTRONOMICAL & EPOCH HELPERS ========================

/** Julian Day Number (integer noon-to-noon JDN for civil Gregorian date y, m(1..12), d) */
function gregorianToJdn(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * m2 + 2) / 5) +
    365 * y2 +
    Math.floor(y2 / 4) -
    Math.floor(y2 / 100) +
    Math.floor(y2 / 400) -
    32045
  );
}

function isGregorianLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** Convert JDN back to civil Gregorian date */
export function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = Math.floor(jdn) + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

/** Julian Calendar to JDN */
export function julianToJdn(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day - 1524;
}

/** Tabular Islamic Calendar to JDN */
export function islamicToJdn(year: number, month: number, day: number): number {
  return (
    day +
    Math.ceil(29.5 * (month - 1)) +
    (year - 1) * 354 +
    Math.floor((3 + 11 * year) / 30) +
    1948439
  );
}

/** Solar Hijri (Persian) to JDN */
export function persianToJdn(year: number, month: number, day: number): number {
  const epBase = year - (year >= 0 ? 474 : 473);
  const epYear = 474 + (((epBase % 2820) + 2820) % 2820);
  return (
    day +
    (month <= 7 ? (month - 1) * 31 : (month - 1) * 30 + 6) +
    Math.floor((epYear * 682 - 110) / 2816) +
    (epYear - 1) * 365 +
    Math.floor(epBase / 2820) * 1029983 +
    1948320
  );
}

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date.getTime() - start.getTime()) / 86400000) + 1;
}

function safeIntlFormat(
  date: Date,
  calendarCode: string,
  fallback: () => string
): string {
  try {
    const fmt = new Intl.DateTimeFormat(`en-US-u-ca-${calendarCode}`, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return fmt.format(date);
  } catch {
    return fallback();
  }
}

function jdnToJulian(jdn: number): { year: number; month: number; day: number } {
  const b = 0;
  const c = jdn + 32082;
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = b * 100 + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

/** Exact Indian National Saka Calendar */
function toIndianSaka(date: Date): { formatted: string; shortLabel: string } {
  const SAKA_MONTHS = [
    'Chaitra', 'Vaisakha', 'Jyaistha', 'Asadha', 'Sravana', 'Bhadra',
    'Asvina', 'Kartika', 'Agrahayana', 'Pausa', 'Magha', 'Phalguna',
  ];
  const y = date.getFullYear();
  const leap = isGregorianLeap(y);
  const chaitraStart = new Date(y, 2, leap ? 21 : 22); // Mar 21 (leap) or Mar 22
  let sakaYear = y - 78;
  let refStart = chaitraStart;

  if (date < chaitraStart) {
    sakaYear = y - 79;
    const prevLeap = isGregorianLeap(y - 1);
    refStart = new Date(y - 1, 2, prevLeap ? 21 : 22);
  }

  let diff = Math.round((date.getTime() - refStart.getTime()) / 86400000);
  const refYearLeap = isGregorianLeap(refStart.getFullYear());
  const monthLens = [refYearLeap ? 31 : 30, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30];

  let mIdx = 0;
  while (mIdx < 11 && diff >= monthLens[mIdx]) {
    diff -= monthLens[mIdx];
    mIdx++;
  }
  const day = diff + 1;
  return {
    formatted: `${day} ${SAKA_MONTHS[mIdx]} ${sakaYear} Saka`,
    shortLabel: `${SAKA_MONTHS[mIdx].slice(0, 4)} ${day}`,
  };
}

/** Solar Regional Indian Calendars (Tamil, Malayalam, Bengali, Nanakshahi) */
function toRegionalSolar(
  date: Date,
  months: string[],
  startDates: Array<[number, number]>, // [month(1-12), day] for each solar month start
  eraOffset: number,
  eraSuffix: string
): { formatted: string; shortLabel: string } {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  // Find current month by checking startDates in calendar order
  let bestIdx = 0;
  let bestStart = new Date(y - 1, startDates[startDates.length - 1][0] - 1, startDates[startDates.length - 1][1]);
  const target = new Date(y, m - 1, d);

  for (let i = 0; i < startDates.length; i++) {
    const [sm, sd] = startDates[i];
    const candidate = new Date(y, sm - 1, sd);
    if (candidate <= target && candidate >= bestStart) {
      bestStart = candidate;
      bestIdx = i;
    }
  }

  // Year rolls over on month 0 (New Year)
  const [nyM, nyD] = startDates[0];
  const nyDate = new Date(y, nyM - 1, nyD);
  const eraYear = target >= nyDate ? y - eraOffset : y - eraOffset - 1;
  const dayNum = Math.round((target.getTime() - bestStart.getTime()) / 86400000) + 1;

  return {
    formatted: `${dayNum} ${months[bestIdx]} ${eraYear}${eraSuffix ? ' ' + eraSuffix : ''}`,
    shortLabel: `${months[bestIdx]} ${dayNum}`,
  };
}

function toNepaliBs(date: Date) {
  return toRegionalSolar(
    date,
    [
      'Baishakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
      'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
    ],
    [
      [4, 14], [5, 15], [6, 15], [7, 17], [8, 17], [9, 17],
      [10, 18], [11, 17], [12, 16], [1, 15], [2, 13], [3, 14],
    ],
    -57,
    'BS'
  );
}

function toTamil(date: Date) {
  return toRegionalSolar(
    date,
    [
      'Chithirai', 'Vaikasi', 'Aani', 'Aadi', 'Aavani', 'Purattasi',
      'Aippasi', 'Karthigai', 'Margazhi', 'Thai', 'Maasi', 'Panguni',
    ],
    [
      [4, 14], [5, 15], [6, 15], [7, 17], [8, 17], [9, 17],
      [10, 18], [11, 17], [12, 16], [1, 14], [2, 13], [3, 15],
    ],
    -31, // Thiruvalluvar Year = Gregorian + 31 (approx; or Saka)
    'TV'
  );
}

function toMalayalam(date: Date) {
  return toRegionalSolar(
    date,
    [
      'Chingam', 'Kanni', 'Thulam', 'Vrishchikam', 'Dhanu', 'Makaram',
      'Kumbham', 'Meenam', 'Medam', 'Edavam', 'Mithunam', 'Karkidakam',
    ],
    [
      [8, 17], [9, 17], [10, 18], [11, 17], [12, 16], [1, 15],
      [2, 13], [3, 15], [4, 14], [5, 15], [6, 15], [7, 17],
    ],
    824, // Kollavarsham starts 825 CE
    'ME'
  );
}

function toBengali(date: Date) {
  return toRegionalSolar(
    date,
    [
      'Boishakh', 'Joishtho', 'Asharh', 'Srabon', 'Bhadro', 'Ashwin',
      'Kartik', 'Ogrohayon', 'Poush', 'Magh', 'Falgun', 'Choitro',
    ],
    [
      [4, 14], [5, 15], [6, 15], [7, 16], [8, 16], [9, 16],
      [10, 17], [11, 16], [12, 16], [1, 15], [2, 14], [3, 15],
    ],
    593,
    'BS'
  );
}

function toNanakshahi(date: Date) {
  return toRegionalSolar(
    date,
    [
      'Chet', 'Vaisakh', 'Jeth', 'Harh', 'Sawan', 'Bhadon',
      'Assu', 'Katak', 'Maghar', 'Poh', 'Magh', 'Phagun',
    ],
    [
      [3, 14], [4, 14], [5, 15], [6, 15], [7, 16], [8, 16],
      [9, 15], [10, 15], [11, 14], [12, 14], [1, 13], [2, 12],
    ],
    1468,
    'NS'
  );
}

/** Zoroastrian / Parsi (Shenshai Yazdegerdi Era — 365-day year, no leap day) */
function toZoroastrianParsi(date: Date): { formatted: string; shortLabel: string } {
  const MONTHS = [
    'Farvardin', 'Ardibehesht', 'Khordad', 'Tir', 'Amardad', 'Shehrevar',
    'Mehr', 'Aban', 'Adar', 'Dae', 'Bahman', 'Aspandad',
  ];
  const ROJ = [
    'Hormazd', 'Bahman', 'Ardibehesht', 'Shehrevar', 'Aspandad', 'Khordad',
    'Amardad', 'Dae-pa-Adar', 'Adar', 'Aban', 'Khorshed', 'Mohor', 'Tir',
    'Gosh', 'Dae-pa-Mehr', 'Mehr', 'Srosh', 'Rashne', 'Farvardin', 'Behram',
    'Ram', 'Govad', 'Dae-pa-Din', 'Din', 'Ashishvangh', 'Ashtad', 'Asman',
    'Zamyad', 'Marespand', 'Aneran',
  ];
  // Shenshai Navroz 1395 YZ fell on Aug 15, 2025 -> JDN reference
  const jdn = gregorianToJdn(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const refNavroz1395 = gregorianToJdn(2025, 8, 15);
  const delta = jdn - refNavroz1395;
  const yearsPassed = Math.floor(delta / 365);
  const dayInYear = ((delta % 365) + 365) % 365; // 0..364
  const yzYear = 1395 + yearsPassed;

  if (dayInYear >= 360) {
    const gathaNames = ['Ahunavad', 'Ushtavad', 'Spentomad', 'Vohuxshathra', 'Vahishtoisht'];
    const gIdx = dayInYear - 360;
    return {
      formatted: `${gathaNames[gIdx]} Gatha, ${yzYear} YZ`,
      shortLabel: `${gathaNames[gIdx]} Gatha`,
    };
  }
  const mIdx = Math.floor(dayInYear / 30);
  const dIdx = dayInYear % 30;
  return {
    formatted: `Roj ${ROJ[dIdx]} (${dIdx + 1}), Mah ${MONTHS[mIdx]}, ${yzYear} YZ`,
    shortLabel: `${MONTHS[mIdx]} ${dIdx + 1}`,
  };
}

/** Baháʼí (Badíʻ Calendar — 19 months × 19 days + Ayyám-i-Há, starts ~March 20/21) */
function toBahai(date: Date): { formatted: string; shortLabel: string } {
  const MONTHS = [
    'Bahá', 'Jalál', 'Jamál', 'ʻAẓamat', 'Núr', 'Raḥmat', 'Kalimát',
    'Kamál', 'Asmáʼ', 'ʻIzzat', 'Mashíyyat', 'ʻIlm', 'Qudrat', 'Qawl',
    'Masáʼil', 'Sharaf', 'Sulṭán', 'Mulk', 'ʻAláʼ',
  ];
  const y = date.getFullYear();
  const nawRuz = new Date(y, 2, 20); // March 20 astronomical equinox approximation
  let bYear = y - 1843;
  let ref = nawRuz;
  if (date < nawRuz) {
    bYear = y - 1844;
    ref = new Date(y - 1, 2, 20);
  }
  const diff = Math.round((date.getTime() - ref.getTime()) / 86400000);
  const leap = isGregorianLeap(ref.getFullYear() + 1);
  const ayyamDays = leap ? 5 : 4;

  if (diff < 18 * 19) {
    const mIdx = Math.floor(diff / 19);
    const dNum = (diff % 19) + 1;
    return {
      formatted: `${dNum} ${MONTHS[mIdx]} ${bYear} BE`,
      shortLabel: `${MONTHS[mIdx]} ${dNum}`,
    };
  }
  if (diff < 18 * 19 + ayyamDays) {
    const aDay = diff - 18 * 19 + 1;
    return {
      formatted: `Day ${aDay} of Ayyám-i-Há, ${bYear} BE`,
      shortLabel: `Ayyám-i-Há ${aDay}`,
    };
  }
  const alaDay = diff - (18 * 19 + ayyamDays) + 1;
  return {
    formatted: `${alaDay} ${MONTHS[18]} ${bYear} BE`,
    shortLabel: `${MONTHS[18]} ${alaDay}`,
  };
}

/** French Republican Calendar (Epoch: Sep 22, 1792 = 1 Vendémiaire An I) */
function toFrenchRepublican(date: Date): { formatted: string; shortLabel: string } {
  const MONTHS = [
    'Vendémiaire', 'Brumaire', 'Frimaire', 'Nivôse', 'Pluviôse', 'Ventôse',
    'Germinal', 'Floréal', 'Prairial', 'Messidor', 'Thermidor', 'Fructidor',
  ];
  const y = date.getFullYear();
  const equinox = new Date(y, 8, 22); // Sep 22
  let repYear = y - 1791;
  let ref = equinox;
  if (date < equinox) {
    repYear = y - 1792;
    ref = new Date(y - 1, 8, 22);
  }
  const diff = Math.round((date.getTime() - ref.getTime()) / 86400000);
  if (diff >= 360) {
    const sc = diff - 360 + 1;
    return {
      formatted: `Jour complémentaire ${sc}, An ${repYear}`,
      shortLabel: `Sans-culottide ${sc}`,
    };
  }
  const mIdx = Math.floor(diff / 30);
  const dNum = (diff % 30) + 1;
  return {
    formatted: `${dNum} ${MONTHS[mIdx]}, An ${repYear}`,
    shortLabel: `${MONTHS[mIdx].slice(0, 5)} ${dNum}`,
  };
}

/** Maya Long Count, Tzolk'in, and Haab' (GMT correlation constant = 584283) */
function toMaya(date: Date): { formatted: string; shortLabel: string; detail: string } {
  const TZOLKIN = [
    'Imixʼ', 'Ikʼ', 'Akʼbʼal', 'Kʼan', 'Chikchan', 'Kimi', 'Manikʼ', 'Lamat',
    'Muluk', 'Ok', 'Chuwen', 'Ebʼ', 'Bʼen', 'Ix', 'Men', 'Kibʼ',
    'Kabʼan', 'Etzʼnabʼ', 'Kawak', 'Ajaw',
  ];
  const HAAB = [
    'Pop', 'Woʼ', 'Sip', 'Sotzʼ', 'Sek', 'Xul', 'Yaxkʼinʼ', 'Mol', 'Chʼen',
    'Yax', 'Sakʼ', 'Keh', 'Mak', 'Kʼankʼin', 'Muwanʼ', 'Pax', 'Kʼayab', 'Kumkʼu', 'Wayebʼ',
  ];
  const jdn = gregorianToJdn(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const days = jdn - 584283;
  const baktun = Math.floor(days / 144000);
  const rem1 = days % 144000;
  const katun = Math.floor(rem1 / 7200);
  const rem2 = rem1 % 7200;
  const tun = Math.floor(rem2 / 360);
  const rem3 = rem2 % 360;
  const uinal = Math.floor(rem3 / 20);
  const kin = rem3 % 20;

  const tzNum = ((days + 3) % 13 + 13) % 13 + 1;
  const tzName = TZOLKIN[((days + 19) % 20 + 20) % 20];
  const haabDays = ((days + 348) % 365 + 365) % 365;
  const haabMonth = HAAB[Math.floor(haabDays / 20)];
  const haabDay = haabDays % 20;

  const longCount = `${baktun}.${katun}.${tun}.${uinal}.${kin}`;
  return {
    formatted: `${longCount} · ${tzNum} ${tzName} · ${haabDay} ${haabMonth}`,
    shortLabel: `${tzNum} ${tzName}`,
    detail: `Long Count ${longCount} (GMT 584283)`,
  };
}

/** Aztec Tonalpohualli (260-day sacred count) & Xiuhpohualli (365-day solar year) */
function toAztec(date: Date): { formatted: string; shortLabel: string } {
  const SIGNS = [
    'Cipactli', 'Ehecatl', 'Calli', 'Cuetzpalin', 'Coatl', 'Miquiztli',
    'Mazatl', 'Tochtli', 'Atl', 'Itzcuintli', 'Ozomahtli', 'Malinalli',
    'Acatl', 'Ocelotl', 'Cuauhtli', 'Cozcacuauhtli', 'Ollin', 'Tecpatl',
    'Quiahuitl', 'Xochitl',
  ];
  // Alfonso Caso correlation: Aug 13, 1521 (Julian) = Aug 23, 1521 (Gregorian) = 1 Coatl
  const jdn = gregorianToJdn(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const ref = gregorianToJdn(1521, 8, 23); // 1 Coatl (num=1, signIdx=4)
  const diff = jdn - ref;
  const num = (((diff % 13) + 13) % 13) + 1;
  const signIdx = (((4 + diff) % 20) + 20) % 20;
  return {
    formatted: `${num} ${SIGNS[signIdx]} (Tonalpohualli)`,
    shortLabel: `${num} ${SIGNS[signIdx]}`,
  };
}

/** Javanese Pasaran (5-day market cycle) & Saka Year */
function toJavanese(date: Date): { formatted: string; shortLabel: string } {
  const PASARAN = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
  const DINA = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const jdn = gregorianToJdn(date.getFullYear(), date.getMonth() + 1, date.getDate());
  // Known anchor: Jan 1, 2025 (JDN 2460677) was Rabu Pon (index 2)
  const ref = gregorianToJdn(2025, 1, 1);
  const pIdx = (((2 + (jdn - ref)) % 5) + 5) % 5;
  const dName = DINA[date.getDay()];
  const hijriStr = safeIntlFormat(date, 'islamic-umalqura', () => '');
  const hijriYearMatch = hijriStr.match(/\d{4}/);
  const javaYear = hijriYearMatch ? Number(hijriYearMatch[0]) + 512 : date.getFullYear() - 68;
  return {
    formatted: `${dName} ${PASARAN[pIdx]}, ${javaYear} AJ`,
    shortLabel: `${dName} ${PASARAN[pIdx]}`,
  };
}

/** Balinese Saka & 210-day Pawukon Wuku cycle */
function toBalineseSaka(date: Date): { formatted: string; shortLabel: string } {
  const WUKU = [
    'Sinta', 'Landep', 'Ukir', 'Kulantir', 'Tolu', 'Gumbreg', 'Wariga',
    'Warigadian', 'Julungwangi', 'Sungsang', 'Dungulan', 'Kuningan', 'Langkir',
    'Medangsia', 'Pujut', 'Pahang', 'Krulut', 'Merakih', 'Tambir', 'Medangkungan',
    'Matal', 'Uye', 'Menail', 'Prangbakat', 'Bala', 'Ugu', 'Wayang', 'Klawu',
    'Dukut', 'Watugunung',
  ];
  const jdn = gregorianToJdn(date.getFullYear(), date.getMonth() + 1, date.getDate());
  // Anchor: Sunday, Jan 5, 2025 = start of Wuku Merakih (idx 17)
  const ref = gregorianToJdn(2025, 1, 5);
  const pawukonDay = (((jdn - ref + 17 * 7) % 210) + 210) % 210;
  const wukuIdx = Math.floor(pawukonDay / 7);
  const sakaYear = date.getMonth() >= 3 ? date.getFullYear() - 78 : date.getFullYear() - 79;
  return {
    formatted: `Wuku ${WUKU[wukuIdx]} · Saka ${sakaYear}`,
    shortLabel: `Wuku ${WUKU[wukuIdx]}`,
  };
}

/** Convert a Gregorian Date into any specific WorldCalendarSystemId */
export function convertToWorldCalendar(
  date: Date,
  systemId: WorldCalendarSystemId,
  gujaratiScript = false
): WorldCalendarDateValue {
  const meta = WORLD_CALENDAR_SYSTEMS.find((s) => s.id === systemId)!;
  const panchang = getGujaratiPanchang(date);

  switch (systemId) {
    case 'gujarati-vikram': {
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: gujaratiScript
          ? `${panchang.monthGu} ${panchang.pakshaGu} ${panchang.tithiGu}, વિ.સં. ${panchang.vikramSamvat}`
          : `${panchang.monthEn} ${panchang.pakshaEn} ${panchang.tithiEn}, VS ${panchang.vikramSamvat}`,
        shortLabel: gujaratiScript ? panchang.shortLabelGu : panchang.shortLabelEn,
        detail: `Amanta · ${panchang.vaarEn} · ${panchang.nakshatraEn} Nakshatra`,
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'hindu-purnimanta': {
      // North Indian Purnimanta shifts Krishna (Vad) paksha to the next lunar month name
      const MONTHS = [
        'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada',
        'Ashwin', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna',
      ];
      const gujIdxMap: Record<string, number> = {
        Chaitra: 0, Vaishakh: 1, Jeth: 2, Ashadh: 3, Shravan: 4, Bhadarvo: 5,
        Aso: 6, Kartak: 7, Magshar: 8, Posh: 9, Maha: 10, Fagan: 11,
      };
      const baseMonth = panchang.monthEn.replace(/^Adhik /, '');
      const idx = gujIdxMap[baseMonth] ?? 0;
      const purnIdx = panchang.pakshaEn === 'Vad' ? (idx + 1) % 12 : idx;
      const paksha = panchang.pakshaEn === 'Sud' ? 'Shukla' : 'Krishna';
      const vsNorth = date.getMonth() >= 3 ? date.getFullYear() + 57 : date.getFullYear() + 56;
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: `${MONTHS[purnIdx]} ${paksha} ${panchang.tithiNum}, VS ${vsNorth}`,
        shortLabel: `${MONTHS[purnIdx].slice(0, 4)} ${paksha[0]} ${panchang.tithiNum}`,
        detail: `Purnimanta · Chaitradi Vikram Samvat`,
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'indian-saka': {
      const s = toIndianSaka(date);
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: s.formatted,
        shortLabel: s.shortLabel,
        detail: 'Official Indian National Solar Calendar',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'nepali-bs': {
      const n = toNepaliBs(date);
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: n.formatted,
        shortLabel: n.shortLabel,
        detail: 'Official Bikram Sambat Calendar of Nepal',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'tamil': {
      const t = toTamil(date);
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: t.formatted,
        shortLabel: t.shortLabel,
        detail: 'Sidereal Solar · Thiruvalluvar Era',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'malayalam': {
      const m = toMalayalam(date);
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: m.formatted,
        shortLabel: m.shortLabel,
        detail: 'Kollavarsham Solar Calendar',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'bengali': {
      const b = toBengali(date);
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: b.formatted,
        shortLabel: b.shortLabel,
        detail: 'Bangabda Solar Year',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'nanakshahi': {
      const n = toNanakshahi(date);
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: n.formatted,
        shortLabel: n.shortLabel,
        detail: 'Sikh Tropical Solar Era (1469 CE)',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'zoroastrian-parsi': {
      const z = toZoroastrianParsi(date);
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: z.formatted,
        shortLabel: z.shortLabel,
        detail: 'Shenshai Yazdegerdi Era',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'jain-vira': {
      // Vira Nirvana Samvat starts on Kartak Sud Ekam (Diwali + 1), Epoch = 527 BCE
      const vnsYear = panchang.vikramSamvat + 470;
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: `${panchang.monthEn} ${panchang.pakshaEn} ${panchang.tithiNum}, VNS ${vnsYear}`,
        shortLabel: `VNS ${vnsYear}`,
        detail: `Vira Nirvana Samvat (Lord Mahavira Nirvana 527 BCE)`,
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'islamic-hijri': {
      const str = safeIntlFormat(date, 'islamic-umalqura', () =>
        safeIntlFormat(date, 'islamic', () => `Hijri ${date.getFullYear() - 579}`)
      );
      const short = str.split(',')[0].replace(/\s+AH$/, '');
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: str,
        shortLabel: short,
        detail: 'Umm al-Qura Lunar Hijri Calendar',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'hebrew': {
      const str = safeIntlFormat(date, 'hebrew', () => `Hebrew ${date.getFullYear() + 3760}`);
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: str,
        shortLabel: str.split(',')[0],
        detail: 'Lunisolar Anno Mundi Calendar',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'solar-hijri': {
      const str = safeIntlFormat(date, 'persian', () => `SH ${date.getFullYear() - 621}`);
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: str,
        shortLabel: str.split(',')[0],
        detail: 'Iranian / Afghan Solar Hijri (Jalali)',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'bahai': {
      const b = toBahai(date);
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: b.formatted,
        shortLabel: b.shortLabel,
        detail: 'Badíʻ Solar Calendar (19 months × 19 days)',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'coptic': {
      const str = safeIntlFormat(date, 'coptic', () => `AM ${date.getFullYear() - 284}`);
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: str,
        shortLabel: str.split(',')[0],
        detail: 'Alexandrian Era of the Martyrs (AM)',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'ethiopian': {
      const str = safeIntlFormat(date, 'ethiopic', () => `EC ${date.getFullYear() - 8}`);
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: str,
        shortLabel: str.split(',')[0],
        detail: 'Geʻez 13-Month Solar Calendar',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'chinese': {
      const ZODIAC = [
        'Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake',
        'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig',
      ];
      const str = safeIntlFormat(date, 'chinese', () => `Lunar ${date.getFullYear()}`);
      const zIdx = ((date.getFullYear() - 4) % 12 + 12) % 12;
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: `${str} · Year of the ${ZODIAC[zIdx]}`,
        shortLabel: str.split(',')[0],
        detail: `Lunisolar Sexagenary Cycle`,
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'japanese': {
      const str = safeIntlFormat(date, 'japanese', () => `Reiwa ${date.getFullYear() - 2018}`);
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: str,
        shortLabel: str.split(',')[0],
        detail: 'Imperial Era (Nengō) System',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'korean': {
      const dangiYear = date.getFullYear() + 2333;
      const lunarStr = safeIntlFormat(date, 'chinese', () => '');
      const lunarPart = lunarStr ? ` · Lunar ${lunarStr.split(',')[0]}` : '';
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: `Dangi ${dangiYear}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}${lunarPart}`,
        shortLabel: `Dangi ${dangiYear}`,
        detail: 'Dangi Era (2333 BCE) + Traditional Lunisolar',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'vietnamese': {
      const ZODIAC_VN = [
        'Rat (Tý)', 'Water Buffalo (Sửu)', 'Tiger (Dần)', 'Cat (Mão)', 'Dragon (Thìn)', 'Snake (Tỵ)',
        'Horse (Ngọ)', 'Goat (Mùi)', 'Monkey (Thân)', 'Rooster (Dậu)', 'Dog (Tuất)', 'Pig (Hợi)',
      ];
      const str = safeIntlFormat(date, 'chinese', () => `${date.getFullYear()}`);
      const zIdx = ((date.getFullYear() - 4) % 12 + 12) % 12;
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: `${str.split(',')[0]} · ${ZODIAC_VN[zIdx]}`,
        shortLabel: str.split(',')[0],
        detail: 'Âm lịch (UTC+7 Lunisolar)',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'tibetan': {
      // Tibetan Royal Year = Gregorian + 127 (before Losar ~Feb, +126)
      const tibYear = date.getMonth() >= 2 ? date.getFullYear() + 127 : date.getFullYear() + 126;
      const ELEMENTS = ['Wood', 'Fire', 'Earth', 'Iron', 'Water'];
      const ANIMALS = [
        'Mouse', 'Ox', 'Tiger', 'Hare', 'Dragon', 'Snake',
        'Horse', 'Sheep', 'Monkey', 'Bird', 'Dog', 'Pig',
      ];
      const elem = ELEMENTS[Math.floor((((date.getFullYear() - 4) % 10) + 10) % 10 / 2)];
      const anim = ANIMALS[((date.getFullYear() - 4) % 12 + 12) % 12];
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: `Tibetan Year ${tibYear} · ${elem} ${anim}, Day ${panchang.tithiNum}`,
        shortLabel: `Tib ${tibYear}`,
        detail: '17th Rabjung Cycle · Lunisolar',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'buddhist': {
      const beYear = date.getFullYear() + 543;
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${beYear} BE`,
        shortLabel: `${beYear} BE`,
        detail: 'Buddhist Era (543 BCE Parinirvana)',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'thai-solar': {
      const THAI_MONTHS = [
        'Mokkarakhom', 'Kumphaphan', 'Minakhom', 'Mesayon', 'Phruetsaphakhom', 'Mithunayon',
        'Karakadakhom', 'Singhakhom', 'Kanyayon', 'Tulakhom', 'Phruetsachikayon', 'Thanwakhom',
      ];
      const beYear = date.getFullYear() + 543;
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: `${date.getDate()} ${THAI_MONTHS[date.getMonth()]} B.E. ${beYear}`,
        shortLabel: `${date.getDate()} ${THAI_MONTHS[date.getMonth()].slice(0, 4)}`,
        detail: 'Thai Official Solar Calendar',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'javanese': {
      const j = toJavanese(date);
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: j.formatted,
        shortLabel: j.shortLabel,
        detail: '5-Day Pasaran Market Cycle & Anno Javanico',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'balinese-saka': {
      const b = toBalineseSaka(date);
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: b.formatted,
        shortLabel: b.shortLabel,
        detail: '210-Day Pawukon Cycle & Saka Era',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'gregorian': {
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: `${DAY_NAMES_SHORT[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`,
        shortLabel: `${MONTH_NAMES[date.getMonth()].slice(0, 3)} ${date.getDate()}`,
        detail: `Day ${dayOfYear(date)} of ${isGregorianLeap(date.getFullYear()) ? 366 : 365}`,
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'julian': {
      const jdn = gregorianToJdn(date.getFullYear(), date.getMonth() + 1, date.getDate());
      const j = jdnToJulian(jdn);
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: `${MONTH_NAMES[j.month - 1]} ${j.day}, ${j.year} (Julian)`,
        shortLabel: `Jul ${MONTH_NAMES[j.month - 1].slice(0, 3)} ${j.day}`,
        detail: 'Old Style (13-day offset from Gregorian)',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'french-republican': {
      const f = toFrenchRepublican(date);
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: f.formatted,
        shortLabel: f.shortLabel,
        detail: 'Revolutionary Decimal Calendar (1792 Epoch)',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'maya': {
      const m = toMaya(date);
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: m.formatted,
        shortLabel: m.shortLabel,
        detail: m.detail,
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'aztec': {
      const a = toAztec(date);
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: a.formatted,
        shortLabel: a.shortLabel,
        detail: '260-Day Sacred Tonalpohualli Count',
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'iso-week': {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}-${dayNum}`,
        shortLabel: `W${weekNo}`,
        detail: `ISO 8601 Week ${weekNo}, Day ${dayNum} (${DAY_NAMES_SHORT[date.getDay()]})`,
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'academic': {
      const m = date.getMonth();
      const y = date.getFullYear();
      let ayStart = y;
      let term = 'Fall';
      let termWeek = 1;
      if (m >= 8) {
        ayStart = y;
        term = 'Fall Semester';
        const termStart = new Date(y, 8, 1);
        termWeek = Math.max(1, Math.ceil((date.getTime() - termStart.getTime()) / (7 * 86400000)));
      } else if (m <= 4) {
        ayStart = y - 1;
        term = 'Spring Semester';
        const termStart = new Date(y, 0, 15);
        termWeek = Math.max(1, Math.ceil((date.getTime() - termStart.getTime()) / (7 * 86400000)));
      } else {
        ayStart = y - 1;
        term = 'Summer Session';
        const termStart = new Date(y, 5, 1);
        termWeek = Math.max(1, Math.ceil((date.getTime() - termStart.getTime()) / (7 * 86400000)));
      }
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: `AY ${ayStart}–${(ayStart + 1) % 100} · ${term} W${termWeek}`,
        shortLabel: `${term.split(' ')[0]} W${termWeek}`,
        detail: `Academic Year ${ayStart}–${ayStart + 1} · Week ${termWeek}`,
        wikiUrl: meta.wikiUrl,
      };
    }

    case 'fiscal': {
      const m = date.getMonth();
      const y = date.getFullYear();
      const fyStart = m >= 3 ? y : y - 1;
      const fyEnd = (fyStart + 1) % 100;
      const monthOffset = ((m - 3 + 12) % 12) + 1;
      const quarter = Math.floor((monthOffset - 1) / 3) + 1;
      return {
        id: systemId,
        name: meta.name,
        group: meta.group,
        formatted: `FY ${fyStart}–${fyEnd} · Q${quarter} (Month ${monthOffset})`,
        shortLabel: `FY${fyEnd}/Q${quarter}`,
        detail: `Fiscal Year ${fyStart}–${fyStart + 1} · Quarter ${quarter} (Apr–Mar standard)`,
        wikiUrl: meta.wikiUrl,
      };
    }
  }
}

export function getWorldCalendarsForDate(
  date: Date,
  enabledIds: WorldCalendarSystemId[],
  gujaratiScript = false
): WorldCalendarDateValue[] {
  return enabledIds.map((id) => convertToWorldCalendar(date, id, gujaratiScript));
}

/**
 * Universal Date Converter between calendar systems (Phase 8)
 * Converts from any input system into a Gregorian baseline, then into the target calendar system.
 */
export function convertCalendarDate(
  fromSystem: WorldCalendarSystemId,
  year: number,
  month: number,
  day: number,
  targetSystem: WorldCalendarSystemId,
  gujaratiScript = false
): {
  gregorianDate: Date;
  result: WorldCalendarDateValue;
  methodExplanation: string;
  isApproximate: boolean;
} {
  let gDate: Date;
  let methodExplanation = 'Astronomical algorithm conversion';
  let isApproximate = false;

  switch (fromSystem) {
    case 'gregorian': {
      gDate = new Date(year, month - 1, day);
      methodExplanation = 'Standard Gregorian civil calendar (proleptic / ISO 8601)';
      break;
    }
    case 'julian': {
      const jdn = julianToJdn(year, month, day);
      const g = jdnToGregorian(jdn);
      gDate = new Date(g.year, g.month - 1, g.day);
      methodExplanation = 'Julian Day Number interpolation (historical Julian calendar)';
      break;
    }
    case 'islamic-hijri': {
      const jdn = islamicToJdn(year, month, day);
      const g = jdnToGregorian(jdn);
      gDate = new Date(g.year, g.month - 1, g.day);
      methodExplanation =
        'Arithmetic tabular Islamic calendar. Official religious dates may vary by ±1 day due to local lunar crescent sightings.';
      isApproximate = true;
      break;
    }
    case 'solar-hijri': {
      const jdn = persianToJdn(year, month, day);
      const g = jdnToGregorian(jdn);
      gDate = new Date(g.year, g.month - 1, g.day);
      methodExplanation = 'Solar Hijri (Jalali 33-year leap cycle astronomical algorithm)';
      break;
    }
    case 'indian-saka': {
      const gYear = year + 78;
      const leap = isGregorianLeap(gYear);
      const chaitraStart = new Date(gYear, 2, leap ? 21 : 22);
      const refYearLeap = isGregorianLeap(chaitraStart.getFullYear());
      const monthLens = [refYearLeap ? 31 : 30, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30];
      let daysToAdd = 0;
      for (let i = 0; i < month - 1; i++) {
        daysToAdd += monthLens[i];
      }
      daysToAdd += day - 1;
      gDate = new Date(chaitraStart.getTime() + daysToAdd * 86400000);
      methodExplanation = 'Indian National Saka calendar standard epoch';
      break;
    }
    case 'nepali-bs': {
      const gYear = year - 57;
      const start = new Date(gYear, 3, 14); // Baishakh 1 ~ April 14
      const daysToAdd = (month - 1) * 30 + (day - 1);
      gDate = new Date(start.getTime() + daysToAdd * 86400000);
      methodExplanation = 'Nepali Bikram Sambat solar epoch (+57 year offset)';
      isApproximate = true;
      break;
    }
    case 'buddhist': {
      const gYear = year - 543;
      gDate = new Date(gYear, month - 1, day);
      methodExplanation = 'Buddhist Era (Suriyakati Solar, BE 543 BCE epoch)';
      break;
    }
    default: {
      // Default to approximate Gregorian mapping for other systems
      gDate = new Date(year, month - 1, day);
      methodExplanation = 'Interpolated civil baseline conversion';
      isApproximate = true;
      break;
    }
  }

  const result = convertToWorldCalendar(gDate, targetSystem, gujaratiScript);
  return {
    gregorianDate: gDate,
    result,
    methodExplanation,
    isApproximate,
  };
}
