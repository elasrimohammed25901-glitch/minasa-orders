import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Tags, 
  TrendingUp, 
  CalendarClock,
  ShieldCheck
} from 'lucide-react';
import { UserRole } from '../types';
import { triggerHaptic } from '../utils/haptics';

export type TabType = 'dashboard' | 'orders' | 'workers' | 'products' | 'reports' | 'maintenance' | 'audit';

interface NavigationTabsProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  userRole: UserRole;
  pendingOrdersCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  pendingOrdersCount
}) => {
  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'لوحة التحكم',
      icon: LayoutDashboard,
      allowedRoles: ['admin', 'acting_admin', 'supervisor', 'worker']
    },
    {
      id: 'orders' as TabType,
      label: 'الطلبيات',
      icon: Package,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      allowedRoles: ['admin', 'acting_admin', 'supervisor', 'worker']
    },
    {
      id: 'products' as TabType,
      label: 'المنتجات',
      icon: Tags,
      allowedRoles: ['admin', 'acting_admin', 'supervisor']
    },
    {
      id: 'workers' as TabType,
      label: 'فريق العمل',
      icon: Users,
      allowedRoles: ['admin', 'acting_admin', 'supervisor']
    },
    {
      id: 'reports' as TabType,
      label: 'التقارير (PDF)',
      icon: TrendingUp,
      allowedRoles: ['admin', 'acting_admin', 'supervisor']
    },
    {
      id: 'maintenance' as TabType,
      label: 'الصيانة الدورية',
      icon: CalendarClock,
      allowedRoles: ['admin', 'acting_admin']
    },
    {
      id: 'audit' as TabType,
      label: 'سجل الرقابة (Audit)',
      icon: ShieldCheck,
      allowedRoles: ['admin', 'acting_admin', 'supervisor']
    }
  ];

  const visibleTabs = tabs.filter(t => t.allowedRoles.includes(userRole));

  const handleTabClick = (tabId: TabType) => {
    triggerHaptic('selection');
    onSelectTab(tabId);
  };

  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 no-print lg:hidden">
      <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`mobile-tab-${tab.id}`}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md font-bold text-xs whitespace-nowrap transition-all duration-75 select-none touch-manipulation active:scale-[0.96] active:brightness-90 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  isActive ? 'bg-white text-blue-700' : 'bg-red-500 text-white'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
