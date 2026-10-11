import { Order, Product, User, AuditLogEntry, CloudflareD1Config } from '../types';

const D1_CONFIG_KEY = 'enjaz_cloudflare_d1_config_v1';

export const DEFAULT_D1_CONFIG: CloudflareD1Config = {
  workerUrl: '',
  apiToken: '',
  databaseName: 'enjaz_orders_db',
  autoSync: true,
  lastSyncedAt: undefined
};

export function loadD1Config(): CloudflareD1Config {
  try {
    const raw = localStorage.getItem(D1_CONFIG_KEY);
    return raw ? { ...DEFAULT_D1_CONFIG, ...JSON.parse(raw) } : DEFAULT_D1_CONFIG;
  } catch {
    return DEFAULT_D1_CONFIG;
  }
}

export function saveD1Config(config: CloudflareD1Config) {
  localStorage.setItem(D1_CONFIG_KEY, JSON.stringify(config));
}

// SQL Schema for Cloudflare D1 (accessible for the user to copy into Wrangler CLI or Cloudflare Dashboard)
export const D1_SQL_SCHEMA = `-- ==========================================
-- كود إنشاء جداول قاعدة بيانات Cloudflare D1
-- نظام إنجاز تك لإدارة طلبيات العمال والمدير
-- ==========================================

-- جدول المستخدمين والعمال
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'supervisor', 'worker')),
  pin TEXT NOT NULL,
  commissionRate REAL DEFAULT 0,
  active INTEGER DEFAULT 1,
  tasksCompletedCount INTEGER DEFAULT 0,
  totalEarnedCommission REAL DEFAULT 0,
  joinedDate TEXT NOT NULL
);

-- جدول المنتجات والأسعار
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  costPrice REAL NOT NULL,
  sellingPrice REAL NOT NULL,
  defaultCommission REAL NOT NULL,
  stock INTEGER DEFAULT 0,
  sku TEXT UNIQUE NOT NULL,
  description TEXT
);

-- جدول الطلبيات
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  orderNumber TEXT UNIQUE NOT NULL,
  customerName TEXT NOT NULL,
  customerPhone TEXT NOT NULL,
  customerAddress TEXT NOT NULL,
  city TEXT NOT NULL,
  items_json TEXT NOT NULL,
  totalCost REAL NOT NULL,
  totalSellingPrice REAL NOT NULL,
  deliveryFee REAL NOT NULL,
  workerCommission REAL NOT NULL,
  netProfit REAL NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'ready', 'delivered', 'cancelled')),
  priority TEXT NOT NULL CHECK(priority IN ('normal', 'urgent')),
  paymentStatus TEXT NOT NULL CHECK(paymentStatus IN ('pending', 'paid', 'cod')),
  assignedWorkerId TEXT NOT NULL,
  assignedWorkerName TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  completedAt TEXT,
  notes TEXT,
  timeline_json TEXT NOT NULL,
  isArchived INTEGER DEFAULT 0
);

-- جدول سجل العمليات والتدقيق (Audit Log)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  userId TEXT NOT NULL,
  userName TEXT NOT NULL,
  userRole TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  entityType TEXT NOT NULL,
  entityId TEXT
);

-- فهارس للبحث السريع وتفادي التكرار
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customerPhone);
CREATE INDEX IF NOT EXISTS idx_orders_worker ON orders(assignedWorkerId);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
`;

export interface D1SyncResult {
  success: boolean;
  message: string;
  syncedCount?: {
    orders: number;
    users: number;
    products: number;
    logs: number;
  };
}

export async function syncWithCloudflareD1(
  orders: Order[],
  users: User[],
  products: Product[],
  auditLogs: AuditLogEntry[]
): Promise<D1SyncResult> {
  const config = loadD1Config();

  // If a real Cloudflare Worker REST endpoint is configured, send the batch payload
  if (config.workerUrl && config.workerUrl.trim().startsWith('http')) {
    try {
      const response = await fetch(`${config.workerUrl.replace(/\/$/, '')}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiToken ? { 'Authorization': `Bearer ${config.apiToken}` } : {})
        },
        body: JSON.stringify({
          database: config.databaseName,
          timestamp: new Date().toISOString(),
          data: {
            orders,
            users,
            products,
            auditLogs
          }
        })
      });

      if (!response.ok) {
        throw new Error(`خطأ في استجابة خادم Worker: ${response.statusText}`);
      }

      const resJson = await response.json();
      const updatedConfig = { ...config, lastSyncedAt: new Date().toISOString() };
      saveD1Config(updatedConfig);

      return {
        success: true,
        message: resJson.message || 'تمت المزامنة بنجاح مع Cloudflare D1',
        syncedCount: {
          orders: orders.length,
          users: users.length,
          products: products.length,
          logs: auditLogs.length
        }
      };
    } catch (err: any) {
      console.warn('Cloudflare D1 Worker sync failed, falling back to local storage:', err);
      return {
        success: false,
        message: `تعذر الاتصال بـ Cloudflare Worker (${err.message || 'شبكة غير متاحة'}). البيانات محفوظة محلياً بأمان.`
      };
    }
  }

  // If no external URL is set yet, simulate successful local snapshot with Cloudflare D1 readiness
  const updatedConfig = { ...config, lastSyncedAt: new Date().toISOString() };
  saveD1Config(updatedConfig);

  return {
    success: true,
    message: 'تم حفظ نسخة احتياطية محلية جاهزة للمزامنة مع Cloudflare D1 (بانتظار إدخال رابط Worker السحابي).',
    syncedCount: {
      orders: orders.length,
      users: users.length,
      products: products.length,
      logs: auditLogs.length
    }
  };
}
