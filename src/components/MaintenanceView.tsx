import React, { useState } from 'react';
import { 
  CalendarClock, 
  Trash2, 
  Archive, 
  CheckCircle2, 
  Sparkles, 
  Clock
} from 'lucide-react';
import { CleanupSettings, Order, SystemNotification } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface MaintenanceViewProps {
  settings: CleanupSettings;
  orders: Order[];
  notifications: SystemNotification[];
  onExecuteCleanup: () => void;
  onUpdateSettings: (settings: CleanupSettings) => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  settings,
  orders,
  notifications,
  onExecuteCleanup,
  onUpdateSettings
}) => {
  const [days, setDays] = useState(settings.autoArchiveDays);
  const [enabled, setEnabled] = useState(settings.enabled);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Stats
  const archivedOrdersCount = orders.filter(o => o.isArchived).length;
  const oldDeliveredEligible = orders.filter(o => {
    if (o.isArchived || o.status !== 'delivered') return false;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return new Date(o.completedAt || o.createdAt) < cutoff;
  }).length;

  const readNotifsCount = notifications.filter(n => n.read).length;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    onUpdateSettings({
      ...settings,
      autoArchiveDays: days,
      enabled
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-sm border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-slate-900 text-white flex items-center justify-center font-bold">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">جدول الصيانة والتنظيف الدوري لسير العمل</h2>
            <p className="text-xs text-slate-500 mt-1">
              أرشفة دورية للطلبيات القديمة المكتملة وتنظيف السجلات لضمان سرعة واستقرار المنظومة
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        <div className="bg-white p-5 sm:p-6 rounded-sm border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">الطلبيات المؤرشفة حالياً</span>
            <Archive className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-2 font-mono">{archivedOrdersCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">محفوظة في الأرشيف ولا تعيق البحث اللحظي</p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-sm border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">موعد التنظيف الدوري القادم</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-lg font-bold text-blue-700 mt-2">
            {new Date(settings.nextScheduledTime).toLocaleDateString('ar-MA', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            آخر تنظيف تم: {new Date(settings.lastCleanupTime).toLocaleDateString('ar-MA')}
          </p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-sm border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">إجمالي العناصر المنظفة تراكمياً</span>
            <Sparkles className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600 mt-2 font-mono">{settings.clearedItemsCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">طلبيات وسجلات قديمة تمت أرشفتها</p>
        </div>

      </div>

      {/* Two Column Layout: Execution Box & Settings Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Manual Cleanup Action Box */}
        <div className="bg-white rounded-sm border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-sm bg-slate-100 text-slate-800">
                <Trash2 className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-slate-900">تشغيل الصيانة الفورية</h3>
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              يقوم هذا الإجراء بأرشفة جميع الطلبيات المسلمة المكتملة الأقدم من {days} يوماً، بالإضافة إلى مسح الإشعارات القديمة المقروءة لتسريع وتحسين استجابة التطبيق وقواعد البيانات.
            </p>

            <div className="bg-slate-50 p-3.5 rounded-sm border border-slate-200 mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">طلبيات مؤهلة للأرشفة الآن:</span>
                <span className="font-bold text-blue-700 font-mono">{oldDeliveredEligible} طلبية</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">إشعارات مقروءة قديمة للتنظيف:</span>
                <span className="font-bold text-slate-800 font-mono">{readNotifsCount} إشعار</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              id="btn-run-manual-cleanup"
              onClick={() => {
                triggerHaptic('heavy');
                if (confirm('هل تريد تأكيد بدء عملية الصيانة وأرشفة السجلات المكتملة القديمة الآن؟')) {
                  triggerHaptic('success');
                  onExecuteCleanup();
                }
              }}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-md transition shadow-xs text-xs sm:text-sm active:scale-95 touch-manipulation"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>بدء الصيانة والتنظيف الدوري الآن</span>
            </button>
          </div>
        </div>

        {/* Schedule & Retention Settings Form */}
        <div className="bg-white rounded-sm border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-2 rounded-sm bg-slate-100 text-slate-700">
              <Clock className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold text-slate-900">إعدادات الجدول الزمني</h3>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs text-right">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                الاحتفاظ بالطلبيات المكتملة في القائمة الرئيسية لمدة (بالأيام):
              </label>
              <input
                type="number"
                min="7"
                max="365"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                يتم نقل الطلبيات المسلمة الأقدم من هذه المدة إلى الأرشيف تلقائياً
              </p>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => {
                    triggerHaptic('selection');
                    setEnabled(e.target.checked);
                  }}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="font-bold text-slate-800">
                  تفعيل الجدولة الدورية التلقائية أسبوعياً
                </span>
              </label>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              {saveSuccess && (
                <span className="text-green-600 font-bold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم حفظ الإعدادات بنجاح</span>
                </span>
              )}
              <div className="mr-auto">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-bold transition text-xs sm:text-sm active:scale-95 touch-manipulation shadow-xs"
                >
                  حفظ إعدادات الجدولة
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
};
