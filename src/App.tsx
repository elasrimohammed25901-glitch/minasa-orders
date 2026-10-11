import React, { useState, useEffect } from 'react';
import { 
  loadStoredData, 
  saveOrders, 
  saveProducts, 
  saveUsers, 
  saveNotifications, 
  saveCleanupSettings,
  queueSyncAction, 
  clearSyncQueue,
  executeMaintenanceCleanup,
  getStoredAuthSession,
  saveAuthSession,
  clearAuthSession
} from './utils/storage';
import { soundManager } from './utils/audio';
import { printPage } from './utils/export';
import { CURRENCY } from './utils/currency';
import { 
  Order, 
  Product, 
  User, 
  SystemNotification, 
  CleanupSettings, 
  SyncState, 
  OrderStatus 
} from './types';

// Components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NavigationTabs, TabType } from './components/NavigationTabs';
import { DashboardView } from './components/DashboardView';
import { OrdersView } from './components/OrdersView';
import { ProductsView } from './components/ProductsView';
import { WorkersView } from './components/WorkersView';
import { FinancialReportsView } from './components/FinancialReportsView';
import { MaintenanceView } from './components/MaintenanceView';
import { AuditLogView } from './components/AuditLogView';
import { LoginPage } from './components/LoginPage';
import { DailyDigestModal } from './components/DailyDigestModal';
import { CloudflareD1Modal } from './components/CloudflareD1Modal';
import { CreateOrderModal } from './components/CreateOrderModal';
import { OrderDetailModal } from './components/OrderDetailModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { OrderPrintInvoice } from './components/OrderPrintInvoice';
import { PrintableSummaryReport } from './components/PrintableSummaryReport';
import { OzonDeliverySticker } from './components/OzonDeliverySticker';
import { OzonApiModal } from './components/OzonApiModal';
import { getOzonConfig } from './utils/ozonApi';

