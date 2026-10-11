import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  FileSpreadsheet, 
  Printer, 
  Clock, 
  Eye,
  UserCheck,
  Phone,
  MapPin,
  CheckCircle,
  Truck,
  PackageCheck,
  ChevronLeft,
  MessageCircle,
  Target,
  Trophy
} from 'lucide-react';
import { Order, User, OrderStatus, Product } from '../types';
import { exportOrdersToExcel } from '../utils/export';
import { triggerHaptic } from '../utils/haptics';
import { CURRENCY } from '../utils/currency';

interface OrdersViewProps {
  orders: Order[];
  workers: User[];
  products: Product[];
  currentUser: User;
  onOpenNewOrder: () => void;
  onSelectOrder: (orderId: string) => void;
  onUpdateStatus: (orderId: string, nextStatus: OrderStatus, note?: string) => void;
  onPrintReport: () => void;
  onOpenOzonSticker?: (order: Order) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  workers,
  currentUser,
  onOpenNewOrder,
  onSelectOrder,
  onUpdateStatus,
  onPrintReport,
  onOpenOzonSticker
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [workerFilter, setWorkerFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week'>('all');

  const isWorker = currentUser.role === 'worker';

  // If worker, only their assigned orders
  const baseOrders = isWorker
    ? orders.filter(o => o.assignedWorkerId === currentUser.id)
    : orders;

  // Filter non-archived orders
  const activeOrders = baseOrders.filter(o => !o.isArchived);

  // Worker daily stats & progress bar
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const workerOrdersToday = activeOrders.filter(o => o.createdAt.startsWith(todayStr));
  const workerDeliveredToday = workerOrdersToday.filter(o => o.status === 'delivered');
  const workerDailyProgress = workerOrdersToday.length > 0 
    ? Math.round((workerDeliveredToday.length / workerOrdersToday.length) * 100) 
    : 0;
  const workerEarnedToday = workerDeliveredToday.reduce((sum, o) => sum + o.workerCommission, 0);

  // Apply filters
  const filteredOrders = activeOrders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery) ||
      order.customerAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.ozonTrackingNumber && order.ozonTrackingNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesWorker = workerFilter === 'all' || order.assignedWorkerId === workerFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;

    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = order.createdAt.startsWith(todayStr);
    } else if (dateFilter === 'yesterday') {
      matchesDate = order.createdAt.startsWith(yesterdayStr);
    } else if (dateFilter === 'week') {
      const orderDate = new Date(order.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = orderDate >= weekAgo;
    }

    return matchesSearch && matchesStatus && matchesWorker && matchesPriority && matchesDate;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800' };
      case 'processing':
        return { label: 'قيد التجهيز', color: 'bg-blue-100 text-blue-800' };
      case 'ready':
        return { label: 'جاهز للتسليم', color: 'bg-purple-100 text-purple-800' };
      case 'delivered':
        return { label: 'تم التسليم', color: 'bg-green-100 text-green-800' };
      case 'cancelled':
        return { label: 'ملغي', color: 'bg-red-100 text-red-800' };
    }
  };

  const handleQuickStatusChange = (orderId: string, nextStatus: OrderStatus, note?: string) => {
    if (nextStatus === 'delivered') {
      triggerHaptic('success');
    } else {
      triggerHaptic('medium');
    }
    onUpdateStatus(orderId, nextStatus, note);
  };

  const getWhatsAppLink = (order: Order) => {
    let rawPhone = order.customerPhone.replace(/[^\d]/g, '');
    if (rawPhone.startsWith('0')) {
      rawPhone = '212' + rawPhone.slice(1);
    } else if (!rawPhone.startsWith('212') && rawPhone.length === 9) {
      rawPhone = '212' + rawPhone;
    }

    const message = `السلام عليكم ورحمة الله أخي/أختي ${order.customerName}،
معكم مندوب التوصيل بخصوص طلبيتك رقم #${order.orderNumber}.
المبلغ الإجمالي عند الاستلام: ${order.totalSellingPrice} درهم.
العنوان المسجل: ${order.city} - ${order.customerAddress}.
هل يناسبكم استلام الشحنة اليوم؟ شكراً جزيلاً!`;

    return `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-sm border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {isWorker ? 'طلبياتي المكلف بها' : 'إدارة ومتابعة الطلبيات'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إجمالي المعروض: {filteredOrders.length} طلبية من أصل {activeOrders.length}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            id="btn-export-orders-excel"
            onClick={() => {
              triggerHaptic('light');
              exportOrdersToExcel(filteredOrders);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition active:scale-95 touch-manipulation shadow-2xs"
            title="تصدير هذه القائمة إلى Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير إكسل</span>
          </button>

          <button
            id="btn-print-orders-report"
            onClick={() => {
              triggerHaptic('light');
              onPrintReport();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition active:scale-95 touch-manipulation shadow-2xs"
            title="طباعة التقرير بصيغة PDF"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>تقرير PDF</span>
          </button>

          {!isWorker && (
            <button
              id="btn-orders-new"
              onClick={() => {
                triggerHaptic('heavy');
                onOpenNewOrder();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition active:scale-95 touch-manipulation shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>طلب جديد +</span>
            </button>
          )}
        </div>
      </div>

      {/* Worker Daily Target Progress Card (Feature 3: Daily Order Counter) */}
      {isWorker && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-sm p-4 sm:p-5 text-white shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-blue-200 block">شريط إنجازك اليومي</span>
                <h3 className="text-base font-bold text-white">
                  أنجزت {workerDeliveredToday.length} من أصل {workerOrdersToday.length} طلبية اليوم ({workerDailyProgress}%)
                </h3>
              </div>
            </div>

            <div className="text-right sm:text-left bg-white/10 px-3.5 py-1.5 rounded-lg border border-white/20">
              <span className="text-[10px] text-blue-200 block">عمولتك المحققة اليوم:</span>
              <span className="font-mono font-bold text-yellow-300 text-sm">
                {workerEarnedToday.toLocaleString()} {CURRENCY}
              </span>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="mt-3.5 w-full bg-white/20 rounded-full h-3 overflow-hidden p-0.5">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.max(workerDailyProgress, workerOrdersToday.length > 0 ? 5 : 0)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-blue-200 mt-1.5 font-medium">
            <span>{workerOrdersToday.length === 0 ? 'لا توجد طلبيات مسندة لليوم حتى الآن' : `${workerOrdersToday.length - workerDeliveredToday.length} متبقية للتوصيل`}</span>
            <span>{workerDailyProgress === 100 && workerOrdersToday.length > 0 ? '🎉 أحسنت! أتممت كافة طلبياتك اليوم' : 'استمر بالعمل الممتاز!'}</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-sm border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              placeholder="بحث برقم الطلب، العميل، الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pr-9 pl-3 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => {
                triggerHaptic('selection');
                setDateFilter(e.target.value as any);
              }}
              className="w-full text-xs px-3 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            >
              <option value="all">كافة التواريخ</option>
              <option value="today">طلبيات اليوم 📅</option>
              <option value="yesterday">طلبيات الأمس</option>
              <option value="week">آخر 7 أيام</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                triggerHaptic('selection');
                setStatusFilter(e.target.value);
              }}
              className="w-full text-xs px-3 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">قيد الانتظار</option>
              <option value="processing">قيد التجهيز والتنفيذ</option>
              <option value="ready">جاهز للتوصيل</option>
              <option value="delivered">تم التسليم</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>

          {/* Worker Filter (Manager only) */}
          {!isWorker && (
            <div>
              <select
                value={workerFilter}
                onChange={(e) => {
                  triggerHaptic('selection');
                  setWorkerFilter(e.target.value);
                }}
                className="w-full text-xs px-3 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              >
                <option value="all">جميع المناديب / العمال</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => {
                triggerHaptic('selection');
                setPriorityFilter(e.target.value);
              }}
              className="w-full text-xs px-3 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            >
              <option value="all">جميع الأولويات</option>
              <option value="urgent">عاجل فقط</option>
              <option value="normal">عادي</option>
            </select>
          </div>

        </div>
      </div>

      {/* Orders View: Mobile Cards for Field Workers + Desktop Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-sm border border-slate-200 text-center py-16 px-4 text-slate-400 shadow-xs">
          <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
          <p className="font-bold text-slate-700 text-sm">لم يتم العثور على أي طلبيات مطابقة للبحث</p>
          <p className="text-xs text-slate-400 mt-1">جرّب تغيير خيارات التصفية أو أنشئ طلبية جديدة</p>
        </div>
      ) : (
        <>
          {/* 1. Mobile Cards View (Optimized for Field Workers with Large Touch Targets & Haptics) */}
          <div className="block lg:hidden space-y-3">
            {filteredOrders.map(order => {
              const badge = getStatusBadge(order.status);
              return (
                <div 
                  key={`mobile-${order.id}`}
                  className="bg-white rounded-sm border border-slate-200 p-4 shadow-xs space-y-3 relative overflow-hidden"
                >
                  {/* Top Bar: Order ID + Status Badge + Urgency */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {order.orderNumber}
                      </span>
                      {order.ozonTrackingNumber && (
                        <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                          <Truck className="w-2.5 h-2.5" />
                          <span>{order.ozonTrackingNumber}</span>
                        </span>
                      )}
                      {order.priority === 'urgent' && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-black bg-red-100 text-red-700">
                          عاجل
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Customer Info & 1-Tap Phone Call with Haptic */}
                  <div className="flex items-start justify-between gap-2 border-y border-slate-100 py-2.5">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{order.customerName}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{order.city} - {order.customerAddress}</span>
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1">
                        📦 {order.items.map(i => `${i.productName} (x${i.quantity})`).join('، ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {order.customerPhone && (
                        <a
                          href={getWhatsAppLink(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => triggerHaptic('medium')}
                          className="p-2.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 hover:bg-emerald-100 transition active:scale-90 touch-manipulation flex items-center justify-center"
                          title="محادثة واتساب سريعة مع العميل"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                        </a>
                      )}
                      {order.customerPhone && (
                        <a
                          href={`tel:${order.customerPhone}`}
                          onClick={() => triggerHaptic('medium')}
                          className="p-2.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200 hover:bg-blue-100 transition active:scale-90 touch-manipulation flex items-center justify-center"
                          title="اتصال مباشر بالعميل"
                        >
                          <Phone className="w-4 h-4 text-blue-600" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Financial Details (in MAD) */}
                  <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-sm">
                    <div>
                      <span className="text-slate-500 block text-[10px]">القيمة المطلوب تحصيلها:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {order.totalSellingPrice.toLocaleString()} {CURRENCY}
                      </span>
                    </div>

                    <div className="text-left">
                      {isWorker ? (
                        <div>
                          <span className="text-amber-700 block text-[10px] font-bold">عمولتك في الطلب:</span>
                          <span className="font-mono font-bold text-amber-800 text-sm">
                            {order.workerCommission.toLocaleString()} {CURRENCY}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-emerald-700 block text-[10px] font-bold">صافي الربح:</span>
                          <span className="font-mono font-bold text-emerald-800 text-sm">
                            {order.netProfit.toLocaleString()} {CURRENCY}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Primary Mobile Action Buttons with Haptic Feedback */}
                  <div className="flex items-center gap-2 pt-1">
                    {/* Status progression button */}
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleQuickStatusChange(order.id, 'processing', 'تم استلام الطلب وبدء التجهيز ميدانياً')}
                        className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition-all active:scale-[0.97] touch-manipulation shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>بدء التجهيز</span>
                      </button>
                    )}

                    {order.status === 'processing' && (
                      <button
                        onClick={() => handleQuickStatusChange(order.id, 'ready', 'تم التجهيز وفي طريق التوصيل للعميل')}
                        className="flex-1 py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-bold transition-all active:scale-[0.97] touch-manipulation shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Truck className="w-4 h-4" />
                        <span>جاهز للتسليم</span>
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => handleQuickStatusChange(order.id, 'delivered', 'تم تسليم الطلبية وتحصيل المبلغ')}
                        className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-all active:scale-[0.97] touch-manipulation shadow-xs flex items-center justify-center gap-1.5 animate-pulse"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>تم التسليم ✓ (تأكيد)</span>
                      </button>
                    )}

                    {order.status === 'delivered' && (
                      <div className="flex-1 py-2 px-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-bold text-center">
                        ✓ مكتمل ومسدد بالكامل
                      </div>
                    )}

                    {order.status === 'cancelled' && (
                      <div className="flex-1 py-2 px-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-xs font-bold text-center">
                        طلب ملغي
                      </div>
                    )}

                    {/* Ozon Delivery Sticker Button */}
                    {onOpenOzonSticker && (
                      <button
                        onClick={() => {
                          triggerHaptic('medium');
                          onOpenOzonSticker(order);
                        }}
                        className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-xs font-bold border border-blue-200 transition-all active:scale-[0.97] touch-manipulation flex items-center gap-1 shrink-0"
                        title="طباعة ورقة التوصيل اللاصقة Ozon"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">الملصق</span>
                      </button>
                    )}

                    {/* View Details Button */}
                    <button
                      onClick={() => {
                        triggerHaptic('selection');
                        onSelectOrder(order.id);
                      }}
                      className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium border border-slate-200 transition-all active:scale-[0.97] touch-manipulation flex items-center gap-1"
                    >
                      <span>التفاصيل</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-sm border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <tr>
                    <th className="p-3.5">رقم الطلبية</th>
                    <th className="p-3.5">العميل والعنوان</th>
                    <th className="p-3.5">المندوب المكلف</th>
                    <th className="p-3.5">المنتجات المطلوبة</th>
                    <th className="p-3.5 text-left">قيمة البيع</th>
                    <th className="p-3.5 text-center">الحالة</th>
                    <th className="p-3.5 text-center">إجراء سريع</th>
                    <th className="p-3.5 text-center">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => {
                    const badge = getStatusBadge(order.status);
                    return (
                      <tr 
                        key={order.id} 
                        className={`hover:bg-slate-50/80 transition ${
                          order.priority === 'urgent' ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        {/* Order Number & Priority */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {order.orderNumber}
                            </span>
                            {order.priority === 'urgent' && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-red-100 text-red-700">
                                عاجل
                              </span>
                            )}
                          </div>
                          {order.ozonTrackingNumber ? (
                            <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mt-1 flex items-center gap-1 w-fit">
                              <Truck className="w-2.5 h-2.5" />
                              <span>{order.ozonTrackingNumber}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </td>

                        {/* Customer & Address + Quick Action Hub */}
                        <td className="p-3.5">
                          <div className="flex items-center justify-between gap-1">
                            <div>
                              <p className="font-bold text-slate-800">{order.customerName}</p>
                              <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                                {order.city} - {order.customerAddress}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {order.customerPhone && (
                                <a
                                  href={getWhatsAppLink(order)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => triggerHaptic('light')}
                                  className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                                  title="محادثة واتساب سريعة"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              )}
                              {order.customerPhone && (
                                <a
                                  href={`tel:${order.customerPhone}`}
                                  onClick={() => triggerHaptic('light')}
                                  className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                  title="اتصال هاتفي مباشر"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Worker */}
                        <td className="p-3.5 font-medium text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span>{order.assignedWorkerName}</span>
                          </div>
                        </td>

                        {/* Products Summary */}
                        <td className="p-3.5 text-slate-600">
                          <span className="font-medium text-xs">
                            {order.items.map(i => `${i.productName} (x${i.quantity})`).join('، ')}
                          </span>
                        </td>

                        {/* Financial Value (MAD) */}
                        <td className="p-3.5 text-left">
                          <span className="font-bold text-slate-900 font-mono text-xs">
                            {order.totalSellingPrice.toLocaleString()} {CURRENCY}
                          </span>
                          {!isWorker && (
                            <span className="block text-[10px] text-green-700 font-bold">
                              ربح: {order.netProfit.toLocaleString()} {CURRENCY}
                            </span>
                          )}
                          {isWorker && (
                            <span className="block text-[10px] text-yellow-700 font-bold">
                              عمولتك: {order.workerCommission.toLocaleString()} {CURRENCY}
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="p-3.5 text-center">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>

                        {/* Quick Status Advancement with Haptic */}
                        <td className="p-3.5 text-center">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleQuickStatusChange(order.id, 'processing', 'تم بدء التجهيز')}
                              className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-2.5 py-1 rounded transition active:scale-95 touch-manipulation"
                            >
                              بدء التجهيز
                            </button>
                          )}
                          {order.status === 'processing' && (
                            <button
                              onClick={() => handleQuickStatusChange(order.id, 'ready', 'تم التجهيز وفي الطريق')}
                              className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 px-2.5 py-1 rounded transition active:scale-95 touch-manipulation"
                            >
                              جاهز للتسليم
                            </button>
                          )}
                          {order.status === 'ready' && (
                            <button
                              onClick={() => handleQuickStatusChange(order.id, 'delivered', 'تم التسليم بنجاح')}
                              className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 px-2.5 py-1 rounded transition active:scale-95 touch-manipulation"
                            >
                              تم التسليم ✓
                            </button>
                          )}
                          {order.status === 'delivered' && (
                            <span className="text-[10px] text-slate-400 font-medium">مكتمل ومسدد</span>
                          )}
                          {order.status === 'cancelled' && (
                            <span className="text-[10px] text-red-500 font-medium">ملغي</span>
                          )}
                        </td>

                        {/* View & Print Modal Triggers */}
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {onOpenOzonSticker && (
                              <button
                                onClick={() => {
                                  triggerHaptic('medium');
                                  onOpenOzonSticker(order);
                                }}
                                className="p-1.5 text-blue-700 hover:text-blue-900 hover:bg-blue-100/60 rounded transition active:scale-90 touch-manipulation"
                                title="طباعة ورقة توصيل Ozon اللاصقة (Sticker)"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                triggerHaptic('selection');
                                onSelectOrder(order.id);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition active:scale-90 touch-manipulation"
                              title="عرض تفاصيل الطلبية و 1-Click Action Hub"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
