import { GujaratiPanchang } from '../types/calendar';
import { formatDateKey } from '../utils/dateUtils';

/**
 * Authentic Astronomical Gujarati Calendar (Vikram Samvat · Amanta System) Calculator
 * Computes Sun & Moon ecliptic longitudes at IST sunrise (06:30 IST = 01:00 UTC)
 * using Jean Meeus simplified solar/lunar orbital equations and Lahiri Ayanamsa.
 */

const GUJARATI_MONTHS_EN = [
  'Chaitra',
  'Vaishakh',
  'Jeth',
  'Ashadh',
  'Shravan',
  'Bhadarvo',
  'Aso',
  'Kartak',
  'Magshar',
  'Posh',
  'Maha',
  'Fagan',
];

const GUJARATI_MONTHS_GU = [
  'ચૈત્ર',
  'વૈશાખ',
  'જેઠ',
  'અષાઢ',
  'શ્રાવણ',
  'ભાદરવો',
  'આસો',
  'કારતક',
  'માગશર',
  'પોષ',
  'મહા',
  'ફાગણ',
];

const TITHI_NAMES_EN = [
  'Ekam',
  'Bij',
  'Trij',
  'Choth',
  'Pancham',
  'Chhath',
  'Satam',
  'Aatham',
  'Nom',
  'Dasham',
  'Agiyaras',
  'Baras',
  'Teras',
  'Chaudas',
  'Poonam',
];

const TITHI_NAMES_GU = [
  'એકમ',
  'બીજ',
  'ત્રીજ',
  'ચોથ',
  'પાંચમ',
  'છઠ',
  'સાતમ',
  'આઠમ',
  'નોમ',
  'દશમ',
  'અગિયારસ',
  'બારસ',
  'તેરસ',
  'ચૌદશ',
  'પૂનમ',
];

const GUJARATI_DIGITS = ['૦', '૧', '૨', '૩', '૪', '૫', '૬', '૭', '૮', '૯'];

const VAAR_EN = [
  'Ravivar',
  'Somvar',
  'Mangalvar',
  'Budhvar',
  'Guruvar',
  'Shukravar',
  'Shanivar',
];

const VAAR_GU = [
  'રવિવાર',
  'સોમવાર',
  'મંગળવાર',
  'બુધવાર',
  'ગુરુવાર',
  'શુક્રવાર',
  'શનિવાર',
];

const NAKSHATRA_EN = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

const NAKSHATRA_GU = [
  'અશ્વિની', 'ભરણી', 'કૃતિકા', 'રોહિણી', 'મૃગશીર્ષ', 'આર્દ્રા',
  'પુનર્વસુ', 'પુષ્ય', 'આશ્લેષા', 'મઘા', 'પૂર્વા ફાલ્ગુની', 'ઉત્તરા ફાલ્ગુની',
  'હસ્ત', 'ચિત્રા', 'સ્વાતિ', 'વિશાખા', 'અનુરાધા', 'જ્યેષ્ઠા',
  'મૂળ', 'પૂર્વાષાઢા', 'ઉત્તરાષાઢા', 'શ્રવણ', 'ધનિષ્ઠા',
  'શતભિષા', 'પૂર્વા ભાદ્રપદા', 'ઉત્તરા ભાદ્રપદા', 'રેવતી',
];

export const YOGA_EN = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda',
  'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva',
  'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyan',
  'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla',
  'Brahma', 'Indra', 'Vaidhriti',
];

export const KARANA_EN = [
  'Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti (Bhadra)',
  'Shakuni', 'Chatushpada', 'Naga', 'Kintughna',
];

export const RITU_EN = [
  'Vasanta (Spring)',
  'Grishma (Summer)',
  'Varsha (Monsoon)',
  'Sharad (Autumn)',
  'Hemanta (Pre-winter)',
  'Shishira (Winter)',
];

export const SAMVATSARA_EN = [
  'Prabhava', 'Vibhava', 'Shukla', 'Pramoda', 'Prajapati', 'Angirasa', 'Shrimukha',
  'Bhava', 'Yuva', 'Dhatri', 'Ishvara', 'Bahudhanya', 'Pramathi', 'Vikrama', 'Vrishaprajapati',
  'Chitrabhanu', 'Subhanu', 'Tarana', 'Parthiva', 'Vyaya', 'Sarvajit', 'Sarvadhari',
  'Virodhi', 'Vikrita', 'Khara', 'Nandana', 'Vijaya', 'Jaya', 'Manmatha', 'Durmukha',
  'Hemalamba', 'Vilamba', 'Vikari', 'Sharvari', 'Plava', 'Shubhakrita', 'Shobhakrita',
  'Krodhi', 'Vishvavasu', 'Parabhava', 'Plavanga', 'Kilaka', 'Saumya', 'Sadharana',
  'Virodhikrita', 'Paridhavi', 'Pramadicha', 'Ananda', 'Rakshasa', 'Anala', 'Pingala',
  'Kalayukta', 'Siddharthi', 'Raudra', 'Durmati', 'Dundubhi', 'Rudhirodgari', 'Raktaksha',
  'Krodhana', 'Akshaya',
];

