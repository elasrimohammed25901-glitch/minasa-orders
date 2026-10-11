import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Clock, 
  CheckCircle2, 
  Truck, 
  MapPin, 
  Phone, 
  UserCheck,
  Package
} from 'lucide-react';
import { Order, User, OrderStatus } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { CURRENCY } from '../utils/currency';
import { OrderActionHub } from './OrderActionHub';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  workers: User[];
  onUpdateStatus: (orderId: string, nextStatus: OrderStatus, note?: string) => void;
  onReassignWorker: (orderId: string, newWorkerId: string) => void;
  onPrintInvoice: (order: Order) => void;
  onUpdateOrderOzon?: (orderId: string, trackingNumber: string, barcode: string) => void;
  onOpenOzonSticker?: (order: Order) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  currentUser,
  workers,
  onUpdateStatus,
  onReassignWorker,
  onPrintInvoice,
  onUpdateOrderOzon,
  onOpenOzonSticker
}) => {
  const [selectedWorker, setSelectedWorker] = useState(order?.assignedWorkerId || '');

  if (!isOpen || !order) return null;

  const canManage = currentUser.role === 'admin' || currentUser.role === 'acting_admin' || currentUser.role === 'supervisor';
  const isAssignedWorker = order.assignedWorkerId === currentUser.id;

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800' };
      case 'processing':
        return { label: 'قيد التجهيز والتنفيذ', color: 'bg-blue-100 text-blue-800' };
      case 'ready':
        return { label: 'جاهز للتوصيل', color: 'bg-purple-100 text-purple-800' };
      case 'delivered':
        return { label: 'تم التسليم بنجاح', color: 'bg-green-100 text-green-800' };
      case 'cancelled':
        return { label: 'ملغي', color: 'bg-red-100 text-red-800' };
    }
  };

  const currentBadge = getStatusBadge(order.status);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-md shadow-2xl max-w-2xl w-full max-h-[94vh] flex flex-col border border-slate-200 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 border border-slate-200 rounded-sm font-mono font-bold text-slate-900 text-sm">
              {order.orderNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${currentBadge.color}`}>
                  {currentBadge.label}
                </span>
                {order.priority === 'urgent' && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                    عاجل جداً
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                تاريخ الإنشاء: {new Date(order.createdAt).toLocaleDateString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('light');
                if (onOpenOzonSticker) {
                  onOpenOzonSticker(order);
                }
              }}
              title="طباعة ورقة التوصيل اللاصقة المخصصة للشحنة (Ozon Express)"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-bold transition active:scale-95 touch-manipulation shadow-2xs"
            >
              <Truck className="w-3.5 h-3.5 text-indigo-600" />
              <span>ملصق Ozon 🖨️</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                onPrintInvoice(order);
              }}
              title="طباعة بوليصة / فاتورة الطلب"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium transition active:scale-95 touch-manipulation shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>طباعة PDF</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-right">
          
          {/* Status Progression Workflow Banner with Tactile Feedback */}
          {(canManage || isAssignedWorker) && order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="bg-slate-50 border border-slate-200 rounded-sm p-3.5">
              <p className="text-xs font-bold text-slate-900 mb-2">
                تحديث حالة الطلبية في الوقت الفعلي:
              </p>
              
              <div className="flex flex-wrap items-center gap-2">
                {order.status === 'pending' && (
                  <button
                    id="btn-advance-processing"
                    onClick={() => {
                      triggerHaptic('medium');
                      onUpdateStatus(order.id, 'processing', 'بدء تجهيز الطلبية من قِبل المندوب');
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-md transition active:scale-95 touch-manipulation shadow-xs"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>بدء التجهيز والعمل</span>
                  </button>
                )}

                {order.status === 'processing' && (
                  <button
                    id="btn-advance-ready"
                    onClick={() => {
                      triggerHaptic('medium');
                      onUpdateStatus(order.id, 'ready', 'تم التجهيز بنجاح والشحنة جاهزة للتسليم');
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-md transition active:scale-95 touch-manipulation shadow-xs"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>جاهز وفي مسار التوصيل</span>
                  </button>
                )}

                {(order.status === 'ready' || order.status === 'processing') && (
                  <button
                    id="btn-advance-delivered"
                    onClick={() => {
                      triggerHaptic('success');
                      onUpdateStatus(order.id, 'delivered', 'تم التسليم للعميل واستلام الحساب كاملاً');
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-md transition active:scale-95 touch-manipulation shadow-xs animate-pulse"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تأكيد التسليم واستلام المبلغ ({CURRENCY})</span>
                  </button>
                )}

                {canManage && (
                  <button
                    id="btn-cancel-order"
                    onClick={() => {
                      triggerHaptic('warning');
                      const reason = prompt('يرجى ذكر سبب إلغاء الطلبية:') || 'إلغاء بناءً على رغبة العميل';
                      onUpdateStatus(order.id, 'cancelled', reason);
                    }}
                    className="text-xs text-red-600 hover:bg-red-50 px-3 py-2 rounded-md border border-red-200 transition active:scale-95"
                  >
                    إلغاء الطلب
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Interactive 1-Click Action Hub (WhatsApp, Direct Call, Ozon Delivery & Sticker) */}
          <OrderActionHub 
            order={order}
            onUpdateOrderOzon={onUpdateOrderOzon}
            onOpenOzonSticker={onOpenOzonSticker}
          />

          {/* Customer & Address Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-sm border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">اسم العميل:</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{order.customerName}</p>
              
              <span className="text-[10px] text-slate-400 block font-bold mt-2">رقم الجوال:</span>
              <a 
                href={`tel:${order.customerPhone}`} 
                onClick={() => triggerHaptic('light')}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 mt-0.5 font-mono"
              >
                <Phone className="w-3 h-3" />
                <span>{order.customerPhone}</span>
              </a>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-bold">عنوان التوصيل:</span>
              <p className="text-xs font-medium text-slate-800 mt-0.5 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{order.city} - {order.customerAddress}</span>
              </p>

              <span className="text-[10px] text-slate-400 block font-bold mt-2">طريقة السداد:</span>
              <p className="text-xs font-medium text-slate-700 mt-0.5">
                {order.paymentStatus === 'paid' ? 'مدفوع مسبقاً إلكترونياً' : 'الدفع عند الاستلام (COD)'}
              </p>
            </div>
          </div>

          {/* Assigned Worker / Reassignment by Manager */}
          <div className="bg-white p-3.5 rounded-sm border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-sm bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                <UserCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">المندوب المكلف بالتنفيذ:</span>
                <p className="font-bold text-slate-900">{order.assignedWorkerName}</p>
              </div>
            </div>

            {canManage && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedWorker}
                  onChange={(e) => {
                    triggerHaptic('selection');
                    setSelectedWorker(e.target.value);
                    onReassignWorker(order.id, e.target.value);
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white"
                >
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>إسناد إلى: {w.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Ordered Products Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2">قائمة المنتجات في الطلبية:</h4>
            <div className="border border-slate-200 rounded-md overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <tr>
                    <th className="p-2.5">المنتج واللون</th>
                    <th className="p-2.5 text-center">الكمية</th>
                    <th className="p-2.5 text-left">سعر البيع</th>
                    <th className="p-2.5 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-medium text-slate-800">
                        <div className="flex items-center gap-2.5">
                          {item.selectedColorImage && (
                            <img
                              src={item.selectedColorImage}
                              alt={item.productName}
                              className="w-9 h-11 object-cover rounded border border-slate-200 shrink-0"
                            />
                          )}
                          <div>
                            <div className="font-bold text-slate-900">{item.productName}</div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
                              {item.selectedColor && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-purple-50 text-purple-800 border border-purple-200 font-medium">
                                  <span>اللون: {item.selectedColor}</span>
                                </span>
                              )}
                              {item.selectedSize && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                                  مقاس: {item.selectedSize}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-700">{item.quantity}</td>
                      <td className="p-2.5 text-left font-mono">{item.unitPrice.toLocaleString()} {CURRENCY}</td>
                      <td className="p-2.5 text-left font-mono font-bold text-slate-900">{item.totalPrice.toLocaleString()} {CURRENCY}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown (in MAD) */}
          <div className="p-4 rounded-sm border border-slate-200 bg-slate-50 space-y-2 text-xs">
            <h4 className="font-bold text-slate-800 text-xs">الملخص المالي التلقائي:</h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
              <div className="bg-white p-2.5 rounded-sm border border-slate-200">
                <span className="text-[10px] text-slate-400 block">سعر البيع الإجمالي</span>
                <span className="font-bold text-slate-900 font-mono">{order.totalSellingPrice.toLocaleString()} {CURRENCY}</span>
              </div>

              {canManage && (
                <div className="bg-white p-2.5 rounded-sm border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">إجمالي التكلفة</span>
                  <span className="font-bold text-slate-700 font-mono">{order.totalCost.toLocaleString()} {CURRENCY}</span>
                </div>
              )}

              <div className="bg-white p-2.5 rounded-sm border border-slate-200">
                <span className="text-[10px] text-yellow-800 block font-bold">عمولة المندوب</span>
                <span className="font-bold text-yellow-700 font-mono">{order.workerCommission.toLocaleString()} {CURRENCY}</span>
              </div>

              {canManage && (
                <div className="bg-white p-2.5 rounded-sm border border-slate-200">
                  <span className="text-[10px] text-green-800 block font-bold">صافي الربح</span>
                  <span className="font-bold text-green-700 font-mono">{order.netProfit.toLocaleString()} {CURRENCY}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Timeline Log */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>سجل التحديثات والتتبع اللحظي:</span>
            </h4>

            <div className="space-y-2 border-r-2 border-slate-200 pr-3 mr-1">
              {order.timeline.map((evt, idx) => (
                <div key={idx} className="relative text-xs">
                  <div className="absolute -right-[17px] top-1 w-2 h-2 rounded-full bg-blue-600 ring-4 ring-white" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {getStatusBadge(evt.status).label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">بواسطة: {evt.updatedBy}</p>
                  {evt.note && (
                    <p className="text-[11px] text-slate-600 bg-white p-1.5 rounded mt-1 border border-slate-200">
                      {evt.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-md">
          <span className="text-[11px] text-slate-400">
            حالة المزامنة: متزامن سحابياً
          </span>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-md transition active:scale-95"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};
