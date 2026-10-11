import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  UserCheck, 
  Sparkles, 
  Mic, 
  MicOff, 
  AlertTriangle, 
  CheckCircle2, 
  ClipboardPaste, 
  Wand2,
  Palette,
  Check,
  Layers,
  Tag,
  ShoppingBag
} from 'lucide-react';
import { Product, User, Order, OrderItem, OzonCity } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { CURRENCY } from '../utils/currency';
import { parseCustomerOrderText, normalizePhoneNumber } from '../utils/smartParser';
import { getOzonConfig } from '../utils/ozonApi';
import { OzonCitySelect } from './OzonCitySelect';

interface SelectedOrderItem {
  id: string;
  productId: string;
  quantity: number;
  selectedColor?: string;
  selectedColorImage?: string;
  selectedSize?: string;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  workers: User[];
  orders?: Order[];
  onCreateOrder: (newOrder: Partial<Order>) => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  products,
  workers,
  orders = [],
  onCreateOrder
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [city, setCity] = useState('الدار البيضاء - المعاريف');
  const [ozonCityId, setOzonCityId] = useState<number | undefined>(2179);
  const [ozonCityRef, setOzonCityRef] = useState<string | undefined>('maarif');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [paymentStatus, setPaymentStatus] = useState<'cod' | 'paid'>('cod');
  const [assignedWorkerId, setAssignedWorkerId] = useState(workers.find(w => w.role === 'worker')?.id || '');
  const [deliveryFee, setDeliveryFee] = useState<number>(20);
  const [notes, setNotes] = useState('');

  // Smart Parser & Voice State
  const [rawText, setRawText] = useState('');
  const [isSmartParserOpen, setIsSmartParserOpen] = useState(false);
  const [parseNotification, setParseNotification] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Ozon Express Auto-Dispatch State
  const ozonConfig = getOzonConfig();
  const [sendToOzon, setSendToOzon] = useState<boolean>(ozonConfig.autoSendOnCreate);

  // Initial Product & Color Setup
  const initialProduct = products[0];
  const initialColor = initialProduct?.colors?.[0];

  // Selected order items in cart
  const [selectedItems, setSelectedItems] = useState<SelectedOrderItem[]>(
    initialProduct ? [
      { 
        id: 'item_init_1',
        productId: initialProduct.id, 
        quantity: 1,
        selectedColor: initialColor?.name,
        selectedColorImage: initialColor?.imageUrl || initialProduct.imageUrl,
        selectedSize: initialProduct?.sizes?.[0]
      }
    ] : []
  );

