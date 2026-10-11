import React from 'react';
import { Order } from '../types';
import { CURRENCY } from '../utils/currency';

interface OrderPrintInvoiceProps {
  order: Order | null;
}

export const OrderPrintInvoice: React.FC<OrderPrintInvoiceProps> = ({ order }) => {
  if (!order) return null;

  return (
    <div className="print-only p-8 max-w-2xl mx-auto bg-white text-slate-900 font-['Tajawal']" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">إنجاز للطلبيات والخدمات اللوجستية</h1>
          <p className="text-xs text-slate-600 mt-1">سند استلام وتسليم رسمي - بوليصة شحنة</p>
          <p className="text-xs text-slate-500">الرقم الضريبي / التجاري: RC-458921</p>
        </div>
        <div className="text-left">
          <div className="inline-block bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg text-left">
            <span className="text-[10px] text-slate-500 block">رقم البوليصة / الطلب:</span>
            <span className="text-lg font-black text-slate-900 tracking-wider font-mono">{order.orderNumber}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            التاريخ: {new Date(order.createdAt).toLocaleDateString('ar-MA')}
          </p>
        </div>
      </div>

      {/* Parties Info */}
      <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
        <div>
          <h3 className="font-bold text-slate-700 mb-1">بيانات العميل:</h3>
          <p className="text-sm font-black text-slate-900">{order.customerName}</p>
          <p className="text-slate-600 mt-0.5">الهاتف: <span className="font-mono">{order.customerPhone}</span></p>
          <p className="text-slate-600 mt-0.5">المدينة: {order.city}</p>
          <p className="text-slate-600 mt-0.5">العنوان: {order.customerAddress}</p>
        </div>
        <div>
          <h3 className="font-bold text-slate-700 mb-1">بيانات المندوب والتسليم:</h3>
          <p className="text-sm font-black text-slate-900">{order.assignedWorkerName}</p>
          <p className="text-slate-600 mt-0.5">
            طريقة الدفع:{' '}
            <strong>
              {order.paymentStatus === 'paid' ? 'مدفوع إلكترونياً مسبقاً' : `الدفع عند الاستلام (${CURRENCY})`}
            </strong>
          </p>
          <p className="text-slate-600 mt-0.5">
            الأولوية: <strong>{order.priority === 'urgent' ? 'عاجل جداً' : 'عادي'}</strong>
          </p>
          {order.notes && <p className="text-slate-600 mt-0.5">ملاحظات: {order.notes}</p>}
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-right text-xs mb-6 border border-slate-300">
        <thead>
          <tr className="bg-slate-800 text-white font-bold">
            <th className="p-2 border border-slate-400">م</th>
            <th className="p-2 border border-slate-400">اسم المنتج والصنف</th>
            <th className="p-2 border border-slate-400 text-center">الكمية</th>
            <th className="p-2 border border-slate-400 text-left">سعر الوحدة</th>
            <th className="p-2 border border-slate-400 text-left">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={idx} className="border-b border-slate-200">
              <td className="p-2 border border-slate-200 text-center">{idx + 1}</td>
              <td className="p-2 border border-slate-200 font-bold">
                <div>{item.productName}</div>
                {item.selectedColor && (
                  <div className="font-medium text-slate-600 text-[11px]">اللون: {item.selectedColor}</div>
                )}
                {item.selectedSize && (
                  <div className="font-normal text-slate-500 text-[10px]">المقاس: {item.selectedSize}</div>
                )}
              </td>
              <td className="p-2 border border-slate-200 text-center font-bold">{item.quantity}</td>
              <td className="p-2 border border-slate-200 text-left font-mono">{item.unitPrice.toLocaleString()} {CURRENCY}</td>
              <td className="p-2 border border-slate-200 text-left font-mono font-bold">{item.totalPrice.toLocaleString()} {CURRENCY}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total Calculations */}
      <div className="flex justify-end mb-8">
        <div className="w-64 bg-slate-50 p-3 rounded-xl border border-slate-300 text-xs space-y-1.5">
          <div className="flex justify-between text-slate-600">
            <span>مجموع المنتجات:</span>
            <span className="font-mono">{order.totalSellingPrice.toLocaleString()} {CURRENCY}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>رسوم التوصيل:</span>
            <span className="font-mono">{order.deliveryFee.toLocaleString()} {CURRENCY}</span>
          </div>
          <div className="border-t border-slate-300 pt-1.5 flex justify-between font-black text-sm text-slate-900">
            <span>المبلغ الإجمالي المطلوب:</span>
            <span className="font-mono text-emerald-800">{(order.totalSellingPrice + order.deliveryFee).toLocaleString()} {CURRENCY}</span>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-dashed border-slate-300 text-xs">
        <div>
          <p className="font-bold text-slate-700 mb-6">توقيع المستلم (العميل):</p>
          <div className="border-b border-slate-400 w-48 mb-1"></div>
          <span className="text-[10px] text-slate-400">أقر باستلام الطلبية بحالة سليمة ومطابقة</span>
        </div>
        <div className="text-left">
          <p className="font-bold text-slate-700 mb-6">توقيع المندوب وختم المؤسسة:</p>
          <div className="border-b border-slate-400 w-48 mb-1 mr-auto"></div>
          <span className="text-[10px] text-slate-400">تم الفحص والمطابقة والتسليم بنجاح</span>
        </div>
      </div>

      <div className="mt-8 text-center text-[10px] text-slate-400">
        تم استخراج هذا السند عبر منصة إنجاز للطلبيات - صالحة كإشعار تسليم رسمي ({CURRENCY})
      </div>
    </div>
  );
};
