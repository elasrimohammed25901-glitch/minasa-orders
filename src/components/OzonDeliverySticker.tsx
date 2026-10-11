import React from 'react';
import { X, Printer, Copy, Check, Truck, ShieldCheck } from 'lucide-react';
import { Order } from '../types';
import { CURRENCY } from '../utils/currency';
import { triggerHaptic } from '../utils/haptics';
import { getOzonConfig } from '../utils/ozonApi';

interface OzonDeliveryStickerProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OzonDeliverySticker: React.FC<OzonDeliveryStickerProps> = ({
  order,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !order) return null;

  const config = getOzonConfig();
  const trackingNumber = order.ozonTrackingNumber || `OZ-MA-${order.orderNumber.replace('ORD-', '')}-9921`;
  const totalCodAmount = order.paymentStatus === 'paid' ? 0 : (order.totalSellingPrice + order.deliveryFee);

  const handleCopy = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    triggerHaptic('heavy');
    window.print();
  };

  // Generate visual barcode stripes
  const barcodeBars = [
    3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 3, 1, 1, 3, 2, 1, 2, 1, 3, 2, 1, 1, 3, 2, 1, 3, 1, 2,
    1, 2, 3, 1, 1, 2, 1, 3, 2, 1, 1, 3, 2, 1, 3, 1, 2, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden border border-slate-300 animate-in zoom-in-95 duration-150">
        
        {/* Modal Top Control Bar (Hidden in Print) */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm">ورقة التوصيل اللاصقة • Ozon Express</h3>
              <p className="text-[10px] text-slate-300">جاهزة للطباعة واللصق مباشرة على طرد الطلبية</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition active:scale-95 shadow-xs"
              title="طباعة بوليصة التوصيل اللاصقة"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة الملصق 🖨️</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Actual Sticky Shipping Label (Optimized for Sticker/Thermal Print) */}
        <div className="p-4 sm:p-6 bg-slate-100 flex justify-center items-center overflow-y-auto max-h-[80vh]">
          
          <div 
            id="ozon-printable-sticker"
            className="w-full max-w-[390px] bg-white border-2 border-black p-4 text-black font-sans select-all shadow-md print:shadow-none print:border-2 print:border-black print:p-3 print:m-0 print:w-full"
            style={{ minHeight: '520px' }}
          >
            
            {/* Header: Carrier Brand & Service */}
            <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="bg-black text-white px-2 py-1 font-black text-sm tracking-wider uppercase font-mono">
                  OZON
                </div>
                <div>
                  <span className="font-black text-xs block leading-none tracking-tight">EXPRESS MOROCCO</span>
                  <span className="text-[9px] text-slate-600 uppercase font-semibold">LOGISTIQUE E-COMMERCE</span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block border border-black px-1.5 py-0.5 text-[9px] font-black uppercase">
                  STANDARD 24/48H
                </span>
                <p className="text-[9px] font-mono text-slate-700 mt-0.5">
                  {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            {/* Destination Hub & City (HUGE BOLD) */}
            <div className="bg-black text-white p-2.5 text-center mb-2.5 rounded-none">
              <span className="text-[10px] font-semibold tracking-widest block uppercase text-slate-200">
                VILLE DE DESTINATION / مدينة الوصول
              </span>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider font-mono">
                {order.city}
              </h1>
            </div>

            {/* Barcode & Tracking Number */}
            <div className="border border-black p-2 text-center mb-2.5 bg-slate-50/50">
              {/* Visual simulated Code128 barcode lines */}
              <div className="flex justify-center items-end gap-[1.5px] h-11 mb-1 px-2 overflow-hidden">
                {barcodeBars.map((w, idx) => (
                  <div
                    key={idx}
                    className="bg-black"
                    style={{
                      width: `${w * 1.5}px`,
                      height: `${(idx % 5 === 0 ? 44 : 36)}px`
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono font-black text-sm tracking-widest text-black">
                  {trackingNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="no-print text-slate-500 hover:text-black p-0.5"
                  title="نسخ رقم التتبع"
                >
                  {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="text-[9px] text-slate-500 font-mono">
                RÉF INTERNE: {order.orderNumber}
              </div>
            </div>

            {/* Recipient Details (Destinataire) */}
            <div className="border-b-2 border-black pb-2 mb-2 text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-[10px] uppercase tracking-wider bg-black text-white px-1.5 py-0.2">
                  DESTINATAIRE / الزبونة
                </span>
                <span className="text-[9px] font-bold text-slate-600">CLIENT FINAL</span>
              </div>
              
              <div className="space-y-0.5 mt-1 text-right" dir="rtl">
                <p className="font-black text-sm text-black">
                  {order.customerName}
                </p>
                <p className="font-mono font-black text-sm text-black tracking-wide dir-ltr text-right">
                  📞 {order.customerPhone}
                </p>
                <p className="text-[11px] font-medium text-slate-800 leading-tight">
                  📍 {order.customerAddress}
                </p>
                <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-slate-200 mt-1">
                  <span className="text-black">
                    🏙️ {order.city}
                  </span>
                  {order.ozonCityRef && (
                    <span className="font-mono bg-black text-white px-1.5 py-0.5 text-[10px] rounded">
                      REF: {order.ozonCityRef.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Prominent COD (Cash on Delivery / CRBT) Box */}
            <div className="border-2 border-black p-2.5 text-center mb-2.5 bg-yellow-50/50">
              <div className="text-[10px] font-black uppercase text-slate-800 tracking-wider">
                MONTANT À ENCAISSER / المبلغ المطلوب تحصيله (CRBT)
              </div>
              <div className="text-2xl font-black font-mono text-black my-0.5">
                {totalCodAmount > 0 ? `${totalCodAmount.toLocaleString()} ${CURRENCY}` : '0 MAD (PAYÉ D\'AVANCE)'}
              </div>
              <div className="text-[9px] text-slate-600 font-bold">
                {order.paymentStatus === 'paid' ? 'الطلبية مدفوعة مسبقاً - لا تقم بتحصيل أي مبلغ' : 'الدفع عند الاستلام نقداً للموزع'}
              </div>
            </div>

            {/* Parcel Contents (Vêtements pour femmes) */}
            <div className="border border-black p-2 mb-2 text-[10px] bg-slate-50/40 text-right" dir="rtl">
              <span className="font-bold block text-slate-700 mb-0.5">محتويات الطرد (أزياء نسائية):</span>
              <p className="text-slate-900 font-semibold leading-relaxed">
                {order.items.map(i => `${i.productName} (${i.quantity})`).join(' + ')}
              </p>
            </div>

            {/* Sender & Instructions */}
            <div className="grid grid-cols-2 gap-2 text-[9px] border-t border-black pt-1.5 text-right" dir="rtl">
              <div>
                <span className="font-bold block text-slate-500">المرسل (Expéditeur):</span>
                <p className="font-bold text-black">{config.senderName}</p>
                <p className="font-mono text-slate-700">{config.senderPhone}</p>
                <p className="text-slate-600">{config.senderCity}</p>
              </div>
              <div className="text-left" dir="ltr">
                <span className="font-bold block text-slate-500">Instructions:</span>
                <p className="font-bold text-black flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5 text-black" />
                  <span>OUVERTURE AUTORISÉE</span>
                </p>
                <p className="text-slate-600">Ne pas plier - Vêtements</p>
                <p className="text-[8px] font-mono text-slate-400">OZON API INTEGRATION</p>
              </div>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs no-print">
          <span className="text-[11px] text-slate-500">
            مقاس الملصق: A6 / 100×150 مم قياسي
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition"
            >
              {copied ? 'تم النسخ بنجاح!' : 'نسخ رقم التتبع'}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-black hover:bg-slate-800 text-white rounded font-bold transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة ورقة التوصيل الآن</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
