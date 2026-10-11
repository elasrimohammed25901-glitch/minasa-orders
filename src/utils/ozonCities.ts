import { OzonCity } from '../types';
import rawOzonCities from '../data/ozonCities.json';

const OZON_CITIES_STORAGE_KEY = 'enjaz_ozon_cities_cache_v1';
const OZON_CITIES_LAST_SYNC_KEY = 'enjaz_ozon_cities_last_sync_v1';

// Arabic name mapping for top Moroccan cities & Casablanca neighborhoods in Ozon
const ARABIC_MAPPINGS: Record<string, string> = {
  // Casablanca Districts
  'Casablanca – Maarif': 'الدار البيضاء - المعاريف',
  'Casablanca – Sidi Maarouf': 'الدار البيضاء - سيدي معروف',
  'Casablanca – Ain Chock': 'الدار البيضاء - عين الشق',
  'Casablanca – Ain Diab': 'الدار البيضاء - عين الذئاب',
  'Casablanca – Ain Sebaa': 'الدار البيضاء - عين السبع',
  'Casablanca – Anfa': 'الدار البيضاء - أنفا',
  'Casablanca – Beauséjour': 'الدار البيضاء - بوزيجور',
  'Casablanca – Bernoussi': 'الدار البيضاء - سيدي البرنوصي',
  'Casablanca – Bourgogne': 'الدار البيضاء - بوركون',
  'Casablanca – Californie': 'الدار البيضاء - كاليفورنيا',
  'Casablanca – Centre Ville': 'الدار البيضاء - وسط المدينة',
  'Casablanca – Derb Omar': 'الدار البيضاء - درب عمر',
  'Casablanca – Derb Sultan': 'الدار البيضاء - درب السلطان',
  'Casablanca – Hay Hassani': 'الدار البيضاء - الحي الحسني',
  'Casablanca – Hay Mohammadi': 'الدار البيضاء - الحي المحمدي',
  'Casablanca – Lissasfa': 'الدار البيضاء - ليساسفة',
  'Casablanca – Moulay Rachid': 'الدار البيضاء - مولاي رشيد',
  'Casablanca – Ouasis': 'الدار البيضاء - الوازيس',
  'Casablanca – Oulfa': 'الدار البيضاء - الألفة',
  'Casablanca – Roches Noires': 'الدار البيضاء - الصخور السوداء',
  'Casablanca – Sbata': 'الدار البيضاء - سباتة',
  'Casablanca – Sidi Moumen': 'الدار البيضاء - سيدي مومن',
  'Casablanca – Sidi Othmane': 'الدار البيضاء - سيدي عثمان',
  'Casablanca – 2 Mars': 'الدار البيضاء - 2 مارس',
  'Tacharouk-casablanca': 'الدار البيضاء - التشارك',
  'Bournazel-casablanca': 'الدار البيضاء - بورنازيل',
  'Lahraouyine-casablanca': 'الدار البيضاء - الهراويين',
  'sidi hajjaj-casa': 'الدار البيضاء - سيدي حجاج',

  // Major Moroccan Cities
  'Agadir': 'أكادير',
  'Ait Melloul': 'أيت ملول',
  'Al Hoceima': 'الحسيمة',
  'Asilah': 'أصيلة',
  'Azemmour': 'أزمور',
  'Azrou': 'أزرو',
  'Ben Guerir': 'ابن جرير',
  'Beni Mellal': 'بني ملال',
  'Berkane': 'بركان',
  'Berrechid': 'برشيد',
  'Boujdour': 'بوجدور',
  'Bouznika': 'بوزنيقة',
  'Chefchaouen': 'شفشاون',
  'Chichaoua': 'شيشاوة',
  'Dakhla': 'الداخلة',
  'El Jadida': 'الجديدة',
  'El Kelaa Des Sraghna': 'قلعة السراغنة',
  'Errachidia': 'الرشيدية',
  'Essaouira': 'الصويرة',
  'Fes': 'فاس',
  'Fnideq': 'الفنيدق',
  'Fquih Ben Salah': 'الفقيه بن صالح',
  'Guelmim': 'كلميم',
  'Guercif': 'جرسيف',
  'Ifrane': 'إفران',
  'Inzegane': 'إنزكان',
  'Kasba Tadla': 'قصبة تادلة',
  'Kenitra': 'القنيطرة',
  'Khemisset': 'الخميسات',
  'Khenifra': 'خنيفرة',
  'Khouribga': 'خريبكة',
  'Ksar El Kebir': 'القصر الكبير',
  'Laayoune': 'العيون',
  'Larache': 'العرائش',
  'M Diq': 'المضيق',
  'Marrakech': 'مراكش',
  'Martil': 'مرتيل',
  'Mechra Bel Ksiri': 'مشرع بلقصيري',
  'Mehdya': 'المهدية',
  'Meknes': 'مكناس',
  'Midelt': 'ميدلت',
  'Mohammedia': 'المحمدية',
  'Nador': 'الناظور',
  'Ouarzazate': 'ورزازات',
  'Ouazzane': 'وزان',
  'Oued Zem': 'وادي زم',
  'Oujda': 'وجدة',
  'Rabat': 'الرباط',
  'Safi': 'آسفي',
  'Sale': 'سلا',
  'Sefrou': 'صفرو',
  'Settat': 'سطات',
  'Sidi Bennour': 'سيدي بنور',
  'Sidi Kacem': 'سيدي قاسم',
  'Sidi Slimane': 'سيدي سليمان',
  'Sidi Yahya El Gharb': 'سيدي يحيى الغرب',
  'Skhirat': 'الصخيرات',
  'Souk El Arbaa': 'سوق الأربعاء',
  'Tanger': 'طنجة',
  'Tan-Tan': 'طانطان',
  'Taounate': 'تاونات',
  'Taroudant': 'تارودانت',
  'Tata': 'طاطا',
  'Taza': 'تازة',
  'Temara': 'تمارة',
  'Tetouan': 'تطوان',
  'Tiflet': 'تيفلت',
  'Tinghir': 'تنغير',
  'Tiznit': 'تيزنيت',
  'Youssoufia': 'اليوسفية',
  'Zagora': 'زاكورة'
};