export default function App() {
  // Load persistent state from storage
  const initialData = loadStoredData();

  const [orders, setOrders] = useState<Order[]>(initialData.orders);
  const [products, setProducts] = useState<Product[]>(initialData.products);
  const [users, setUsers] = useState<User[]>(initialData.users);
  const [notifications, setNotifications] = useState<SystemNotification[]>(initialData.notifications);
  const [cleanupSettings, setCleanupSettings] = useState<CleanupSettings>(initialData.cleanupSettings);
  
  // Current active logged-in user:
  // Initialized to null to strictly ensure that the login screen is the first interface that appears
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Mobile sidebar drawer
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals and Drawers
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDailyDigestOpen, setIsDailyDigestOpen] = useState(false);
  const [isCloudflareD1Open, setIsCloudflareD1Open] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [isPrintSummaryActive, setIsPrintSummaryActive] = useState(false);
  const [isOzonSettingsOpen, setIsOzonSettingsOpen] = useState(false);
  const [ozonStickerOrder, setOzonStickerOrder] = useState<Order | null>(null);

  // Sound alert toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Instant Toast Alert Notification
  const [activeToast, setActiveToast] = useState<{ title: string; message: string } | null>(null);

  // Cloud Sync & Offline State
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    lastSyncTime: initialData.lastSyncTime,
    pendingSyncCount: initialData.syncQueue.length
  });

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setSyncState(prev => ({ ...prev, isOnline: true }));
      triggerCloudSync();
    };

    const handleOffline = () => {
      setSyncState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync sound manager toggle
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.soundEnabled = next;
  };

  // Cloud Sync Function
  const triggerCloudSync = () => {
    setSyncState(prev => ({ ...prev, isSyncing: true }));
    setTimeout(() => {
      const now = clearSyncQueue();
      setSyncState({
        isOnline: navigator.onLine,
        isSyncing: false,
        lastSyncTime: now,
        pendingSyncCount: 0
      });
    }, 900);
  };

  // Helper to show instant toast notification & audio chime
  const notify = (title: string, message: string, type: SystemNotification['type'], orderId?: string) => {
    if (type === 'order_new') {
      soundManager.playNewOrderChime();
    } else if (type === 'status_change') {
      soundManager.playStatusUpdateChime();
    } else {
      soundManager.playNotificationChime();
    }

    const newNotif: SystemNotification = {
      id: `notif_${Date.now()}`,
      title,
      message,
      timestamp: new Date().toISOString(),
      type,
      orderId,
      read: false
    };

    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    saveNotifications(updatedNotifs);

    // Show popup toast
    setActiveToast({ title, message });
    setTimeout(() => setActiveToast(null), 4500);

    // Queue sync action
    queueSyncAction(`إشعار جديد: ${title}`);
    setSyncState(prev => ({ ...prev, pendingSyncCount: prev.pendingSyncCount + 1 }));
  };

  // Order Operations
  const handleCreateOrder = (newOrderData: Partial<Order>) => {
    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber: newOrderData.orderNumber || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: newOrderData.customerName || '',
      customerPhone: newOrderData.customerPhone || '',
      customerAddress: newOrderData.customerAddress || '',
      city: newOrderData.city || 'الدار البيضاء',
      items: newOrderData.items || [],
      totalCost: newOrderData.totalCost || 0,
      totalSellingPrice: newOrderData.totalSellingPrice || 0,
      deliveryFee: newOrderData.deliveryFee || 20,
      workerCommission: newOrderData.workerCommission || 0,
      netProfit: newOrderData.netProfit || 0,
      priority: newOrderData.priority || 'normal',
      paymentStatus: newOrderData.paymentStatus || 'cod',
      assignedWorkerId: newOrderData.assignedWorkerId || '',
      assignedWorkerName: newOrderData.assignedWorkerName || 'غير محدد',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: newOrderData.notes || '',
      ozonTrackingNumber: newOrderData.ozonTrackingNumber,
      ozonBarcode: newOrderData.ozonBarcode,
      ozonStatus: newOrderData.ozonStatus,
      ozonRegisteredAt: newOrderData.ozonRegisteredAt,
      ozonCityId: newOrderData.ozonCityId,
      ozonCityRef: newOrderData.ozonCityRef,
      timeline: [
        {
          status: 'pending',
          timestamp: new Date().toISOString(),
          updatedBy: currentUser ? currentUser.name : 'مستخدم النظام',
          note: newOrderData.ozonTrackingNumber 
            ? `تسجيل الطلبية وتكليف المندوب + الربط الفوري بشركة Ozon Express (${newOrderData.ozonTrackingNumber})`
            : 'تسجيل الطلبية وتكليف المندوب'
        }
      ]
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    saveOrders(updatedOrders);

    if (newOrder.ozonTrackingNumber) {
      notify(
        `وصلت طلبية مسجلة في Ozon: ${newOrder.orderNumber}`,
        `تم تسجيل الطلبية باسم ${newOrder.customerName} وتوليد بوليصة Ozon Express رقم: ${newOrder.ozonTrackingNumber}`,
        'order_new',
        newOrder.id
      );
      // Auto open delivery sticker print modal if enabled
      const ozonConfig = getOzonConfig();
      if (ozonConfig.autoOpenStickerOnCreate) {
        setOzonStickerOrder(newOrder);
      }
    } else {
      notify(
        `وصلت طلبية جديدة: ${newOrder.orderNumber}`,
        `تم تسجيل الطلبية باسم ${newOrder.customerName} بقيمة ${newOrder.totalSellingPrice.toLocaleString()} ${CURRENCY} وإسنادها إلى ${newOrder.assignedWorkerName}`,
        'order_new',
        newOrder.id
      );
    }
  };

  const handleUpdateOrderOzon = (orderId: string, trackingNumber: string, barcode: string) => {
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        const now = new Date().toISOString();
        return {
          ...order,
          ozonTrackingNumber: trackingNumber,
          ozonBarcode: barcode,
          ozonStatus: 'registered' as const,
          ozonRegisteredAt: now,
          updatedAt: now,
          timeline: [
            ...order.timeline,
            {
              status: order.status,
              timestamp: now,
              updatedBy: currentUser ? currentUser.name : 'النظام',
              note: `تم ربط الشحنة بشركة Ozon Express برقم التتبع ${trackingNumber}`
            }
          ]
        };
      }
      return order;
    });

    setOrders(updatedOrders);
    saveOrders(updatedOrders);
    notify('تم الربط بـ Ozon Express', `تم تسجيل الشحنة بنجاح برقم: ${trackingNumber}`, 'status_change', orderId);
  };

  const handleUpdateOrderStatus = (orderId: string, nextStatus: OrderStatus, note?: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    let statusLabel = 'قيد التجهيز';
    if (nextStatus === 'ready') statusLabel = 'جاهز وفي طريق التوصيل';
    else if (nextStatus === 'delivered') statusLabel = 'تم التسليم بنجاح';
    else if (nextStatus === 'cancelled') statusLabel = 'ملغي';

    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
          completedAt: nextStatus === 'delivered' ? new Date().toISOString() : order.completedAt,
          timeline: [
            ...order.timeline,
            {
              status: nextStatus,
              timestamp: new Date().toISOString(),
              updatedBy: currentUser.name,
              note: note || `تحديث الحالة إلى: ${statusLabel}`
            }
          ]
        };
      }
      return order;
    });

    setOrders(updatedOrders);
    saveOrders(updatedOrders);

    notify(
      `تحديث حالة الطلب: ${targetOrder.orderNumber}`,
      `تم تغيير حالة طلبية ${targetOrder.customerName} إلى (${statusLabel}) بواسطة ${currentUser.name}`,
      'status_change',
      orderId
    );
  };

  const handleReassignWorker = (orderId: string, newWorkerId: string) => {
    const worker = users.find(u => u.id === newWorkerId);
    if (!worker) return;

    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          assignedWorkerId: worker.id,
          assignedWorkerName: worker.name,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...order.timeline,
            {
              status: order.status,
              timestamp: new Date().toISOString(),
              updatedBy: currentUser.name,
              note: `إعادة إسناد الطلبية إلى المندوب: ${worker.name}`
            }
          ]
        };
      }
      return order;
    });

    setOrders(updatedOrders);
    saveOrders(updatedOrders);

    notify(
      'إعادة إسناد طلبية',
      `تم إسناد الطلبية للمندوب ${worker.name}`,
      'worker_assigned',
      orderId
    );
  };

  // Product Operations
  const handleAddProduct = (prodData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...prodData,
      id: `prod_${Date.now()}`
    };
    const updated = [newProd, ...products];
    setProducts(updated);
    saveProducts(updated);
    queueSyncAction(`إضافة منتج: ${newProd.name}`);
  };

  const handleUpdateProduct = (prod: Product) => {
    const updated = products.map(p => p.id === prod.id ? prod : p);
    setProducts(updated);
    saveProducts(updated);
    queueSyncAction(`تعديل منتج: ${prod.name}`);
  };

  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter(p => p.id !== productId);
    setProducts(updated);
    saveProducts(updated);
    queueSyncAction(`حذف منتج ${productId}`);
  };

  // User Operations
  const handleAddUser = (userData: Omit<User, 'id' | 'tasksCompletedCount' | 'totalEarnedCommission' | 'joinedDate'>) => {
    const newUser: User = {
      ...userData,
      id: `usr_${Date.now()}`,
      tasksCompletedCount: 0,
      totalEarnedCommission: 0,
      joinedDate: new Date().toISOString().split('T')[0]
    };
    const updated = [...users, newUser];
    setUsers(updated);
    saveUsers(updated);
    queueSyncAction(`إضافة مستخدم جديد: ${newUser.name}`);
  };

  const handleUpdateUser = (updatedUser: User) => {
    const updated = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updated);
    saveUsers(updated);
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      saveAuthSession(updatedUser);
    }
    queueSyncAction(`تعديل مستخدم: ${updatedUser.name}`);
  };

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
  };

  // Periodic Maintenance Cleanup
  const handleExecuteCleanup = () => {
    const result = executeMaintenanceCleanup(orders, notifications, cleanupSettings);
    setOrders(result.updatedOrders);
    setNotifications(result.updatedNotifications);
    setCleanupSettings(result.newSettings);

    notify(
      'اكتمل التنظيف الدوري للمنظومة',
      `تمت أرشفة ${result.archivedCount} طلبية مكتملة ومسح ${result.clearedNotifsCount} إشعار قديم بنجاح`,
      'system_cleanup'
    );
  };

  const handleUpdateCleanupSettings = (newSettings: CleanupSettings) => {
    setCleanupSettings(newSettings);
    saveCleanupSettings(newSettings);
  };

  // Print invoice for a specific order
  const handlePrintOrderInvoice = (order: Order) => {
    setOrderToPrint(order);
    setIsPrintSummaryActive(false);
    setTimeout(() => {
      printPage();
    }, 150);
  };

  // Print general summary report
  const handlePrintGeneralReport = () => {
    setOrderToPrint(null);
    setIsPrintSummaryActive(true);
    setTimeout(() => {
      printPage();
    }, 150);
  };

  // Switch immediately to admin user
  const handleSwitchToAdmin = () => {
    const adminUser = users.find(u => u.role === 'admin') || users[0];
    if (adminUser) {
      setCurrentUser(adminUser);
      saveAuthSession(adminUser);
      notify('تم تسجيل الدخول كمدير النظام', `أهلاً بك ${adminUser.name}، تم تفعيل كامل صلاحيات الإدارة`, 'system_cleanup');
    }
  };

  // Login Gate: If no user is authenticated, display the login screen
  if (!currentUser) {
    return (
      <LoginPage 
        allUsers={users}
        users={users} 
        onLogin={(user) => {
          setCurrentUser(user);
          saveAuthSession(user);
          notify('تم تسجيل الدخول بنجاح', `مرحباً بك مجدداً ${user.name}`, 'system_cleanup');
        }}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          saveAuthSession(user);
          notify('تم تسجيل الدخول بنجاح', `مرحباً بك مجدداً ${user.name}`, 'system_cleanup');
        }} 
      />
    );
  }

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || null;

  const pendingOrdersCount = currentUser.role === 'worker'
    ? orders.filter(o => o.assignedWorkerId === currentUser.id && o.status === 'pending' && !o.isArchived).length
    : orders.filter(o => o.status === 'pending' && !o.isArchived).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-['Tajawal',Arial,sans-serif] antialiased" dir="rtl">
      
      {/* Fixed Printable Views for PDF / Print Output */}
      {orderToPrint && <OrderPrintInvoice order={orderToPrint} />}
      {isPrintSummaryActive && <PrintableSummaryReport orders={orders} workers={users} />}

      {/* Geometric Balance Sidebar (Desktop fixed/sticky, Mobile drawer) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        allUsers={users}
        onSwitchUser={(user) => {
          setCurrentUser(user);
          saveAuthSession(user);
          if (user.role === 'worker' && (activeTab === 'products' || activeTab === 'workers' || activeTab === 'maintenance' || activeTab === 'audit')) {
            setActiveTab('dashboard');
          }
        }}
        pendingOrdersCount={pendingOrdersCount}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onLogout={handleLogout}
        onOpenOzonSettings={() => setIsOzonSettingsOpen(true)}
      />

      {/* Screen Main Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto no-print">
        
        {/* Top Header */}
        <Header 
          currentUser={currentUser}
          activeTab={activeTab}
          syncState={syncState}
          onManualSync={triggerCloudSync}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          notifications={notifications}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenNewOrder={() => setIsCreateOrderOpen(true)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenDailyDigest={() => setIsDailyDigestOpen(true)}
          onOpenCloudflareD1={() => setIsCloudflareD1Open(true)}
          onLogout={handleLogout}
          onSwitchToAdmin={handleSwitchToAdmin}
          onOpenOzonSettings={() => setIsOzonSettingsOpen(true)}
        />

        {/* Mobile Navigation Tabs (visible only on screens < lg) */}
        <NavigationTabs 
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          userRole={currentUser.role}
          pendingOrdersCount={pendingOrdersCount}
        />

        {/* Main Content View Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {activeTab === 'dashboard' && (
            <DashboardView 
              orders={orders}
              workers={users}
              products={products}
              currentUser={currentUser}
              onOpenNewOrder={() => setIsCreateOrderOpen(true)}
              onSelectTab={setActiveTab}
              onSelectOrder={(id) => setSelectedOrderId(id)}
              onPrintReport={handlePrintGeneralReport}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersView 
              orders={orders}
              workers={users}
              products={products}
              currentUser={currentUser}
              onOpenNewOrder={() => setIsCreateOrderOpen(true)}
              onSelectOrder={(id) => setSelectedOrderId(id)}
              onUpdateStatus={handleUpdateOrderStatus}
              onPrintReport={handlePrintGeneralReport}
              onOpenOzonSticker={(order) => setOzonStickerOrder(order)}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView 
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === 'workers' && (
            <WorkersView 
              users={users}
              orders={orders}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
            />
          )}

          {activeTab === 'reports' && (
            <FinancialReportsView 
              orders={orders}
              workers={users}
              onPrintReport={handlePrintGeneralReport}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceView 
              settings={cleanupSettings}
              orders={orders}
              notifications={notifications}
              onExecuteCleanup={handleExecuteCleanup}
              onUpdateSettings={handleUpdateCleanupSettings}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogView 
              currentUser={currentUser}
              workers={users}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>منظومة إنجاز تك © {new Date().getFullYear()} - منصة إدارة طلبيات العمال وتتبع الإنجاز لحظياً</p>
            <p className="text-slate-400 text-[11px]">
              دعم العمل دون اتصال بالإنترنت • مزامنة سحابية مستمرة • تصدير إكسل وPDF
            </p>
          </div>
        </footer>

      </div>

      {/* Instant Floating Toast Notification Banner */}
      {activeToast && (
        <div 
          id="system-instant-toast"
          className="fixed bottom-5 left-5 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1.5 animate-ping" />
          <div className="flex-1 text-right">
            <h4 className="text-xs font-black text-emerald-300">{activeToast.title}</h4>
            <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{activeToast.message}</p>
          </div>
          <button 
            onClick={() => setActiveToast(null)}
            className="text-slate-400 hover:text-white text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modals & Drawers */}
      <CreateOrderModal 
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        products={products}
        workers={users.filter(u => u.role === 'worker' || u.role === 'supervisor')}
        onCreateOrder={handleCreateOrder}
      />

      <OrderDetailModal 
        isOpen={!!selectedOrderId}
        order={selectedOrder}
        onClose={() => setSelectedOrderId(null)}
        currentUser={currentUser}
        workers={users.filter(u => u.role === 'worker' || u.role === 'supervisor')}
        onUpdateStatus={handleUpdateOrderStatus}
        onReassignWorker={handleReassignWorker}
        onPrintInvoice={handlePrintOrderInvoice}
        onUpdateOrderOzon={handleUpdateOrderOzon}
        onOpenOzonSticker={(order) => setOzonStickerOrder(order)}
      />

      <NotificationsDrawer 
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => {
          const updated = notifications.map(n => ({ ...n, read: true }));
          setNotifications(updated);
          saveNotifications(updated);
        }}
        onSelectOrder={(id) => {
          setSelectedOrderId(id);
        }}
      />

      {isDailyDigestOpen && (
        <DailyDigestModal 
          isOpen={isDailyDigestOpen}
          onClose={() => setIsDailyDigestOpen(false)}
          orders={orders}
          workers={users}
          onSelectOrder={(id) => {
            setIsDailyDigestOpen(false);
            setSelectedOrderId(id);
          }}
        />
      )}

      {isCloudflareD1Open && (
        <CloudflareD1Modal 
          isOpen={isCloudflareD1Open}
          onClose={() => setIsCloudflareD1Open(false)}
          orders={orders}
          products={products}
          users={users}
          onSyncComplete={(msg) => {
            notify('تمت المزامنة مع Cloudflare D1', msg, 'system_cleanup');
          }}
        />
      )}

      {/* Ozon Express Delivery Sticker Print Modal */}
      {ozonStickerOrder && (
        <OzonDeliverySticker
          isOpen={!!ozonStickerOrder}
          onClose={() => setOzonStickerOrder(null)}
          order={ozonStickerOrder}
        />
      )}

      {/* Ozon Express API Settings Modal */}
      {isOzonSettingsOpen && (
        <OzonApiModal
          isOpen={isOzonSettingsOpen}
          onClose={() => setIsOzonSettingsOpen(false)}
        />
      )}

    </div>
  );
}
