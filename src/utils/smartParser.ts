import { Product } from '../types';
import { findOzonCity, getOzonCities } from './ozonCities';

export interface ParsedOrderData {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  city: string;
  ozonCityId?: number;
  ozonCityRef?: string;
  ozonDeliveredPrice?: number;
  matchedItems: { productId: string; quantity: number }[];
  notes?: string;
  rawText: string;
  confidence: number; // 0 - 100
}

const MOROCCAN_CITIES = [
  'الدار البيضاء',
  'الرباط',
  'فاس',
  'مراكش',
  'طنجة',
  'أكادير',
  'مكناس',
  'وجدة',
  'القنيطرة',
  'تطوان',
  'تمارة',
  'سلا',
  'الجديدة',
  'بني ملال',
  'الناظور',
  'المحمدية',
  'خريبكة',
  'سطات',
  'العرائش',
  'العيون',
  'الداخلة',
  'ورزازات',
  'تازة',
  'برشيد'
];

/**
 * Normalizes phone numbers to standard format
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If starts with 00212, convert to +212
  if (cleaned.startsWith('00212')) {
    cleaned = '+212' + cleaned.slice(5);
  } else if (cleaned.startsWith('212') && cleaned.length >= 12) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

/**
 * Extracts phone numbers from text
 */
function extractPhone(text: string): string {
  // Patterns for Moroccan and international numbers:
  // 0612345678, 0712345678, 0512345678, +212 6..., 06 12 34 56 78
  const phoneRegexes = [
    /(?:\+212|00212)[\s-]?[567]\d{1}[\s-]?\d{3}[\s-]?\d{4}/,
    /0[567][\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}/,
    /0[567]\d{8}/,
    /(?:\+?\d{1,3}[\s-]?)?\(?\d{2,3}\)?[\s-]?\d{3}[\s-]?\d{4}/
  ];

  for (const regex of phoneRegexes) {
    const match = text.match(regex);
    if (match) {
      return match[0].trim();
    }
  }

  return '';
}

/**
 * Extracts city from text and matches with Ozon Express cities database
 */
