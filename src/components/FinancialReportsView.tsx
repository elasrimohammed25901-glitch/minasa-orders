import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Printer
} from 'lucide-react';
import { Order, User } from '../types';
import { exportOrdersToExcel } from '../utils/export';
import { triggerHaptic } from '../utils/haptics';
import { CURRENCY } from '../utils/currency';

interface FinancialReportsViewProps {
  orders: Order[];
  workers: User[];
  onPrintReport: () => void;
}

export const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({
  orders,
  workers,
  onPrintReport
}) => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');

  // Filter orders by period
  const now = new Date();
  const filteredOrders = orders.filter(order => {
    if (order.isArchived) return false;
    const orderDate = new Date(order.createdAt);
    
    if (period === 'today') {
      return orderDate.toDateString() === now.toDateString();
    } else if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orderDate >= weekAgo;
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return orderDate >= monthAgo;
    }
    return true;
  });

  // Calculate financials
  const totalSales = filteredOrders.reduce((sum, o) => sum + o.totalSellingPrice, 0);
  const totalCost = filteredOrders.reduce((sum, o) => sum + o.totalCost, 0);
  const totalCommissions = filteredOrders.reduce((sum, o) => sum + o.workerCommission, 0);
  const netProfit = filteredOrders.reduce((sum, o) => sum + o.netProfit, 0);
  const marginPercent = totalSales > 0 ? Math.round((netProfit / totalSales) * 100) : 0;

  const deliveredOrdersCount = filteredOrders.filter(o => o.status === 'delivered').length;

  // Breakdown per worker
  const workerBreakdown = workers
    .filter(w => w.role === 'worker' || w.role === 'supervisor')
    .map(worker => {
      const wOrders = filteredOrders.filter(o => o.assignedWorkerId === worker.id);
      const wSales = wOrders.reduce((s, o) => s + o.totalSellingPrice, 0);
      const wProfit = wOrders.reduce((s, o) => s + o.netProfit, 0);
      const wCommissions = wOrders.reduce((s, o) => s + o.workerCommission, 0);
      const wDelivered = wOrders.filter(o => o.status === 'delivered').length;

      return {
        worker,
        totalOrders: wOrders.length,
        delivered: wDelivered,
        sales: wSales,
        profit: wProfit,
        commission: wCommissions
      };
    })
    .sort((a, b) => b.sales - a.sales);

  return (
    <div className="space-y-6">
      
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-sm border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">التقارير المالية وحساب الأرباح التلقائي ({CURRENCY})</h2>
          <p className="text-xs text-slate-500 mt-1">
            تحليل دقيق للإيرادات، تكلفة المشتريات، عمولات المندوبين، وصافي الأرباح بالدرهم المغربي
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Period selector */}
          <div className="flex bg-slate-100 p-1 rounded-md text-xs font-medium border border-slate-200">
            <button
              onClick={() => {
                triggerHaptic('selection');
                setPeriod('today');
              }}
              className={`px-3 py-1.5 rounded-sm transition active:scale-95 touch-manipulation ${period === 'today' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'}`}
            >
              اليوم
            </button>
            <button
              onClick={() => {
                triggerHaptic('selection');
                setPeriod('week');
              }}
              className={`px-3 py-1.5 rounded-sm transition active:scale-95 touch-manipulation ${period === 'week' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'}`}
            >
              الأسبوع
            </button>
            <button
              onClick={() => {
                triggerHaptic('selection');
                setPeriod('month');
              }}
              className={`px-3 py-1.5 rounded-sm transition active:scale-95 touch-manipulation ${period === 'month' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'}`}
            >
              الشهر
            </button>
            <button
              onClick={() => {
                triggerHaptic('selection');
                setPeriod('all');
              }}
              className={`px-3 py-1.5 rounded-sm transition active:scale-95 touch-manipulation ${period === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'}`}
            >
              الكل
            </button>
          </div>

          <button
            id="btn-export-financials-excel"
            onClick={() => {
              triggerHaptic('light');
              exportOrdersToExcel(filteredOrders, `التقرير_المالي_${period}.xlsx`);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition active:scale-95 touch-manipulation"
            title="تصدير الأرباح إلى Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            id="btn-print-financials-pdf"
            onClick={() => {
              triggerHaptic('light');
              onPrintReport();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-all active:scale-95 touch-manipulation shadow-xs"
            title="تصدير أو طباعة التقرير بصيغة PDF"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>طباعة PDF</span>
          </button>
        </div>
      </div>

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Sales */}
        <div className="bg-white p-5 sm:p-6 rounded-sm border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">إجمالي المبيعات</span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 font-mono">
            {totalSales.toLocaleString()} <span className="text-xs font-normal text-slate-500">{CURRENCY}</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-2 block">
            من إجمالي {filteredOrders.length} طلبية في الفترة
          </span>
        </div>

        {/* Cost of Goods */}
        <div className="bg-white p-5 sm:p-6 rounded-sm border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">تكلفة البضاعة والمنتجات</span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-700 mt-2 font-mono">
            {totalCost.toLocaleString()} <span className="text-xs font-normal text-slate-500">{CURRENCY}</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-2 block">سعر الشراء والجملة الأساسي</span>
        </div>

        {/* Worker Commissions */}
        <div className="bg-white p-5 sm:p-6 rounded-sm border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-yellow-700">عمولات ومستحقات العمال</span>
          <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mt-2 font-mono">
            {totalCommissions.toLocaleString()} <span className="text-xs font-normal text-slate-500">{CURRENCY}</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-2 block">
            موزعة على {deliveredOrdersCount} طلبية مسلّمة
          </span>
        </div>

        {/* Net Profit */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-sm shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">صافي الأرباح المحققة</span>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono font-bold text-green-400">
              هامش {marginPercent}%
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-white mt-2 font-mono">
              {netProfit.toLocaleString()} <span className="text-xs font-normal text-slate-400">{CURRENCY}</span>
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              (المبيعات - التكاليف - العمولات)
            </span>
          </div>
        </div>

      </div>

      {/* Worker Performance & Financial Contribution Table */}
      <div className="bg-white rounded-sm border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">مساهمة كل موظف في المبيعات والأرباح والعمولات</h3>
            <p className="text-xs text-slate-500">تحليل إنتاجية الفريق وفق الفترة المحددة ({CURRENCY})</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="p-3.5">اسم الموظف / المندوب</th>
                <th className="p-3.5 text-center">الطلبات المسندة</th>
                <th className="p-3.5 text-center">الطلبات المسلّمة</th>
                <th className="p-3.5 text-left">قيمة المبيعات المحققة</th>
                <th className="p-3.5 text-left">عمولة العامل المستحقة</th>
                <th className="p-3.5 text-left">صافي ربح المتجر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workerBreakdown.map((item) => (
                <tr key={item.worker.id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-sm bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                        {item.worker.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{item.worker.name}</p>
                        <p className="text-[10px] text-slate-400">{item.worker.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 text-center font-medium text-slate-700">{item.totalOrders}</td>
                  <td className="p-3.5 text-center font-bold text-green-600">{item.delivered}</td>
                  <td className="p-3.5 text-left font-mono font-bold text-slate-900">{item.sales.toLocaleString()} {CURRENCY}</td>
                  <td className="p-3.5 text-left font-mono font-bold text-yellow-700">{item.commission.toLocaleString()} {CURRENCY}</td>
                  <td className="p-3.5 text-left font-mono font-bold text-green-700">{item.profit.toLocaleString()} {CURRENCY}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
