import { Order, Product, User, SystemNotification, CleanupSettings, AuditLogEntry } from '../types';
import { INITIAL_ORDERS, INITIAL_PRODUCTS, INITIAL_USERS, INITIAL_NOTIFICATIONS, INITIAL_CLEANUP_SETTINGS } from '../data/initialData';

const STORAGE_KEYS = {
  ORDERS: 'enjaz_orders_v5',
  PRODUCTS: 'enjaz_products_v5',
  USERS: 'enjaz_users_v5',
  NOTIFICATIONS: 'enjaz_notifications_v5',
  CLEANUP_SETTINGS: 'enjaz_cleanup_v2',
  SYNC_QUEUE: 'enjaz_sync_queue_v1',
  LAST_SYNC: 'enjaz_last_sync_v1',
  AUDIT_LOGS: 'enjaz_audit_logs_v5',
  AUTH_USER: 'enjaz_auth_user_v2'
};

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit_1',
    timestamp: new Date().toISOString(),
    userId: 'usr_admin',
    userName: 'كمال بن عمامو',
    userRole: 'admin',
    action: 'تهيئة النظام',
    details: 'تمت تهيئة لوحة التحكم وتعيين المدير العام كمال بن عمامو',
    entityType: 'auth'
  }
];

export function loadStoredData() {
  try {
    const rawOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const rawProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    const rawNotifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const rawCleanup = localStorage.getItem(STORAGE_KEYS.CLEANUP_SETTINGS);
    const rawSyncQueue = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    const rawLastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    const rawAuditLogs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);

    // Products: clean slate until manager adds them
    let products: Product[] = [];
    if (rawProducts) {
      try {
        const parsed = JSON.parse(rawProducts) as Product[];
        const hasMockData = parsed.some(p => p.id === 'prod_1' || p.id === 'prod_2' || p.sku?.startsWith('ABY-'));
        if (!hasMockData) {
          products = parsed;
        }
      } catch {
        products = [];
      }
    }

    // Orders: clean slate until new orders are created
    let orders: Order[] = [];
    if (rawOrders) {
      try {
        const parsedOrders = JSON.parse(rawOrders) as Order[];
        const hasMockOrders = parsedOrders.some(o => o.id === 'ord_1' || o.id === 'ord_2' || o.orderNumber === 'ORD-2041');
        if (!hasMockOrders) {
          orders = parsedOrders;
        }
      } catch {
        orders = [];
      }
    }

    // Users: keep admin and purge mock workers
    let users = rawUsers ? (JSON.parse(rawUsers) as User[]) : INITIAL_USERS;
    users = users.filter(u => u.role === 'admin' || (u.id !== 'usr_worker_1' && u.id !== 'usr_worker_2' && u.id !== 'usr_worker_3' && u.id !== 'usr_supervisor'));
    let adminFound = false;
    users = users.map(u => {
      if (u.role === 'admin' || u.id === 'usr_admin') {
        adminFound = true;
        return {
          ...u,
          name: 'كمال بن عمامو',
          phone: '0642815566',
          pin: '064281',
          username: 'admin'
        };
      }
      return u;
    });
    if (!adminFound) {
      users = [INITIAL_USERS[0], ...users];
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    return {
      orders,
      products,
      users,
      notifications: rawNotifications ? (JSON.parse(rawNotifications) as SystemNotification[]) : INITIAL_NOTIFICATIONS,
      cleanupSettings: rawCleanup ? (JSON.parse(rawCleanup) as CleanupSettings) : INITIAL_CLEANUP_SETTINGS,
      syncQueue: rawSyncQueue ? (JSON.parse(rawSyncQueue) as string[]) : [],
      lastSyncTime: rawLastSync || new Date().toISOString(),
      auditLogs: rawAuditLogs ? (JSON.parse(rawAuditLogs) as AuditLogEntry[]) : INITIAL_AUDIT_LOGS
    };
  } catch (err) {
    console.error('Error loading localStorage, using defaults', err);
    return {
      orders: INITIAL_ORDERS,
      products: INITIAL_PRODUCTS,
      users: INITIAL_USERS,
      notifications: INITIAL_NOTIFICATIONS,
      cleanupSettings: INITIAL_CLEANUP_SETTINGS,
      syncQueue: [],
      lastSyncTime: new Date().toISOString(),
      auditLogs: INITIAL_AUDIT_LOGS
    };
  }
}

export function saveOrders(orders: Order[]) {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
}

export function saveAuditLogs(logs: AuditLogEntry[]) {
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
}

export function loadAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return raw ? JSON.parse(raw) : INITIAL_AUDIT_LOGS;
  } catch (e) {
    console.error('Error loading audit logs', e);
    return INITIAL_AUDIT_LOGS;
  }
}

export function addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
  try {
    const current = loadAuditLogs();
    const newLog: AuditLogEntry = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString()
    };
    const updated = [newLog, ...current];
    saveAuditLogs(updated);
  } catch (e) {
    console.error('Error appending audit log', e);
  }
}

export function saveAuthSession(user: User | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
}

export function getStoredAuthSession(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProducts(products: Product[]) {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

export function saveUsers(users: User[]) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function saveNotifications(notifs: SystemNotification[]) {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
}

export function saveCleanupSettings(settings: CleanupSettings) {
  localStorage.setItem(STORAGE_KEYS.CLEANUP_SETTINGS, JSON.stringify(settings));
}

export function queueSyncAction(actionDescription: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    const queue: string[] = raw ? JSON.parse(raw) : [];
    queue.push(actionDescription);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  } catch (e) {
    console.error('Error saving sync queue', e);
  }
}

export function clearSyncQueue() {
  localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
  const now = new Date().toISOString();
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC, now);
  return now;
}

// Periodic cleanup of completed / archived records
export function executeMaintenanceCleanup(
  orders: Order[],
  notifications: SystemNotification[],
  settings: CleanupSettings
): {
  updatedOrders: Order[];
  updatedNotifications: SystemNotification[];
  archivedCount: number;
  clearedNotifsCount: number;
  newSettings: CleanupSettings;
} {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - settings.autoArchiveDays);

  let archivedCount = 0;
  const updatedOrders = orders.map(order => {
    if (!order.isArchived && order.status === 'delivered') {
      const orderDate = new Date(order.completedAt || order.createdAt);
      if (orderDate < cutoffDate) {
        archivedCount++;
        return { ...order, isArchived: true };
      }
    }
    return order;
  });

  // Keep unread notifications, discard read ones older than 3 days
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const initialNotifsLen = notifications.length;
  const updatedNotifications = notifications.filter(n => {
    if (!n.read) return true;
    return new Date(n.timestamp) >= threeDaysAgo;
  });
  const clearedNotifsCount = initialNotifsLen - updatedNotifications.length;

  const now = new Date();
  const nextScheduled = new Date(now);
  nextScheduled.setDate(nextScheduled.getDate() + 7); // Schedule next in 7 days

  const newSettings: CleanupSettings = {
    ...settings,
    lastCleanupTime: now.toISOString(),
    nextScheduledTime: nextScheduled.toISOString(),
    clearedItemsCount: settings.clearedItemsCount + archivedCount + clearedNotifsCount
  };

  saveOrders(updatedOrders);
  saveNotifications(updatedNotifications);
  saveCleanupSettings(newSettings);

  return {
    updatedOrders,
    updatedNotifications,
    archivedCount,
    clearedNotifsCount,
    newSettings
  };
}

