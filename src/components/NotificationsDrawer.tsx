import React from 'react';
import { X, CheckCheck, Bell, Volume2, Sparkles, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { SystemNotification } from '../types';
import { soundManager } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
  onMarkAllAsRead: () => void;
  onSelectOrder?: (orderId: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onSelectOrder
}) => {
  if (!isOpen) return null;

  const handleTestSound = () => {
    triggerHaptic('medium');
    soundManager.playNewOrderChime();
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'order_new':
        return <ShoppingBag className="w-4 h-4 text-blue-600" />;
      case 'status_change':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'financial':
        return <CheckCheck className="w-4 h-4 text-green-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden notifications-drawer">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
        onClick={() => {
          triggerHaptic('light');
          onClose();
        }}
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pl-0 pr-10 sm:pr-0">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-r border-slate-200">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-900 text-white rounded-sm">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">مركز التنبيهات الفورية</h2>
                <p className="text-xs text-slate-500">إشعارات الطلبيات والتحديثات المباشرة</p>
              </div>
            </div>

            <button 
              id="btn-close-notifications"
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition active:scale-90 touch-manipulation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Bar */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <button
              id="btn-mark-all-read"
              onClick={() => {
                triggerHaptic('selection');
                onMarkAllAsRead();
              }}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 py-1 active:scale-95 touch-manipulation"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>تحديد الكل كمقروء</span>
            </button>

            <button
              id="btn-test-chime"
              onClick={handleTestSound}
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1 py-1 px-2.5 rounded-md bg-white border border-slate-200 active:scale-95 touch-manipulation"
            >
              <Volume2 className="w-3.5 h-3.5 text-blue-600" />
              <span>اختبار النغمة</span>
            </button>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
            {notifications.length === 0 ? (
              <div className="text-center py-16 px-4 text-slate-400">
                <Bell className="w-10 h-10 mx-auto mb-3 stroke-1 text-slate-300" />
                <p className="font-bold text-slate-700 text-sm">لا توجد إشعارات جديدة حالياً</p>
                <p className="text-xs mt-1 text-slate-400">ستظهر هنا التنبيهات الفورية عند وصول أي طلبية أو تعديل حالتها</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  id={`notification-item-${notif.id}`}
                  className={`p-3 rounded-sm transition-all mb-1 ${
                    notif.read ? 'bg-white opacity-80 hover:bg-slate-50' : 'bg-blue-50/40 border border-blue-100 font-medium'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-sm bg-white border border-slate-200 shadow-2xs mt-0.5">
                      {getNotifIcon(notif.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{notif.title}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(notif.timestamp).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                      
                      {notif.orderId && onSelectOrder && (
                        <button
                          onClick={() => {
                            triggerHaptic('selection');
                            onSelectOrder(notif.orderId!);
                            onClose();
                          }}
                          className="mt-2 inline-flex items-center gap-1 text-[11px] text-blue-600 font-bold hover:underline active:scale-95 touch-manipulation"
                        >
                          <span>عرض الطلبية</span>
                          <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
            <span className="text-[11px] text-slate-400">
              يتم حفظ وتحديث الإشعارات فورياً مع التنبيه الصوتي
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
