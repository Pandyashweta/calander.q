import { FestivalItem, FestivalLayerId } from '../types/calendar';
import { formatDateKey } from '../utils/dateUtils';
import { getGujaratiPanchang } from './gujaratiPanchang';

/**
 * Curated multi-year lunar festivals (2025, 2026, 2027) covering:
 * - Pan-Indian Festivals (Hindu, Islamic, Sikh, Jain, Buddhist, Christian, Regional)
 * - Gujarati Cultural Festivals & Vrats
 * - Indian National & Gazetted Holidays
 */
const YEARLY_FESTIVALS: FestivalItem[] = [
  // ======================== 2025 ========================
  { id: 'ind-2025-lohri', date: '2025-01-13', title: 'Lohri', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'North Indian harvest bonfire festival celebrating winter solstice and rabi crops.', region: 'Punjab & North India' },
  { id: 'guj-2025-uttarayan', date: '2025-01-14', title: 'Uttarayan · Makar Sankranti', gujaratiTitle: 'ઉત્તરાયણ · મકરસંક્રાંતિ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Gujarat’s iconic kite-flying festival celebrating the sun’s northward transit into Makara Rashi, enjoyed with Undhiyu, Jalebi, and Chikki.', region: 'Gujarat & Pan-India', isMajor: true },
  { id: 'ind-2025-pongal', date: '2025-01-14', title: 'Pongal & Magh Bihu', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'South Indian and Assamese harvest thanksgiving festivals honoring the Sun and cattle.', region: 'Tamil Nadu & Assam' },
  { id: 'guj-2025-vasi', date: '2025-01-15', title: 'Vasi Uttarayan', gujaratiTitle: 'વાસી ઉત્તરાયણ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Second day of Gujarat’s Uttarayan celebrations with rooftop kite flying and family feasts.', region: 'Gujarat' },
  { id: 'ind-2025-vasant', date: '2025-02-02', title: 'Vasant Panchami', gujaratiTitle: 'વસંત પંચમી', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Spring festival honoring Goddess Saraswati, patron of knowledge, music, and arts.', isMajor: true },
  { id: 'ind-2025-shivaratri', date: '2025-02-26', title: 'Maha Shivaratri', gujaratiTitle: 'મહાશિવરાત્રી', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Great night of Lord Shiva observed with all-night vigil, Rudrabhishek, and the Bhavnath Mela in Junagadh.', isMajor: true },
  { id: 'hol-2025-shivaratri', date: '2025-02-26', title: 'Maha Shivaratri (Holiday)', layerId: 'national-holidays', categoryLabel: 'Public Holiday', description: 'Gazetted public holiday observed across Gujarat and most Indian states.' },
  { id: 'guj-2025-holika', date: '2025-03-13', title: 'Holi · Holika Dahan', gujaratiTitle: 'હોળી · હોલિકા દહન', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Fagan Sud Poonam ceremonial bonfire symbolizing the triumph of devotion over evil.', isMajor: true },
  { id: 'ind-2025-holi', date: '2025-03-14', title: 'Dhuleti · Holi', gujaratiTitle: 'ધુળેટી', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Festival of colors celebrating spring, joy, and community warmth.', isMajor: true },
  { id: 'hol-2025-holi', date: '2025-03-14', title: 'Holi (Public Holiday)', layerId: 'national-holidays', categoryLabel: 'National Holiday', description: 'National holiday across India celebrating Holi / Dhuleti.' },
  { id: 'ind-2025-ugadi', date: '2025-03-30', title: 'Gudi Padwa · Ugadi · Cheti Chand', gujaratiTitle: 'ચેટીચાંદ · ગુડી પડવો', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Chaitra Navratri start and New Year for Maharashtra, Karnataka, Andhra, Telangana, and Sindhi communities.', isMajor: true },
  { id: 'ind-2025-eid', date: '2025-03-31', title: 'Eid-ul-Fitr', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Joyous festival marking the conclusion of Ramadan with prayers, charity, and festive feasts.', isMajor: true },
  { id: 'ind-2025-ramnavami', date: '2025-04-06', title: 'Ram Navami', gujaratiTitle: 'રામ નવમી', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Celebration of Lord Rama’s birth on Chaitra Sud Nom.', isMajor: true },
  { id: 'ind-2025-mahavir', date: '2025-04-10', title: 'Mahavir Jayanti', gujaratiTitle: 'મહાવીર જયંતિ', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Birth anniversary of Lord Mahavira, the 24th Jain Tirthankara.' },
  { id: 'ind-2025-hanuman', date: '2025-04-12', title: 'Hanuman Jayanti', gujaratiTitle: 'હનુમાન જયંતિ', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Celebration of Lord Hanuman’s birth on Chaitra Poonam.' },
  { id: 'ind-2025-baisakhi', date: '2025-04-14', title: 'Baisakhi · Vishu · Poila Boishakh', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Solar New Year and spring harvest celebrations across Punjab, Kerala, Tamil Nadu, and Bengal.' },
  { id: 'ind-2025-goodfriday', date: '2025-04-18', title: 'Good Friday', layerId: 'national-holidays', categoryLabel: 'Public Holiday', description: 'Christian observance commemorating the crucifixion of Jesus Christ.' },
  { id: 'guj-2025-akhatrij', date: '2025-04-30', title: 'Akha Trij · Akshaya Tritiya', gujaratiTitle: 'અખા ત્રીજ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'One of the most auspicious days in the Gujarati calendar for new ventures, weddings, and charity.', isMajor: true },
  { id: 'ind-2025-buddha', date: '2025-05-12', title: 'Buddha Purnima', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Birth, enlightenment, and Mahaparinirvana of Gautama Buddha.' },
  { id: 'guj-2025-bhim', date: '2025-06-06', title: 'Bhim Agiyaras', gujaratiTitle: 'ભીમ અગિયારસ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Nirjala Ekadashi observed widely across Gujarat with waterless fasting and mango offerings.' },
  { id: 'ind-2025-bakrid', date: '2025-06-07', title: 'Eid-ul-Adha (Bakrid)', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Festival of Sacrifice celebrating devotion, generosity, and sharing.' },
  { id: 'guj-2025-ashadhibij', date: '2025-06-27', title: 'Ashadhi Bij · Rath Yatra', gujaratiTitle: 'અષાઢી બીજ · રથયાત્રા', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Kutchi New Year and the grand Jagannath Rath Yatra in Ahmedabad and Puri.', isMajor: true },
  { id: 'ind-2025-gurupurnima', date: '2025-07-10', title: 'Guru Purnima', gujaratiTitle: 'ગુરુ પૂર્ણિમા', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Day of gratitude honoring spiritual and academic teachers on Ashadh Poonam.' },
  { id: 'ind-2025-rakhi', date: '2025-08-09', title: 'Raksha Bandhan · Balev', gujaratiTitle: 'રક્ષાબંધન · બળેવ', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Festival celebrating the bond between brothers and sisters on Shravan Poonam.', isMajor: true },
  { id: 'guj-2025-shitla', date: '2025-08-15', title: 'Shitla Satam', gujaratiTitle: 'શીતળા સાતમ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Gujarati Shravan Vad Satam observance honoring Goddess Shitla with traditional chilled foods cooked on Randhan Chhath.' },
  { id: 'ind-2025-janmashtami', date: '2025-08-16', title: 'Krishna Janmashtami (Gokul Aatham)', gujaratiTitle: 'જન્માષ્ટમી · ગોકુળ આઠમ', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Midnight celebration of Lord Krishna’s birth across Dwarka, Mathura, and Gujarat.', isMajor: true },
  { id: 'ind-2025-ganesh', date: '2025-08-27', title: 'Ganesh Chaturthi', gujaratiTitle: 'ગણેશ ચતુર્થી', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Ten-day celebration welcoming Lord Ganesha on Bhadarvo Sud Choth.', isMajor: true },
  { id: 'ind-2025-onam', date: '2025-09-05', title: 'Thiruvonam (Onam)', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Kerala’s vibrant harvest festival featuring Pookkalam, Vallam Kali, and Onasadya.', region: 'Kerala' },
  { id: 'guj-2025-navratri', date: '2025-09-22', title: 'Navratri Begins (Ghatasthapana)', gujaratiTitle: 'નવરાત્રી પ્રારંભ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Nine nights of Garba, Dandiya Raas, and Shakti worship across Gujarat and India.', isMajor: true },
  { id: 'ind-2025-durga8', date: '2025-09-30', title: 'Durga Ashtami (Maha Aatham)', gujaratiTitle: 'મહા આઠમ', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Eighth day of Navratri and Durga Puja celebrated with Havan and Kanya Pujan.' },
  { id: 'ind-2025-dussehra', date: '2025-10-02', title: 'Dussehra · Vijayadashami', gujaratiTitle: 'દશેરા · વિજયાદશમી', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Celebration of good triumphing over evil, marked across Gujarat with Fafda and Jalebi.', isMajor: true },
  { id: 'guj-2025-sharad', date: '2025-10-06', title: 'Sharad Poonam', gujaratiTitle: 'શરદ પૂનમ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Moonlit Raas Garba night on Aso Sud Poonam celebrated with sweet doodh-pauva under the full moon.' },
  { id: 'guj-2025-vaghbaras', date: '2025-10-17', title: 'Vagh Baras', gujaratiTitle: 'વાઘ બારસ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Opening day of Gujarat’s Diwali festival week on Aso Vad Baras.' },
  { id: 'ind-2025-dhanteras', date: '2025-10-18', title: 'Dhanteras', gujaratiTitle: 'ધનતેરસ', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Worship of Goddess Lakshmi and Lord Dhanvantari for prosperity and health.', isMajor: true },
  { id: 'guj-2025-kalichaudas', date: '2025-10-19', title: 'Kali Chaudas · Naraka Chaturdashi', gujaratiTitle: 'કાળી ચૌદશ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Day honoring Mahakali and Lord Hanuman, dispelling negativity before Diwali.' },
  { id: 'ind-2025-diwali', date: '2025-10-20', title: 'Diwali · Chopda Pujan', gujaratiTitle: 'દિવાળી · ચોપડા પૂજન', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Festival of Lights celebrating Lakshmi Puja, diyas, rangoli, and Gujarati Chopda Pujan.', isMajor: true },
  { id: 'guj-2025-bestuvaras', date: '2025-10-22', title: 'Bestu Varas · Gujarati New Year (VS 2082)', gujaratiTitle: 'બેસતું વર્ષ · વિક્રમ સંવત ૨૦૮૨', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Kartak Sud Ekam marking the joyous Gujarati New Year with Annakut and Saal Mubarak greetings.', isMajor: true },
  { id: 'guj-2025-bhaibij', date: '2025-10-23', title: 'Bhai Bij · Bhai Dooj', gujaratiTitle: 'ભાઈ બીજ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Kartak Sud Bij honoring the cherished bond between siblings.' },
  { id: 'guj-2025-labhpancham', date: '2025-10-26', title: 'Labh Pancham', gujaratiTitle: 'લાભ પાંચમ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Kartak Sud Pancham marking the auspicious reopening of Gujarati businesses for the new year.' },
  { id: 'ind-2025-devdiwali', date: '2025-11-05', title: 'Dev Diwali · Guru Nanak Jayanti', gujaratiTitle: 'દેવ દિવાળી · કારતક પૂનમ', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Kartak Poonam celebrating Gurpurab and the festival of lights of the gods.', isMajor: true },

  // ======================== 2026 ========================
  { id: 'ind-2026-lohri', date: '2026-01-13', title: 'Lohri', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Bonfire harvest festival celebrated across Punjab and North India with til, gur, and folk songs.', region: 'North India' },
  { id: 'guj-2026-uttarayan', date: '2026-01-14', title: 'Uttarayan · Makar Sankranti', gujaratiTitle: 'ઉત્તરાયણ · મકરસંક્રાંતિ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Gujarat’s iconic International Kite Festival celebrating the sun’s northward journey, paired with Undhiyu, Jalebi, and sesame Chikki.', region: 'Gujarat & Pan-India', isMajor: true },
  { id: 'ind-2026-pongal', date: '2026-01-15', title: 'Pongal · Vasi Uttarayan', gujaratiTitle: 'વાસી ઉત્તરાયણ · પોંગલ', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Tamil harvest thanksgiving festival and Gujarat’s second day of rooftop kite celebrations.', isMajor: true },
  { id: 'ind-2026-vasant', date: '2026-01-23', title: 'Vasant Panchami', gujaratiTitle: 'વસંત પંચમી', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Spring celebration honoring Goddess Saraswati on Maha Sud Pancham.', isMajor: true },
  { id: 'ind-2026-shivaratri', date: '2026-02-15', title: 'Maha Shivaratri', gujaratiTitle: 'મહાશિવરાત્રી', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Sacred night dedicated to Lord Shiva on Maha Vad Chaudas, highlighted by Junagadh’s Bhavnath Mela.', isMajor: true },
  { id: 'hol-2026-shivaratri', date: '2026-02-15', title: 'Maha Shivaratri (Holiday)', layerId: 'national-holidays', categoryLabel: 'Public Holiday', description: 'Public holiday observed across Gujarat and India.' },
  { id: 'guj-2026-holika', date: '2026-03-03', title: 'Holi · Holika Dahan', gujaratiTitle: 'હોળી · હોલિકા દહન', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Fagan Sud Poonam ceremonial evening bonfire celebrating devotion and spring’s arrival.', isMajor: true },
  { id: 'ind-2026-holi', date: '2026-03-04', title: 'Dhuleti · Holi', gujaratiTitle: 'ધુળેટી · હોળી', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Joyous festival of colors celebrating community, renewal, and spring.', isMajor: true },
  { id: 'hol-2026-holi', date: '2026-03-04', title: 'Holi / Dhuleti (Public Holiday)', layerId: 'national-holidays', categoryLabel: 'National Holiday', description: 'National holiday across India celebrating Dhuleti / Holi.' },
  { id: 'ind-2026-ugadi', date: '2026-03-19', title: 'Gudi Padwa · Ugadi · Chaitra Navratri', gujaratiTitle: 'ચેટીચાંદ · ચૈત્રી નવરાત્રી', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Chaitra Sud Ekam marking the lunar New Year across Deccan states and start of Chaitra Navratri.', isMajor: true },
  { id: 'ind-2026-eid', date: '2026-03-20', title: 'Eid-ul-Fitr', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Celebration concluding the holy month of Ramadan with community prayers and festive meals.', isMajor: true },
  { id: 'hol-2026-eid', date: '2026-03-20', title: 'Eid-ul-Fitr (Holiday)', layerId: 'national-holidays', categoryLabel: 'National Holiday', description: 'Gazetted public holiday across India.' },
  { id: 'ind-2026-ramnavami', date: '2026-03-26', title: 'Ram Navami', gujaratiTitle: 'રામ નવમી', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Birth celebration of Lord Rama on Chaitra Sud Nom.', isMajor: true },
  { id: 'ind-2026-mahavir', date: '2026-03-31', title: 'Mahavir Jayanti', gujaratiTitle: 'મહાવીર જયંતિ', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Auspicious birth anniversary of Lord Mahavira celebrated with peace processions across Gujarat and India.' },
  { id: 'ind-2026-hanuman', date: '2026-04-02', title: 'Hanuman Jayanti', gujaratiTitle: 'હનુમાન જયંતિ', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Celebration of Lord Hanuman on Chaitra Poonam, celebrated grandly at Salangpur and temples nationwide.' },
  { id: 'hol-2026-goodfriday', date: '2026-04-03', title: 'Good Friday', layerId: 'national-holidays', categoryLabel: 'Public Holiday', description: 'Christian day of solemn remembrance preceding Easter Sunday.' },
  { id: 'ind-2026-baisakhi', date: '2026-04-14', title: 'Baisakhi · Vishu · Puthandu', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Harvest and Solar New Year festivities across Punjab, Kerala, Tamil Nadu, and Assam.' },
  { id: 'guj-2026-akhatrij', date: '2026-04-19', title: 'Akha Trij · Akshaya Tritiya', gujaratiTitle: 'અખા ત્રીજ · અક્ષય તૃતીયા', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Vaishakh Sud Trij — eternally auspicious day for starting ventures, charity, and new beginnings.', isMajor: true },
  { id: 'ind-2026-buddha', date: '2026-05-01', title: 'Buddha Purnima', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Sacred Vesak celebration honoring the birth and enlightenment of Lord Buddha.' },
  { id: 'ind-2026-bakrid', date: '2026-05-27', title: 'Eid-ul-Adha (Bakrid)', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Festival of Sacrifice marked by prayers, hospitality, and charity.', isMajor: true },
  { id: 'guj-2026-bhim', date: '2026-06-25', title: 'Bhim Agiyaras (Nirjala Ekadashi)', gujaratiTitle: 'ભીમ અગિયારસ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Jeth Sud Agiyaras celebrated across Gujarat with devotion and seasonal mango dishes.' },
  { id: 'ind-2026-muharram', date: '2026-06-26', title: 'Muharram (Ashura)', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Day of solemn remembrance in the Islamic calendar.' },
  { id: 'guj-2026-ashadhibij', date: '2026-07-16', title: 'Ashadhi Bij · Rath Yatra', gujaratiTitle: 'અષાઢી બીજ · રથયાત્રા', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Kutchi New Year and grand Jagannath Rath Yatra procession in Ahmedabad and Puri.', isMajor: true },
  { id: 'ind-2026-gurupurnima', date: '2026-07-29', title: 'Guru Purnima', gujaratiTitle: 'ગુરુ પૂર્ણિમા', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Ashadh Poonam day of reverence for teachers and mentors.' },
  { id: 'guj-2026-nagpancham', date: '2026-08-17', title: 'Nag Panchami', gujaratiTitle: 'નાગ પાંચમ', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Traditional worship honoring serpent deities and nature’s balance.' },
  { id: 'ind-2026-onam', date: '2026-08-26', title: 'Thiruvonam (Onam)', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Kerala’s beloved harvest festival of floral Pookkalam and Sadya feasts.', region: 'Kerala' },
  { id: 'ind-2026-rakhi', date: '2026-08-28', title: 'Raksha Bandhan · Balev', gujaratiTitle: 'રક્ષાબંધન · બળેવ', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Shravan Poonam celebrating sibling love and protection.', isMajor: true },
  { id: 'guj-2026-randhan', date: '2026-09-02', title: 'Randhan Chhath', gujaratiTitle: 'રાંધણ છઠ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Gujarati culinary preparation day ahead of Shitla Satam, cooking Thepla, Dhebra, and traditional snacks.' },
  { id: 'guj-2026-shitla', date: '2026-09-03', title: 'Shitla Satam', gujaratiTitle: 'શીતળા સાતમ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Shravan Vad Satam honoring Goddess Shitla, resting the kitchen stove and enjoying cooled festive delicacies.' },
  { id: 'ind-2026-janmashtami', date: '2026-09-04', title: 'Krishna Janmashtami (Gokul Aatham)', gujaratiTitle: 'જન્માષ્ટમી · ગોકુળ આઠમ', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Shravan Vad Aatham celebrating Lord Krishna’s birth with Matki Phod, bhajans, and midnight aarti.', isMajor: true },
  { id: 'ind-2026-ganesh', date: '2026-09-14', title: 'Ganesh Chaturthi', gujaratiTitle: 'ગણેશ ચતુર્થી', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Bhadarvo Sud Choth welcoming Lord Ganesha with modaks, music, and community pandals.', isMajor: true },
  { id: 'ind-2026-anant', date: '2026-09-25', title: 'Anant Chaturdashi (Ganesh Visarjan)', gujaratiTitle: 'અનંત ચૌદશ', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Concluding day of Ganeshotsav with farewell processions.' },
  { id: 'guj-2026-navratri', date: '2026-10-11', title: 'Sharad Navratri Begins (First Garba)', gujaratiTitle: 'શારદીય નવરાત્રી પ્રારંભ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Aso Sud Ekam launching nine vibrant nights of Garba, Dandiya, and Maa Amba worship.', isMajor: true },
  { id: 'ind-2026-durga8', date: '2026-10-18', title: 'Durga Ashtami (Maha Aatham)', gujaratiTitle: 'મહા આઠમ · દુર્ગાષ્ટમી', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Sacred eighth day of Navratri and Durga Puja.' },
  { id: 'ind-2026-dussehra', date: '2026-10-20', title: 'Dussehra · Vijayadashami', gujaratiTitle: 'દશેરા · વિજયાદશમી', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Victory of righteousness, celebrated in Gujarat with warm Fafda and Jalebi mornings.', isMajor: true },
  { id: 'hol-2026-dussehra', date: '2026-10-20', title: 'Dussehra (National Holiday)', layerId: 'national-holidays', categoryLabel: 'National Holiday', description: 'Gazetted public holiday across India.' },
  { id: 'guj-2026-sharad', date: '2026-10-25', title: 'Sharad Poonam', gujaratiTitle: 'શરદ પૂનમ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Aso Sud Poonam celebrated across Gujarat with open-air Garba and sweet doodh-pauva under the bright autumn moon.' },
  { id: 'ind-2026-karwa', date: '2026-10-29', title: 'Karwa Chauth', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Traditional fast observed from sunrise to moonrise for marital harmony and longevity.' },
  { id: 'guj-2026-vaghbaras', date: '2026-11-05', title: 'Vagh Baras', gujaratiTitle: 'વાઘ બારસ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'First day of Gujarat’s Diwali festivities on Aso Vad Baras, settling accounts and welcoming prosperity.' },
  { id: 'ind-2026-dhanteras', date: '2026-11-06', title: 'Dhanteras', gujaratiTitle: 'ધનતેરસ', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Auspicious worship of Goddess Lakshmi and Lord Dhanvantari for wealth and wellbeing.', isMajor: true },
  { id: 'guj-2026-kalichaudas', date: '2026-11-07', title: 'Kali Chaudas · Naraka Chaturdashi', gujaratiTitle: 'કાળી ચૌદશ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Aso Vad Chaudas evening prayers to Mahakali and Lord Hanuman.' },
  { id: 'ind-2026-diwali', date: '2026-11-08', title: 'Diwali · Lakshmi & Chopda Pujan', gujaratiTitle: 'દિવાળી · ચોપડા પૂજન', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Grand Festival of Lights celebrated with diyas, rangoli, sweets, and Gujarati Chopda Pujan.', isMajor: true },
  { id: 'hol-2026-diwali', date: '2026-11-08', title: 'Diwali (National Holiday)', layerId: 'national-holidays', categoryLabel: 'National Holiday', description: 'National holiday across India celebrating Deepavali.' },
  { id: 'guj-2026-bestuvaras', date: '2026-11-10', title: 'Bestu Varas · Gujarati New Year (VS 2083)', gujaratiTitle: 'બેસતું વર્ષ · વિક્રમ સંવત ૨૦૮૩', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Kartak Sud Ekam inaugurating Vikram Samvat 2083! Saal Mubarak greetings, temple Annakut darshan, and family visits.', isMajor: true },
  { id: 'guj-2026-bhaibij', date: '2026-11-11', title: 'Bhai Bij · Bhai Dooj', gujaratiTitle: 'ભાઈ બીજ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Kartak Sud Bij celebrating sibling affection and family gatherings.' },
  { id: 'guj-2026-labhpancham', date: '2026-11-14', title: 'Labh Pancham (Saubhagya Pancham)', gujaratiTitle: 'લાભ પાંચમ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Kartak Sud Pancham marking the auspicious reopening of businesses and shops across Gujarat.', isMajor: true },
  { id: 'ind-2026-chhath', date: '2026-11-15', title: 'Chhath Puja', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Four-day solar thanksgiving festival offering Arghya to the setting and rising Sun.', region: 'Bihar, UP & Pan-India' },
  { id: 'guj-2026-devuthi', date: '2026-11-20', title: 'Dev Uthi Agiyaras · Tulsi Vivah', gujaratiTitle: 'દેવ ઉઠી અગિયારસ · તુલસી વિવાહ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Kartak Sud Agiyaras marking the auspicious commencement of the wedding season and sacred Tulsi Vivah.', isMajor: true },
  { id: 'ind-2026-devdiwali', date: '2026-11-24', title: 'Dev Diwali · Guru Nanak Jayanti', gujaratiTitle: 'દેવ દિવાળી · કારતક પૂનમ', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Kartak Poonam celebrating Gurpurab (Prakash Parv of Guru Nanak Dev Ji) and the illumination of ghats for Dev Diwali.', isMajor: true },
  { id: 'hol-2026-gurunanak', date: '2026-11-24', title: 'Guru Nanak Jayanti (Holiday)', layerId: 'national-holidays', categoryLabel: 'National Holiday', description: 'Gazetted public holiday honoring Guru Nanak Dev Ji.' },
  { id: 'ind-2026-gita', date: '2026-12-20', title: 'Gita Jayanti · Mokshada Ekadashi', gujaratiTitle: 'ગીતા જયંતિ · મોક્ષદા અગિયારસ', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Magshar Sud Agiyaras commemorating the sacred discourse of the Bhagavad Gita.' },
  { id: 'ind-2026-datta', date: '2026-12-23', title: 'Dattatreya Jayanti', gujaratiTitle: 'દત્ત જયંતિ', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Magshar Poonam celebrating Lord Dattatreya, especially revered at Girnar in Gujarat.' },

  // ======================== 2027 ========================
  { id: 'guj-2027-uttarayan', date: '2027-01-14', title: 'Uttarayan · Makar Sankranti', gujaratiTitle: 'ઉત્તરાયણ · મકરસંક્રાંતિ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Gujarat’s beloved kite-flying festival celebrating the sun’s northward transit.', isMajor: true },
  { id: 'ind-2027-vasant', date: '2027-02-11', title: 'Vasant Panchami', gujaratiTitle: 'વસંત પંચમી', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Spring festival dedicated to Goddess Saraswati.' },
  { id: 'ind-2027-shivaratri', date: '2027-03-06', title: 'Maha Shivaratri', gujaratiTitle: 'મહાશિવરાત્રી', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Great night of Lord Shiva worship and Bhavnath Mela in Junagadh.', isMajor: true },
  { id: 'ind-2027-eid', date: '2027-03-10', title: 'Eid-ul-Fitr', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Joyous festival concluding the holy month of Ramadan.', isMajor: true },
  { id: 'guj-2027-holika', date: '2027-03-21', title: 'Holi · Holika Dahan', gujaratiTitle: 'હોળી · હોલિકા દહન', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Fagan Sud Poonam ceremonial evening bonfire.', isMajor: true },
  { id: 'ind-2027-holi', date: '2027-03-22', title: 'Dhuleti · Holi', gujaratiTitle: 'ધુળેટી · હોળી', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Vibrant festival of colors welcoming spring.', isMajor: true },
  { id: 'ind-2027-ugadi', date: '2027-04-07', title: 'Gudi Padwa · Ugadi · Cheti Chand', gujaratiTitle: 'ચેટીચાંદ · ગુડી પડવો', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Chaitra Sud Ekam New Year and start of Chaitra Navratri.' },
  { id: 'ind-2027-ramnavami', date: '2027-04-15', title: 'Ram Navami', gujaratiTitle: 'રામ નવમી', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Celebration of Lord Rama’s birth on Chaitra Sud Nom.' },
  { id: 'guj-2027-akhatrij', date: '2027-05-09', title: 'Akha Trij · Akshaya Tritiya', gujaratiTitle: 'અખા ત્રીજ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Eternally auspicious Vaishakh Sud Trij.', isMajor: true },
  { id: 'ind-2027-rakhi', date: '2027-08-17', title: 'Raksha Bandhan · Balev', gujaratiTitle: 'રક્ષાબંધન · બળેવ', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Shravan Poonam celebrating sibling bonds.', isMajor: true },
  { id: 'ind-2027-janmashtami', date: '2027-08-25', title: 'Krishna Janmashtami (Gokul Aatham)', gujaratiTitle: 'જન્માષ્ટમી · ગોકુળ આઠમ', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Shravan Vad Aatham celebrating Lord Krishna’s birth.', isMajor: true },
  { id: 'ind-2027-ganesh', date: '2027-09-04', title: 'Ganesh Chaturthi', gujaratiTitle: 'ગણેશ ચતુર્થી', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Ten-day celebration honoring Lord Ganesha.', isMajor: true },
  { id: 'guj-2027-navratri', date: '2027-09-30', title: 'Sharad Navratri Begins', gujaratiTitle: 'શારદીય નવરાત્રી પ્રારંભ', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Nine nights of Garba and Maa Shakti devotion.', isMajor: true },
  { id: 'ind-2027-dussehra', date: '2027-10-09', title: 'Dussehra · Vijayadashami', gujaratiTitle: 'દશેરા · વિજયાદશમી', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Celebration of victory of dharma over evil.', isMajor: true },
  { id: 'ind-2027-diwali', date: '2027-10-29', title: 'Diwali · Chopda Pujan', gujaratiTitle: 'દિવાળી · ચોપડા પૂજન', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Grand Festival of Lights across India.', isMajor: true },
  { id: 'guj-2027-bestuvaras', date: '2027-10-30', title: 'Bestu Varas · Gujarati New Year (VS 2084)', gujaratiTitle: 'બેસતું વર્ષ · વિક્રમ સંવત ૨૦૮૪', layerId: 'gujarati-calendar', categoryLabel: 'Gujarati Festival', description: 'Kartak Sud Ekam welcoming Vikram Samvat 2084.', isMajor: true },
  { id: 'ind-2027-devdiwali', date: '2027-11-14', title: 'Dev Diwali · Guru Nanak Jayanti', gujaratiTitle: 'દેવ દિવાળી · કારતક પૂનમ', layerId: 'indian-festivals', categoryLabel: 'Indian Festival', description: 'Kartak Poonam celebrating Gurpurab and Dev Diwali.' },

  // ======================== WORLD CALENDAR FESTIVALS (2025–2027) ========================
  // 2025
  { id: 'wld-2025-cny', date: '2025-01-29', title: 'Lunar New Year · Chinese, Korean Seollal & Tết', layerId: 'world-observances', categoryLabel: 'East Asian Lunar', description: 'Year of the Wood Snake celebrated across China, Korea, Vietnam, and East Asia.', isMajor: true },
  { id: 'wld-2025-losar', date: '2025-02-28', title: 'Losar (Tibetan New Year)', layerId: 'world-observances', categoryLabel: 'Tibetan Calendar', description: 'Traditional Tibetan Lunar New Year celebrated with prayer flags and monastery rituals.' },
  { id: 'wld-2025-ramadan', date: '2025-03-01', title: 'Ramadan Begins (1 Ramadan 1446 AH)', layerId: 'world-observances', categoryLabel: 'Islamic Hijri', description: 'Commencement of the sacred Islamic month of fasting, prayer, and reflection.', isMajor: true },
  { id: 'wld-2025-nyepi', date: '2025-03-29', title: 'Nyepi (Balinese Saka New Year)', layerId: 'world-observances', categoryLabel: 'Balinese Saka', description: 'Bali’s revered Day of Silence welcoming Saka Year 1947.' },
  { id: 'wld-2025-passover', date: '2025-04-13', title: 'Passover (Pesach · 15 Nisan 5785)', layerId: 'world-observances', categoryLabel: 'Hebrew Calendar', description: 'Major Jewish festival commemorating the Exodus from Egypt.' },
  { id: 'wld-2025-islamic-ny', date: '2025-06-26', title: 'Islamic New Year (1 Muharram 1447 AH)', layerId: 'world-observances', categoryLabel: 'Islamic Hijri', description: 'First day of Hijri Year 1447.' },
  { id: 'wld-2025-parsi', date: '2025-08-15', title: 'Parsi Navroz (Shenshai 1395 YZ)', layerId: 'world-observances', categoryLabel: 'Zoroastrian / Parsi', description: 'Zoroastrian New Year celebrated across Gujarat and Mumbai with family feasts and Agiary prayers.', isMajor: true },
  { id: 'wld-2025-rosh', date: '2025-09-23', title: 'Rosh Hashanah (Hebrew New Year 5786)', layerId: 'world-observances', categoryLabel: 'Hebrew Calendar', description: 'Jewish New Year (1 Tishrei 5786) beginning the High Holy Days.', isMajor: true },
  { id: 'wld-2025-yomkippur', date: '2025-10-02', title: 'Yom Kippur (10 Tishrei 5786)', layerId: 'world-observances', categoryLabel: 'Hebrew Calendar', description: 'Day of Atonement, the holiest day in the Jewish calendar.' },
  { id: 'wld-2025-midautumn', date: '2025-10-06', title: 'Mid-Autumn Festival · Chuseok', layerId: 'world-observances', categoryLabel: 'East Asian Lunar', description: 'Harvest full-moon festival celebrated with mooncakes and lanterns.' },
  { id: 'wld-2025-hanukkah', date: '2025-12-15', title: 'Hanukkah Begins (25 Kislev 5786)', layerId: 'world-observances', categoryLabel: 'Hebrew Calendar', description: 'Eight-day Jewish Festival of Lights.' },

  // 2026
  { id: 'wld-2026-cny', date: '2026-02-17', title: 'Lunar New Year · Chinese, Korean Seollal & Tết', layerId: 'world-observances', categoryLabel: 'East Asian Lunar', description: 'Year of the Fire Horse celebrated across China, Korea, Vietnam, and global communities.', isMajor: true },
  { id: 'wld-2026-ramadan', date: '2026-02-18', title: 'Ramadan Begins (1 Ramadan 1447 AH)', layerId: 'world-observances', categoryLabel: 'Islamic Hijri', description: 'Opening of the holy month of Ramadan in the Hijri lunar calendar.', isMajor: true },
  { id: 'wld-2026-losar', date: '2026-02-18', title: 'Losar (Tibetan New Year 2153)', layerId: 'world-observances', categoryLabel: 'Tibetan Calendar', description: 'Tibetan Fire Horse New Year celebrated across the Himalayas.' },
  { id: 'wld-2026-nyepi', date: '2026-03-19', title: 'Nyepi (Balinese Saka New Year 1948)', layerId: 'world-observances', categoryLabel: 'Balinese Saka', description: 'Bali’s annual Day of Silence, reflection, and renewal.' },
  { id: 'wld-2026-passover', date: '2026-04-02', title: 'Passover (Pesach · 15 Nisan 5786)', layerId: 'world-observances', categoryLabel: 'Hebrew Calendar', description: 'Eight-day Jewish festival celebrating liberation and spring.' },
  { id: 'wld-2026-islamic-ny', date: '2026-06-16', title: 'Islamic New Year (1 Muharram 1448 AH)', layerId: 'world-observances', categoryLabel: 'Islamic Hijri', description: 'First day of Hijri Year 1448.' },
  { id: 'wld-2026-parsi', date: '2026-08-15', title: 'Parsi Navroz (Shenshai 1396 YZ)', layerId: 'world-observances', categoryLabel: 'Zoroastrian / Parsi', description: 'Parsi New Year celebrated warmly in Gujarat (Udvada, Navsari, Surat) and Mumbai.', isMajor: true },
  { id: 'wld-2026-rosh', date: '2026-09-12', title: 'Rosh Hashanah (Hebrew New Year 5787)', layerId: 'world-observances', categoryLabel: 'Hebrew Calendar', description: 'Jewish New Year (1 Tishrei 5787) celebrated with shofar blasts and apples & honey.', isMajor: true },
  { id: 'wld-2026-yomkippur', date: '2026-09-21', title: 'Yom Kippur (10 Tishrei 5787)', layerId: 'world-observances', categoryLabel: 'Hebrew Calendar', description: 'Day of Atonement observed with fasting and reflection.' },
  { id: 'wld-2026-midautumn', date: '2026-09-25', title: 'Mid-Autumn Festival · Chuseok', layerId: 'world-observances', categoryLabel: 'East Asian Lunar', description: 'Autumn harvest full-moon celebration across East and Southeast Asia.' },
  { id: 'wld-2026-loykrathong', date: '2026-11-24', title: 'Loy Krathong & Yi Peng (Thailand)', layerId: 'world-observances', categoryLabel: 'Thai Lunar', description: 'Thai festival of floating lotus baskets and sky lanterns on the 12th full moon.' },
  { id: 'wld-2026-hanukkah', date: '2026-12-05', title: 'Hanukkah Begins (25 Kislev 5787)', layerId: 'world-observances', categoryLabel: 'Hebrew Calendar', description: 'Eight-day Jewish Festival of Lights beginning on the eve of 25 Kislev.', isMajor: true },

  // 2027
  { id: 'wld-2027-cny', date: '2027-02-06', title: 'Lunar New Year · Chinese, Korean Seollal & Tết', layerId: 'world-observances', categoryLabel: 'East Asian Lunar', description: 'Year of the Fire Goat celebrated across East and Southeast Asia.', isMajor: true },
  { id: 'wld-2027-ramadan', date: '2027-02-08', title: 'Ramadan Begins (1 Ramadan 1448 AH)', layerId: 'world-observances', categoryLabel: 'Islamic Hijri', description: 'Opening of the sacred month of Ramadan.', isMajor: true },
  { id: 'wld-2027-nyepi', date: '2027-03-08', title: 'Nyepi (Balinese Saka New Year 1949)', layerId: 'world-observances', categoryLabel: 'Balinese Saka', description: 'Bali’s traditional Day of Silence welcoming Saka Year 1949.' },
  { id: 'wld-2027-rosh', date: '2027-10-02', title: 'Rosh Hashanah (Hebrew New Year 5788)', layerId: 'world-observances', categoryLabel: 'Hebrew Calendar', description: 'Jewish New Year welcoming 5788 AM.', isMajor: true },
];

/**
 * Fixed-date annual observances (Global Days, Indian National Days, Cultural & Awareness Days, National Holidays).
 * Key format: "MM-DD" so they automatically sync across EVERY year (past, present, and future).
 */
interface AnnualDayRule {
  mmdd: string;
  title: string;
  gujaratiTitle?: string;
  layerId: FestivalLayerId;
  categoryLabel: string;
  description: string;
  isMajor?: boolean;
}

const FIXED_ANNUAL_DAYS: AnnualDayRule[] = [
  // January
  { mmdd: '01-01', title: 'New Year’s Day', layerId: 'global-days', categoryLabel: 'Global Day', description: 'First day of the Gregorian calendar year celebrated worldwide.', isMajor: true },
  { mmdd: '01-04', title: 'World Braille Day', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Raising awareness of the importance of Braille for accessibility and literacy.' },
  { mmdd: '01-09', title: 'Pravasi Bharatiya Divas', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Celebrating the contributions of the global Indian diaspora.' },
  { mmdd: '01-10', title: 'World Hindi Day', layerId: 'global-days', categoryLabel: 'Cultural Day', description: 'Promoting Hindi language and literature around the world.' },
  { mmdd: '01-12', title: 'National Youth Day', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Honoring Swami Vivekananda’s birth anniversary and empowering youth.' },
  { mmdd: '01-15', title: 'Indian Army Day', layerId: 'global-days', categoryLabel: 'National Day', description: 'Honoring the courage and service of the Indian Army.' },
  { mmdd: '01-23', title: 'Parakram Diwas', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Birth anniversary of Netaji Subhas Chandra Bose.' },
  { mmdd: '01-24', title: 'National Girl Child Day · Int’l Day of Education', layerId: 'global-days', categoryLabel: 'Global & National Day', description: 'Championing equal rights, education, and opportunity for girls and learners.' },
  { mmdd: '01-25', title: 'National Voters’ Day', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Encouraging democratic participation and civic awareness across India.' },
  { mmdd: '01-26', title: 'Republic Day of India', gujaratiTitle: 'પ્રજાસત્તાક દિન', layerId: 'national-holidays', categoryLabel: 'National Holiday', description: 'Commemorating the adoption of the Constitution of India on January 26, 1950.', isMajor: true },
  { mmdd: '01-30', title: 'Martyrs’ Day (Shaheed Diwas)', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Paying homage to Mahatma Gandhi and all freedom fighters.' },

  // February
  { mmdd: '02-02', title: 'World Wetlands Day', layerId: 'global-days', categoryLabel: 'Global Day', description: 'Highlighting the ecological role of wetlands worldwide.' },
  { mmdd: '02-04', title: 'World Cancer Day', layerId: 'global-days', categoryLabel: 'Health Day', description: 'Global initiative uniting communities to raise cancer awareness and research.' },
  { mmdd: '02-07', title: 'Rose Day', layerId: 'global-days', categoryLabel: 'Special Day', description: 'Opening day of Valentine’s Week exchanging roses with loved ones.' },
  { mmdd: '02-11', title: 'Int’l Day of Women & Girls in Science', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Recognizing women’s vital leadership and innovation across STEM fields.' },
  { mmdd: '02-13', title: 'World Radio Day · National Women’s Day', layerId: 'global-days', categoryLabel: 'Global & National Day', description: 'Celebrating radio broadcasting and Sarojini Naidu’s birth anniversary.' },
  { mmdd: '02-14', title: 'Valentine’s Day', layerId: 'global-days', categoryLabel: 'Global Day', description: 'Worldwide celebration of love, affection, and appreciation.', isMajor: true },
  { mmdd: '02-20', title: 'World Day of Social Justice', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Advocating for fairness, equality, and dignity for all.' },
  { mmdd: '02-21', title: 'International Mother Language Day', gujaratiTitle: 'વિશ્વ માતૃભાષા દિવસ', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Celebrating linguistic diversity and mother tongues including Gujarati and Indian languages.' },
  { mmdd: '02-28', title: 'National Science Day', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Commemorating Sir C.V. Raman’s discovery of the Raman Effect.' },

  // March
  { mmdd: '03-03', title: 'World Wildlife Day', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Celebrating and protecting Earth’s wild fauna and flora.' },
  { mmdd: '03-08', title: 'International Women’s Day', layerId: 'global-days', categoryLabel: 'Global Day', description: 'Celebrating women’s social, cultural, economic, and scientific achievements globally.', isMajor: true },
  { mmdd: '03-14', title: 'Pi Day · Int’l Day of Mathematics', layerId: 'global-days', categoryLabel: 'Science Day', description: 'Celebrating the mathematical constant π (3.14) and joyful math discovery.' },
  { mmdd: '03-14', title: 'Nanakshahi New Year (1 Chet)', layerId: 'world-observances', categoryLabel: 'Nanakshahi (Sikh)', description: 'First day of Chet inaugurating the Sikh Nanakshahi solar year.' },
  { mmdd: '03-15', title: 'World Consumer Rights Day', layerId: 'global-days', categoryLabel: 'Global Day', description: 'Advocating for transparent and fair consumer protections.' },
  { mmdd: '03-20', title: 'Nowruz · Baháʼí Naw-Rúz (Vernal Equinox)', layerId: 'world-observances', categoryLabel: 'Solar Hijri & Baháʼí', description: 'Persian Solar Hijri New Year (1 Farvardin) and Baháʼí New Year (1 Bahá) celebrating spring’s arrival.', isMajor: true },
  { mmdd: '03-20', title: 'Int’l Day of Happiness · World Sparrow Day', layerId: 'global-days', categoryLabel: 'Global Day', description: 'Recognizing wellbeing, joy, and urban biodiversity conservation.' },
  { mmdd: '03-21', title: 'World Poetry Day · Int’l Day of Forests', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Celebrating poetic expression and forest ecosystems.' },
  { mmdd: '03-22', title: 'Indian National Calendar New Year (1 Chaitra Saka)', layerId: 'world-observances', categoryLabel: 'Indian Saka', description: 'First day of Chaitra in India’s official national civil Saka calendar.' },
  { mmdd: '03-22', title: 'World Water Day', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Focusing attention on freshwater conservation and universal clean water.' },
  { mmdd: '03-23', title: 'Shaheed Diwas (Bhagat Singh Memorial)', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Remembering Bhagat Singh, Shivaram Rajguru, and Sukhdev Thapar.' },
  { mmdd: '03-27', title: 'World Theatre Day', layerId: 'global-days', categoryLabel: 'Cultural Day', description: 'Celebrating stagecraft and performing arts worldwide.' },

  // April
  { mmdd: '04-01', title: 'April Fools’ Day · Financial Year Start', layerId: 'global-days', categoryLabel: 'Special Day', description: 'Playful pranks worldwide and the opening day of India’s fiscal year.' },
  { mmdd: '04-02', title: 'World Autism Awareness Day', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Promoting understanding, inclusion, and support for neurodivergent communities.' },
  { mmdd: '04-07', title: 'World Health Day', layerId: 'global-days', categoryLabel: 'WHO Observance', description: 'Marking the founding of the World Health Organization with annual health initiatives.', isMajor: true },
  { mmdd: '04-13', title: 'Songkran (Thai Solar New Year)', layerId: 'world-observances', categoryLabel: 'Thai Solar', description: 'Traditional Thai New Year water festival celebrating renewal and family blessings.', isMajor: true },
  { mmdd: '04-14', title: 'Dr. B.R. Ambedkar Jayanti', layerId: 'national-holidays', categoryLabel: 'Public Holiday', description: 'Honoring the chief architect of the Indian Constitution and social reformer.' },
  { mmdd: '04-18', title: 'World Heritage Day', layerId: 'global-days', categoryLabel: 'UNESCO Day', description: 'Celebrating architectural monuments and cultural heritage sites.' },
  { mmdd: '04-21', title: 'National Civil Services Day', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Recognizing public administration and civic service across India.' },
  { mmdd: '04-22', title: 'Earth Day', layerId: 'global-days', categoryLabel: 'Global Day', description: 'Global movement for environmental protection and sustainable living.', isMajor: true },
  { mmdd: '04-23', title: 'World Book & Copyright Day', layerId: 'global-days', categoryLabel: 'UNESCO Day', description: 'Celebrating reading, authors, and storytelling.' },

  // May
  { mmdd: '05-01', title: 'Gujarat Foundation Day · Int’l Workers’ Day', gujaratiTitle: 'ગુજરાત સ્થાપના દિન', layerId: 'gujarati-calendar', categoryLabel: 'Gujarat State Day', description: 'Commemorating the formation of Gujarat State on May 1, 1960, alongside International Labour Day.', isMajor: true },
  { mmdd: '05-03', title: 'World Press Freedom Day', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Defending independent journalism and press freedom worldwide.' },
  { mmdd: '05-08', title: 'World Red Cross Day · Rabindra Jayanti', layerId: 'global-days', categoryLabel: 'Global & Cultural Day', description: 'Honoring humanitarian service and poet laureate Rabindranath Tagore.' },
  { mmdd: '05-11', title: 'National Technology Day', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Celebrating India’s scientific and technological breakthroughs.' },
  { mmdd: '05-12', title: 'International Nurses Day', layerId: 'global-days', categoryLabel: 'Global Day', description: 'Honoring nurses and healthcare caregivers worldwide.' },
  { mmdd: '05-15', title: 'International Day of Families', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Highlighting the role of families in building resilient communities.' },
  { mmdd: '05-22', title: 'Int’l Day for Biological Diversity', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Promoting conservation of Earth’s rich ecosystems.' },
  { mmdd: '05-31', title: 'World No Tobacco Day', layerId: 'global-days', categoryLabel: 'WHO Observance', description: 'Global campaign encouraging healthier tobacco-free living.' },

  // June
  { mmdd: '06-01', title: 'World Milk Day · Global Day of Parents', layerId: 'global-days', categoryLabel: 'Global Day', description: 'Celebrating nutrition and appreciating parents worldwide.' },
  { mmdd: '06-03', title: 'World Bicycle Day', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Championing clean, healthy, sustainable cycling.' },
  { mmdd: '06-05', title: 'World Environment Day', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Flagship global day for ecological stewardship and climate action.', isMajor: true },
  { mmdd: '06-08', title: 'World Oceans Day', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Protecting marine biodiversity and clean oceans.' },
  { mmdd: '06-14', title: 'World Blood Donor Day', layerId: 'global-days', categoryLabel: 'WHO Observance', description: 'Thanking voluntary blood donors saving lives every day.' },
  { mmdd: '06-21', title: 'International Day of Yoga · World Music Day', gujaratiTitle: 'આંતરરાષ્ટ્રીય યોગ દિવસ', layerId: 'global-days', categoryLabel: 'Global Day', description: 'Summer solstice celebration of holistic yoga practice and live music worldwide.', isMajor: true },

  // July
  { mmdd: '07-01', title: 'National Doctors’ Day · CA Day', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Honoring physicians in memory of Dr. Bidhan Chandra Roy and chartered accountants.' },
  { mmdd: '07-11', title: 'World Population Day', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Focusing on sustainable global development and demographics.' },
  { mmdd: '07-17', title: 'World Emoji Day', layerId: 'global-days', categoryLabel: 'Fun Special Day', description: 'Lighthearted global celebration of modern digital expression.' },
  { mmdd: '07-18', title: 'Nelson Mandela International Day', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Inspiring 67 minutes of community service in honor of Nelson Mandela.' },
  { mmdd: '07-20', title: 'International Chess Day · Moon Day', layerId: 'global-days', categoryLabel: 'Global Day', description: 'Celebrating chess strategy and the anniversary of the first Moon landing.' },
  { mmdd: '07-26', title: 'Kargil Vijay Diwas', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Honoring the valor and sacrifice of India’s Kargil heroes.' },
  { mmdd: '07-28', title: 'World Nature Conservation Day', layerId: 'global-days', categoryLabel: 'Global Day', description: 'Encouraging stewardship of natural resources.' },
  { mmdd: '07-29', title: 'International Tiger Day', layerId: 'global-days', categoryLabel: 'Global Day', description: 'Celebrating global tiger conservation efforts, especially in India’s reserves.' },

  // August
  { mmdd: '08-06', title: 'Hiroshima Day', layerId: 'global-days', categoryLabel: 'Global Observance', description: 'Annual call for peace and nuclear disarmament.' },
  { mmdd: '08-07', title: 'National Handloom Day', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Honoring India’s master weavers including Patola, Bandhani, and Khadi artisans.' },
  { mmdd: '08-09', title: 'Quit India Day · Int’l Indigenous Peoples Day', layerId: 'global-days', categoryLabel: 'Indian & Global Day', description: 'Marking the 1942 Quit India Movement and celebrating indigenous cultures.' },
  { mmdd: '08-12', title: 'International Youth Day · World Elephant Day', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Amplifying youth voices and elephant wildlife protection.' },
  { mmdd: '08-15', title: 'Independence Day of India', gujaratiTitle: 'સ્વાતંત્ર્ય દિન', layerId: 'national-holidays', categoryLabel: 'National Holiday', description: 'Celebrating India’s freedom and sovereignty since August 15, 1947.', isMajor: true },
  { mmdd: '08-19', title: 'World Photography Day · Humanitarian Day', layerId: 'global-days', categoryLabel: 'Global Day', description: 'Celebrating the art of photography and humanitarian workers.' },
  { mmdd: '08-29', title: 'National Sports Day', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Honoring hockey legend Major Dhyan Chand and Indian athletics.' },

  // September
  { mmdd: '09-05', title: 'Teachers’ Day (India)', gujaratiTitle: 'શિક્ષક દિન', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Honoring educators on the birth anniversary of Dr. Sarvepalli Radhakrishnan.', isMajor: true },
  { mmdd: '09-08', title: 'International Literacy Day', layerId: 'global-days', categoryLabel: 'UNESCO Day', description: 'Highlighting literacy as a cornerstone of human empowerment.' },
  { mmdd: '09-14', title: 'Hindi Diwas', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Commemorating the adoption of Hindi as an official language of India.' },
  { mmdd: '09-15', title: 'Engineers’ Day (India)', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Celebrating engineering excellence on Sir M. Visvesvaraya’s birth anniversary.' },
  { mmdd: '09-16', title: 'World Ozone Day', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Marking the Montreal Protocol and atmospheric preservation.' },
  { mmdd: '09-21', title: 'International Day of Peace', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Dedicated to strengthening ideals of peace across all nations.' },
  { mmdd: '09-27', title: 'World Tourism Day', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Celebrating cultural discovery and sustainable travel.' },
  { mmdd: '09-29', title: 'World Heart Day', layerId: 'global-days', categoryLabel: 'Health Day', description: 'Promoting cardiovascular health and active lifestyles.' },

  // October
  { mmdd: '10-01', title: 'International Coffee Day · Day of Older Persons', layerId: 'global-days', categoryLabel: 'Global Day', description: 'Honoring elders worldwide and celebrating specialty coffee growers.' },
  { mmdd: '10-02', title: 'Gandhi Jayanti · Int’l Day of Non-Violence', gujaratiTitle: 'ગાંધી જયંતિ', layerId: 'national-holidays', categoryLabel: 'National Holiday', description: 'Birth anniversary of Mahatma Gandhi (born in Porbandar, Gujarat) and Lal Bahadur Shastri.', isMajor: true },
  { mmdd: '10-05', title: 'World Teachers’ Day', layerId: 'global-days', categoryLabel: 'UNESCO Day', description: 'Global appreciation for educators shaping future generations.' },
  { mmdd: '10-08', title: 'Indian Air Force Day', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Celebrating the founding and excellence of the Indian Air Force.' },
  { mmdd: '10-10', title: 'World Mental Health Day', layerId: 'global-days', categoryLabel: 'WHO Observance', description: 'Advocating for mental wellbeing, empathy, and open conversation.', isMajor: true },
  { mmdd: '10-11', title: 'International Day of the Girl Child', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Empowering girls’ leadership and rights worldwide.' },
  { mmdd: '10-15', title: 'World Students’ Day', layerId: 'global-days', categoryLabel: 'Observance', description: 'Honoring Dr. A.P.J. Abdul Kalam’s legacy of curiosity and learning.' },
  { mmdd: '10-16', title: 'World Food Day', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Advancing sustainable agriculture and food security for all.' },
  { mmdd: '10-24', title: 'United Nations Day', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Commemorating the founding of the United Nations Charter.' },
  { mmdd: '10-31', title: 'Rashtriya Ekta Diwas · Halloween', gujaratiTitle: 'રાષ્ટ્રીય એકતા દિવસ', layerId: 'global-days', categoryLabel: 'Indian & Global Day', description: 'National Unity Day honoring Sardar Vallabhbhai Patel (Statue of Unity, Gujarat) alongside global Halloween celebrations.', isMajor: true },

  // November
  { mmdd: '11-07', title: 'National Cancer Awareness Day', layerId: 'global-days', categoryLabel: 'Health Day', description: 'Promoting early screening and preventive healthcare awareness in India.' },
  { mmdd: '11-10', title: 'World Science Day for Peace & Development', layerId: 'global-days', categoryLabel: 'UNESCO Day', description: 'Highlighting science’s essential role in everyday life and society.' },
  { mmdd: '11-11', title: 'National Education Day', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Honoring Maulana Abul Kalam Azad, India’s first Minister of Education.' },
  { mmdd: '11-13', title: 'World Kindness Day', layerId: 'global-days', categoryLabel: 'Global Day', description: 'Encouraging everyday acts of compassion, empathy, and generosity.' },
  { mmdd: '11-14', title: 'Children’s Day (Bal Diwas) · World Diabetes Day', gujaratiTitle: 'બાળ દિન', layerId: 'global-days', categoryLabel: 'Indian & Global Day', description: 'Celebrating childhood, curiosity, and Pandit Jawaharlal Nehru’s birth anniversary.', isMajor: true },
  { mmdd: '11-19', title: 'International Men’s Day', layerId: 'global-days', categoryLabel: 'Global Day', description: 'Focusing on men’s health, positive role models, and community wellbeing.' },
  { mmdd: '11-20', title: 'World Children’s Day', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Promoting children’s welfare and rights worldwide.' },
  { mmdd: '11-21', title: 'World Television Day', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Recognizing broadcast media’s influence on global communication.' },
  { mmdd: '11-25', title: 'Int’l Day for Elimination of Violence Against Women', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Global day of advocacy for safety, dignity, and human rights.' },
  { mmdd: '11-26', title: 'Constitution Day of India (Samvidhan Divas)', gujaratiTitle: 'બંધારણ દિવસ', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Commemorating the adoption of the Constitution of India on November 26, 1949.', isMajor: true },

  // December
  { mmdd: '12-01', title: 'World AIDS Day', layerId: 'global-days', categoryLabel: 'WHO Observance', description: 'Standing in solidarity and advancing global health awareness.' },
  { mmdd: '12-02', title: 'National Pollution Control Day · Computer Literacy Day', layerId: 'global-days', categoryLabel: 'Observance', description: 'Raising awareness about clean air, industrial safety, and digital skills.' },
  { mmdd: '12-04', title: 'Indian Navy Day', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Celebrating the maritime strength and achievements of the Indian Navy.' },
  { mmdd: '12-05', title: 'World Soil Day', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Highlighting the vitality of healthy soils for sustainable food systems.' },
  { mmdd: '12-07', title: 'Armed Forces Flag Day', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Honoring India’s armed forces personnel and veterans.' },
  { mmdd: '12-10', title: 'Human Rights Day', layerId: 'global-days', categoryLabel: 'UN Observance', description: 'Commemorating the Universal Declaration of Human Rights.', isMajor: true },
  { mmdd: '12-14', title: 'National Energy Conservation Day', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Championing renewable power and energy efficiency across India.' },
  { mmdd: '12-16', title: 'Vijay Diwas', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Commemorating India’s historic 1971 victory and honoring brave soldiers.' },
  { mmdd: '12-22', title: 'National Mathematics Day · Winter Solstice', layerId: 'global-days', categoryLabel: 'Indian & Science Day', description: 'Honoring mathematical genius Srinivasa Ramanujan’s birth anniversary.' },
  { mmdd: '12-23', title: 'Kisan Diwas (National Farmers’ Day)', layerId: 'global-days', categoryLabel: 'Indian Observance', description: 'Honoring Indian farmers and their vital contribution to the nation.' },
  { mmdd: '12-25', title: 'Christmas Day · Good Governance Day', gujaratiTitle: 'નાતાલ (ક્રિસમસ)', layerId: 'national-holidays', categoryLabel: 'National Holiday', description: 'Global Christmas celebration of warmth and goodwill, alongside Atal Bihari Vajpayee’s birth anniversary.', isMajor: true },
  { mmdd: '12-31', title: 'New Year’s Eve', layerId: 'global-days', categoryLabel: 'Global Day', description: 'Final evening of the Gregorian year celebrated around the globe.' },
];

/** Compute floating weekday observances (Mother's Day, Father's Day, Friendship Day, Thanksgiving) */
function getFloatingDaysForDate(date: Date): FestivalItem[] {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const dow = date.getDay(); // 0=Sun .. 4=Thu
  const dateKey = formatDateKey(date);
  const items: FestivalItem[] = [];

  // Mother's Day: 2nd Sunday of May
  if (m === 5 && dow === 0 && d >= 8 && d <= 14) {
    items.push({
      id: `float-${y}-mothers-day`,
      date: dateKey,
      title: 'Mother’s Day',
      layerId: 'global-days',
      categoryLabel: 'Global Day',
      description: 'Celebrating mothers, maternal bonds, and their influence in society.',
      isMajor: true,
    });
  }
  // Father's Day: 3rd Sunday of June
  if (m === 6 && dow === 0 && d >= 15 && d <= 21) {
    items.push({
      id: `float-${y}-fathers-day`,
      date: dateKey,
      title: 'Father’s Day',
      layerId: 'global-days',
      categoryLabel: 'Global Day',
      description: 'Honoring fathers and father figures worldwide.',
      isMajor: true,
    });
  }
  // Friendship Day (India): 1st Sunday of August
  if (m === 8 && dow === 0 && d >= 1 && d <= 7) {
    items.push({
      id: `float-${y}-friendship-day`,
      date: dateKey,
      title: 'Friendship Day',
      layerId: 'global-days',
      categoryLabel: 'Special Day',
      description: 'Celebrating lifelong friendships and camaraderie.',
    });
  }
  // Thanksgiving (US): 4th Thursday of November
  if (m === 11 && dow === 4 && d >= 22 && d <= 28) {
    items.push({
      id: `float-${y}-thanksgiving`,
      date: dateKey,
      title: 'Thanksgiving Day',
      layerId: 'global-days',
      categoryLabel: 'Global Day',
      description: 'Traditional North American day of gratitude, harvest, and family dinner.',
      isMajor: true,
    });
  }

  return items;
}

const yearlyByDate = new Map<string, FestivalItem[]>();
for (const item of YEARLY_FESTIVALS) {
  const existing = yearlyByDate.get(item.date) || [];
  existing.push(item);
  yearlyByDate.set(item.date, existing);
}

const fixedByMmDd = new Map<string, AnnualDayRule[]>();
for (const rule of FIXED_ANNUAL_DAYS) {
  const existing = fixedByMmDd.get(rule.mmdd) || [];
  existing.push(rule);
  fixedByMmDd.set(rule.mmdd, existing);
}

interface RegionalFixedHoliday {
  mmdd: string;
  title: string;
  description: string;
  isMajor?: boolean;
}

const REGIONAL_FIXED_HOLIDAYS: Record<string, RegionalFixedHoliday[]> = {
  US: [
    { mmdd: '01-01', title: "New Year's Day", description: 'Federal public holiday in the United States.', isMajor: true },
    { mmdd: '06-19', title: 'Juneteenth National Independence Day', description: 'Federal holiday commemorating the end of slavery in the United States.', isMajor: true },
    { mmdd: '07-04', title: 'Independence Day', description: 'US federal holiday celebrating the Declaration of Independence.', isMajor: true },
    { mmdd: '11-11', title: 'Veterans Day', description: 'Federal holiday honoring military veterans of the United States Armed Forces.' },
    { mmdd: '12-25', title: 'Christmas Day', description: 'Federal public holiday celebrated across the United States.', isMajor: true },
  ],
  GB: [
    { mmdd: '01-01', title: "New Year's Day", description: 'Bank holiday across the United Kingdom.', isMajor: true },
    { mmdd: '12-25', title: 'Christmas Day', description: 'UK bank holiday.', isMajor: true },
    { mmdd: '12-26', title: 'Boxing Day', description: 'UK bank holiday following Christmas Day.', isMajor: true },
  ],
  CA: [
    { mmdd: '01-01', title: "New Year's Day", description: 'Statutory public holiday across Canada.', isMajor: true },
    { mmdd: '07-01', title: 'Canada Day', description: 'National statutory holiday celebrating Canadian Confederation.', isMajor: true },
    { mmdd: '09-30', title: 'National Day for Truth and Reconciliation', description: 'Canadian federal statutory holiday.' },
    { mmdd: '11-11', title: 'Remembrance Day', description: 'Day honoring members of the Canadian Armed Forces.' },
    { mmdd: '12-25', title: 'Christmas Day', description: 'Statutory holiday across Canada.', isMajor: true },
    { mmdd: '12-26', title: 'Boxing Day', description: 'Public holiday in Canada.' },
  ],
  AU: [
    { mmdd: '01-01', title: "New Year's Day", description: 'National public holiday in Australia.', isMajor: true },
    { mmdd: '01-26', title: 'Australia Day', description: 'Official national day of Australia.', isMajor: true },
    { mmdd: '04-25', title: 'ANZAC Day', description: 'National day of remembrance in Australia and New Zealand.', isMajor: true },
    { mmdd: '12-25', title: 'Christmas Day', description: 'National public holiday in Australia.', isMajor: true },
    { mmdd: '12-26', title: 'Boxing Day', description: 'National public holiday in Australia.' },
  ],
  EU: [
    { mmdd: '01-01', title: "New Year's Day", description: 'Public holiday across the European Union.', isMajor: true },
    { mmdd: '05-01', title: 'Labour Day', description: 'International Workers’ Day public holiday across Europe.', isMajor: true },
    { mmdd: '05-09', title: 'Europe Day', description: 'Celebration of peace and unity in Europe.' },
    { mmdd: '08-15', title: 'Assumption Day', description: 'Public holiday observed in many European countries.' },
    { mmdd: '11-01', title: "All Saints' Day", description: 'Public holiday observed across many European regions.' },
    { mmdd: '12-25', title: 'Christmas Day', description: 'Public holiday across Europe.', isMajor: true },
    { mmdd: '12-26', title: "St. Stephen's Day", description: 'Second day of Christmas observed across Europe.' },
  ],
  JP: [
    { mmdd: '01-01', title: "New Year's Day (Ganjitsu)", description: 'Japanese national holiday.', isMajor: true },
    { mmdd: '02-11', title: 'National Foundation Day', description: 'Japanese national holiday celebrating the founding of Japan.' },
    { mmdd: '02-23', title: "Emperor's Birthday", description: 'Japanese national holiday.' },
    { mmdd: '04-29', title: 'Showa Day', description: 'Opening public holiday of Golden Week in Japan.' },
    { mmdd: '05-03', title: 'Constitution Memorial Day', description: 'Japanese national holiday during Golden Week.', isMajor: true },
    { mmdd: '05-04', title: 'Greenery Day', description: 'Japanese national holiday celebrating nature.' },
    { mmdd: '05-05', title: "Children's Day (Kodomo no Hi)", description: 'Japanese national holiday.', isMajor: true },
    { mmdd: '08-11', title: 'Mountain Day', description: 'Japanese national holiday.' },
    { mmdd: '11-03', title: 'Culture Day', description: 'Japanese national holiday promoting arts and culture.' },
    { mmdd: '11-23', title: 'Labour Thanksgiving Day', description: 'Japanese national holiday.' },
  ],
  AE: [
    { mmdd: '01-01', title: "New Year's Day", description: 'Public holiday in the United Arab Emirates.', isMajor: true },
    { mmdd: '12-01', title: 'Commemoration Day', description: 'UAE national remembrance day.' },
    { mmdd: '12-02', title: 'UAE National Day (Eid Al Etihad)', description: 'Celebration of the union of the United Arab Emirates.', isMajor: true },
    { mmdd: '12-03', title: 'UAE National Day Holiday', description: 'Second day of UAE National Day celebrations.' },
  ],
  SG: [
    { mmdd: '01-01', title: "New Year's Day", description: 'Public holiday in Singapore.', isMajor: true },
    { mmdd: '05-01', title: 'Labour Day', description: 'Public holiday in Singapore.', isMajor: true },
    { mmdd: '08-09', title: 'Singapore National Day', description: 'Celebration of Singapore’s independence.', isMajor: true },
    { mmdd: '12-25', title: 'Christmas Day', description: 'Public holiday in Singapore.', isMajor: true },
  ],
  GLOBAL: [
    { mmdd: '01-01', title: "New Year's Day", description: 'International public holiday welcoming the new year.', isMajor: true },
    { mmdd: '05-01', title: 'International Workers’ Day', description: 'Public holiday celebrated globally.', isMajor: true },
    { mmdd: '12-25', title: 'Christmas Day', description: 'Widely observed international holiday.', isMajor: true },
  ],
};

function getRegionalFloatingHolidays(date: Date, regionCode: string): FestivalItem[] {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dow = date.getDay();
  const dateKey = formatDateKey(date);
  const items: FestivalItem[] = [];

  const isNthWeekday = (n: number, weekday: number) =>
    dow === weekday && Math.ceil(day / 7) === n;

  const isLastWeekday = (weekday: number) => {
    if (dow !== weekday) return false;
    const nextWeek = new Date(year, month - 1, day + 7);
    return nextWeek.getMonth() !== month - 1;
  };

  if (regionCode === 'US') {
    if (month === 1 && isNthWeekday(3, 1)) {
      items.push({ id: `reg-us-${dateKey}-mlk`, date: dateKey, title: 'Martin Luther King Jr. Day', layerId: 'national-holidays', categoryLabel: 'US Holiday', description: 'US federal holiday honoring civil rights leader Dr. Martin Luther King Jr.', region: 'US', isMajor: true });
    }
    if (month === 2 && isNthWeekday(3, 1)) {
      items.push({ id: `reg-us-${dateKey}-pres`, date: dateKey, title: "Presidents' Day", layerId: 'national-holidays', categoryLabel: 'US Holiday', description: 'US federal holiday (Washington’s Birthday).', region: 'US' });
    }
    if (month === 5 && isLastWeekday(1)) {
      items.push({ id: `reg-us-${dateKey}-mem`, date: dateKey, title: 'Memorial Day', layerId: 'national-holidays', categoryLabel: 'US Holiday', description: 'US federal holiday honoring fallen military service members.', region: 'US', isMajor: true });
    }
    if (month === 9 && isNthWeekday(1, 1)) {
      items.push({ id: `reg-us-${dateKey}-labor`, date: dateKey, title: 'Labor Day', layerId: 'national-holidays', categoryLabel: 'US Holiday', description: 'US federal holiday celebrating American workers.', region: 'US', isMajor: true });
    }
    if (month === 10 && isNthWeekday(2, 1)) {
      items.push({ id: `reg-us-${dateKey}-indig`, date: dateKey, title: 'Indigenous Peoples’ / Columbus Day', layerId: 'national-holidays', categoryLabel: 'US Holiday', description: 'US federal holiday observed on the second Monday of October.', region: 'US' });
    }
    if (month === 11 && isNthWeekday(4, 4)) {
      items.push({ id: `reg-us-${dateKey}-thanks`, date: dateKey, title: 'Thanksgiving Day', layerId: 'national-holidays', categoryLabel: 'US Holiday', description: 'US federal holiday of gratitude and harvest.', region: 'US', isMajor: true });
    }
  } else if (regionCode === 'GB') {
    if (month === 5 && isNthWeekday(1, 1)) {
      items.push({ id: `reg-gb-${dateKey}-earlymay`, date: dateKey, title: 'Early May Bank Holiday', layerId: 'national-holidays', categoryLabel: 'UK Bank Holiday', description: 'Public bank holiday across the United Kingdom.', region: 'GB' });
    }
    if (month === 5 && isLastWeekday(1)) {
      items.push({ id: `reg-gb-${dateKey}-spring`, date: dateKey, title: 'Spring Bank Holiday', layerId: 'national-holidays', categoryLabel: 'UK Bank Holiday', description: 'Public bank holiday across the United Kingdom.', region: 'GB' });
    }
    if (month === 8 && isLastWeekday(1)) {
      items.push({ id: `reg-gb-${dateKey}-summer`, date: dateKey, title: 'Summer Bank Holiday', layerId: 'national-holidays', categoryLabel: 'UK Bank Holiday', description: 'Late summer bank holiday in England, Wales, and Northern Ireland.', region: 'GB' });
    }
  } else if (regionCode === 'CA') {
    if (month === 5 && dow === 1 && day >= 18 && day <= 24) {
      items.push({ id: `reg-ca-${dateKey}-victoria`, date: dateKey, title: 'Victoria Day', layerId: 'national-holidays', categoryLabel: 'Canada Holiday', description: 'Canadian federal statutory holiday.', region: 'CA' });
    }
    if (month === 9 && isNthWeekday(1, 1)) {
      items.push({ id: `reg-ca-${dateKey}-labour`, date: dateKey, title: 'Labour Day', layerId: 'national-holidays', categoryLabel: 'Canada Holiday', description: 'Statutory holiday across Canada.', region: 'CA', isMajor: true });
    }
    if (month === 10 && isNthWeekday(2, 1)) {
      items.push({ id: `reg-ca-${dateKey}-thanks`, date: dateKey, title: 'Thanksgiving Day (Canada)', layerId: 'national-holidays', categoryLabel: 'Canada Holiday', description: 'Statutory holiday across most of Canada.', region: 'CA', isMajor: true });
    }
  } else if (regionCode === 'JP') {
    if (month === 1 && isNthWeekday(2, 1)) {
      items.push({ id: `reg-jp-${dateKey}-seijin`, date: dateKey, title: 'Coming of Age Day', layerId: 'national-holidays', categoryLabel: 'Japan Holiday', description: 'Japanese national holiday.', region: 'JP' });
    }
    if (month === 7 && isNthWeekday(3, 1)) {
      items.push({ id: `reg-jp-${dateKey}-umi`, date: dateKey, title: 'Marine Day', layerId: 'national-holidays', categoryLabel: 'Japan Holiday', description: 'Japanese national holiday.', region: 'JP' });
    }
    if (month === 9 && isNthWeekday(3, 1)) {
      items.push({ id: `reg-jp-${dateKey}-keiro`, date: dateKey, title: 'Respect for the Aged Day', layerId: 'national-holidays', categoryLabel: 'Japan Holiday', description: 'Japanese national holiday.', region: 'JP' });
    }
    if (month === 10 && isNthWeekday(2, 1)) {
      items.push({ id: `reg-jp-${dateKey}-sports`, date: dateKey, title: 'Sports Day', layerId: 'national-holidays', categoryLabel: 'Japan Holiday', description: 'Japanese national holiday.', region: 'JP' });
    }
  }

  return items;
}

/**
 * Returns ALL synced festivals, special days, regional local holidays, and Gujarati lunar observances
 * for a given date, filtered by currently visible layer IDs and local holiday region.
 */
export function getFestivalsForDate(
  date: Date,
  visibleLayerIds?: Set<string>,
  regionCode: string = 'IN'
): FestivalItem[] {
  const dateKey = formatDateKey(date);
  const mmdd = dateKey.slice(5); // MM-DD
  const results: FestivalItem[] = [];

  // 1. Multi-year curated lunar festivals (for national-holidays, only include Indian gazetted ones if region is IN)
  const curated = yearlyByDate.get(dateKey);
  if (curated) {
    for (const item of curated) {
      if (item.layerId === 'national-holidays' && regionCode !== 'IN') {
        // Keep Good Friday for Western/Global regions as well
        if (!item.title.toLowerCase().includes('good friday')) continue;
      }
      results.push(item);
    }
  }

  // 2. Fixed annual global, Indian, and regional national holidays
  const fixed = fixedByMmDd.get(mmdd);
  if (fixed) {
    for (const rule of fixed) {
      if (rule.layerId === 'national-holidays' && regionCode !== 'IN') {
        continue;
      }
      results.push({
        id: `fixed-${dateKey}-${rule.layerId}-${rule.title.slice(0, 12).replace(/\W+/g, '').toLowerCase()}`,
        date: dateKey,
        title: rule.title,
        gujaratiTitle: rule.gujaratiTitle,
        layerId: rule.layerId,
        categoryLabel: rule.categoryLabel,
        description: rule.description,
        isMajor: rule.isMajor,
      });
    }
  }

  // 2b. Non-India Regional Local Holidays
  if (regionCode !== 'IN') {
    const regionalList = REGIONAL_FIXED_HOLIDAYS[regionCode] || REGIONAL_FIXED_HOLIDAYS.GLOBAL;
    for (const h of regionalList) {
      if (h.mmdd === mmdd) {
        results.push({
          id: `reg-${regionCode.toLowerCase()}-${dateKey}-${h.title.slice(0, 12).replace(/\W+/g, '').toLowerCase()}`,
          date: dateKey,
          title: h.title,
          layerId: 'national-holidays',
          categoryLabel: `${regionCode === 'GLOBAL' ? 'Public' : regionCode} Holiday`,
          description: h.description,
          region: regionCode,
          isMajor: h.isMajor,
        });
      }
    }
    results.push(...getRegionalFloatingHolidays(date, regionCode));
  }

  // 3. Floating weekday observances
  results.push(...getFloatingDaysForDate(date));

  // 4. Astronomical Gujarati Tithi observances (controlled by gujarati-calendar layer under World Calendars)
  const panchang = getGujaratiPanchang(date);
  if (panchang.specialTithi) {
    const alreadyHasGujaratiMajor = results.some(
      (r) =>
        r.layerId === 'gujarati-calendar' &&
        (r.title.toLowerCase().includes('poonam') ||
          r.title.toLowerCase().includes('agiyaras') ||
          r.title.toLowerCase().includes('holi') ||
          r.title.toLowerCase().includes('dev diwali'))
    );
    if (!alreadyHasGujaratiMajor) {
      results.push({
        id: `panchang-${dateKey}-${panchang.tithiEn.toLowerCase()}`,
        date: dateKey,
        title: panchang.specialTithi.nameEn,
        gujaratiTitle: panchang.specialTithi.nameGu,
        layerId: 'gujarati-calendar',
        categoryLabel: 'Gujarati Tithi',
        description: `${panchang.specialTithi.significance} (${panchang.monthEn} ${panchang.pakshaEn} ${panchang.tithiEn}, Vikram Samvat ${panchang.vikramSamvat}).`,
      });
    }
  }

  if (!visibleLayerIds) return results;
  return results.filter((item) => visibleLayerIds.has(item.layerId));
}

/**
 * Returns searchable list of all curated festivals + regional holidays for a given year.
 */
export function getAllFestivalsForYear(year: number, regionCode: string = 'IN'): FestivalItem[] {
  const all: FestivalItem[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const cur = new Date(start);
  while (cur <= end) {
    all.push(...getFestivalsForDate(cur, undefined, regionCode));
    cur.setDate(cur.getDate() + 1);
  }
  return all;
}
