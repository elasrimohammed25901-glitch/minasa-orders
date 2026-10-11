import * as XLSX from 'xlsx';
import { Order, User, Product, AuditLogEntry } from '../types';
import { CURRENCY } from './currency';

export function exportOrdersToExcel(orders: Order[], customFilename: string = 'طلبيات_نظام_إنجاز.xlsx') {
  // Format data with clear Arabic headers
  const rows = orders.map((ord, index) => {
    const itemsText = ord.items.map(i => `${i.productName} (الكمية: ${i.quantity})`).join(' ، ');
    
    let statusArabic = 'قيد الانتظار';
    if (ord.status === 'processing') statusArabic = 'قيد التجهيز والتنفيذ';
    else if (ord.status === 'ready') statusArabic = 'تم التجهيز وجاهز للتسليم';
    else if (ord.status === 'delivered') statusArabic = 'تم التسليم بنجاح';
    else if (ord.status === 'cancelled') statusArabic = 'ملغي';

    let priorityArabic = ord.priority === 'urgent' ? 'عاجل جداً' : 'عادي';
    let paymentArabic = ord.paymentStatus === 'paid' ? 'مدفوع مسبقاً' : (ord.paymentStatus === 'cod' ? 'الدفع عند الاستلام' : 'معلق');

    return {
      'م': index + 1,
      'رقم الطلبية': ord.orderNumber,
      'اسم العميل': ord.customerName,
      'رقم هاتف العميل': ord.customerPhone,
      'المدينة': ord.city,
      'العنوان الكامل': ord.customerAddress,
      'حالة الطلب': statusArabic,
      'أولوية الطلب': priorityArabic,
      'المندوب/العامل المسؤول': ord.assignedWorkerName || 'غير مسند',
      'المنتجات المطلوبة': itemsText,
      [`إجمالي سعر البيع (${CURRENCY})`]: ord.totalSellingPrice,
      [`إجمالي التكلفة (${CURRENCY})`]: ord.totalCost,
      [`عمولة العامل (${CURRENCY})`]: ord.workerCommission,
      [`صافي الربح (${CURRENCY})`]: ord.netProfit,
      [`رسوم التوصيل (${CURRENCY})`]: ord.deliveryFee,
      'حالة السداد': paymentArabic,
      'تاريخ الإنشاء': new Date(ord.createdAt).toLocaleDateString('ar-MA', { hour: '2-digit', minute: '2-digit' }),
      'ملاحظات': ord.notes || '-'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلبيات');

  // Set RTL direction on the worksheet if supported
  if (!worksheet['!views']) {
    worksheet['!views'] = [{ rightToLeft: true }];
  }

  XLSX.writeFile(workbook, customFilename);
}

export function exportWorkersReportToExcel(workers: User[], orders: Order[], customFilename: string = 'تقرير_إنتاجية_العمال.xlsx') {
  const rows = workers.filter(w => w.role === 'worker' || w.role === 'supervisor').map((worker, index) => {
    const workerOrders = orders.filter(o => o.assignedWorkerId === worker.id);
    const completedOrders = workerOrders.filter(o => o.status === 'delivered');
    const inProgressOrders = workerOrders.filter(o => o.status === 'processing' || o.status === 'ready');
    const pendingOrders = workerOrders.filter(o => o.status === 'pending');
    
    const completionRate = workerOrders.length > 0 
      ? Math.round((completedOrders.length / workerOrders.length) * 100) 
      : 0;

    const totalEarnedInActiveOrders = completedOrders.reduce((acc, curr) => acc + curr.workerCommission, 0);

    return {
      'م': index + 1,
      'اسم العامل/المندوب': worker.name,
      'اسم المستخدم': worker.username,
      'رقم الجوال': worker.phone,
      'الدور الوظيفي': worker.role === 'supervisor' ? 'مشرف ميداني' : 'مندوب تنفيذ',
      'الحالة': worker.active ? 'نشط' : 'موقوف',
      'إجمالي الطلبات المسندة': workerOrders.length,
      'الطلبات المنجزة بالكامل': completedOrders.length,
      'طلبات قيد التنفيذ': inProgressOrders.length,
      'طلبات جديدة بالانتظار': pendingOrders.length,
      'نسبة الإنجاز': `${completionRate}%`,
      [`إجمالي العمولات المكتسبة (${CURRENCY})`]: totalEarnedInActiveOrders + worker.totalEarnedCommission,
      'تاريخ الانضمام': worker.joinedDate
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'إنتاجية العمال');

  if (!worksheet['!views']) {
    worksheet['!views'] = [{ rightToLeft: true }];
  }

  XLSX.writeFile(workbook, customFilename);
}

export function exportProductsToExcel(products: Product[], customFilename: string = 'قائمة_المنتجات_والأسعار.xlsx') {
  const rows = products.map((prod, index) => {
    const margin = prod.sellingPrice > 0 
      ? Math.round(((prod.sellingPrice - prod.costPrice) / prod.sellingPrice) * 100) 
      : 0;

    return {
      'م': index + 1,
      'رمز المنتج (SKU)': prod.sku,
      'اسم المنتج': prod.name,
      'التصنيف': prod.category,
      [`سعر التكلفة (${CURRENCY})`]: prod.costPrice,
      [`سعر البيع (${CURRENCY})`]: prod.sellingPrice,
      'هامش الربح الإجمالي': `${margin}%`,
      [`عمولة العامل الافتراضية (${CURRENCY})`]: prod.defaultCommission,
      'الكمية المتاحة في المخزون': prod.stock,
      'الوصف': prod.description || '-'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'المنتجات');

  if (!worksheet['!views']) {
    worksheet['!views'] = [{ rightToLeft: true }];
  }

  XLSX.writeFile(workbook, customFilename);
}

// Trigger printable view for PDF generation or physical receipt
export function printPage() {
  window.print();
}

export function exportAuditLogsToExcel(logs: AuditLogEntry[], customFilename: string = 'سجل_النشاطات_والعمليات.xlsx') {
  const rows = logs.map((log, index) => {
    let roleArabic = 'عامل تنفيذ';
    if (log.userRole === 'admin') roleArabic = 'مدير النظام';
    else if (log.userRole === 'supervisor') roleArabic = 'مشرف';

    return {
      'م': index + 1,
      'الوقت والتاريخ': new Date(log.timestamp).toLocaleString('ar-MA'),
      'المستخدم': log.userName,
      'الدور الوظيفي': roleArabic,
      'نوع العملية': log.action,
      'البيان والتفاصيل': log.details,
      'التصنيف': log.entityType
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل النشاطات');

  if (!worksheet['!views']) {
    worksheet['!views'] = [{ rightToLeft: true }];
  }

  XLSX.writeFile(workbook, customFilename);
}
