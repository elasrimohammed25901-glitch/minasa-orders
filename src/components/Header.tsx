import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Menu,
  Plus,
  Smartphone,
  Sunrise,
  Cloud,
  LogOut,
  Shield
} from 'lucide-react';
import { User, SyncState, SystemNotification } from '../types';
import { TabType } from './NavigationTabs';
import { triggerHaptic, haptics } from '../utils/haptics';

interface HeaderProps {
  currentUser: User;
  activeTab: TabType;
  syncState: SyncState;
  onManualSync: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  notifications: SystemNotification[];
  onOpenNotifications: () => void;
  onOpenNewOrder: () => void;
  onOpenMobileSidebar?: () => void;
  onOpenDailyDigest?: () => void;
  onOpenCloudflareD1?: () => void;
  onLogout?: () => void;
  onSwitchToAdmin?: () => void;
  onOpenOzonSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  syncState,
  onManualSync,
  soundEnabled,
  onToggleSound,
  notifications,
  onOpenNotifications,
  onOpenNewOrder,
  onOpenMobileSidebar,
  onOpenDailyDigest,
  onOpenCloudflareD1,
  onLogout,
  onSwitchToAdmin,
  onOpenOzonSettings
}) => {
  const [hapticActive, setHapticActive] = useState(haptics.isEnabled());
  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const getTabTitle = (tab: TabType) => {
    switch (tab) {
      case 'dashboard':
        return 'نظرة عامة على الأداء';
      case 'orders':
        return 'سجل وإدارة الطلبيات الحية';
      case 'workers':
        return 'فريق العمل ونظام الصلاحيات';
      case 'products':
        return 'كتالوج المنتجات والأسعار';
      case 'reports':
        return 'التقارير المالية وحساب الأرباح';
      case 'maintenance':
        return 'جدول الصيانة والتنظيف الدوري';
      default:
        return 'إنجاز تك';
    }
  };

  const handleToggleHaptic = () => {
    const next = haptics.toggle();
    setHapticActive(next);
  };

  return (
    <header className="h-16 sm:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 no-print sticky top-0 z-30">
      
      {/* Right Side (in RTL): Title & Online Status */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Mobile menu trigger */}
        {onOpenMobileSidebar && (
          <button
            onClick={() => {
              triggerHaptic('medium');
              onOpenMobileSidebar();
            }}
            className="p-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 lg:hidden active:scale-95 transition-transform touch-manipulation"
            aria-label="فتح القائمة الرئيسية"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <h1 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight">
          {getTabTitle(activeTab)}
        </h1>

        {/* Online / Cloud Sync Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-medium">
          <span className={`w-2 h-2 rounded-full ${syncState.isOnline ? 'bg-green-500' : 'bg-amber-500'}`} />
          <span>
            {syncState.isOnline 
              ? (syncState.pendingSyncCount > 0 ? `متصل (${syncState.pendingSyncCount} معلق)` : 'متصل بالإنترنت')
              : 'وضع أوفلاين'}
          </span>
          <button
            id="btn-sync-cloud-head"
            onClick={() => {
              triggerHaptic('selection');
              onManualSync();
            }}
            disabled={syncState.isSyncing}
            title="مزامنة فورية"
            className="p-0.5 hover:text-green-900 rounded transition active:scale-90"
          >
            <RefreshCw className={`w-3 h-3 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Left Side (in RTL): Actions, Alerts, Haptic Feedback & New Order */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        
        {/* Haptic feedback simulation toggle (vital for field work) */}
        <button
          id="btn-toggle-haptic"
          onClick={handleToggleHaptic}
          title={hapticActive ? 'رد الفعل اللمسي والاهتزاز مفعل (انقر للتعطيل أو الاختبار)' : 'تفعيل رد الفعل اللمسي الميداني'}
          className={`px-2.5 py-1.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 touch-manipulation ${
            hapticActive
              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 shadow-2xs'
              : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
          }`}
        >
          <Smartphone className={`w-3.5 h-3.5 ${hapticActive ? 'text-blue-600 animate-pulse' : ''}`} />
          <span className="hidden md:inline">{hapticActive ? 'اهتزاز ميداني: نعم' : 'اهتزاز: معطل'}</span>
        </button>

        {/* Sound toggle button */}
        <button
          id="btn-toggle-sound"
          onClick={() => {
            triggerHaptic('light');
            onToggleSound();
          }}
          title={soundEnabled ? 'كتم الإشعارات الصوتية' : 'تفعيل الإشعارات الصوتية'}
          className={`p-2 rounded-md border text-sm transition-all active:scale-95 touch-manipulation ${
            soundEnabled 
              ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' 
              : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Notifications badge button */}
        <button
          id="btn-notifications-drawer"
          onClick={() => {
            triggerHaptic('medium');
            onOpenNotifications();
          }}
          className="relative px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-700 text-xs sm:text-sm font-medium border border-slate-200 transition-all active:scale-95 touch-manipulation flex items-center gap-1.5"
          title="التنبيهات والإشعارات"
        >
          {unreadNotifsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse" />
          )}
          <span>{unreadNotifsCount > 0 ? `${unreadNotifsCount} إشعار` : 'الإشعارات'}</span>
        </button>

        {/* Daily Digest Modal Trigger (Admin & Acting Admin) */}
        {(currentUser.role === 'admin' || currentUser.role === 'acting_admin') && onOpenDailyDigest && (
          <button
            id="btn-open-daily-digest"
            onClick={() => {
              triggerHaptic('medium');
              onOpenDailyDigest();
            }}
            title="ملخص الصباح الذكي وتوزيع المهام"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-md text-xs font-bold transition active:scale-95 touch-manipulation shadow-2xs"
          >
            <Sunrise className="w-4 h-4 text-amber-600" />
            <span className="hidden md:inline">ملخص الصباح ☀️</span>
          </button>
        )}

        {/* Ozon Express API Connector Trigger */}
        {(currentUser.role === 'admin' || currentUser.role === 'acting_admin' || currentUser.role === 'supervisor') && onOpenOzonSettings && (
          <button
            id="btn-open-ozon-header"
            onClick={() => {
              triggerHaptic('medium');
              onOpenOzonSettings();
            }}
            title="إعدادات شركة التوصيل Ozon Express والربط التلقائي بـ API"
            className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 rounded-md text-xs font-bold transition active:scale-95 touch-manipulation shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Ozon Express 🚚</span>
          </button>
        )}

        {/* Cloudflare D1 Trigger (Admin & Acting Admin) */}
        {(currentUser.role === 'admin' || currentUser.role === 'acting_admin') && onOpenCloudflareD1 && (
          <button
            id="btn-open-cloudflare-d1"
            onClick={() => {
              triggerHaptic('medium');
              onOpenCloudflareD1();
            }}
            title="إعداد ومزامنة سحابة Cloudflare D1"
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100 rounded-md text-xs font-bold transition active:scale-95 touch-manipulation shadow-2xs"
          >
            <Cloud className="w-4 h-4 text-orange-600" />
            <span>سحابة D1 ☁️</span>
          </button>
        )}

        {/* Quick New Order button (Open to all including workers who register orders) */}
        <button
          id="btn-quick-new-order"
          onClick={() => {
            triggerHaptic('heavy');
            onOpenNewOrder();
          }}
          className="px-3 sm:px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 touch-manipulation flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>طلب جديد +</span>
        </button>

        {/* Switch to Admin (if not admin) */}
        {currentUser.role !== 'admin' && currentUser.role !== 'acting_admin' && onSwitchToAdmin && (
          <button
            id="btn-header-switch-admin"
            onClick={() => {
              triggerHaptic('medium');
              onSwitchToAdmin();
            }}
            title="التبديل الفوري لحساب مدير النظام (كمال بن عمامو)"
            className="px-2.5 sm:px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs font-bold transition active:scale-95 touch-manipulation flex items-center gap-1.5 shadow-2xs"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">دخول كمدير 👑</span>
            <span className="sm:hidden">مدير 👑</span>
          </button>
        )}

        {/* Logout button */}
        {onLogout && (
          <button
            id="btn-header-logout"
            onClick={() => {
              triggerHaptic('medium');
              onLogout();
            }}
            title="تسجيل الخروج من الحساب"
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md border border-slate-200 transition active:scale-90 touch-manipulation"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}

      </div>

    </header>
  );
};
