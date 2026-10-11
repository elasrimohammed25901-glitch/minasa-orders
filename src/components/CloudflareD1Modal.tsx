import React, { useState } from 'react';
import { 
  Cloud, 
  X, 
  RefreshCw, 
  Check, 
  Copy, 
  ShieldCheck, 
  Database, 
  Save, 
  FileCode, 
  ExternalLink 
} from 'lucide-react';
import { 
  loadD1Config, 
  saveD1Config, 
  syncWithCloudflareD1, 
  D1_SQL_SCHEMA
} from '../utils/cloudflareD1';
import { Order, User, Product, AuditLogEntry, CloudflareD1Config } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface CloudflareD1ModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  users: User[];
  products: Product[];
  auditLogs?: AuditLogEntry[];
  onSyncComplete?: (message: string) => void;
}

export const CloudflareD1Modal: React.FC<CloudflareD1ModalProps> = ({
  isOpen,
  onClose,
  orders,
  users,
  products,
  auditLogs = [],
  onSyncComplete
}) => {
  if (!isOpen) return null;

  const [config, setConfig] = useState<CloudflareD1Config>(loadD1Config());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');
    saveD1Config(config);
    setSyncStatus('تم حفظ إعدادات Cloudflare D1 بنجاح');
    setTimeout(() => setSyncStatus(null), 3000);
  };

  const handleManualSync = async () => {
    triggerHaptic('medium');
    setIsSyncing(true);
    setSyncStatus('جاري المزامنة السحابية مع Cloudflare D1...');

    const result = await syncWithCloudflareD1(orders, users, products, auditLogs);
    setIsSyncing(false);
    setSyncStatus(result.message);
    triggerHaptic(result.success ? 'success' : 'warning');
    onSyncComplete(result.message);

    setTimeout(() => setSyncStatus(null), 4000);
  };

  const handleCopySql = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(D1_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 text-right" dir="rtl">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">الربط السحابي مع Cloudflare D1</h2>
              <p className="text-xs text-slate-400">حفظ سحابي مركزي لحماية طلبيات العمال وسجلات النظام</p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Status Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">حالة المزامنة السحابية:</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                config.workerUrl 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                {config.workerUrl ? 'مربوط بسيرفر Worker' : 'وضع الحفظ المحلي الآمن (Local Fallback)'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-center font-mono text-xs">
              <div className="p-2 rounded bg-white border border-slate-200">
                <span className="block text-[10px] text-slate-400 font-sans">الطلبيات</span>
                <span className="font-bold text-slate-800">{orders.length}</span>
              </div>
              <div className="p-2 rounded bg-white border border-slate-200">
                <span className="block text-[10px] text-slate-400 font-sans">المستخدمين</span>
                <span className="font-bold text-slate-800">{users.length}</span>
              </div>
              <div className="p-2 rounded bg-white border border-slate-200">
                <span className="block text-[10px] text-slate-400 font-sans">المنتجات</span>
                <span className="font-bold text-slate-800">{products.length}</span>
              </div>
              <div className="p-2 rounded bg-white border border-slate-200">
                <span className="block text-[10px] text-slate-400 font-sans">سجل النشاطات</span>
                <span className="font-bold text-slate-800">{auditLogs.length}</span>
              </div>
            </div>

            {config.lastSyncedAt && (
              <p className="text-[11px] text-slate-500 pt-1">
                آخر مزامنة ناجحة: {new Date(config.lastSyncedAt).toLocaleString('ar-SA')}
              </p>
            )}
          </div>

          {syncStatus && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 font-medium animate-in fade-in">
              {syncStatus}
            </div>
          )}

          {/* Sync Trigger Button */}
          <div>
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-500 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition shadow-md shadow-orange-600/20 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'جاري المزامنة مع Cloudflare...' : 'مزامنة سحابية فورية الآن مع Cloudflare D1'}</span>
            </button>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSaveConfig} className="space-y-3 pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>إعدادات الاتصال بـ Cloudflare Worker API</span>
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                رابط Worker السحابي (Endpoint URL)
              </label>
              <input
                type="url"
                placeholder="https://my-enjaz-worker.example.workers.dev"
                value={config.workerUrl}
                onChange={(e) => setConfig({ ...config, workerUrl: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-left"
                dir="ltr"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                يمكن تركه فارغاً للاعتماد التلقائي على التخزين المحلي الآمن دون الحاجة لسيرفر خارجي.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                رمز المصادقة السري (Bearer API Token) - اختياري
              </label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                value={config.apiToken}
                onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-left"
                dir="ltr"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoSync}
                  onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>مزامنة تلقائية في الخلفية عند كل تغيير بالطلبيات</span>
              </label>

              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ الإعدادات</span>
              </button>
            </div>
          </form>

          {/* D1 SQL Schema Script Generator */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold">كود SQL لإنشاء جداول Cloudflare D1</span>
              </div>

              <button
                type="button"
                onClick={handleCopySql}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'تم النسخ!' : 'نسخ SQL'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              يمكنك نسخ هذا الكود وتنفيذه بضغطة زر داخل Cloudflare Dashboard D1 أو عبر أمر Wrangler:
              <br />
              <code className="text-orange-300 font-mono text-[10px] mt-1 inline-block" dir="ltr">
                wrangler d1 execute {config.databaseName} --file=schema.sql
              </code>
            </p>

            <button
              type="button"
              onClick={() => setShowSqlModal(!showSqlModal)}
              className="text-xs text-blue-400 hover:text-blue-300 underline font-medium block"
            >
              {showSqlModal ? 'إخفاء كود الـ SQL' : 'عرض كود الـ SQL بالكامل'}
            </button>

            {showSqlModal && (
              <pre className="p-3 bg-slate-950 rounded-lg text-[10px] font-mono text-slate-300 overflow-x-auto max-h-40 scrollbar-thin text-left" dir="ltr">
                {D1_SQL_SCHEMA}
              </pre>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};