export const RAHU_KAAL_BY_DOW = [
  '16:30 – 18:00', // Sun
  '07:30 – 09:00', // Mon
  '15:00 – 16:30', // Tue
  '12:00 – 13:30', // Wed
  '13:30 – 15:00', // Thu
  '10:30 – 12:00', // Fri
  '09:00 – 10:30', // Sat
];

export function toGujaratiDigits(num: number): string {
  return String(num)
    .split('')
    .map((ch) => {
      const d = Number(ch);
      return Number.isNaN(d) ? ch : GUJARATI_DIGITS[d];
    })
    .join('');
}

const DEG2RAD = Math.PI / 180;

function mod360(x: number): number {
  return ((x % 360) + 360) % 360;
}

/** Julian Day for a UTC timestamp (year, month 1..12, day with fractional UTC day) */
function toJulianDay(year: number, month: number, dayWithFrac: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + dayWithFrac + B - 1524.5;
}

/** Tropical Sun ecliptic longitude in degrees */
function sunLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  const L0 = mod360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = mod360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const Mrad = M * DEG2RAD;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
    0.000289 * Math.sin(3 * Mrad);
  const omega = (125.04 - 1934.136 * T) * DEG2RAD;
  return mod360(L0 + C - 0.00569 - 0.00478 * Math.sin(omega));
}

/** Tropical Moon ecliptic longitude in degrees */
function moonLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  const Lprime = mod360(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T);
  const D = mod360(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T);
  const M = mod360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T);
  const Mprime = mod360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T);
  const F = mod360(93.272095 + 483202.0175233 * T - 0.0036539 * T * T);

  const Dr = D * DEG2RAD;
  const Mr = M * DEG2RAD;
  const Mpr = Mprime * DEG2RAD;
  const Fr = F * DEG2RAD;

  // Principal periodic terms from Meeus Chapter 47
  const sumL =
    6.288774 * Math.sin(Mpr) +
    1.274027 * Math.sin(2 * Dr - Mpr) +
    0.658314 * Math.sin(2 * Dr) +
    0.213618 * Math.sin(2 * Mpr) -
    0.185116 * Math.sin(Mr) -
    0.114332 * Math.sin(2 * Fr) +
    0.058793 * Math.sin(2 * Dr - 2 * Mpr) +
    0.057066 * Math.sin(2 * Dr - Mr - Mpr) +
    0.053322 * Math.sin(2 * Dr + Mpr) +
    0.045758 * Math.sin(2 * Dr - Mr) -
    0.040923 * Math.sin(Mr - Mpr) -
    0.03472 * Math.sin(Dr) -
    0.030383 * Math.sin(Mr + Mpr) +
    0.015327 * Math.sin(2 * Dr - 2 * Fr) -
    0.012528 * Math.sin(Mpr + 2 * Fr) +
    0.01098 * Math.sin(Mpr - 2 * Fr);

  return mod360(Lprime + sumL);
}

/** Lahiri Chitrapaksha Ayanamsa in degrees */
function lahiriAyanamsa(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  return 23.853056 + 1.396971 * T;
}

/** Finds JD of New Moon (elongation = 0) closest to and <= targetJd using Newton-Raphson */
function findPreviousNewMoon(jd: number): number {
  const elong = mod360(moonLongitude(jd) - sunLongitude(jd));
  // Approximate days since new moon (synodic month = 29.530588861)
  let t = jd - (elong / 360) * 29.530588861;
  for (let i = 0; i < 6; i++) {
    let diff = mod360(moonLongitude(t) - sunLongitude(t));
    if (diff > 180) diff -= 360;
    t -= diff / 12.190749; // mean daily elongation rate
  }
  return t;
}

/** Finds JD of Next New Moon (elongation = 0) > targetJd */
function findNextNewMoon(prevNewMoonJd: number): number {
  let t = prevNewMoonJd + 29.530588861;
  for (let i = 0; i < 6; i++) {
    let diff = mod360(moonLongitude(t) - sunLongitude(t));
    if (diff > 180) diff -= 360;
    t -= diff / 12.190749;
  }
  return t;
}

const panchangCache = new Map<string, GujaratiPanchang>();