function extractCityDetails(text: string): {
  city: string;
  ozonCityId?: number;
  ozonCityRef?: string;
  ozonDeliveredPrice?: number;
} {
  const lower = text.toLowerCase();

  // 1. Check for specific Casablanca neighborhoods (20 DH zone)
  const casaDistricts: { keyword: string; ref: string; name: string }[] = [
    { keyword: 'معاريف', ref: 'maarif', name: 'Casablanca – Maarif' },
    { keyword: 'سيدي معروف', ref: 'mrof', name: 'Casablanca – Sidi Maarouf' },
    { keyword: 'عين الشق', ref: 'achok', name: 'Casablanca – Ain Chock' },
    { keyword: 'حي حسني', ref: 'hssnI', name: 'Casablanca – Hay Hassani' },
    { keyword: 'الحي الحسني', ref: 'hssnI', name: 'Casablanca – Hay Hassani' },
    { keyword: 'عين سبع', ref: 'sbaa', name: 'Casablanca – Ain Sebaa' },
    { keyword: 'عين السبع', ref: 'sbaa', name: 'Casablanca – Ain Sebaa' },
    { keyword: 'بوركون', ref: 'rgon', name: 'Casablanca – Bourgogne' },
    { keyword: 'برنوصي', ref: 'brns', name: 'Casablanca – Bernoussi' },
    { keyword: 'سيدي عثمان', ref: 'sotmn', name: 'Casablanca – Sidi Othmane' },
    { keyword: 'سباتة', ref: 'sbata', name: 'Casablanca – Sbata' },
    { keyword: 'مولاي رشيد', ref: 'mrachid', name: 'Casablanca – Moulay Rachid' },
    { keyword: 'ليساسفة', ref: 'lssf', name: 'Casablanca – Lissasfa' },
    { keyword: 'درب سلطان', ref: 'dseltan', name: 'Casablanca – Derb Sultan' },
    { keyword: 'درب عمر', ref: 'domar', name: 'Casablanca – Derb Omar' },
    { keyword: 'الفة', ref: 'olf', name: 'Casablanca – Oulfa' },
    { keyword: 'الألفة', ref: 'olf', name: 'Casablanca – Oulfa' },
    { keyword: 'أنفا', ref: 'anfa', name: 'Casablanca – Anfa' },
    { keyword: 'كاليفورنيا', ref: 'calif', name: 'Casablanca – Californie' },
    { keyword: 'تشارك', ref: 'tchrk', name: 'Tacharouk-casablanca' }
  ];

  for (const district of casaDistricts) {
    if (text.includes(district.keyword) || lower.includes(district.ref)) {
      const ozonMatch = findOzonCity(district.ref);
      return {
        city: ozonMatch?.arabicName || district.name,
        ozonCityId: ozonMatch?.id,
        ozonCityRef: ozonMatch?.ref,
        ozonDeliveredPrice: ozonMatch?.deliveredPrice || 20
      };
    }
  }

  // 2. Check Moroccan main cities list
  for (const cityName of MOROCCAN_CITIES) {
    if (text.includes(cityName)) {
      const ozonMatch = findOzonCity(cityName);
      return {
        city: ozonMatch?.arabicName || cityName,
        ozonCityId: ozonMatch?.id,
        ozonCityRef: ozonMatch?.ref,
        ozonDeliveredPrice: ozonMatch?.deliveredPrice || 35
      };
    }
  }

  // 3. Check for common variations like "كازا" or "كازابلانكا"
  if (text.includes('كازا') || text.includes('كازابلانكا') || lower.includes('casa')) {
    const ozonMatch = findOzonCity('maarif');
    return {
      city: 'الدار البيضاء - المعاريف',
      ozonCityId: ozonMatch?.id,
      ozonCityRef: ozonMatch?.ref || 'maarif',
      ozonDeliveredPrice: 20
    };
  }
  if (text.includes('مراكش') || lower.includes('kech') || lower.includes('marrakech')) {
    const ozonMatch = findOzonCity('MRK');
    return {
      city: 'مراكش',
      ozonCityId: ozonMatch?.id,
      ozonCityRef: ozonMatch?.ref || 'MRK',
      ozonDeliveredPrice: 35
    };
  }
  if (text.includes('رباط') || lower.includes('rabat')) {
    const ozonMatch = findOzonCity('RABT');
    return {
      city: 'الرباط',
      ozonCityId: ozonMatch?.id,
      ozonCityRef: ozonMatch?.ref || 'RABT',
      ozonDeliveredPrice: 35
    };
  }
  if (text.includes('طنجة') || lower.includes('tanger')) {
    const ozonMatch = findOzonCity('TGR');
    return {
      city: 'طنجة',
      ozonCityId: ozonMatch?.id,
      ozonCityRef: ozonMatch?.ref || 'TGR',
      ozonDeliveredPrice: 35
    };
  }

  // 4. Check against all 801 Ozon cities names
  const ozonCities = getOzonCities();
  for (const ozCity of ozonCities) {
    if (ozCity.name && ozCity.name.length > 3 && lower.includes(ozCity.name.toLowerCase())) {
      return {
        city: ozCity.arabicName || ozCity.name,
        ozonCityId: ozCity.id,
        ozonCityRef: ozCity.ref,
        ozonDeliveredPrice: ozCity.deliveredPrice
      };
    }
  }

  const defaultMatch = findOzonCity('maarif');
  return {
    city: 'الدار البيضاء - المعاريف',
    ozonCityId: defaultMatch?.id,
    ozonCityRef: defaultMatch?.ref || 'maarif',
    ozonDeliveredPrice: 20
  };
}

/**
 * Extracts customer name from text
 */
function extractName(text: string, phone: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Look for explicit markers like "الاسم:", "الاسم الكامل:", "سميتي", "اسم:", "Nom:"
  for (const line of lines) {
    const nameMarkerMatch = line.match(/(?:الاسم|الاسم الكامل|سميتي|اسم|nom|client)\s*[:\-]?\s*([^\n,،]+)/i);
    if (nameMarkerMatch && nameMarkerMatch[1]) {
      const extracted = nameMarkerMatch[1].replace(/[0-9+]/g, '').trim();
      if (extracted.length >= 3 && extracted.length <= 40) {
        return extracted;
      }
    }
  }

  // Try finding name in greeting or first lines
  for (const line of lines) {
    // Avoid lines with phone, address, or product words
    if (
      phone && line.includes(phone) ||
      line.includes('شارع') ||
      line.includes('حي') ||
      line.includes('رقم') ||
      line.includes('عمارة') ||
      line.includes('طلب') ||
      line.includes('حبة') ||
      line.includes('قطعة')
    ) {
      continue;
    }

    // Check if line looks like 2 or 3 Arabic words (e.g. "محمد السالمي")
    const words = line.split(/\s+/).filter(w => w.length > 1);
    if (words.length >= 2 && words.length <= 4 && /^[\u0600-\u06FF\s]+$/.test(line)) {
      // Exclude greetings like "السلام عليكم"
      if (!line.includes('السلام') && !line.includes('مرحبا') && !line.includes('صباح') && !line.includes('مساء')) {
        return line;
      }
    }
  }

  return '';
}

