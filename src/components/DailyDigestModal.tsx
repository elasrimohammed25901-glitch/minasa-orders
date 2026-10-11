import React from 'react';
import { Sun, X, TrendingUp, AlertTriangle, UserCheck, CheckCircle2, ArrowLeft, DollarSign } from 'lucide-react';
import { Order, User } from '../types';
import { CURRENCY } from '../utils/currency';
import { triggerHaptic } from '../utils/haptics';

interface DailyDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  workers: User[];
  onNavigateToPending: () => void;
}

export const DailyDigestModal: React.FC<DailyDigestModalProps> = ({
  isOpen,
  onClose,
  orders,
  workers,
  onNavigateToPending
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const todayOrders = orders.filter(o => o.createdAt.startsWith(todayStr) && !o.isArchived);
  const yesterdayOrders = orders.filter(o => o.createdAt.startsWith(yesterdayStr) && !o.isArchived);
  
  const pendingOrders = orders.filter(o => o.status === 'pending' && !o.isArchived);
  const urgentPendingOrders = pendingOrders.filter(o => o.priority === 'urgent');

  // Today financial expectation
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalSellingPrice, 0);
  const todayExpectedProfit = todayOrders.reduce((sum, o) => sum + o.netProfit, 0);

  // Top worker today
  const workerDailyCounts: { [workerId: string]: { name: string; count: number; completed: number } } = {};
  todayOrders.forEach(o => {
    if (!workerDailyCounts[o.assignedWorkerId]) {
      workerDailyCounts[o.assignedWorkerId] = {
        name: o.assignedWorkerName,
        count: 0,
        completed: 0
      };
    }
    workerDailyCounts[o.assignedWorkerId].count++;
    if (o.status === 'delivered') {
      workerDailyCounts[o.assignedWorkerId].completed++;
    }
  });

  const topWorker = Object.values(workerDailyCounts).sort((a, b) => b.count - a.count)[0];

  // Daily difference percentage
  const diffPercent = yesterdayOrders.length > 0 
    ? Math.round(((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100)
    : todayOrders.length > 0 ? 100 : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 text-right" dir="rtl">
        
        {/* Header with Warm Morning Gradient */}
        <div className="p-6 bg-gradient-to-l from-amber-500 to-orange-500 text-white relative">
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="absolute top-4 left-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Sun className="w-7 h-7 text-yellow-100 animate-spin-slow" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-100 uppercase tracking-wider block">الملخص الصباحي الذكي</span>
              <h2 className="text-xl font-black text-white">صباح النشاط والإنجاز! ☀️</h2>
            </div>
          </div>
          <p className="text-xs text-amber-100 mt-2">
            موجز تشغيلي فوري لحالة المنظومة، نشاط العمال، وتوزيع الطلبيات اليومية
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          
          {/* 1. Comparison & Volume Card */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">طلبيات اليوم المسجلة</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 font-mono">{todayOrders.length}</span>
                <span className="text-xs text-slate-400">طلبية</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] mt-1 text-emerald-600 font-bold">
                <TrendingUp className="w-3 h-3" />
                <span>
                  {diffPercent >= 0 ? `+${diffPercent}%` : `${diffPercent}%`} مقارنة بالأمس ({yesterdayOrders.length})
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">إجمالي مبيعات اليوم</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-slate-900 font-mono">
                  {todayRevenue.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-500">{CURRENCY}</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                صافي الربح: {todayExpectedProfit.toLocaleString()} {CURRENCY}
              </span>
            </div>
          </div>

          {/* 2. Outstanding Pending Orders Alert */}
          <div className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
            pendingOrders.length > 0 
              ? 'bg-amber-50/70 border-amber-200 text-amber-900' 
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-start gap-3">
              {pendingOrders.length > 0 ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-xs font-bold">
                  {pendingOrders.length > 0 
                    ? `توجد ${pendingOrders.length} طلبية بانتظار البدء والتجهيز`
                    : 'رائع! لا توجد أي طلبيات معلقة حالياً'}
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {urgentPendingOrders.length > 0 && (
                    <span className="text-red-700 font-bold block">
                      منها {urgentPendingOrders.length} طلبيات ذات أولوية عاجلة تحتاج تكليفاً فورياً!
                    </span>
                  )}
                  يوصى بمتابعة العمال لبدء شحن الطلبيات في الصباح الباكر.
                </p>
              </div>
            </div>

            {pendingOrders.length > 0 && (
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  onClose();
                  onNavigateToPending();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shrink-0 transition active:scale-95"
              >
                متابعة الآن
              </button>
            )}
          </div>

          {/* 3. Top Worker Spotlight */}
          {topWorker ? (
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-blue-700 font-bold block">أنشط عامل اليوم حتى الآن:</span>
                  <h4 className="text-xs font-bold text-slate-900">{topWorker.name}</h4>
                </div>
              </div>
              <div className="text-left font-mono">
                <span className="text-xs font-bold text-blue-900">{topWorker.count} طلبية مسندة</span>
                <span className="text-[10px] text-slate-500 block">({topWorker.completed} مكتمل)</span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
              لم تسند بعد طلبيات جديدة لليوم، ابدأ بتوزيع الطلبيات على المناديب
            </div>
          )}

          {/* 4. Operational Recommendations */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs space-y-1.5">
            <h5 className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
              <span>💡 توصيات تشغيلية سريعة لليوم:</span>
            </h5>
            <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside leading-relaxed">
              <li>تأكد من تأكيد مواعيد التسليم مع العملاء في الصباح عبر زر واتساب المباشر.</li>
              <li>التحقق من رقم الهاتف عند الإدخال لتفادي أي طلبيات مكررة لنفس العميل.</li>
              <li>مراجعة تقرير المخزون للمنتجات الأكثر طلباً في الدار البيضاء ومراكش.</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition active:scale-98 shadow-xs flex items-center justify-center gap-1.5"
          >
            <span>حسناً، الانتقال للعمل الميداني</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