// Build baseline list with Arabic names enriched
export const BUNDLED_OZON_CITIES: OzonCity[] = (rawOzonCities as any[]).map(city => {
  const arabic = ARABIC_MAPPINGS[city.name] || guessArabicName(city.name);
  return {
    id: city.id,
    ref: city.ref,
    name: city.name,
    deliveredPrice: city.deliveredPrice !== undefined ? city.deliveredPrice : 35,
    returnedPrice: city.returnedPrice !== undefined ? city.returnedPrice : 0,
    refusedPrice: city.refusedPrice !== undefined ? city.refusedPrice : 10,
    arabicName: arabic
  };
});

function guessArabicName(name: string): string | undefined {
  if (!name) return undefined;
  if (name.startsWith('Casablanca – ')) {
    const sub = name.replace('Casablanca – ', '');
    return `الدار البيضاء - ${sub}`;
  }
  return undefined;
}

// In-memory cache
let cachedCities: OzonCity[] | null = null;

/**
 * Gets all Ozon cities (from localStorage if synced, else bundled fallback)
 */
export function getOzonCities(): OzonCity[] {
  if (cachedCities && cachedCities.length > 0) {
    return cachedCities;
  }

  try {
    const stored = localStorage.getItem(OZON_CITIES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedCities = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading cached Ozon cities from localStorage:', e);
  }

  cachedCities = BUNDLED_OZON_CITIES;
  return BUNDLED_OZON_CITIES;
}

/**
 * Get timestamp of last sync with Ozon Express API
 */
export function getOzonCitiesLastSync(): string | null {
  try {
    return localStorage.getItem(OZON_CITIES_LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

/**
 * Live sync with official Ozon Express API https://api.ozonexpress.ma/cities
 */
export async function syncOzonCitiesFromApi(): Promise<{
  success: boolean;
  count: number;
  message: string;
}> {
  try {
    const response = await fetch('https://api.ozonexpress.ma/cities', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Ozon API returned status ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.CITIES) {
      throw new Error('Invalid response structure from Ozon API');
    }

    const rawList = Object.values(data.CITIES) as any[];
    const parsedCities: OzonCity[] = rawList.map(c => {
      const name = c.NAME ? String(c.NAME).trim() : '';
      const arabic = ARABIC_MAPPINGS[name] || guessArabicName(name);
      return {
        id: Number(c.ID),
        ref: c.REF ? String(c.REF).trim() : '',
        name: name,
        deliveredPrice: c['DELIVERED-PRICE'] !== undefined ? Number(c['DELIVERED-PRICE']) : 35,
        returnedPrice: c['RETURNED-PRICE'] !== undefined ? Number(c['RETURNED-PRICE']) : 0,
        refusedPrice: c['REFUSED-PRICE'] !== undefined ? Number(c['REFUSED-PRICE']) : 10,
        arabicName: arabic
      };
    });

    parsedCities.sort((a, b) => a.name.localeCompare(b.name));

    // Update in-memory and localStorage
    cachedCities = parsedCities;
    localStorage.setItem(OZON_CITIES_STORAGE_KEY, JSON.stringify(parsedCities));
    const nowIso = new Date().toISOString();
    localStorage.setItem(OZON_CITIES_LAST_SYNC_KEY, nowIso);

    return {
      success: true,
      count: parsedCities.length,
      message: `تم تحديث ${parsedCities.length} مدينة بنجاح مباشرة من Ozon Express API!`
    };
  } catch (err: any) {
    console.warn('Ozon API cities fetch failed, fallback to bundled cities:', err);
    return {
      success: false,
      count: getOzonCities().length,
      message: `تعذر الاتصال بـ Ozon API (${err.message || 'شبكة'})، يتم استخدام قاعدة المدن المدمجة (${BUNDLED_OZON_CITIES.length} مدينة).`
    };
  }
}

/**
 * Searches Ozon cities by Arabic, French/English name, or REF code
 */
export function searchOzonCities(query: string, limit: number = 30): OzonCity[] {
  const cities = getOzonCities();
  const trimmed = query.trim().toLowerCase();
  
  if (!trimmed) {
    return cities.slice(0, limit);
  }

  // Normalize query
  const cleanQ = trimmed
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');

  const matches = cities.filter(city => {
    const nameLower = city.name.toLowerCase();
    const refLower = city.ref.toLowerCase();
    const arabic = city.arabicName || '';
    const cleanArabic = arabic
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي');

    return (
      nameLower.includes(trimmed) ||
      refLower.includes(trimmed) ||
      arabic.includes(trimmed) ||
      cleanArabic.includes(cleanQ)
    );
  });

  return matches.slice(0, limit);
}

/**
 * Finds an exact or best-matching Ozon city
 */
export function findOzonCity(nameOrRef: string): OzonCity | undefined {
  if (!nameOrRef) return undefined;
  const cities = getOzonCities();
  const clean = nameOrRef.trim().toLowerCase();

  // 1. Exact match on REF
  const byRef = cities.find(c => c.ref.toLowerCase() === clean);
  if (byRef) return byRef;

  // 2. Exact match on Name
  const byName = cities.find(c => c.name.toLowerCase() === clean);
  if (byName) return byName;

  // 3. Exact match on Arabic name
  const byArabic = cities.find(c => c.arabicName && c.arabicName.trim() === nameOrRef.trim());
  if (byArabic) return byArabic;

  // 4. Case/Normalization insensitive match
  const cleanSearch = clean
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');

  return cities.find(c => {
    const arabic = (c.arabicName || '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي');
    return c.name.toLowerCase().includes(clean) || arabic.includes(cleanSearch);
  });
}

/**
 * Gets the delivery fee for a given city based on Ozon official pricing
 */
export function getOzonDeliveryFee(cityName: string, defaultFee: number = 35): number {
  const city = findOzonCity(cityName);
  if (city && city.deliveredPrice !== undefined) {
    return city.deliveredPrice;
  }
  // Check if Casablanca district fallback
  if (cityName.includes('الدار البيضاء') || cityName.toLowerCase().includes('casa')) {
    return 20;
  }
  return defaultFee;
}

/**
 * Top popular cities in Morocco with Ozon Express for quick selection
 */
export const POPULAR_OZON_CITIES = [
  { ref: 'maarif', name: 'Casablanca – Maarif', arabicName: 'الدار البيضاء - المعاريف', price: 20 },
  { ref: 'mrof', name: 'Casablanca – Sidi Maarouf', arabicName: 'الدار البيضاء - سيدي معروف', price: 20 },
  { ref: 'achok', name: 'Casablanca – Ain Chock', arabicName: 'الدار البيضاء - عين الشق', price: 20 },
  { ref: 'hssnI', name: 'Casablanca – Hay Hassani', arabicName: 'الدار البيضاء - الحي الحسني', price: 20 },
  { ref: 'sbaa', name: 'Casablanca – Ain Sebaa', arabicName: 'الدار البيضاء - عين السبع', price: 20 },
  { ref: 'RABT', name: 'Rabat', arabicName: 'الرباط', price: 35 },
  { ref: 'TGR', name: 'Tanger', arabicName: 'طنجة', price: 35 },
  { ref: 'MRK', name: 'Marrakech', arabicName: 'مراكش', price: 35 },
  { ref: 'FES', name: 'Fes', arabicName: 'فاس', price: 35 },
  { ref: 'AGA', name: 'Agadir', arabicName: 'أكادير', price: 35 },
  { ref: 'KNT', name: 'Kenitra', arabicName: 'القنيطرة', price: 35 },
  { ref: 'MEK', name: 'Meknes', arabicName: 'مكناس', price: 35 },
  { ref: 'OUJ', name: 'Oujda', arabicName: 'وجدة', price: 45 },
  { ref: 'TET', name: 'Tetouan', arabicName: 'تطوان', price: 35 },
  { ref: 'MOH', name: 'Mohammedia', arabicName: 'المحمدية', price: 35 },
  { ref: 'EJD', name: 'El Jadida', arabicName: 'الجديدة', price: 35 },
  { ref: 'SFI', name: 'Safi', arabicName: 'آسفي', price: 40 },
  { ref: 'BML', name: 'Beni Mellal', arabicName: 'بني ملال', price: 40 },
  { ref: 'KHO', name: 'Khouribga', arabicName: 'خريبكة', price: 40 },
  { ref: 'NAD', name: 'Nador', arabicName: 'الناظور', price: 45 },
  { ref: 'DAK', name: 'Dakhla', arabicName: 'الداخلة', price: 45 },
  { ref: 'BJDR', name: 'Boujdour', arabicName: 'بوجدور', price: 45 }
];
