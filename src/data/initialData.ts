import { User, Product, Order, SystemNotification, CleanupSettings } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin',
    name: 'كمال بن عمامو',
    username: 'admin',
    phone: '0642815566',
    role: 'admin',
    commissionRate: 0,
    active: true,
    pin: '064281',
    tasksCompletedCount: 0,
    totalEarnedCommission: 0,
    joinedDate: '2025-01-10'
  }
];

// Product catalog is intentionally empty so the manager (Kamal Ben Amamou) can add them fresh
export const INITIAL_PRODUCTS: Product[] = [];

// Orders are initialized empty awaiting new real orders
export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif_welcome',
    title: 'مرحباً بك في لوحة تحكم المتجر',
    message: 'تمت تهيئة المنصة لحساب المدير كمال بن عمامو. يمكنك الآن البدء بإضافة المنتجات وتعيين العمال والمندوبين.',
    timestamp: new Date().toISOString(),
    type: 'system_cleanup',
    read: false
  }
];

export const INITIAL_CLEANUP_SETTINGS: CleanupSettings = {
  autoArchiveDays: 30,
  enabled: true,
  lastCleanupTime: new Date().toISOString(),
  nextScheduledTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  clearedItemsCount: 0
};
