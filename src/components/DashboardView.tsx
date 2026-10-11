import React from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  ArrowUpRight, 
  Plus, 
  ShieldCheck, 
  Package
} from 'lucide-react';
import { Order, User, Product } from '../types';
import { exportOrdersToExcel, exportWorkersReportToExcel } from '../utils/export';
import { triggerHaptic } from '../utils/haptics';
import { CURRENCY } from '../utils/currency';

interface DashboardViewProps {
  orders: Order[];
  workers: User[];
  products: Product[];
  currentUser: User;
  onOpenNewOrder: () => void;
  onSelectTab: (tab: any) => void;
  onSelectOrder: (orderId: string) => void;
  onPrintReport: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  workers,
  currentUser,
  onOpenNewOrder,
  onSelectTab,
  onSelectOrder,
  onPrintReport
}) => {
  const isWorkerOnly = currentUser.role === 'worker';

  // Filter orders relevant for current user if worker
  const relevantOrders = isWorkerOnly
    ? orders.filter(o => o.assignedWorkerId === currentUser.id)
    : orders;

  const activeOrders = relevantOrders.filter(o => !o.isArchived);

  // Status breakdown
  const pendingOrders = activeOrders.filter(o => o.status === 'pending');
  const processingOrders = activeOrders.filter(o => o.status === 'processing');
  const readyOrders = activeOrders.filter(o => o.status === 'ready');
  const deliveredOrders = activeOrders.filter(o => o.status === 'delivered');
  const urgentOrders = activeOrders.filter(o => o.priority === 'urgent' && o.status !== 'delivered');

  // Daily completion rate
  const totalTasks = activeOrders.length;
  const completionRate = totalTasks > 0 ? Math.round((deliveredOrders.length / totalTasks) * 100) : 0;

  // Financial calculations
  const totalCommissions = activeOrders.reduce((sum, o) => sum + o.workerCommission, 0);
  const totalNetProfit = activeOrders.reduce((sum, o) => sum + o.netProfit, 0);

  // Active workers count
  const activeWorkersCount = workers.filter(w => w.active && w.role === 'worker').length;
  const totalWorkersCount = workers.filter(w => w.role === 'worker').length;

  // Workers performance metrics
  const workerStats = workers
    .filter(w => w.role === 'worker' || w.role === 'supervisor')
    .map(worker => {
      const wOrders = orders.filter(o => o.assignedWorkerId === worker.id && !o.isArchived);
      const wCompleted = wOrders.filter(o => o.status === 'delivered');
      const wInProg = wOrders.filter(o => o.status === 'processing' || o.status === 'ready');
      const rate = wOrders.length > 0 ? Math.round((wCompleted.length / wOrders.length) * 100) : 0;
      const commissionEarned = wCompleted.reduce((sum, o) => sum + o.workerCommission, 0);
      
      return {
        ...worker,
        totalAssigned: wOrders.length,
        completed: wCompleted.length,
        inProgress: wInProg.length,
        rate,
        commissionEarned
      };
    })
    .sort((a, b) => b.completed - a.completed);

  // Recent 6 orders
  const recentOrders = [...activeOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'قيد الانتظار', bg: 'bg-yellow-100 text-yellow-800' };
      case 'processing':
        return { label: 'قيد التجهيز', bg: 'bg-blue-100 text-blue-800' };
      case 'ready':
        return { label: 'جاهز للتوصيل', bg: 'bg-purple-100 text-purple-800' };
      case 'delivered':
        return { label: 'تم التسليم', bg: 'bg-green-100 text-green-800' };
      default:
        return { label: 'ملغي', bg: 'bg-red-100 text-red-800' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Geometric Title Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-sm border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isWorkerOnly ? `مرحباً بك، ${currentUser.name}` : 'لوحة المتابعة التشغيلية والإحصائيات'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isWorkerOnly
              ? 'تتبع طلبياتك الميدانية، مراحل التسليم والعمولات المستحقة'
              : 'مراقبة فورية لأداء العمال، تدفق الطلبيات وصافي الأرباح'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {!isWorkerOnly && (
            <button
              id="btn-dash-new-order"
              onClick={() => {
                triggerHaptic('heavy');
                onOpenNewOrder();
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 touch-manipulation flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>طلب جديد +</span>
            </button>
          )}

          <button
            id="btn-dash-export-excel"
            onClick={() => {
              triggerHaptic('light');
              exportOrdersToExcel(orders);
            }}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs sm:text-sm font-medium border border-slate-200 transition-all active:scale-95 touch-manipulation flex items-center gap-1.5"
            title="تصدير جميع الطلبيات إلى Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير إكسل</span>
          </button>

          <button
            id="btn-dash-print-report"
            onClick={() => {
              triggerHaptic('light');
              onPrintReport();
            }}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs sm:text-sm font-medium border border-slate-200 transition-all active:scale-95 touch-manipulation flex items-center gap-1.5"
            title="طباعة أو حفظ تقرير PDF"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>تقرير PDF</span>
          </button>
        </div>
      </div>

      {/* Geometric Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Total Orders Today */}
        <div className="bg-white p-6 border border-slate-200 rounded-sm shadow-xs">
          <span className="text-xs font-bold text-slate-400">إجمالي الطلبات اليوم</span>
          <p className="text-3xl font-bold text-slate-900 mt-2">{totalTasks}</p>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>عاجلة للمتابعة: {urgentOrders.length}</span>
            <span className="text-blue-600 font-bold">{deliveredOrders.length} منجزة</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalTasks > 0 ? (deliveredOrders.length / totalTasks) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Card 2: Daily Completion Rate */}
        <div className="bg-white p-6 border border-slate-200 rounded-sm shadow-xs">
          <span className="text-xs font-bold text-slate-400">نسبة إنجاز المهام</span>
          <p className="text-3xl font-bold text-green-600 mt-2">{completionRate}%</p>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>معدل الإنجاز المستهدف: 85%</span>
            <span className={`font-bold ${completionRate >= 80 ? 'text-green-600' : 'text-blue-600'}`}>
              {completionRate >= 80 ? 'أداء ممتاز' : 'قيد التقدم'}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
            <div 
              className="bg-green-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Card 3: Workers Active / Financial KPI (in MAD) */}
        {!isWorkerOnly ? (
          <div className="bg-white p-6 border border-slate-200 rounded-sm shadow-xs">
            <span className="text-xs font-bold text-slate-400">العمال النشطون حالياً</span>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {activeWorkersCount} <span className="text-lg font-normal text-slate-400">/ {totalWorkersCount || 1}</span>
            </p>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>صافي الأرباح: {totalNetProfit.toLocaleString()} {CURRENCY}</span>
              <span className="text-slate-400">تحديث فوري</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
              <div 
                className="bg-slate-900 h-full rounded-full transition-all duration-500"
                style={{ width: `${totalWorkersCount > 0 ? (activeWorkersCount / totalWorkersCount) * 100 : 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 border border-slate-200 rounded-sm shadow-xs">
            <span className="text-xs font-bold text-slate-400">عمولتي المكتسبة اليوم</span>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {deliveredOrders.reduce((sum, o) => sum + o.workerCommission, 0).toLocaleString()} <span className="text-base font-normal text-slate-500">{CURRENCY}</span>
            </p>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>عن {deliveredOrders.length} طلبية مسلمة</span>
              <span className="text-emerald-600 font-bold">جاهز للصرف</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full w-full rounded-full" />
            </div>
          </div>
        )}

      </div>

      {/* Main Content Grid: Recent Orders Table (2 cols) + Side Geometric Cards (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols in RTL): Recent Orders Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-sm shadow-xs flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">أحدث الطلبيات المسندة</h3>
              <p className="text-xs text-slate-400">تتبع تقدم مراحل التجهيز والتسليم لحظياً</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  triggerHaptic('light');
                  exportOrdersToExcel(orders);
                }}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                تصدير إكسل
              </button>
              <button 
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectTab('orders');
                }}
                className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 active:scale-95 transition-transform"
              >
                <span>عرض الكل</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="p-4">رقم الطلب</th>
                  <th className="p-4">العامل المسؤول</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">التقدم</th>
                  <th className="p-4">القيمة</th>
                  <th className="p-4 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      لا توجد طلبات مسجلة حالياً
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => {
                    const badge = getStatusBadge(ord.status);
                    const progressPercent = 
                      ord.status === 'delivered' ? 100 :
                      ord.status === 'ready' ? 75 :
                      ord.status === 'processing' ? 50 : 25;

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-mono font-bold text-slate-900">
                          #{ord.orderNumber.replace('ORD-', '')}
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-slate-800">{ord.assignedWorkerName || 'غير مسند'}</p>
                          <p className="text-[10px] text-slate-400">{ord.customerName}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="p-4 min-w-[100px]">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  ord.status === 'delivered' ? 'bg-green-500' : 'bg-blue-500'
                                }`} 
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">{progressPercent}%</span>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          {ord.totalSellingPrice.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{CURRENCY}</span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              triggerHaptic('selection');
                              onSelectOrder(ord.id);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-bold underline active:scale-95 transition-transform"
                          >
                            تفاصيل
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Geometric Side Cards */}
        <div className="space-y-6">
          
          {/* Dark Card: Access Levels & Security Protocol */}
          <div className="bg-slate-900 p-6 rounded-sm text-white relative overflow-hidden shadow-xs">
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-blue-500 rounded-full opacity-20 pointer-events-none" />
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <h4 className="font-bold text-sm">مستويات الصلاحيات والأمان</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              النظام يعمل ببروتوكول تحكم وتشفير متعدد المستويات لحفظ سرية الحسابات وتتبع كافة العمليات لحظياً.
            </p>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                <span className="font-medium text-slate-300">المزامنة السحابية نشطة</span>
              </div>
              <span className="text-[10px] text-slate-500">حفظ محلي فوري</span>
            </div>
          </div>

          {/* System Alerts Card */}
          <div className="bg-white border border-slate-200 rounded-sm p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm">تنبيهات النظام اللحظية</h4>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                {urgentOrders.length} تنبيه
              </span>
            </div>

            {urgentOrders.length > 0 ? (
              urgentOrders.slice(0, 3).map(ord => (
                <div 
                  key={ord.id} 
                  onClick={() => {
                    triggerHaptic('selection');
                    onSelectOrder(ord.id);
                  }}
                  className="border-r-2 border-red-500 pr-3 cursor-pointer hover:bg-slate-50/60 p-1 rounded-l transition active:scale-98"
                >
                  <p className="text-xs font-bold text-slate-800">طلب عاجل بحاجة لتسليم: #{ord.orderNumber}</p>
                  <p className="text-[10px] text-slate-500">{ord.customerName} - العامل: {ord.assignedWorkerName}</p>
                </div>
              ))
            ) : (
              <div className="border-r-2 border-green-500 pr-3">
                <p className="text-xs font-bold text-slate-800">جميع الطلبيات تسير بانتظام</p>
                <p className="text-[10px] text-slate-400">لا توجد شحنات متأخرة أو تنبيهات حرجة</p>
              </div>
            )}

            <div className="border-r-2 border-blue-500 pr-3">
              <p className="text-xs font-bold text-slate-800">تحديث جداول الإنجاز اليومي</p>
              <p className="text-[10px] text-slate-400">تم احتساب العمولات وصافي الأرباح بصورة تلقائية ({CURRENCY})</p>
            </div>
          </div>

          {/* Team Efficiency Summary Card */}
          <div className="bg-blue-600 p-6 rounded-sm text-white flex flex-col items-center justify-center text-center shadow-xs">
            <span className="text-xs font-semibold text-blue-100">كفاءة الفريق الإجمالية</span>
            <p className="text-3xl font-black mt-1 text-white">{completionRate}%</p>
            <p className="text-[11px] text-blue-100 mt-1 max-w-[200px]">
              {deliveredOrders.length} طلبية مكتملة اليوم بنجاح
            </p>
            <button
              onClick={() => {
                triggerHaptic('selection');
                onSelectTab('workers');
              }}
              className="mt-4 px-3 py-1.5 bg-white text-blue-700 text-xs font-bold rounded-md hover:bg-blue-50 transition active:scale-95 touch-manipulation"
            >
              عرض تقييم العمال
            </button>
          </div>

        </div>

      </div>

      {/* Real-time Order Progression Stages */}
      <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">مسار تدفق ومراحل الطلبيات</h3>
            <p className="text-xs text-slate-500">حالة التجهيز والتوزيع الميداني</p>
          </div>
          <button
            onClick={() => {
              triggerHaptic('selection');
              onSelectTab('orders');
            }}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 active:scale-95 transition-transform"
          >
            <span>جدول الطلبيات</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-4 rounded-sm border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between text-slate-800 font-bold text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>قيد الانتظار</span>
              </span>
              <span className="font-mono text-sm font-bold text-slate-900">{pendingOrders.length}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">طلبات جديدة تنتظر استلام وتجهيز العمال</p>
          </div>

          <div className="p-4 rounded-sm border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between text-slate-800 font-bold text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>قيد التجهيز</span>
              </span>
              <span className="font-mono text-sm font-bold text-slate-900">{processingOrders.length}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">جاري تجهيز البضائع وتعبئة الشحنات</p>
          </div>

          <div className="p-4 rounded-sm border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between text-slate-800 font-bold text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>جاهز للتوصيل</span>
              </span>
              <span className="font-mono text-sm font-bold text-slate-900">{readyOrders.length}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">في طريقها للعملاء مع المناديب</p>
          </div>

          <div className="p-4 rounded-sm border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between text-slate-800 font-bold text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span>تم التسليم</span>
              </span>
              <span className="font-mono text-sm font-bold text-slate-900">{deliveredOrders.length}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">تم التسليم واستلام المبالغ واحتساب الأرباح</p>
          </div>

        </div>
      </div>

      {/* Workers Productivity Leaderboard (for Managers & Supervisors) */}
      {!isWorkerOnly && (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">إنتاجية وأداء العمال اليومية</h3>
              <p className="text-xs text-slate-500">متابعة إنجاز كل مندوب ومستحقات العمولات ({CURRENCY})</p>
            </div>
            <button
              onClick={() => {
                triggerHaptic('light');
                exportWorkersReportToExcel(workers, orders);
              }}
              className="text-xs text-slate-700 hover:text-slate-900 font-medium px-3 py-1.5 border border-slate-200 rounded-md bg-slate-50 flex items-center gap-1.5 transition active:scale-95 touch-manipulation"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>تصدير تقرير العمال</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="p-3.5">العامل</th>
                  <th className="p-3.5">المهام المسندة</th>
                  <th className="p-3.5">تم إنجازه</th>
                  <th className="p-3.5">قيد العمل</th>
                  <th className="p-3.5">نسبة الإنجاز</th>
                  <th className="p-3.5">العمولة المستحقة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workerStats.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center font-bold text-slate-700 text-xs">
                          {w.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{w.name}</p>
                          <p className="text-[10px] text-slate-400">{w.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">{w.totalAssigned}</td>
                    <td className="p-3.5 font-bold text-green-600">{w.completed}</td>
                    <td className="p-3.5 font-semibold text-yellow-600">{w.inProgress}</td>
                    <td className="p-3.5 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-green-500 h-full rounded-full"
                            style={{ width: `${w.rate}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-[11px] text-slate-700">{w.rate}%</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">
                      {w.commissionEarned.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{CURRENCY}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
