import React, { useState } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Truck, 
  Printer, 
  Copy, 
  Check, 
  Send, 
  ExternalLink,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Order } from '../types';
import { CURRENCY } from '../utils/currency';
import { triggerHaptic } from '../utils/haptics';
import { registerParcelWithOzon } from '../utils/ozonApi';

interface OrderActionHubProps {
  order: Order;
  onUpdateOrderOzon?: (orderId: string, trackingNumber: string, barcode: string) => void;
  onOpenOzonSticker?: (order: Order) => void;
}

export function normalizeMoroccanPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '212' + cleaned.substring(1);
  } else if (!cleaned.startsWith('212') && cleaned.length >= 9) {
    cleaned = '212' + cleaned;
  }
  return cleaned;
}

export const OrderActionHub: React.FC<OrderActionHubProps> = ({
  order,
  onUpdateOrderOzon,
  onOpenOzonSticker
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [customText, setCustomText] = useState<string>('');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isRegisteringOzon, setIsRegisteringOzon] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const itemsSummary = order.items.map(i => `${i.productName} (${i.quantity})`).join('، ');
  const codAmount = order.paymentStatus === 'paid' ? 0 : (order.totalSellingPrice + order.deliveryFee);
  const waPhone = normalizeMoroccanPhoneForWhatsApp(order.customerPhone);
  const trackingNumber = order.ozonTrackingNumber || 'قيد التوليد';

  // Women's fashion tailored WhatsApp message templates
  const templates = [
    {
      title: '👗 تأكيد المقاس والعنوان',
      text: `السلام عليكم أختي ${order.customerName}، معك متجر إنجاز للأزياء النسائية بخصوص طلبيتك رقم ${order.orderNumber} (${itemsSummary}). نود تأكيد العنوان والمقاسات لإرسال الشحنة لكِ اليوم عبر شركة التوصيل أوزون. هل العنوان (${order.city} - ${order.customerAddress}) دقيق؟ شكراً لكِ!`
    },
    {
      title: '📦 إشعار التتبع مع Ozon Express',
      text: `مرحباً أختي ${order.customerName}، تم تجهيز طلبيتك للأزياء النسائية وتسليمها لشركة التوصيل Ozon Express برقم تتبع: ${order.ozonTrackingNumber || 'OZ-MA-' + order.orderNumber.replace('ORD-', '')}. المبلغ المطلوب عند الاستلام: ${codAmount} ${CURRENCY}. المرجو إبقاء هاتفك مشغلاً للاستلام.`
    },
    {
      title: '🚚 المندوب في الطريق للتسليم',
      text: `السلام عليكم أختي الكريمة، مندوب التوصيل في طريقه إلى عنوانك حالياً (${order.city} - ${order.customerAddress}) لتسليم طلبيتك ${order.orderNumber}. هل أنتِ متواجدة لاستلام الطرد؟`
    },
    {
      title: '💖 تأكيد الاستلام وشكر الزبونة',
      text: `شكراً جزيلاً لكِ أختي ${order.customerName} على ثقتكِ بمتجر إنجاز للأزياء النسائية! نتمنى أن تنال المنتجات إعجابكِ، وسيسعدنا دائماً خدمتكِ في طلبياتك القادمة.`
    }
  ];

  const currentMessage = customText || templates[selectedTemplate].text;

  const handleOpenWhatsApp = (messageOverride?: string) => {
    triggerHaptic('heavy');
    const msgToSend = encodeURIComponent(messageOverride || currentMessage);
    const waUrl = `https://wa.me/${waPhone}?text=${msgToSend}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyPhone = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(order.customerPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyAddress = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(`${order.customerName} - ${order.customerPhone} - ${order.city}: ${order.customerAddress}`);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleRegisterWithOzon = async () => {
    triggerHaptic('medium');
    setIsRegisteringOzon(true);
    try {
      const res = await registerParcelWithOzon(order);
      if (res.success && onUpdateOrderOzon) {
        onUpdateOrderOzon(order.id, res.trackingNumber, res.barcode);
      }
      triggerHaptic('success');
    } catch (err) {
      console.error(err);
      triggerHaptic('warning');
    } finally {
      setIsRegisteringOzon(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-lg p-4 sm:p-5 shadow-lg border border-slate-700 space-y-4">
      
      {/* Action Hub Title Bar */}
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>مركز العمليات الفورية (1-Click Action Hub)</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                فوري بنقرة واحدة
              </span>
            </h3>
            <p className="text-[11px] text-slate-300">
              تواصل مباشر مع الزبونة، إرسال لـ Ozon، وطباعة ملصق التوصيل
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyPhone}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white text-[11px] flex items-center gap-1 transition active:scale-95"
            title="نسخ رقم الهاتف"
          >
            {copiedPhone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedPhone ? 'تم النسخ' : 'نسخ الرقم'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyAddress}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white text-[11px] flex items-center gap-1 transition active:scale-95"
            title="نسخ العنوان الكامل"
          >
            {copiedAddress ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedAddress ? 'تم النسخ' : 'نسخ العنوان'}</span>
          </button>
        </div>
      </div>

      {/* Main 1-Click Interactive Buttons Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        
        {/* 1-Click Direct WhatsApp */}
        <button
          type="button"
          onClick={() => handleOpenWhatsApp()}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-md active:scale-95 touch-manipulation group"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div className="text-right">
            <span className="block text-xs font-black">محادثة واتساب فورية</span>
            <span className="text-[10px] text-emerald-100 font-normal">بنقرة واحدة مع الرسالة</span>
          </div>
        </button>

        {/* 1-Click Direct Phone Call */}
        <a
          href={`tel:${order.customerPhone}`}
          onClick={() => triggerHaptic('heavy')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-md active:scale-95 touch-manipulation group"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
            <Phone className="w-3.5 h-3.5" />
          </div>
          <div className="text-right">
            <span className="block text-xs font-black">إجراء مكالمة هاتفية</span>
            <span className="text-[10px] text-blue-100 font-mono">{order.customerPhone}</span>
          </div>
        </a>

        {/* 1-Click Ozon Sticker Print or Register */}
        {order.ozonTrackingNumber ? (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              if (onOpenOzonSticker) onOpenOzonSticker(order);
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-md active:scale-95 touch-manipulation group"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
              <Printer className="w-3.5 h-3.5" />
            </div>
            <div className="text-right">
              <span className="block text-xs font-black">طباعة ورقة التوصيل 🖨️</span>
              <span className="text-[10px] text-indigo-200 font-mono truncate max-w-[120px]">
                {order.ozonTrackingNumber}
              </span>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleRegisterWithOzon}
            disabled={isRegisteringOzon}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition shadow-md active:scale-95 touch-manipulation group disabled:opacity-50"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
              <Truck className={`w-3.5 h-3.5 ${isRegisteringOzon ? 'animate-spin' : ''}`} />
            </div>
            <div className="text-right">
              <span className="block text-xs font-black">
                {isRegisteringOzon ? 'جاري التسجيل...' : 'تسجيل في Ozon Express'}
              </span>
              <span className="text-[10px] text-amber-200">توليد بوليصة التوصيل</span>
            </div>
          </button>
        )}

      </div>

      {/* Ozon Express Realtime Status Badge Bar */}
      <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-black flex items-center justify-center font-mono font-black text-[10px] text-white">
            OZ
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">حالة الشحنة في Ozon Express:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-white text-xs">
                {order.ozonTrackingNumber || 'لم ترسل لأوزون بعد'}
              </span>
              {order.ozonTrackingNumber && (
                <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Check className="w-2.5 h-2.5" /> مسجلة
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {order.ozonTrackingNumber ? (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                if (onOpenOzonSticker) onOpenOzonSticker(order);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-100 text-slate-900 rounded text-xs font-bold transition active:scale-95 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>عرض وطباعة اللاصق (Sticker)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRegisterWithOzon}
              disabled={isRegisteringOzon}
              className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-xs font-bold transition active:scale-95"
            >
              <Truck className="w-3 h-3" />
              <span>إرسال الآن لأوزون</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable WhatsApp Message Templates Hub */}
      <div className="bg-slate-800/60 rounded-lg border border-slate-700/80 overflow-hidden">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setShowTemplates(!showTemplates);
          }}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-slate-200 hover:bg-slate-700/50 transition text-right"
        >
          <span className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>رسائل الواتساب الجاهزة للأزياء والعبايات ({templates.length} قوالب احترافية)</span>
          </span>
          <span className="text-slate-400 flex items-center gap-1 text-[11px]">
            <span>{showTemplates ? 'إخفاء القوالب' : 'تخصيص الرسالة'}</span>
            {showTemplates ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </button>

        {showTemplates && (
          <div className="p-3.5 border-t border-slate-700/80 space-y-3 bg-slate-900/40">
            {/* Quick Templates Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {templates.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedTemplate(idx);
                    setCustomText(tpl.text);
                  }}
                  className={`p-2 rounded text-right text-[11px] font-semibold border transition ${
                    selectedTemplate === idx
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-xs'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <span className="block truncate">{tpl.title}</span>
                </button>
              ))}
            </div>

            {/* Editable Preview */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400">
                معاينة وتعديل نص رسالة الواتساب قبل الإرسال:
              </label>
              <textarea
                rows={3}
                value={customText || templates[selectedTemplate].text}
                onChange={e => setCustomText(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-sans"
                dir="rtl"
              />
            </div>

            {/* Send WhatsApp Button */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleOpenWhatsApp(customText || templates[selectedTemplate].text)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition active:scale-95 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال الرسالة المختارة عبر واتساب الآن</span>
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
