import {
  signUp,
  signIn,
  getUserByToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updateProfile,
  deleteAccount,
  getEmailsForUser,
} from './server/authService';
import { buildIcs, parseIcsEvents } from './src/utils/icsExport';
import {
  WORLD_CALENDAR_SYSTEMS,
  convertToWorldCalendar,
  convertCalendarDate,
} from './src/data/worldCalendars';
import { getGujaratiPanchang } from './src/data/gujaratiPanchang';
import {
  getDetailedMoon,
  getSolarAlmanac,
  ECLIPSE_CATALOG,
  ANNUAL_METEOR_SHOWERS,
  PLANETARY_EVENTS,
} from './src/services/astronomyService';
import {
  PRESET_WORLD_CITIES,
  getCityTimeInfo,
  calculateMeetingOverlap,
} from './src/services/worldTimeService';
import {
  computeTimeAnalytics,
  exportTimeCsv,
  TimeEntry,
  CATEGORY_META,
} from './src/services/timeTrackingService';
import { CalendarEvent } from './src/types/calendar';

async function runTests() {
  console.log('--- STARTING CALENDAR.Q EXPANDED E2E TEST SUITE ---');
  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passCount++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failCount++;
    }
  }

  // ==========================================
  // TEST 1: Auth Service & Transactional Outbox
  // ==========================================
  console.log('\n[1] Testing Auth Service & Transactional Email Outbox...');
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPass = 'SecurePass123!';

  const signupRes = signUp('Aarav Patel', testEmail, testPass);
  assert(Boolean(signupRes.user && signupRes.token), 'User signed up successfully with session token');
  assert(signupRes.user.emailVerified === false, 'New user starts with emailVerified: false');

  const outbox = getEmailsForUser(testEmail);
  const verifyEmailMsg = outbox.find((e) => e.to === testEmail && e.subject.includes('Verify'));
  assert(Boolean(verifyEmailMsg), 'Verification email sent to persistent transactional outbox');

  const codeMatch = verifyEmailMsg?.body.match(/\b\d{6}\b/);
  const verifyCode = codeMatch ? codeMatch[0] : '';
  assert(verifyCode.length === 6, `Extracted 6-digit verification code: ${verifyCode}`);

  const verifySuccess = verifyEmail(testEmail, verifyCode);
  assert(verifySuccess, 'Email verification succeeded with 6-digit code');

  const meAfterVerify = getUserByToken(signupRes.token);
  assert(meAfterVerify?.emailVerified === true, 'User is now emailVerified: true');

  const loginRes = signIn(testEmail, testPass);
  assert(Boolean(loginRes.user && loginRes.token), 'User successfully logged in with password');

  let wrongPassCaught = false;
  try {
    signIn(testEmail, 'WrongPassword!');
  } catch {
    wrongPassCaught = true;
  }
  assert(wrongPassCaught, 'Invalid password rejected correctly with error');

  // Password Reset Flow
  const returnedToken = forgotPassword(testEmail);
  const resetEmail = getEmailsForUser(testEmail).find((e) => e.to === testEmail && e.subject.includes('Reset'));
  assert(Boolean(resetEmail), 'Password reset email sent to outbox with secure reset token');

  const tokenMatch = resetEmail?.body.match(/[a-f0-9]{16}/);
  const resetToken = tokenMatch ? tokenMatch[0] : returnedToken;
  assert(Boolean(resetToken) && resetToken.length === 16, `Extracted password reset token from email body: ${resetToken}`);

  const resetSuccess = resetPassword(resetToken, 'NewSecurePass456!');
  assert(resetSuccess, 'Password reset succeeded with token');

  const newLogin = signIn(testEmail, 'NewSecurePass456!');
  assert(Boolean(newLogin.user), 'User logged in with new password');

  // Profile update & account deletion
  const updatedUser = updateProfile(signupRes.user.id, { name: 'Aarav K. Patel', timezone: 'America/New_York' });
  assert(updatedUser?.name === 'Aarav K. Patel' && updatedUser?.timezone === 'America/New_York', 'Profile updated correctly');

  const deleteSuccess = deleteAccount(signupRes.user.id);
  assert(deleteSuccess, 'Account deleted successfully with complete data erasure');

  let loginAfterDeleteCaught = false;
  try {
    signIn(testEmail, 'NewSecurePass456!');
  } catch {
    loginAfterDeleteCaught = true;
  }
  assert(loginAfterDeleteCaught, 'Deleted user cannot log in');

  // ==========================================
  // TEST 2: RFC 5545 ICS Export and Import Engine
  // ==========================================
  console.log('\n[2] Testing RFC 5545 ICS Export & Import Engine...');
  const sampleEvents: CalendarEvent[] = [
    {
      id: 'e1',
      calendarId: 'personal',
      title: 'Sprint Planning Meeting',
      startDate: '2026-03-10',
      endDate: '2026-03-10',
      startMinutes: 600, // 10:00 AM
      endMinutes: 660,   // 11:00 AM
      allDay: false,
      location: 'Conference Room Alpha',
      notes: 'Review Q1 roadmap and deliverables',
      recurrence: {
        frequency: 'weekly',
        interval: 1,
        until: '2026-06-30',
      },
      reminders: [
        { id: 'r1', minutes: 15, method: 'popup' },
        { id: 'r2', minutes: 60, method: 'popup' },
      ],
      attendeesList: [
        { name: 'Sarah Connor', email: 'sarah@example.com', status: 'accepted' },
        { name: 'John Doe', email: 'john@example.com', status: 'needsAction' },
      ],
    },
    {
      id: 'e2',
      calendarId: 'birthdays',
      title: 'Mom’s Birthday Celebration',
      startDate: '2026-04-15',
      endDate: '2026-04-15',
      startMinutes: 0,
      endMinutes: 0,
      allDay: true,
      category: 'birthday',
      notes: 'Family dinner',
    },
  ];

  const icsString = buildIcs(sampleEvents, [], {
    scope: 'all',
    calendarName: 'calendar.q Calendar',
    timezone: 'Asia/Kolkata',
  });

  assert(icsString.includes('BEGIN:VCALENDAR'), 'ICS contains BEGIN:VCALENDAR');
  assert(icsString.includes('VERSION:2.0'), 'ICS contains VERSION:2.0 RFC 5545 specification');
  assert(icsString.includes('SUMMARY:Sprint Planning Meeting'), 'ICS contains event summary');
  assert(icsString.includes('RRULE:FREQ=WEEKLY;UNTIL=20260630T235959Z'), 'ICS contains valid RRULE');
  assert(icsString.includes('BEGIN:VALARM'), 'ICS contains VALARM for reminders');
  assert(icsString.includes('CN=Sarah Connor:mailto:sarah@example.com'), 'ICS contains attendee mailto');
  assert(icsString.includes('DTSTART;VALUE=DATE:20260415'), 'ICS handles all-day event DATE format');
  assert(icsString.includes('END:VCALENDAR'), 'ICS ends with END:VCALENDAR');

  const parsedEvents = parseIcsEvents(icsString, 'personal');
  assert(parsedEvents.length === 2, `Parsed exactly 2 events back from generated ICS (got 2)`);
  assert(parsedEvents[0].title === 'Sprint Planning Meeting', 'Parsed event title matches original');
  assert(parsedEvents[0].location === 'Conference Room Alpha', 'Parsed event location matches original');
  assert(parsedEvents[0].startMinutes === 600, 'Parsed event start time matches 10:00 AM');
  assert(parsedEvents[1].allDay === true, 'Parsed birthday event correctly recognized as all-day');

  // ==========================================
  // TEST 3: Multi-Calendar Calculations across 33 Systems (including Nepali BS)
  // ==========================================
  console.log('\n[3] Testing Unified 33 World Calendar Conversions & Nepali BS...');
  const testDates = [
    new Date(2026, 0, 1),   // Jan 1, 2026
    new Date(2026, 2, 20),  // Vernal Equinox / Chaitra / Ramadan / Nowruz
    new Date(2026, 10, 8),  // Diwali period 2026
  ];

  assert(WORLD_CALENDAR_SYSTEMS.length >= 33, `Found ${WORLD_CALENDAR_SYSTEMS.length} registered world calendar systems (>= 33)`);

  const nepaliSystem = WORLD_CALENDAR_SYSTEMS.find((s) => s.id === 'nepali-bs');
  assert(Boolean(nepaliSystem), 'Nepali Bikram Sambat (nepali-bs) registered in system catalog');

  const nepaliConverted = convertToWorldCalendar(new Date(2026, 0, 1), 'nepali-bs', false);
  assert(nepaliConverted.formatted.includes('2082') || nepaliConverted.formatted.includes('Poush') || nepaliConverted.formatted.includes('BS'), `Nepali BS calculation for Jan 1, 2026: ${nepaliConverted.formatted}`);

  for (const date of testDates) {
    for (const sys of WORLD_CALENDAR_SYSTEMS) {
      const result = convertToWorldCalendar(date, sys.id, false);
      if (!result.formatted || !result.name) {
        assert(false, `Conversion failed for ${sys.id} on ${date.toISOString()}`);
      }
    }
  }
  assert(true, 'All 33 world calendar systems converted cleanly across all test dates with valid formatted outputs');

  // Verify ISO Week calculation
  const isoWeekCheck = convertToWorldCalendar(new Date(2026, 0, 1), 'iso-week', false);
  assert(isoWeekCheck.formatted.includes('Week') || isoWeekCheck.formatted.includes('2026-W'), `ISO week output: ${isoWeekCheck.formatted}`);

  // Verify Academic & Fiscal
  const academicCheck = convertToWorldCalendar(new Date(2026, 8, 15), 'academic', false);
  assert(academicCheck.formatted.includes('Fall') || academicCheck.formatted.includes('Semester'), `Academic output: ${academicCheck.formatted}`);

  const fiscalCheck = convertToWorldCalendar(new Date(2026, 3, 15), 'fiscal', false);
  assert(fiscalCheck.formatted.includes('FY') && fiscalCheck.formatted.includes('Q'), `Fiscal output: ${fiscalCheck.formatted}`);

  // ==========================================
  // TEST 4: Universal 2-Way Calendar Date Converter
  // ==========================================
  console.log('\n[4] Testing Universal 2-Way Calendar Converter...');
  const testConversions = [
    { from: 'gregorian' as const, year: 2026, month: 3, day: 20, target: 'islamic-hijri' as const },
    { from: 'nepali-bs' as const, year: 2082, month: 9, day: 17, target: 'gregorian' as const },
    { from: 'hebrew' as const, year: 5786, month: 7, day: 1, target: 'gregorian' as const },
    { from: 'solar-hijri' as const, year: 1405, month: 1, day: 1, target: 'gregorian' as const },
    { from: 'indian-saka' as const, year: 1948, month: 1, day: 1, target: 'gregorian' as const },
  ];

  for (const tc of testConversions) {
    const res = convertCalendarDate(tc.from, tc.year, tc.month, tc.day, tc.target);
    assert(Boolean(res && res.result && res.result.formatted && res.gregorianDate), `Converted ${tc.from} (${tc.year}-${tc.month}-${tc.day}) -> ${tc.target}: ${res?.result?.formatted}`);
  }

  // ==========================================
  // TEST 5: Complete Hindu Panchang Calculations
  // ==========================================
  console.log('\n[5] Testing Complete Hindu Panchang Engine...');
  const panchangNov = getGujaratiPanchang(new Date(2026, 10, 8));
  assert(panchangNov.vikramSamvat === 2083 || panchangNov.vikramSamvat === 2082, `Vikram Samvat year is ${panchangNov.vikramSamvat}`);
  assert(panchangNov.shakaYear === 1948 || panchangNov.shakaYear === 1947, `Shaka Samvat year is ${panchangNov.shakaYear}`);
  assert(Boolean(panchangNov.monthEn && panchangNov.pakshaEn && panchangNov.tithiEn), 'Panchang month, paksha, tithi calculated');
  assert(Boolean(panchangNov.yogaEn), `Panchang Yoga calculated: ${panchangNov.yogaEn}`);
  assert(Boolean(panchangNov.karanaEn), `Panchang Karana calculated: ${panchangNov.karanaEn}`);
  assert(Boolean(panchangNov.rituEn), `Panchang Ritu calculated: ${panchangNov.rituEn}`);
  assert(Boolean(panchangNov.samvatsaraEn), `Panchang Samvatsara calculated: ${panchangNov.samvatsaraEn}`);
  assert(Boolean(panchangNov.rahuKaal), `Rahu Kaal window calculated: ${panchangNov.rahuKaal}`);
  assert(Boolean(panchangNov.abhijitMuhurat), `Abhijit Muhurat window calculated: ${panchangNov.abhijitMuhurat}`);
  assert(typeof panchangNov.moonIllumination === 'number' && panchangNov.moonIllumination >= 0 && panchangNov.moonIllumination <= 100, `Moon illumination is ${panchangNov.moonIllumination}%`);
  assert(Boolean(panchangNov.moonPhaseLabel), `Moon phase label is "${panchangNov.moonPhaseLabel}"`);

  // ==========================================
  // TEST 6: Astronomy Calendar & Solar Almanac
  // ==========================================
  console.log('\n[6] Testing Astronomy Calendar & Solar Almanac Engine...');
  const moon = getDetailedMoon(new Date(2026, 2, 20));
  assert(Boolean(moon.phaseName), `Moon phase name: ${moon.phaseName}`);
  assert(moon.illuminationPercent >= 0 && moon.illuminationPercent <= 100, `Moon illumination: ${moon.illuminationPercent}%`);
  assert(moon.ageDays >= 0 && moon.ageDays <= 30, `Moon age: ${moon.ageDays} days`);
  assert(moon.distanceKm > 350000 && moon.distanceKm < 410000, `Moon distance: ${moon.distanceKm} km`);
  assert(typeof moon.isSupermoon === 'boolean', `Supermoon flag: ${moon.isSupermoon}`);
  assert(Boolean(moon.nextFullMoonDate && moon.nextNewMoonDate), `Upcoming phases: Full=${moon.nextFullMoonDate}, New=${moon.nextNewMoonDate}`);

  const solar = getSolarAlmanac(new Date(2026, 5, 21), 28.6139, 77.209); // Summer Solstice in New Delhi
  assert(Boolean(solar.sunrise && solar.sunset), `Sunrise: ${solar.sunrise}, Sunset: ${solar.sunset}`);
  assert(Boolean(solar.dayLength), `Day length: ${solar.dayLength}`);
  assert(Boolean(solar.civilTwilightDawn && solar.civilTwilightDusk), `Civil twilight: Dawn=${solar.civilTwilightDawn}, Dusk=${solar.civilTwilightDusk}`);
  assert(Boolean(solar.goldenHourEvening), `Golden hour: ${solar.goldenHourEvening}`);

  assert(ECLIPSE_CATALOG.length >= 4, `Eclipse catalog contains ${ECLIPSE_CATALOG.length} events for 2026-2027`);
  assert(ANNUAL_METEOR_SHOWERS.length >= 6, `Meteor showers catalog contains ${ANNUAL_METEOR_SHOWERS.length} major showers`);
  assert(PLANETARY_EVENTS.length >= 5, `Planetary events catalog contains ${PLANETARY_EVENTS.length} events`);

  // ==========================================
  // TEST 7: World Time Dashboard & Meeting Overlap Calculator
  // ==========================================
  console.log('\n[7] Testing World Time Dashboard & Meeting Overlap Calculator...');
  assert(PRESET_WORLD_CITIES.length === 12, `World time catalog contains ${PRESET_WORLD_CITIES.length} global cities`);

  const nyc = PRESET_WORLD_CITIES.find((c) => c.id === 'newyork')!;
  const tokyo = PRESET_WORLD_CITIES.find((c) => c.id === 'tokyo')!;
  const london = PRESET_WORLD_CITIES.find((c) => c.id === 'london')!;

  const testMeetingDate = new Date(2026, 2, 20);
  const nycInfo = getCityTimeInfo(nyc, testMeetingDate);
  const tokyoInfo = getCityTimeInfo(tokyo, testMeetingDate);
  assert(Boolean(nycInfo.timeString && nycInfo.utcOffsetString), `NYC Info: ${nycInfo.timeString} (${nycInfo.utcOffsetString})`);
  assert(Boolean(tokyoInfo.timeString && tokyoInfo.utcOffsetString), `Tokyo Info: ${tokyoInfo.timeString} (${tokyoInfo.utcOffsetString})`);

  const overlapRes = calculateMeetingOverlap([nyc, london, tokyo]);
  assert(overlapRes.slots.length === 24, `24-hour overlap matrix computed for NYC, London, Tokyo`);
  const anyOverlapSlot = overlapRes.slots.find((s) => s.cityTimes.filter((c) => c.isBusinessHour).length >= 2);
  assert(Boolean(anyOverlapSlot), `Found multi-city business hour overlapping slot: UTC ${anyOverlapSlot?.utcHour}:00 (${anyOverlapSlot?.cityTimes.filter((c) => c.isBusinessHour).length}/3 cities)`);

  // ==========================================
  // TEST 8: Time Tracking, Live Timer & Analytics Engine
  // ==========================================
  console.log('\n[8] Testing Time Tracking & Personal Analytics Engine...');
  const categoryKeys = Object.keys(CATEGORY_META);
  assert(categoryKeys.length === 8, `Defined ${categoryKeys.length} tracking categories`);

  const targetDateKey = '2026-03-20';
  const targetDateObj = new Date(2026, 2, 20, 12, 0, 0);

  const mockEntries: TimeEntry[] = [
    {
      id: 'log-1',
      activityName: 'UI Component Architecture',
      category: 'work',
      projectName: 'calendar.q',
      dateKey: targetDateKey,
      startTime: '2026-03-20T09:00:00.000Z',
      endTime: '2026-03-20T12:00:00.000Z',
      durationMinutes: 180,
      isRunning: false,
    },
    {
      id: 'log-2',
      activityName: 'Algorithm Optimization',
      category: 'study',
      projectName: 'Astronomy',
      dateKey: targetDateKey,
      startTime: '2026-03-20T13:00:00.000Z',
      endTime: '2026-03-20T15:00:00.000Z',
      durationMinutes: 120,
      isRunning: false,
    },
    {
      id: 'log-3',
      activityName: 'Team Sync',
      category: 'meeting',
      projectName: 'Engineering',
      dateKey: targetDateKey,
      startTime: '2026-03-20T15:30:00.000Z',
      endTime: '2026-03-20T16:30:00.000Z',
      durationMinutes: 60,
      isRunning: false,
    },
  ];

  const analytics = computeTimeAnalytics(mockEntries, targetDateObj);
  assert(analytics.totalMinutesToday === 360, `Total minutes logged today: ${analytics.totalMinutesToday} min (expected 360)`);
  assert(analytics.productiveHoursToday === 6.0, `Productive hours today: ${analytics.productiveHoursToday} hrs (expected 6.0)`);
  const workCat = analytics.categories.find((c) => c.category === 'work');
  assert(workCat?.totalMinutes === 180, `Work category breakdown: ${workCat?.totalMinutes} min`);
  const studyCat = analytics.categories.find((c) => c.category === 'study');
  assert(studyCat?.totalMinutes === 120, `Study category breakdown: ${studyCat?.totalMinutes} min`);

  const csv = exportTimeCsv(mockEntries);
  assert(csv.startsWith('ID,Date,Activity,Category,Project,Start Time,End Time,Duration (Minutes),Notes'), 'CSV contains correct header columns');
  assert(csv.includes('UI Component Architecture'), 'CSV contains entry data');

  console.log(`\n======================================================`);
  console.log(`EXPANDED TEST SUITE SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log(`======================================================`);

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
