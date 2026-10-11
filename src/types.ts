export type UserRole = 'admin' | 'acting_admin' | 'supervisor' | 'worker';

export interface User {
  id: string;
  name: string;
  username: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  commissionRate: number; // Percentage or fixed per order
  active: boolean;
  pin: string;
  tasksCompletedCount: number;
  totalEarnedCommission: number;
  joinedDate: string;
  isActingAdmin?: boolean;
}

export type OrderStatus = 'pending' | 'processing' | 'ready' | 'delivered' | 'cancelled';
export type OrderPriority = 'normal' | 'urgent';
export type PaymentStatus = 'pending' | 'paid' | 'cod'; // الدفع عند الاستلام

export interface OrderItem {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  totalCost: number;
  totalPrice: number;
  selectedColor?: string;
  selectedColorImage?: string;
  selectedSize?: string;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  updatedBy: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. ORD-1082
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  city: string;
  items: OrderItem[];
  totalCost: number;
  totalSellingPrice: number;
  deliveryFee: number;
  workerCommission: number;
  netProfit: number;
  status: OrderStatus;
  priority: OrderPriority;
  paymentStatus: PaymentStatus;
  assignedWorkerId: string;
  assignedWorkerName: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  notes?: string;
  timeline: OrderTimelineEvent[];
  isArchived?: boolean;
  ozonTrackingNumber?: string;
  ozonStatus?: 'registered' | 'in_transit' | 'delivered' | 'returned';
  ozonRegisteredAt?: string;
  ozonBarcode?: string;
  ozonCityId?: number;
  ozonCityRef?: string;
}

export interface OzonCity {
  id: number;
  ref: string;
  name: string;
  deliveredPrice: number;
  returnedPrice: number;
  refusedPrice: number;
  arabicName?: string;
}

export interface OzonConfig {
  apiKey: string;
  customerId: string;
  accountName: string;
  autoSendOnCreate: boolean;
  autoOpenStickerOnCreate: boolean;
  senderName: string;
  senderPhone: string;
  senderCity: string;
  senderAddress: string;
  openPackageAllowed: boolean;
  connected: boolean;
  lastTestedAt?: string;
}

export interface ProductColorVariant {
  id: string;
  name: string; // e.g. "أسود ملكي", "كحلي داكن", "عنابي", "بيج كشميري"
  hexColor?: string; // e.g. "#111827", "#1e3a8a", "#881337"
  imageUrl: string; // رابط صورة الموديل باللون المحدد
}

export interface Product {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  defaultCommission: number;
  stock: number;
  sku: string;
  description?: string;
  imageUrl?: string;
  colors?: ProductColorVariant[];
  sizes?: string[];
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'order_new' | 'status_change' | 'worker_assigned' | 'system_cleanup' | 'financial';
  orderId?: string;
  read: boolean;
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string;
  pendingSyncCount: number;
}

export interface CleanupSettings {
  autoArchiveDays: number;
  enabled: boolean;
  lastCleanupTime: string;
  nextScheduledTime: string;
  clearedItemsCount: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  entityType: 'order' | 'user' | 'product' | 'system' | 'auth';
  entityId?: string;
}

export interface CloudflareD1Config {
  workerUrl: string;
  apiToken: string;
  databaseName: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}
