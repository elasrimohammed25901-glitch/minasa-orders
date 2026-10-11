import React from 'react';
import { Order, User } from '../types';
import { CURRENCY } from '../utils/currency';

interface PrintableSummaryReportProps {
  orders: Order[];
  workers: User[];
}

export const PrintableSummaryReport: React.FC<PrintableSummaryReportProps> = ({
  orders,
  workers
}) => {
  const activeOrders = orders.filter(o => !o.isArchived);
  const delivered = activeOrders.filter(o => o.status === 'delivered');
  const totalSales = activeOrders.reduce((acc, o) => acc + o.totalSellingPrice, 0);
  const totalCost = activeOrders.reduce((acc, o) => acc + o.totalCost, 0);
  const totalCommissions = activeOrders.reduce((acc, o) => acc + o.workerCommission, 0);
  const netProfit = activeOrders.reduce((acc, o) => acc + o.netProfit, 0);
  const rate = activeOrders.length > 0 ? Math.round((delivered.length / activeOrders.length) * 100) : 0;

  return (
    <div className="print-only p-8 max-w-4xl mx-auto bg-white text-slate-900 font-['Tajawal']" dir="rtl">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-black">منظومة إنجاز - تقرير الإنجاز والأداء المالي العام</h1>
          <p className="text-xs text-slate-600 mt-0.5">تقرير إحصائي دوري لحركة الطلبيات وإنتاجية فريق العمل بالدرهم المغربي ({CURRENCY})</p>
        </div>
        <div className="text-left text-xs">
          <p className="font-bold">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-MA')}</p>
          <p className="text-slate-500">الوقت: {new Date().toLocaleTimeString('ar-MA')}</p>
        </div>
      </div>

      {/* Summary Matrix */}
      <div className="grid grid-cols-4 gap-3 mb-6 text-center text-xs">
        <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg">
          <span className="text-slate-500 block">إجمالي الطلبيات</span>
          <span className="text-lg font-black">{activeOrders.length}</span>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg">
          <span className="text-slate-500 block">نسبة الإنجاز</span>
          <span className="text-lg font-black text-emerald-700">{rate}%</span>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg">
          <span className="text-slate-500 block">إجمالي المبيعات</span>
          <span className="text-lg font-black">{totalSales.toLocaleString()} {CURRENCY}</span>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg">
          <span className="text-slate-500 block">صافي الأرباح</span>
          <span className="text-lg font-black text-emerald-800">{netProfit.toLocaleString()} {CURRENCY}</span>
        </div>
      </div>

      {/* Workers Productivity Section */}
      <div className="mb-6">
        <h3 className="font-bold text-sm mb-2 border-b border-slate-300 pb-1">
          أولاً: أداء وإنتاجية فريق العمل (العمال والمناديب):
        </h3>
        <table className="w-full text-right text-xs border border-slate-300">
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-slate-300">
              <th className="p-2 border border-slate-300">العامل</th>
              <th className="p-2 border border-slate-300 text-center">الطلبات المسندة</th>
              <th className="p-2 border border-slate-300 text-center">المنجزة</th>
              <th className="p-2 border border-slate-300 text-center">نسبة الإنجاز</th>
              <th className="p-2 border border-slate-300 text-left">العمولة المستحقة</th>
            </tr>
          </thead>
          <tbody>
            {workers.filter(w => w.role === 'worker' || w.role === 'supervisor').map((worker) => {
              const wOrders = activeOrders.filter(o => o.assignedWorkerId === worker.id);
              const wDelivered = wOrders.filter(o => o.status === 'delivered');
              const wRate = wOrders.length > 0 ? Math.round((wDelivered.length / wOrders.length) * 100) : 0;
              const wComm = wDelivered.reduce((sum, o) => sum + o.workerCommission, 0);

              return (
                <tr key={worker.id} className="border-b border-slate-200">
                  <td className="p-2 border border-slate-200 font-bold">{worker.name}</td>
                  <td className="p-2 border border-slate-200 text-center">{wOrders.length}</td>
                  <td className="p-2 border border-slate-200 text-center font-bold">{wDelivered.length}</td>
                  <td className="p-2 border border-slate-200 text-center">{wRate}%</td>
                  <td className="p-2 border border-slate-200 text-left font-mono">{wComm.toLocaleString()} {CURRENCY}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Active Orders List */}
      <div className="mb-6">
        <h3 className="font-bold text-sm mb-2 border-b border-slate-300 pb-1">
          ثانياً: قائمة الطلبيات النشطة:
        </h3>
        <table className="w-full text-right text-xs border border-slate-300">
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-slate-300">
              <th className="p-2 border border-slate-300">رقم الطلب</th>
              <th className="p-2 border border-slate-300">العميل</th>
              <th className="p-2 border border-slate-300">المندوب</th>
              <th className="p-2 border border-slate-300 text-center">الحالة</th>
              <th className="p-2 border border-slate-300 text-left">قيمة البيع</th>
              <th className="p-2 border border-slate-300 text-left">صافي الربح</th>
            </tr>
          </thead>
          <tbody>
            {activeOrders.map((ord) => (
              <tr key={ord.id} className="border-b border-slate-200">
                <td className="p-2 border border-slate-200 font-mono font-bold">{ord.orderNumber}</td>
                <td className="p-2 border border-slate-200">{ord.customerName}</td>
                <td className="p-2 border border-slate-200">{ord.assignedWorkerName}</td>
                <td className="p-2 border border-slate-200 text-center">
                  {ord.status === 'delivered' ? 'تم التسليم' : (ord.status === 'processing' ? 'قيد التجهيز' : (ord.status === 'ready' ? 'جاهز للتسليم' : 'قيد الانتظار'))}
                </td>
                <td className="p-2 border border-slate-200 text-left font-mono">{ord.totalSellingPrice.toLocaleString()} {CURRENCY}</td>
                <td className="p-2 border border-slate-200 text-left font-mono font-bold text-emerald-800">{ord.netProfit.toLocaleString()} {CURRENCY}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signoff */}
      <div className="flex justify-between items-center pt-8 border-t border-slate-300 text-xs">
        <div>
          <p className="font-bold">إعداد وتدقيق إدارة العمليات:</p>
          <div className="border-b border-slate-400 w-40 mt-6"></div>
        </div>
        <div className="text-left">
          <p className="font-bold">اعتماد المدير العام:</p>
          <div className="border-b border-slate-400 w-40 mt-6 mr-auto"></div>
        </div>
      </div>

    </div>
  );
};
