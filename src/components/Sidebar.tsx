import React, { useState } from 'react';
import { 
  X, 
  ChevronDown,
  Shield,
  Briefcase,
  Truck,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { User, UserRole } from '../types';
import { TabType } from './NavigationTabs';
import { triggerHaptic } from '../utils/haptics';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (user: User) => void;
  pendingOrdersCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onLogout?: () => void;
  onOpenOzonSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  allUsers,
  onSwitchUser,
  pendingOrdersCount,
  isOpenMobile,
  onCloseMobile,
  onLogout,
  onOpenOzonSettings
}) => {
  const [showSwitchDropdown, setShowSwitchDropdown] = useState(false);

  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'لوحة التحكم الإحصائية',
      allowedRoles: ['admin', 'acting_admin', 'supervisor', 'worker']
    },
    {
      id: 'orders' as TabType,
      label: 'إدارة الطلبيات',
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      allowedRoles: ['admin', 'acting_admin', 'supervisor', 'worker']
    },
    {
      id: 'workers' as TabType,
      label: 'فريق العمل والصلاحيات',
      allowedRoles: ['admin', 'acting_admin', 'supervisor']
    },
    {
      id: 'products' as TabType,
      label: 'المنتجات والأسعار',
      allowedRoles: ['admin', 'acting_admin', 'supervisor']
    },
    {
      id: 'reports' as TabType,
      label: 'التقارير الدورية (PDF)',
      allowedRoles: ['admin', 'acting_admin', 'supervisor']
    },
    {
      id: 'maintenance' as TabType,
      label: 'الصيانة والجدول الدوري',
      allowedRoles: ['admin', 'acting_admin']
    },
    {
      id: 'audit' as TabType,
      label: 'سجل العمليات والرقابة',
      allowedRoles: ['admin', 'acting_admin', 'supervisor']
    }
  ];

  const visibleItems = navItems.filter(item => item.allowedRoles.includes(currentUser.role));

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'مدير النظام (الرئيسي)';
      case 'acting_admin':
        return 'مدير مؤقت (ممثل المدير)';
      case 'supervisor':
        return 'مشرف ذو امتيازات';
      default:
        return 'عامل (تسجيل طلبيات)';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return Shield;
      case 'acting_admin':
        return ShieldCheck;
      case 'supervisor':
        return Briefcase;
      default:
        return Truck;
    }
  };

  const initials = currentUser.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0])
    .join('. ');

  const RoleIcon = getRoleIcon(currentUser.role);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => {
            triggerHaptic('light');
            onCloseMobile();
          }}
        />
      )}

      {/* Aside Container */}
      <aside 
        className={`fixed lg:sticky top-0 right-0 h-screen w-64 bg-slate-900 text-white flex flex-col z-50 transition-transform duration-200 ease-in-out border-l border-slate-800 ${
          isOpenMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
        dir="rtl"
      >
        {/* Brand Header */}
        <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-8 h-8 bg-blue-500 rounded-sm rotate-45 flex items-center justify-center shadow-sm shrink-0">
              <div className="w-3 h-3 bg-white rounded-xs -rotate-45" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">إنجاز تك</span>
              <span className="text-[10px] text-slate-400 block tracking-wider uppercase">منظومة الطلبيات الذكية</span>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onCloseMobile();
            }}
            className="p-1 rounded text-slate-400 hover:text-white lg:hidden active:scale-90"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-4 space-y-2 text-sm overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-md transition-colors text-right touch-manipulation active:scale-98 ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span 
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isActive ? 'bg-white' : 'bg-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                    isActive ? 'bg-white text-blue-700' : 'bg-red-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Ozon Express Integration Quick Badge & Launcher */}
        {onOpenOzonSettings && (currentUser.role === 'admin' || currentUser.role === 'acting_admin' || currentUser.role === 'supervisor') && (
          <div className="px-4 pb-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onOpenOzonSettings();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-r from-blue-900/40 to-slate-800 border border-blue-500/30 text-xs text-blue-200 hover:bg-blue-900/60 transition group text-right"
              title="إعدادات Ozon Express API وطباعة الملصقات"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                  OZ
                </div>
                <div>
                  <span className="font-bold text-white block text-[11px] leading-tight">Ozon Express API</span>
                  <span className="text-[9px] text-blue-300">متصل • إرسال وملصقات</span>
                </div>
              </div>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30 font-medium">
                إعدادات
              </span>
            </button>
          </div>
        )}

        {/* User Card at Footer */}
        <div className="p-4 border-t border-slate-800 relative">
          <div 
            onClick={() => {
              triggerHaptic('light');
              setShowSwitchDropdown(!showSwitchDropdown);
            }}
            className="flex items-center justify-between bg-slate-800 hover:bg-slate-750 p-3 rounded-lg cursor-pointer transition border border-slate-700/50 active:scale-98 touch-manipulation"
            title="انقر لتبديل الحساب أو تغيير الصلاحيات"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                {initials || currentUser.name.charAt(0)}
              </div>
              <div className="text-right overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <RoleIcon className="w-3 h-3 text-slate-400" />
                  <p className="text-[10px] text-slate-400 truncate">{getRoleLabel(currentUser.role)}</p>
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>

          {/* Quick Switch Dropdown */}
          {showSwitchDropdown && (
            <div className="absolute bottom-20 right-4 left-4 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1.5 border-b border-slate-700 mb-1">
                <span className="text-[10px] text-slate-400 font-bold block">تبديل الحساب (الصلاحيات):</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {allUsers.map((user) => {
                  const isSelected = user.id === currentUser.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        triggerHaptic('medium');
                        onSwitchUser(user);
                        setShowSwitchDropdown(false);
                      }}
                      className={`w-full text-right p-2 rounded flex items-center justify-between transition active:scale-95 touch-manipulation ${
                        isSelected 
                          ? 'bg-blue-600 text-white font-bold' 
                          : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <div className="truncate">
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-[10px] opacity-70">{user.phone}</p>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900/60">
                        {getRoleLabel(user.role)}
                      </span>
                    </button>
                  );
                })}
              </div>
              {onLogout && (
                <div className="pt-2 mt-2 border-t border-slate-700">
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      setShowSwitchDropdown(false);
                      onLogout();
                    }}
                    className="w-full text-right p-2 rounded flex items-center justify-between text-red-400 hover:bg-red-500/10 transition"
                  >
                    <span className="font-bold text-xs">تسجيل الخروج من المنصة</span>
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
