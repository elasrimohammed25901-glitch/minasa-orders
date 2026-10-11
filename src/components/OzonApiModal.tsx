import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Key, 
  Building2, 
  Phone, 
  MapPin, 
  ToggleLeft, 
  ToggleRight,
  Printer,
  Search,
  ExternalLink,
  Sparkles,
  Sliders
} from 'lucide-react';
import { OzonConfig, OzonCity } from '../types';
import { getOzonConfig, saveOzonConfig, testOzonConnection } from '../utils/ozonApi';
import { 
  getOzonCities, 
  syncOzonCitiesFromApi, 
  getOzonCitiesLastSync, 
  searchOzonCities 
} from '../utils/ozonCities';
import { triggerHaptic } from '../utils/haptics';
import { CURRENCY } from '../utils/currency';

interface OzonApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated?: (config: OzonConfig) => void;
}

export const OzonApiModal: React.FC<OzonApiModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'cities'>('config');
  const [config, setConfig] = useState<OzonConfig>(getOzonConfig);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    accountName?: string;
    activeHub?: string;
  } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Cities Tab State
  const [cities, setCities] = useState<OzonCity[]>(getOzonCities);
  const [citySearch, setCitySearch] = useState('');
  const [priceFilter, setPriceFilter] = useState<number | 'all'>('all');
  const [isSyncingCities, setIsSyncingCities] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(getOzonCitiesLastSync);

  if (!isOpen) return null;

  const handleTest = async () => {
    triggerHaptic('medium');
    setIsTesting(true);
    setTestResult(null);

    const res = await testOzonConnection(config);
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      triggerHaptic('success');
      setConfig(prev => ({
        ...prev,
        connected: true,
        lastTestedAt: new Date().toISOString()
      }));
    } else {
      triggerHaptic('warning');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('heavy');
    saveOzonConfig(config);
    if (onConfigUpdated) {
      onConfigUpdated(config);
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const handleSyncCities = async () => {
    triggerHaptic('medium');
    setIsSyncingCities(true);
    setSyncFeedback(null);
    const result = await syncOzonCitiesFromApi();
    setIsSyncingCities(false);
    setSyncFeedback(result.message);
    setCities(getOzonCities());
    setLastSync(getOzonCitiesLastSync());
    if (result.success) {
      triggerHaptic('success');
    }
  };

  // Filter cities
  const filteredCities = cities.filter(c => {
    const matchesPrice = priceFilter === 'all' || c.deliveredPrice === priceFilter;
    if (!matchesPrice) return false;
    if (!citySearch.trim()) return true;
    const query = citySearch.trim().toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.ref.toLowerCase().includes(query) ||
      (c.arabicName && c.arabicName.includes(citySearch.trim())) ||
      String(c.id).includes(query)
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full flex flex-col border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white rounded-t-lg shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-lg text-white">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>ربط Ozon Express API</span>
                <span className="text-[10px] bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/30 font-mono">
                  v1.2 Morocco
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                تكامل كامل مع خدمات التوصيل وقاعدة المدن الرسمية (801 مدينة)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('config');
            }}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'config'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>إعدادات الربط والأتمتة</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('cities');
            }}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'cities'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>قاعدة مدن أوزون المعتمدة ({cities.length} مدينة)</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-mono">
              LIVE
            </span>
          </button>
        </div>

        {/* Tab 1: API Configuration Form */}
        {activeTab === 'config' && (
          <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-right">
            
            {/* Status Alert */}
            {testResult && (
              <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                testResult.success 
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                  : 'bg-red-50 text-red-900 border-red-200'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-bold text-xs">{testResult.message}</p>
                  {testResult.accountName && (
                    <div className="mt-1 text-[11px] text-slate-600 flex items-center gap-3">
                      <span>الحساب: <b className="text-slate-900">{testResult.accountName}</b></span>
                      <span>المركز: <b className="text-slate-900">{testResult.activeHub}</b></span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* API Credentials */}
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-600" />
                <span>بيانات الاعتماد الرسمية لـ Ozon API (Morocco):</span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    معرّف العميل (Votre ID Client) *
                  </label>
                  <input
                    type="text"
                    value={config.customerId}
                    onChange={e => setConfig(prev => ({ ...prev, customerId: e.target.value }))}
                    placeholder="مثال: 12345"
                    className="w-full px-3 py-2 rounded border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    dir="ltr"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    رقم حسابك كما هو ظاهر في لوحة تحكم أوزون
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    اسم الحساب المسجل بأوزون
                  </label>
                  <input
                    type="text"
                    value={config.accountName}
                    onChange={e => setConfig(prev => ({ ...prev, accountName: e.target.value }))}
                    placeholder="متجر إنجاز للأزياء النسائية"
                    className="w-full px-3 py-2 rounded border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    الاسم التجاري للمتجر
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  مفتاح الربط (Clé API) *
                </label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={e => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="الصق مفتاحك المولد من قسم Compte -> Generate API key"
                  className="w-full px-3 py-2 rounded border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  dir="ltr"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  تجد مفتاحك في: أوزون ⬅ Compte ⬅ Generate your API key
                </span>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-bold transition active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 text-blue-600 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'جاري فحص الاتصال...' : 'فحص الاتصال مع Ozon API'}</span>
                </button>
              </div>
            </div>

            {/* Automation Rules */}
            <div className="space-y-2 bg-blue-50/50 p-3.5 rounded-lg border border-blue-100">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <span>إعدادات الأتمتة المباشرة (التسجيل والطباعة):</span>
              </h4>

              {/* Auto send toggle */}
              <div 
                onClick={() => {
                  triggerHaptic('selection');
                  setConfig(prev => ({ ...prev, autoSendOnCreate: !prev.autoSendOnCreate }));
                }}
                className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition"
              >
                <div>
                  <span className="font-bold text-slate-800 block text-xs">
                    تسجيل الشحنة مباشرة في أوزون فور إضافة الطلبية
                  </span>
                  <span className="text-[10px] text-slate-500">
                    بمجرد قيام أي مستخدم (مدير، مشرف، عامل) بتسجيل طلبية، ترسل أوتوماتيكياً لأوزون وينشأ رقم التتبع فوراً
                  </span>
                </div>
                <div className="text-blue-600">
                  {config.autoSendOnCreate ? (
                    <ToggleRight className="w-6 h-6 text-blue-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Auto open sticker toggle */}
              <div 
                onClick={() => {
                  triggerHaptic('selection');
                  setConfig(prev => ({ ...prev, autoOpenStickerOnCreate: !prev.autoOpenStickerOnCreate }));
                }}
                className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition"
              >
                <div>
                  <span className="font-bold text-slate-800 block text-xs flex items-center gap-1">
                    <Printer className="w-3 h-3 text-slate-700" />
                    <span>فتح ورقة التوصيل اللاصقة للطباعة فور تسجيل الطلبية</span>
                  </span>
                  <span className="text-[10px] text-slate-500">
                    عرض بوليصة الشحن اللاصقة (Sticker A6) لطباعتها ولصقها على الطرد فوراً
                  </span>
                </div>
                <div className="text-blue-600">
                  {config.autoOpenStickerOnCreate ? (
                    <ToggleRight className="w-6 h-6 text-blue-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Sender details */}
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>بيانات المرسل التي تظهر على ملصق الشحنة:</span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">اسم المتجر / العلامة</label>
                  <input
                    type="text"
                    required
                    value={config.senderName}
                    onChange={e => setConfig(prev => ({ ...prev, senderName: e.target.value }))}
                    className="w-full px-3 py-2 rounded border border-slate-300 bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">هاتف المتجر للاتصال</label>
                  <input
                    type="text"
                    required
                    value={config.senderPhone}
                    onChange={e => setConfig(prev => ({ ...prev, senderPhone: e.target.value }))}
                    className="w-full px-3 py-2 rounded border border-slate-300 bg-white text-xs font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">مدينة انطلاق الشحنة</label>
                  <input
                    type="text"
                    required
                    value={config.senderCity}
                    onChange={e => setConfig(prev => ({ ...prev, senderCity: e.target.value }))}
                    className="w-full px-3 py-2 rounded border border-slate-300 bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">عنوان المستودع / المحل</label>
                  <input
                    type="text"
                    required
                    value={config.senderAddress}
                    onChange={e => setConfig(prev => ({ ...prev, senderAddress: e.target.value }))}
                    className="w-full px-3 py-2 rounded border border-slate-300 bg-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Footer Save */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-200">
              {saveSuccess ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1 text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم حفظ إعدادات Ozon Express بنجاح!</span>
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  يتم تطبيق إعدادات الربط على كافة طلبيات المنصة
                </span>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded text-xs font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition active:scale-95 shadow-xs"
                >
                  حفظ الإعدادات
                </button>
              </div>
            </div>

          </form>
        )}

        {/* Tab 2: Ozon Cities Explorer & Live Sync */}
        {activeTab === 'cities' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-right">
            
            {/* Top Sync & API Info Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>قاعدة مدن ومناطق Ozon Express Morocco</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    مستوردة مباشرة من الرابط الرسمي: <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-blue-700 border border-blue-200">https://api.ozonexpress.ma/cities</code>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSyncCities}
                  disabled={isSyncingCities}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCities ? 'animate-spin' : ''}`} />
                  <span>{isSyncingCities ? 'جاري المزامنة...' : 'مزامنة المدن الآن'}</span>
                </button>
              </div>

              {syncFeedback && (
                <div className="p-2 bg-white rounded border border-blue-200 text-blue-800 text-[11px] font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{syncFeedback}</span>
                </div>
              )}

              {lastSync && (
                <div className="text-[10px] text-slate-500 flex items-center justify-between border-t border-blue-200/60 pt-2">
                  <span>آخر مزامنة ناجحة: {new Date(lastSync).toLocaleString('ar-MA')}</span>
                  <span className="font-mono font-bold text-blue-700">{cities.length} مدينة مسجلة</span>
                </div>
              )}
            </div>

            {/* Price Categories Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-600 ml-1">تصفية حسب سعر التوصيل:</span>
              <button
                type="button"
                onClick={() => setPriceFilter('all')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition ${
                  priceFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                الكل ({cities.length})
              </button>
              <button
                type="button"
                onClick={() => setPriceFilter(20)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition ${
                  priceFilter === 20
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                20 {CURRENCY} (أحياء الدار البيضاء - {cities.filter(c => c.deliveredPrice === 20).length})
              </button>
              <button
                type="button"
                onClick={() => setPriceFilter(35)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition ${
                  priceFilter === 35
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                35 {CURRENCY} (المدن الكبرى: الرباط، طنجة، فاس... - {cities.filter(c => c.deliveredPrice === 35).length})
              </button>
              <button
                type="button"
                onClick={() => setPriceFilter(40)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition ${
                  priceFilter === 40
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                40 {CURRENCY} (آسفي، خريبكة... - {cities.filter(c => c.deliveredPrice === 40).length})
              </button>
              <button
                type="button"
                onClick={() => setPriceFilter(45)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition ${
                  priceFilter === 45
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                45 {CURRENCY} (المناطق الإقليمية - {cities.filter(c => c.deliveredPrice === 45).length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث عن أي مدينة أو منطقة أو رمز REF أو رقم ID (مثال: Agadir, maarif, طنجة, 289...)"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="w-full pr-9 pl-8 py-2 rounded-md border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {citySearch && (
                <button
                  type="button"
                  onClick={() => setCitySearch('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Cities Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">المدينة الرسمية بأوزون</th>
                      <th className="p-2.5">الاسم بالعربية</th>
                      <th className="p-2.5 text-center">رمز REF</th>
                      <th className="p-2.5 text-center">معرّف ID</th>
                      <th className="p-2.5 text-center">سعر التوصيل</th>
                      <th className="p-2.5 text-center">سعر الإرجاع</th>
                      <th className="p-2.5 text-center">سعر الرفض</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredCities.length > 0 ? (
                      filteredCities.map(city => (
                        <tr key={`${city.id}-${city.ref}`} className="hover:bg-blue-50/50 transition">
                          <td className="p-2.5 font-bold text-slate-900 truncate">
                            {city.name}
                          </td>
                          <td className="p-2.5 text-slate-700">
                            {city.arabicName || '—'}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-blue-700">
                            <span className="bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-[10px]">
                              {city.ref}
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-mono text-slate-500 text-[11px]">
                            {city.id}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-emerald-700">
                            <span className="bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                              {city.deliveredPrice} {CURRENCY}
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-mono text-slate-600 text-[11px]">
                            {city.returnedPrice} {CURRENCY}
                          </td>
                          <td className="p-2.5 text-center font-mono text-slate-600 text-[11px]">
                            {city.refusedPrice} {CURRENCY}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          لا توجد مدينة مطابقة للبحث "{citySearch}"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="bg-slate-50 p-2 text-center text-[11px] text-slate-500 border-t border-slate-200">
                عرض {filteredCities.length} من أصل {cities.length} مدينة معتمدة
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition active:scale-95"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