export function getGujaratiPanchang(date: Date): GujaratiPanchang {
  const key = formatDateKey(date);
  const cached = panchangCache.get(key);
  if (cached) return cached;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Sunrise in Gujarat (Ahmedabad ~72.6°E) averages ~06:30 IST = 01:00 UTC
  const jd = toJulianDay(year, month, day + 1.0 / 24.0);

  const sLon = sunLongitude(jd);
  const mLon = moonLongitude(jd);
  const ayan = lahiriAyanamsa(jd);

  const elongation = mod360(mLon - sLon);
  const tithiIndex0 = Math.floor(elongation / 12); // 0..29
  const isSud = tithiIndex0 < 15;
  const pakshaEn: 'Sud' | 'Vad' = isSud ? 'Sud' : 'Vad';
  const pakshaGu: 'સુદ' | 'વદ' = isSud ? 'સુદ' : 'વદ';
  const tithiNum = (tithiIndex0 % 15) + 1; // 1..15

  const tithiEn =
    !isSud && tithiNum === 15 ? 'Amas' : TITHI_NAMES_EN[tithiNum - 1];
  const tithiGu =
    !isSud && tithiNum === 15 ? 'અમાસ' : TITHI_NAMES_GU[tithiNum - 1];

  // Determine Amanta Lunar Month via Solar Rashi at preceding & next New Moon
  const prevNM = findPreviousNewMoon(jd + 0.02);
  const nextNM = findNextNewMoon(prevNM);

  const sunSidPrev = mod360(sunLongitude(prevNM) - lahiriAyanamsa(prevNM));
  const sunSidNext = mod360(sunLongitude(nextNM) - lahiriAyanamsa(nextNM));

  const rashiPrev = Math.floor(sunSidPrev / 30); // 0=Mesha .. 11=Meena
  const rashiNext = Math.floor(sunSidNext / 30);

  // If the Sun stays in the same Rashi between two new moons, it's an Adhik Mas
  const isAdhik = rashiPrev === rashiNext;
  // In Amanta system: Chaitra is the lunar month in which Sun enters Mesha (0),
  // i.e., preceding New Moon occurs in Meena (11), so monthIndex = (rashiPrev + 1) % 12
  // Wait: if rashiPrev = 11 (Meena), (11 + 1) % 12 = 0 -> Chaitra!
  // Let's verify Kartak: Sun enters Vrischika (7) in Kartak -> prevNM is in Tula (6) -> (6 + 1) % 12 = 7 -> Kartak!
  const monthIdx = (rashiPrev + 1) % 12;

  const monthEn = GUJARATI_MONTHS_EN[monthIdx];
  const monthGu = GUJARATI_MONTHS_GU[monthIdx];

  // Vikram Samvat (Gujarati Kartakadi): increments on Kartak Sud 1 (monthIdx = 7)
  // Jan–Oct (Posh/Maha/Fagan/Chaitra/Vaishakh/Jeth/Ashadh/Shravan/Bhadarvo/Aso): Gregorian + 56
  // Exception: If Gregorian month is Nov/Dec and lunar month is Kartak(7), Magshar(8), Posh(9) -> Gregorian + 57
  // If Gregorian month is Oct and lunar month is already Kartak(7) -> Gregorian + 57
  let vikramSamvat = year + 56;
  if (
    (month >= 10 && monthIdx >= 7 && monthIdx <= 9) ||
    (month === 12 && monthIdx === 10)
  ) {
    vikramSamvat = year + 57;
  }

  // Sidereal Moon Nakshatra
  const moonSid = mod360(mLon - ayan);
  const nakIdx = Math.floor(moonSid / (360 / 27)) % 27;

  // Shaka Year (Civil Indian national epoch)
  const shakaYear = vikramSamvat - 135;

  // Yoga: Sidereal Sun + Sidereal Moon / (360 / 27)
  const sunSid = mod360(sLon - ayan);
  const yogaIdx = Math.floor(mod360(sunSid + moonSid) / (360 / 27)) % 27;
  const yogaEn = YOGA_EN[yogaIdx];

  // Karana: half-tithi (6 degrees of elongation)
  const halfTithi = Math.floor(elongation / 6) % 60;
  let karanaEn = '';
  if (halfTithi === 0) {
    karanaEn = 'Kintughna';
  } else if (halfTithi >= 57) {
    karanaEn = KARANA_EN[7 + (halfTithi - 57)] || 'Naga';
  } else {
    karanaEn = KARANA_EN[(halfTithi - 1) % 7];
  }

  // Ritu (season based on lunar month index 0..11)
  const rituIdx = Math.floor(monthIdx / 2) % 6;
  const rituEn = RITU_EN[rituIdx];

  // Samvatsara (60-year Jovian cycle)
  const samvatsaraIdx = ((year - 1987) % 60 + 60) % 60;
  const samvatsaraEn = SAMVATSARA_EN[samvatsaraIdx];

  // Day of week
  const dow = date.getDay();
  const vaarEn = VAAR_EN[dow];
  const vaarGu = VAAR_GU[dow];

  // Rahu Kaal & Abhijit Muhurat
  const rahuKaal = RAHU_KAAL_BY_DOW[dow];
  const abhijitMuhurat = dow === 3 ? 'None (Avoided on Wed)' : '11:45 AM – 12:35 PM';

  // Moon Illumination %
  const moonIllumination = Math.round(((1 - Math.cos(elongation * DEG2RAD)) / 2) * 100);
  let moonPhaseLabel = 'Waxing';
  if (tithiIndex0 === 14) moonPhaseLabel = 'Full Moon (Poonam)';
  else if (tithiIndex0 === 29) moonPhaseLabel = 'New Moon (Amas)';
  else if (tithiIndex0 < 7) moonPhaseLabel = 'Waxing Crescent';
  else if (tithiIndex0 < 14) moonPhaseLabel = 'Waxing Gibbous';
  else if (tithiIndex0 < 22) moonPhaseLabel = 'Waning Gibbous';
  else moonPhaseLabel = 'Waning Crescent';

  // Special recurring Gujarati Tithi observances
  let specialTithi: GujaratiPanchang['specialTithi'] = undefined;
  if (isSud && tithiNum === 15) {
    specialTithi = {
      nameEn: `${monthEn} Poonam`,
      nameGu: `${monthGu} પૂનમ`,
      significance: `Full moon day (Purnima) of ${monthEn} month in the Gujarati Vikram Samvat calendar, traditionally observed with temple darshan, Satyanarayan Katha, and charity.`,
    };
  } else if (!isSud && tithiNum === 15) {
    specialTithi = {
      nameEn: `${monthEn} Amas`,
      nameGu: `${monthGu} અમાસ`,
      significance: `New moon day (Amavasya) marking the completion of the Gujarati lunar month of ${monthEn}.`,
    };
  } else if (tithiNum === 11) {
    specialTithi = {
      nameEn: `${monthEn} ${pakshaEn} Agiyaras`,
      nameGu: `${monthGu} ${pakshaGu} અગિયારસ`,
      significance: `Auspicious Ekadashi (Agiyaras) fasting day in ${monthEn} ${pakshaEn}, devoted to Lord Vishnu.`,
    };
  } else if (!isSud && tithiNum === 4) {
    specialTithi = {
      nameEn: 'Sankashti Choth',
      nameGu: 'સંકષ્ટી ચોથ',
      significance: `Monthly Krishna Paksha Chaturthi dedicated to Lord Ganesha, observed until moonrise.`,
    };
  } else if (tithiNum === 13) {
    specialTithi = {
      nameEn: 'Pradosh Vrat',
      nameGu: 'પ્રદોષ વ્રત',
      significance: `Trayodashi (Teras) evening observance dedicated to Lord Shiva during twilight.`,
    };
  }

  const adhikPrefixEn = isAdhik ? 'Adhik ' : '';
  const adhikPrefixGu = isAdhik ? 'અધિક ' : '';

  const tithiShortEn =
    tithiNum === 15
      ? isSud
        ? 'Poonam'
        : 'Amas'
      : tithiNum === 11
      ? 'Agiyaras'
      : String(tithiNum);

  const tithiShortGu =
    tithiNum === 15
      ? isSud
        ? 'પૂનમ'
        : 'અમાસ'
      : tithiNum === 11
      ? 'અગિયારસ'
      : toGujaratiDigits(tithiNum);

  const result: GujaratiPanchang = {
    dateKey: key,
    vikramSamvat,
    shakaYear,
    monthEn: `${adhikPrefixEn}${monthEn}`,
    monthGu: `${adhikPrefixGu}${monthGu}`,
    isAdhik,
    pakshaEn,
    pakshaGu,
    tithiNum,
    tithiEn,
    tithiGu,
    vaarEn,
    vaarGu,
    nakshatraEn: NAKSHATRA_EN[nakIdx],
    nakshatraGu: NAKSHATRA_GU[nakIdx],
    yogaEn,
    karanaEn,
    rituEn,
    samvatsaraEn,
    rahuKaal,
    abhijitMuhurat,
    moonIllumination,
    moonPhaseLabel,
    specialTithi,
    shortLabelEn: `${adhikPrefixEn}${monthEn} ${pakshaEn} ${tithiShortEn}`,
    shortLabelGu: `${adhikPrefixGu}${monthGu} ${pakshaGu} ${tithiShortGu}`,
  };

  panchangCache.set(key, result);
  return result;
}