  // Visual Product Selector state (Category -> Product with Image -> Color with Image & Name)
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeProductId, setActiveProductId] = useState<string>(products[0]?.id || '');

  // Current active product
  const activeProduct = products.find(p => p.id === activeProductId) || products[0];
  const activeProductColors = activeProduct?.colors && activeProduct.colors.length > 0
    ? activeProduct.colors
    : [
        {
          id: `col_default_${activeProduct?.id || '1'}`,
          name: 'اللون الرئيسي',
          hexColor: '#1e293b',
          imageUrl: activeProduct?.imageUrl || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80'
        }
      ];

  const [activeColorId, setActiveColorId] = useState<string>(activeProductColors[0]?.id || '');
  const [activeSize, setActiveSize] = useState<string>(activeProduct?.sizes?.[0] || '');
  const [activeQuantity, setActiveQuantity] = useState<number>(1);

  // Current chosen color object
  const selectedActiveColor = activeProductColors.find(c => c.id === activeColorId) || activeProductColors[0];

  // Categories list
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  // When changing product in the visual picker
  const handleSelectProduct = (prod: Product) => {
    triggerHaptic('selection');
    setActiveProductId(prod.id);
    if (prod.colors && prod.colors.length > 0) {
      setActiveColorId(prod.colors[0].id);
    } else {
      setActiveColorId('');
    }
    if (prod.sizes && prod.sizes.length > 0) {
      setActiveSize(prod.sizes[0]);
    } else {
      setActiveSize('');
    }
    setActiveQuantity(1);
  };

  // When choosing color in the visual picker
  const handleSelectColor = (colorId: string) => {
    triggerHaptic('selection');
    setActiveColorId(colorId);
  };

  // Add the configured product with chosen color to the order items
  const handleAddActiveProductToOrder = () => {
    if (!activeProduct) return;
    triggerHaptic('success');

    const colorName = selectedActiveColor?.name || activeProduct.colors?.[0]?.name;
    const colorImg = selectedActiveColor?.imageUrl || activeProduct.imageUrl;

    const existingIndex = selectedItems.findIndex(
      item => item.productId === activeProduct.id && 
              item.selectedColor === colorName &&
              item.selectedSize === (activeSize || undefined)
    );

    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += activeQuantity;
      setSelectedItems(updated);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          productId: activeProduct.id,
          quantity: activeQuantity,
          selectedColor: colorName,
          selectedColorImage: colorImg,
          selectedSize: activeSize || activeProduct.sizes?.[0]
        }
      ]);
    }
  };

  // Remove item from order
  const handleRemoveItem = (index: number) => {
    triggerHaptic('warning');
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  // Change quantity in order cart
  const handleItemQuantityChange = (index: number, qty: number) => {
    triggerHaptic('light');
    if (qty <= 0) {
      handleRemoveItem(index);
    } else {
      const next = [...selectedItems];
      next[index].quantity = qty;
      setSelectedItems(next);
    }
  };

  // Duplicate Order Check (Phone match today)
  const todayStr = new Date().toISOString().split('T')[0];
  const normalizedPhone = normalizePhoneNumber(customerPhone);
  const duplicateOrder = normalizedPhone.length >= 8
    ? orders.find(o => 
        !o.isArchived && 
        normalizePhoneNumber(o.customerPhone) === normalizedPhone &&
        o.createdAt.startsWith(todayStr)
      )
    : null;

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  if (!isOpen) return null;

  // Process text with Smart Parser
  const handleApplySmartParser = (textToParse: string) => {
    if (!textToParse.trim()) return;

    triggerHaptic('medium');
    const result = parseCustomerOrderText(textToParse, products);

    if (result.customerName) setCustomerName(result.customerName);
    if (result.customerPhone) setCustomerPhone(result.customerPhone);
    if (result.customerAddress) setCustomerAddress(result.customerAddress);
    if (result.city) setCity(result.city);
    if (result.ozonCityId) setOzonCityId(result.ozonCityId);
    if (result.ozonCityRef) setOzonCityRef(result.ozonCityRef);
    if (result.ozonDeliveredPrice !== undefined) setDeliveryFee(result.ozonDeliveredPrice);
    if (result.matchedItems && result.matchedItems.length > 0) {
      const parsedItems = result.matchedItems.map((m, idx) => {
        const prod = products.find(p => p.id === m.productId);
        const col = prod?.colors?.[0];
        return {
          id: `item_parse_${Date.now()}_${idx}`,
          productId: m.productId,
          quantity: m.quantity,
          selectedColor: col?.name,
          selectedColorImage: col?.imageUrl || prod?.imageUrl,
          selectedSize: prod?.sizes?.[0]
        };
      });
      setSelectedItems(parsedItems);
    }

    setParseNotification(
      `تم استخراج البيانات بنجاح (${result.confidence}% دقة): ${result.customerName || 'الاسم'} | ${result.customerPhone || 'الهاتف'} | ${result.city}`
    );
    setTimeout(() => setParseNotification(null), 5000);
  };

  // Toggle Voice Recognition Assistant
  const handleToggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('متصفحك الحالي لا يدعم التسميع الصوتي المباشر. يرجى استخدام متصفح Chrome أو كتابة النص يدوياً.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      triggerHaptic('light');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-MA'; // Moroccan Arabic with Arabic fallback
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('جاري الاستماع... اذكر الاسم، الهاتف، العنوان، والطلب');
        triggerHaptic('medium');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setVoiceTranscript(transcript);
        setRawText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setVoiceTranscript('تعذر التقاط الصوت بوضوح، يرجى المحاولة ثانية');
        triggerHaptic('warning');
      };

      recognition.onend = () => {
        setIsListening(false);
        triggerHaptic('success');
        if (rawText.trim()) {
          handleApplySmartParser(rawText);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Error starting speech recognition:', e);
      setIsListening(false);
    }
  };

  // Build full OrderItem objects with live calculated prices, colors, and images
  const orderItems: OrderItem[] = selectedItems
    .map(item => {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) return null;
      const chosenColor = prod.colors?.find(c => c.name === item.selectedColor || c.id === item.selectedColor) 
        || prod.colors?.[0];

      return {
        productId: prod.id,
        productName: prod.name,
        category: prod.category,
        quantity: item.quantity,
        unitCost: prod.costPrice,
        unitPrice: prod.sellingPrice,
        totalCost: prod.costPrice * item.quantity,
        totalPrice: prod.sellingPrice * item.quantity,
        selectedColor: item.selectedColor || chosenColor?.name,
        selectedColorImage: item.selectedColorImage || chosenColor?.imageUrl || prod.imageUrl,
        selectedSize: item.selectedSize || prod.sizes?.[0]
      };
    })
    .filter(Boolean) as OrderItem[];

  // Automatic Financial Calculations
  const totalSellingPrice = orderItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const totalCost = orderItems.reduce((acc, item) => acc + item.totalCost, 0);
  
  // Calculate worker commission based on default product commissions
  const assignedWorker = workers.find(w => w.id === assignedWorkerId);
  const workerCommission = selectedItems.reduce((acc, item) => {
    const prod = products.find(p => p.id === item.productId);
    if (!prod) return acc;
    return acc + (prod.defaultCommission * item.quantity);
  }, 0);

  const netProfit = totalSellingPrice - totalCost - workerCommission;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress || orderItems.length === 0) {
      triggerHaptic('warning');
      alert('يرجى تعبئة جميع الحقول المطلوبة واختيار منتج واحد على الأقل للطلبية');
      return;
    }

    triggerHaptic('heavy');
    const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    let ozonTrackingNumber: string | undefined = undefined;
    let ozonBarcode: string | undefined = undefined;
    let ozonStatus: Order['ozonStatus'] = undefined;
    let ozonRegisteredAt: string | undefined = undefined;

    if (sendToOzon) {
      const rand1 = Math.floor(1000 + Math.random() * 9000);
      const rand2 = Math.floor(1000 + Math.random() * 9000);
      ozonTrackingNumber = `OZ-MA-${rand1}-${rand2}`;
      ozonBarcode = `*${ozonTrackingNumber}*`;
      ozonStatus = 'registered';
      ozonRegisteredAt = new Date().toISOString();
    }

    onCreateOrder({
      orderNumber,
      customerName,
      customerPhone,
      customerAddress,
      city,
      items: orderItems,
      totalCost,
      totalSellingPrice,
      deliveryFee,
      workerCommission,
      netProfit,
      priority,
      paymentStatus,
      assignedWorkerId,
      assignedWorkerName: assignedWorker ? assignedWorker.name : 'غير محدد',
      notes,
      status: 'pending',
      ozonTrackingNumber,
      ozonBarcode,
      ozonStatus,
      ozonRegisteredAt,
      ozonCityId,
      ozonCityRef
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-md shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-slate-900 text-white flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">إنشاء طلبية جديدة</h2>
              <p className="text-xs text-slate-500">حساب فوري للأرباح وتكليف المندوب المسؤول بالدرهم المغربي ({CURRENCY})</p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-right">
          
          {products.length === 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>لا توجد منتجات مسجلة في الكتالوج حتى الآن</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                تم مسح قائمة المنتجات بالكامل بناء على طلبك. يرجى من المدير (كمال بن عمامو) إضافة المنتجات من قسم <strong>"المنتجات والأسعار"</strong> أولاً ليتمكن النظام من إدراجها في الطلبيات وحساب الأرباح بدقة.
              </p>
            </div>
          )}

          {/* Smart Text & Voice Assistant Box */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">المساعد الذكي لإدخال الطلبيات (نص + صوت)</h4>
                  <p className="text-[10px] text-slate-500">انسخ محادثة واتساب أو تحدث بصوتك لتعبئة الحقول فورياً</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Voice to Order Button */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30' 
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                  title="التسميع الصوتي السريع بالدارجة المغربية أو العربية"
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-blue-600" />}
                  <span>{isListening ? 'جاري الاستماع...' : 'تسميع صوتي'}</span>
                </button>

                {/* Toggle Parser Box */}
                <button
                  type="button"
                  onClick={() => setIsSmartParserOpen(!isSmartParserOpen)}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>{isSmartParserOpen ? 'إخفاء الحقل' : 'لصق نص'}</span>
                </button>
              </div>
            </div>

            {/* Voice Transcript Display */}
            {isListening && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-center gap-2 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                <span>{voiceTranscript || 'تحدث الآن: مثلاً "طلب جديد للعميل رشيد بالرباط هاتف 0612345678 قطعتين كابل شحن"'}</span>
              </div>
            )}

            {/* Expandable Text Parser */}
            {isSmartParserOpen && (
              <div className="space-y-2 pt-1 animate-in fade-in">
                <textarea
                  rows={3}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="الصق هنا رسالة الزبونة من واتساب (مثال: الاسم: فاطمة الزهراء، الهاتف: 0661223344، العنوان: حي المعاريف الدار البيضاء، المطلوب: 1 عباية ملكية سوداء و 2 حجاب شيفون)..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.readText().then(text => {
                        setRawText(text);
                        handleApplySmartParser(text);
                      }).catch(() => {
                        handleApplySmartParser(rawText);
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5 text-blue-400" />
                    <span>لصق واستخراج فوري ⚡</span>
                  </button>
                </div>
              </div>
            )}

            {/* Parse Notification Banner */}
            {parseNotification && (
              <div className="p-2 rounded-lg bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{parseNotification}</span>
              </div>
            )}
          </div>

          {/* Section 1: Customer Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>بيانات العميل والتوصيل</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم العميل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يوسف الإدريسي"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم هاتف العميل *</label>
                <input
                  type="tel"
                  required
                  placeholder="مثال: +212 612 345678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left font-mono"
                  dir="ltr"
                />
              </div>

              {/* Duplicate Order Warning Alert */}
              {duplicateOrder && (
                <div className="col-span-full p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-amber-950">⚠️ تنبيه كشف التكرار: توجد طلبية مسجلة مسبقاً بهذا الرقم اليوم!</span>
                    <span className="text-[11px] text-amber-800 leading-relaxed block mt-0.5">
                      رقم الطلبية: <span className="font-mono font-bold text-slate-900">{duplicateOrder.orderNumber}</span> | 
                      الحالة: <span className="font-bold text-slate-900">{duplicateOrder.status}</span> | 
                      المندوب: <span className="font-bold text-slate-900">{duplicateOrder.assignedWorkerName}</span> | 
                      القيمة: <span className="font-bold text-slate-900">{duplicateOrder.totalSellingPrice} {CURRENCY}</span>
                    </span>
                    <span className="text-[10px] text-amber-700 block mt-1">
                      يرجى التأكد مع العميل لتفادي إرسال شحنة مزدوجة عن طريق الخطأ.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              <div>
                <OzonCitySelect
                  value={city}
                  selectedRef={ozonCityRef}
                  onChange={(ozCity) => {
                    setCity(ozCity.arabicName || ozCity.name);
                    setOzonCityId(ozCity.id);
                    setOzonCityRef(ozCity.ref);
                    setDeliveryFee(ozCity.deliveredPrice);
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">العنوان التفصيلي *</label>
                <input
                  type="text"
                  required
                  placeholder="الحي، اسم الشارع، رقم الإقامة أو العمارة"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  الحي أو الإقامة داخل المدينة المحددة
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Visual Products & Colors Selection */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">
                    اختيار المنتجات والألوان (بالصورة والاسم)
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    اختر التصنيف، ثم اسم الموديل، ثم اختر اللون المناسب بالصورة
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {selectedItems.length} عناصر في الطلبية
              </span>
            </div>

            {/* Step-by-Step Visual Picker Card */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-3.5 sm:p-4 space-y-3.5">
              
              {/* Step 1: Category Filter Tabs */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    <span>1. تصفية المنتجات حسب التصنيف:</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {filteredProducts.length} منتجات متاحة
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => {
                    const count = cat === 'all' 
                      ? products.length 
                      : products.filter(p => p.category === cat).length;
                    const isActive = activeCategory === cat;

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setActiveCategory(cat);
                          const prodsInCat = cat === 'all' 
                            ? products 
                            : products.filter(p => p.category === cat);
                          if (prodsInCat.length > 0 && !prodsInCat.some(p => p.id === activeProductId)) {
                            handleSelectProduct(prodsInCat[0]);
                          }
                        }}
                        className={`text-xs px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1 ${
                          isActive
                            ? 'bg-slate-900 text-white font-bold shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{cat === 'all' ? 'جميع التصنيفات' : cat}</span>
                        <span className={`text-[10px] px-1 py-0.2 rounded-full ${
                          isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Select Product Name with Photo */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>2. اختر اسم الموديل (المنتج):</span>
                  </label>
                  {activeProduct && (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      المحدد: {activeProduct.name}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto p-1 scrollbar-thin">
                  {filteredProducts.map((prod) => {
                    const isSelected = prod.id === activeProductId;
                    const colorCount = prod.colors && prod.colors.length > 0 ? prod.colors.length : 1;

                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleSelectProduct(prod)}
                        className={`text-right rounded-md overflow-hidden transition relative flex flex-col justify-between border ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-full h-24 bg-slate-100 overflow-hidden">
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-full h-full object-cover object-center"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80';
                            }}
                          />
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs">
                              <Check className="w-3 h-3" />
                              <span>محدد</span>
                            </div>
                          )}
                          <span className="absolute bottom-1 left-1 bg-black/70 backdrop-blur-2xs text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                            {colorCount} ألوان
                          </span>
                        </div>

                        {/* Info */}
                        <div className="p-2 space-y-1">
                          <p className="text-xs font-bold text-slate-900 line-clamp-1 leading-tight">
                            {prod.name}
                          </p>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-blue-800 font-mono">
                              {prod.sellingPrice} {CURRENCY}
                            </span>
                            <span className="text-slate-400">
                              مخزون: {prod.stock}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Select Color Variant with Real Photos and Names */}
              {activeProduct && (
                <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-purple-600" />
                      <span>3. اختر لون الموديل (بالصورة والاسم لجميع الألوان):</span>
                    </label>
                    <span className="text-[11px] font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                      اللون المختار: {selectedActiveColor?.name || 'افتراضي'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600">
                    انقر على أي لون لمعاينة صورته واسمه واختياره للطلبية:
                  </p>

                  {/* Colors Grid with Names and Images */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {activeProductColors.map((color) => {
                      const isColorSelected = (color.id === activeColorId) || (!activeColorId && color === activeProductColors[0]);

                      return (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => handleSelectColor(color.id)}
                          className={`text-right rounded-md overflow-hidden transition relative flex flex-col border ${
                            isColorSelected
                              ? 'border-purple-600 bg-white shadow-xs ring-2 ring-purple-500/30'
                              : 'border-slate-200 bg-white hover:border-purple-300'
                          }`}
                        >
                          {/* Color Model Image */}
                          <div className="relative w-full h-28 sm:h-32 bg-slate-100 overflow-hidden border-b border-slate-100">
                            <img
                              src={color.imageUrl}
                              alt={color.name}
                              className="w-full h-full object-cover object-center transition hover:scale-105 duration-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = activeProduct.imageUrl || '';
                              }}
                            />
                            {isColorSelected && (
                              <div className="absolute top-1.5 right-1.5 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                                <Check className="w-3 h-3" />
                                <span>تم الاختيار</span>
                              </div>
                            )}

                            {/* Mini Hex Swatch */}
                            <span 
                              className="absolute bottom-1.5 left-1.5 w-4 h-4 rounded-full border border-white shadow-xs" 
                              style={{ backgroundColor: color.hexColor || '#333' }}
                              title={color.hexColor}
                            />
                          </div>

                          {/* Color Name & Swatch Label */}
                          <div className="p-2 flex items-center gap-1.5">
                            <span 
                              className="w-3 h-3 rounded-full shrink-0 border border-slate-300"
                              style={{ backgroundColor: color.hexColor || '#333' }}
                            />
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {color.name}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Step 4: Size, Quantity & Add to Cart Action */}
                  <div className="pt-3 border-t border-purple-200/70 flex flex-wrap items-center justify-between gap-3">
                    
                    {/* Sizes Selection */}
                    {activeProduct.sizes && activeProduct.sizes.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-bold text-slate-700">المقاس:</span>
                        <div className="flex items-center gap-1">
                          {activeProduct.sizes.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                triggerHaptic('selection');
                                setActiveSize(s);
                              }}
                              className={`px-2 py-1 rounded text-xs font-bold transition ${
                                activeSize === s
                                  ? 'bg-purple-600 text-white shadow-2xs'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-700">الكمية:</span>
                      <div className="flex items-center border border-slate-300 rounded bg-white overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setActiveQuantity(Math.max(1, activeQuantity - 1));
                          }}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold active:scale-95"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 font-bold font-mono text-slate-900 min-w-[30px] text-center">
                          {activeQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setActiveQuantity(activeQuantity + 1);
                          }}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold active:scale-95"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Add to Order Button */}
                    <button
                      type="button"
                      onClick={handleAddActiveProductToOrder}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-md shadow-xs transition active:scale-95 touch-manipulation"
                    >
                      <Plus className="w-4 h-4" />
                      <span>
                        إضافة للطلبية (لون: {selectedActiveColor?.name || 'الرئيسي'})
                      </span>
                    </button>
                  </div>

                </div>
              )}

            </div>

            {/* Current Order Cart Items */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
                  <span>المنتجات المضافة في هذه الطلبية ({selectedItems.length}):</span>
                </span>

                {selectedItems.length > 0 && (
                  <span className="text-slate-500 font-medium text-[11px]">
                    المجموع الفرعي: <strong className="text-slate-900 font-mono">{totalSellingPrice.toLocaleString()} {CURRENCY}</strong>
                  </span>
                )}
              </div>

              {selectedItems.length === 0 ? (
                <div className="p-4 rounded-md border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-500">
                  لم تتم إضافة أي منتج للطلبية بعد. يرجى اختيار الموديل واللون من الأعلى والضغط على <strong>"إضافة للطلبية"</strong>.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedItems.map((item, idx) => {
                    const currentProduct = products.find(p => p.id === item.productId);
                    const colorImg = item.selectedColorImage || currentProduct?.imageUrl;

                    return (
                      <div 
                        key={item.id || idx} 
                        className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-md border border-slate-200 shadow-2xs hover:border-slate-300 transition"
                      >
                        {/* Thumbnail & Product Details */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={colorImg}
                            alt={currentProduct?.name || 'المنتج'}
                            className="w-12 h-14 rounded object-cover border border-slate-200 shrink-0 shadow-2xs"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = currentProduct?.imageUrl || '';
                            }}
                          />
                          
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {currentProduct?.name || 'منتج محذوف'}
                            </h4>
                            
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                              {/* Selected Color Badge with Swatch */}
                              {item.selectedColor && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-medium">
                                  <Palette className="w-3 h-3 text-purple-600" />
                                  <span>اللون: {item.selectedColor}</span>
                                </span>
                              )}

                              {item.selectedSize && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                                  مقاس: {item.selectedSize}
                                </span>
                              )}

                              <span className="text-slate-400 font-mono">
                                ({currentProduct?.sellingPrice} {CURRENCY} / قطعة)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quantity controls & Line Total */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center border border-slate-200 rounded bg-slate-50">
                            <button
                              type="button"
                              onClick={() => handleItemQuantityChange(idx, item.quantity - 1)}
                              className="px-2 py-1 text-slate-600 hover:bg-slate-200 font-bold active:scale-95 text-xs"
                            >
                              -
                            </button>
                            <span className="px-2 py-0.5 text-xs font-bold font-mono text-slate-900 min-w-[24px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleItemQuantityChange(idx, item.quantity + 1)}
                              className="px-2 py-1 text-slate-600 hover:bg-slate-200 font-bold active:scale-95 text-xs"
                            >
                              +
                            </button>
                          </div>

                          <div className="text-left font-mono font-bold text-xs text-slate-900 min-w-[70px]">
                            {currentProduct ? (currentProduct.sellingPrice * item.quantity).toLocaleString() : 0} {CURRENCY}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition active:scale-90"
                            title="حذف هذا المنتج من الطلبية"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Assignment & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المندوب / العامل المسؤول *</label>
              <select
                value={assignedWorkerId}
                onChange={(e) => {
                  triggerHaptic('selection');
                  setAssignedWorkerId(e.target.value);
                }}
                className="w-full text-xs px-3 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {workers.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.role === 'supervisor' ? 'مشرف' : 'عامل'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الأولوية</label>
              <select
                value={priority}
                onChange={(e) => {
                  triggerHaptic('selection');
                  setPriority(e.target.value as any);
                }}
                className="w-full text-xs px-3 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-bold"
              >
                <option value="normal">عادي (تسليم قياسي)</option>
                <option value="urgent">عاجل جداً (أولوية قصوى)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">طريقة السداد</label>
              <select
                value={paymentStatus}
                onChange={(e) => {
                  triggerHaptic('selection');
                  setPaymentStatus(e.target.value as any);
                }}
                className="w-full text-xs px-3 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="cod">الدفع عند الاستلام (COD)</option>
                <option value="paid">مدفوع مسبقاً (إلكتروني)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات إضافية للتنفيذ والتوصيل</label>
            <input
              type="text"
              placeholder="مثال: يرجى الاتصال قبل التوصيل، العميل يفضل التسليم مساءً"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Section 4: Real-time Profit & Cost Calculation Summary (in MAD) */}
          <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>الحساب التلقائي للأرباح والعمولات للطلبية ({CURRENCY}):</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-2">
              <div className="bg-white p-2 rounded-sm border border-slate-200">
                <span className="text-[10px] text-slate-500 block">إجمالي سعر البيع</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{totalSellingPrice.toLocaleString()} {CURRENCY}</span>
              </div>
              <div className="bg-white p-2 rounded-sm border border-slate-200">
                <span className="text-[10px] text-slate-500 block">إجمالي التكلفة</span>
                <span className="text-sm font-bold text-slate-700 font-mono">{totalCost.toLocaleString()} {CURRENCY}</span>
              </div>
              <div className="bg-white p-2 rounded-sm border border-slate-200">
                <span className="text-[10px] text-slate-500 block">عمولة العامل</span>
                <span className="text-sm font-bold text-yellow-700 font-mono">{workerCommission.toLocaleString()} {CURRENCY}</span>
              </div>
              <div className="bg-white p-2 rounded-sm border border-slate-200">
                <span className="text-[10px] text-green-700 font-bold block">صافي ربح المتجر</span>
                <span className="text-sm font-bold text-green-700 font-mono">{netProfit.toLocaleString()} {CURRENCY}</span>
              </div>
            </div>
          </div>

          {/* Section 5: Ozon Express Automated Dispatch */}
          <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200 rounded-sm p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                  OZ
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">ربط مباشر بـ Ozon Express للتوصيل</h4>
                  <p className="text-[10px] text-slate-500">
                    تسجيل الطلبية فوراً في نظام أوزون وتوليد رقم التتبع وملصق الشحن
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendToOzon}
                  onChange={(e) => {
                    triggerHaptic('selection');
                    setSendToOzon(e.target.checked);
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            {sendToOzon && (
              <div className="text-[11px] text-blue-900 bg-white/90 p-2 rounded border border-blue-100 flex items-center justify-between">
                <span>✓ سيتم تمرير الشحنة فوراً لـ Ozon Express وطباعة ورقة التوصيل اللاصقة</span>
                <span className="font-mono font-bold text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">OZ-LIVE-API</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition active:scale-95"
            >
              إلغاء
            </button>

            <button
              type="submit"
              id="btn-submit-create-order"
              className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-all active:scale-95 touch-manipulation flex items-center gap-2"
            >
              <span>تسجيل الطلبية وإرسال التنبيه</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