/**
 * Extracts detailed address from text
 */
function extractAddress(text: string, city: string, phone: string, name: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Look for explicit address markers like "العنوان:", "العنوان الكامل:", "Adresse:"
  for (const line of lines) {
    const addressMarkerMatch = line.match(/(?:العنوان|العنوان الكامل|adresse|adresse de livraison)\s*[:\-]?\s*([^\n]+)/i);
    if (addressMarkerMatch && addressMarkerMatch[1]) {
      return addressMarkerMatch[1].trim();
    }
  }

  // Look for lines containing address keywords: شارع، حي، عمارة، إقامة، زنقة، تجزئة، درب، رقم
  const addressKeywords = ['شارع', 'حي', 'عمارة', 'إقامة', 'زنقة', 'تجزئة', 'درب', 'رقم', 'بلوك', 'طابق'];
  for (const line of lines) {
    if (addressKeywords.some(kw => line.includes(kw))) {
      // Remove phone or city if present on that line
      let cleanLine = line;
      if (phone) cleanLine = cleanLine.replace(phone, '');
      return cleanLine.trim();
    }
  }

  // Fallback: take the longest line that isn't the phone or name
  for (const line of lines) {
    if (line !== name && (!phone || !line.includes(phone)) && line.length > 15) {
      return line;
    }
  }

  return city ? `وسط المدينة، ${city}` : '';
}

/**
 * Matches requested products and quantities from available catalog
 */
function extractProducts(text: string, products: Product[]): { productId: string; quantity: number }[] {
  const lower = text.toLowerCase();
  const matched: { productId: string; quantity: number }[] = [];

  for (const prod of products) {
    const prodNameLower = prod.name.toLowerCase();
    const prodWords = prodNameLower.split(/\s+/).filter(w => w.length > 2);
    
    // Check if full product name or significant keywords appear
    const isDirectMatch = lower.includes(prodNameLower);
    const isKeywordMatch = prodWords.length >= 2 && prodWords.filter(w => lower.includes(w)).length >= 2;

    if (isDirectMatch || isKeywordMatch) {
      // Look for quantity keywords near product name or general text
      // e.g. "2 من", "3 حبات", "قطعتين", "زوج", "واحد", "3 قطع"
      let qty = 1;
      
      const qtyRegex = new RegExp(`(\\d+)\\s*(?:حبة|حبات|قطعة|قطع|من|بياسات)?\\s*${prodNameLower}`, 'i');
      const postQtyRegex = new RegExp(`${prodNameLower}[^0-9]*(\\d+)\\s*(?:حبة|حبات|قطعة|قطع)?`, 'i');
      
      const preMatch = text.match(qtyRegex);
      const postMatch = text.match(postQtyRegex);

      if (preMatch && preMatch[1]) {
        qty = parseInt(preMatch[1], 10);
      } else if (postMatch && postMatch[1]) {
        qty = parseInt(postMatch[1], 10);
      } else if (lower.includes('قطعتين') || lower.includes('حبتين') || lower.includes('زوج')) {
        qty = 2;
      }

      matched.push({ productId: prod.id, quantity: Math.max(1, qty) });
    }
  }

  // If no specific product matched, default to the first available product
  if (matched.length === 0 && products.length > 0) {
    matched.push({ productId: products[0].id, quantity: 1 });
  }

  return matched;
}

/**
 * Main Smart Parser Entry Function
 */
export function parseCustomerOrderText(text: string, products: Product[]): ParsedOrderData {
  if (!text || !text.trim()) {
    return {
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      city: 'الدار البيضاء',
      matchedItems: products[0] ? [{ productId: products[0].id, quantity: 1 }] : [],
      rawText: '',
      confidence: 0
    };
  }

  const phone = extractPhone(text);
  const cityInfo = extractCityDetails(text);
  const name = extractName(text, phone);
  const address = extractAddress(text, cityInfo.city, phone, name);
  const matchedItems = extractProducts(text, products);

  // Calculate extraction confidence score
  let score = 20;
  if (phone) score += 30;
  if (name) score += 25;
  if (address) score += 15;
  if (cityInfo.city) score += 10;

  return {
    customerName: name,
    customerPhone: phone,
    customerAddress: address,
    city: cityInfo.city,
    ozonCityId: cityInfo.ozonCityId,
    ozonCityRef: cityInfo.ozonCityRef,
    ozonDeliveredPrice: cityInfo.ozonDeliveredPrice,
    matchedItems,
    rawText: text,
    confidence: Math.min(100, score)
  };
}
