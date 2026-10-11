import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Check, RefreshCw, Sparkles, Building, ChevronDown, X } from 'lucide-react';
import { OzonCity } from '../types';
import { 
  getOzonCities, 
  searchOzonCities, 
  findOzonCity, 
  syncOzonCitiesFromApi, 
  POPULAR_OZON_CITIES,
  getOzonCitiesLastSync
} from '../utils/ozonCities';
import { triggerHaptic } from '../utils/haptics';
import { CURRENCY } from '../utils/currency';

interface OzonCitySelectProps {
  value: string;
  selectedRef?: string;
  onChange: (city: OzonCity) => void;
  required?: boolean;
  label?: string;
  autoFocus?: boolean;
}

export const OzonCitySelect: React.FC<OzonCitySelectProps> = ({
  value,
  selectedRef,
  onChange,
  required = true,
  label = 'مدينة التوصيل (قاعدة مدن أوزون)'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(getOzonCitiesLastSync());

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Current matched city object
  const currentCity = findOzonCity(selectedRef || value);

  // Filtered cities based on search
  const filteredCities = searchOzonCities(searchQuery, 40);
  const totalCitiesCount = getOzonCities().length;

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCity = (city: OzonCity) => {
    triggerHaptic('selection');
    onChange(city);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSyncWithApi = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    setIsSyncing(true);
    setSyncFeedback(null);
    const result = await syncOzonCitiesFromApi();
    setIsSyncing(false);
    setSyncFeedback(result.message);
    setLastSync(getOzonCitiesLastSync());
    if (result.success) {
      triggerHaptic('success');
    }
    setTimeout(() => {
      setSyncFeedback(null);
    }, 4000);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Label and Live Status */}
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          <span>{label} {required && <span className="text-red-500">*</span>}</span>
        </label>
        
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <button
            type="button"
            onClick={handleSyncWithApi}
            disabled={isSyncing}
            className="hover:text-blue-600 flex items-center gap-1 transition disabled:opacity-50"
            title="تحديث قائمة المدن من https://api.ozonexpress.ma/cities"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="font-mono text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
              {totalCitiesCount} مدن أوزون
            </span>
          </button>
        </div>
      </div>

      {/* Main Trigger Button / Field */}
      <div
        onClick={() => {
          triggerHaptic('light');
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className={`w-full text-xs px-3 py-2 rounded-md border cursor-pointer transition flex items-center justify-between bg-white shadow-2xs ${
          isOpen ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <div className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building className="w-3 h-3" />
          </div>

          <div className="truncate text-right">
            {currentCity ? (
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-slate-900">
                  {currentCity.arabicName || currentCity.name}
                </span>
                {currentCity.arabicName && currentCity.arabicName !== currentCity.name && (
                  <span className="text-slate-400 text-[10px] hidden sm:inline">
                    ({currentCity.name})
                  </span>
                )}
                <span className="bg-slate-100 text-slate-600 text-[9px] font-mono px-1 rounded border border-slate-200">
                  {currentCity.ref}
                </span>
              </div>
            ) : (
              <span className="text-slate-700 font-bold">{value || 'اختر مدينة التوصيل...'}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {currentCity && (
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] px-1.5 py-0.5 rounded font-mono">
              توصيل: {currentCity.deliveredPrice} {CURRENCY}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Quick Select Popular Cities Chips */}
      <div className="mt-1.5 flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[10px]">
        <span className="text-slate-400 shrink-0 flex items-center gap-0.5">
          <Sparkles className="w-2.5 h-2.5 text-amber-500" />
          <span>الأكثر طلباً:</span>
        </span>
        {POPULAR_OZON_CITIES.slice(0, 6).map((c) => {
          const isSelected = value === c.name || value === c.arabicName || selectedRef === c.ref;
          return (
            <button
              key={c.ref}
              type="button"
              onClick={() => {
                const fullCity = findOzonCity(c.ref);
                if (fullCity) handleSelectCity(fullCity);
              }}
              className={`shrink-0 px-2 py-0.5 rounded-full border transition active:scale-95 ${
                isSelected 
                  ? 'bg-blue-600 text-white border-blue-600 font-bold' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {c.arabicName.replace('الدار البيضاء - ', '')} ({c.price} د.م)
            </button>
          );
        })}
      </div>

      {/* Feedback Toast if any */}
      {syncFeedback && (
        <div className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 p-1.5 rounded mt-1">
          {syncFeedback}
        </div>
      )}

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full sm:min-w-[340px] bg-white rounded-lg shadow-xl border border-slate-200 p-2 animate-in fade-in-50 zoom-in-95 duration-100 right-0">
          
          {/* Search Header inside Dropdown */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              placeholder="ابحث بالعربية أو الفرنسية أو رمز REF (مثال: طنجة، maarif، أكادير، الرباط...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pr-8 pl-8 py-1.5 bg-slate-50 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
              dir="auto"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Info Banner */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pb-1.5 border-b border-slate-100 mb-1">
            <span>نتائج البحث من قاعدة Ozon Express ({filteredCities.length} مدينة)</span>
            <span className="text-[9px] text-blue-600 font-mono">api.ozonexpress.ma</span>
          </div>

          {/* Cities List */}
          <div className="max-h-60 overflow-y-auto space-y-1 overscroll-contain">
            {filteredCities.length > 0 ? (
              filteredCities.map((city) => {
                const isSelected = 
                  (selectedRef && selectedRef.toLowerCase() === city.ref.toLowerCase()) ||
                  value === city.name || 
                  value === city.arabicName;

                return (
                  <div
                    key={`${city.id}-${city.ref}`}
                    onClick={() => handleSelectCity(city)}
                    className={`p-2 rounded cursor-pointer transition flex items-center justify-between text-xs ${
                      isSelected 
                        ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold' 
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      
                      <div className="truncate">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-slate-900">
                            {city.arabicName || city.name}
                          </span>
                          {city.arabicName && city.arabicName !== city.name && (
                            <span className="text-slate-400 text-[10px]">
                              • {city.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono mt-0.5">
                          <span>REF: {city.ref}</span>
                          <span>•</span>
                          <span>ID: {city.id}</span>
                          {city.returnedPrice === 0 && (
                            <span className="text-emerald-600 font-sans">• الإرجاع مجاني (0 د.م)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0 pl-1">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {city.deliveredPrice} {CURRENCY}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs">
                لا توجد مدينة مطابقة لـ "{searchQuery}" في قاعدة مدن أوزون
              </div>
            )}
          </div>

          {/* Dropdown Footer with API link */}
          <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 px-1">
            <span>مصدر البيانات: Ozon Express API المعتمدة</span>
            <button
              type="button"
              onClick={handleSyncWithApi}
              className="text-blue-600 hover:underline font-bold flex items-center gap-1"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>مزامنة الآن</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
