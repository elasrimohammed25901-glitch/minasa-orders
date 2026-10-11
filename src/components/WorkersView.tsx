import React, { useState } from 'react';
import { 
  Users, 
  Shield, 
  Briefcase, 
  Truck, 
  UserPlus, 
  Edit3, 
  Key, 
  Phone, 
  FileSpreadsheet, 
  X,
  Check, 
  Ban,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { User, Order, UserRole } from '../types';
import { exportWorkersReportToExcel } from '../utils/export';
import { triggerHaptic } from '../utils/haptics';
import { CURRENCY } from '../utils/currency';

interface WorkersViewProps {
  users: User[];
  orders: Order[];
  currentUser: User;
  onAddUser: (user: Omit<User, 'id' | 'tasksCompletedCount' | 'totalEarnedCommission' | 'joinedDate'>) => void;
  onUpdateUser: (user: User) => void;
}

export const WorkersView: React.FC<WorkersViewProps> = ({
  users,
  orders,
  currentUser,
  onAddUser,
  onUpdateUser
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('worker');
  const [pin, setPin] = useState('1234');
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [active, setActive] = useState<boolean>(true);

  const canManage = currentUser.role === 'admin' || currentUser.role === 'acting_admin';

  const handleOpenAdd = () => {
    triggerHaptic('heavy');
    setEditingUser(null);
    setName('');
    setUsername('');
    setPhone('');
    setRole('worker');
    setPin('1234');
    setCommissionRate(10);
    setActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    triggerHaptic('selection');
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setPhone(user.phone);
    setRole(user.role);
    setPin(user.pin);
    setCommissionRate(user.commissionRate);
    setActive(user.active);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !phone || !pin) {
      triggerHaptic('warning');
      alert('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    triggerHaptic('medium');

    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        name,
        username,
        phone,
        role,
        pin,
        commissionRate,
        active,
        isActingAdmin: role === 'acting_admin'
      });
    } else {
      onAddUser({
        name,
        username,
        phone,
        role,
        pin,
        commissionRate,
        active,
        isActingAdmin: role === 'acting_admin'
      });
    }

    setIsModalOpen(false);
  };

  const handleToggleActingAdmin = (targetUser: User) => {
    triggerHaptic('heavy');
    const willBeActing = targetUser.role !== 'acting_admin';
    const newRole: UserRole = willBeActing ? 'acting_admin' : 'worker';
    onUpdateUser({
      ...targetUser,
      role: newRole,
      isActingAdmin: willBeActing
    });
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return { label: 'المدير العام', color: 'bg-red-100 text-red-800 border-red-200', icon: Shield };
      case 'acting_admin':
        return { label: 'ممثل مدير مؤقت (صلاحيات كاملة)', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: ShieldCheck };
      case 'supervisor':
        return { label: 'مشرف ذو امتيازات', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Briefcase };
      default:
        return { label: 'عامل (تسجيل طلبيات)', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Truck };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-sm border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">فريق العمل ونظام الصلاحيات وتعيين الأدوار</h2>
          <p className="text-xs text-slate-500 mt-1">
            إنشاء بيانات الدخول والـ PIN، تحديد نسب العمولات، ومتابعة دقيقة لإنتاجية كل موظف ({CURRENCY})
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="btn-export-workers-excel"
            onClick={() => {
              triggerHaptic('light');
              exportWorkersReportToExcel(users, orders);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition active:scale-95 touch-manipulation"
            title="تصدير تقرير إنتاجية الفريق"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير إكسل</span>
          </button>

          {canManage && (
            <button
              id="btn-add-worker"
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-all active:scale-95 touch-manipulation shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>مستخدم جديد +</span>
            </button>
          )}
        </div>
      </div>

      {/* Users Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => {
          const roleInfo = getRoleBadge(user.role);
          const RoleIcon = roleInfo.icon;

          // Compute user orders & stats
          const userOrders = orders.filter(o => o.assignedWorkerId === user.id && !o.isArchived);
          const completedOrders = userOrders.filter(o => o.status === 'delivered');
          const completionRate = userOrders.length > 0 
            ? Math.round((completedOrders.length / userOrders.length) * 100) 
            : 0;
          const currentEarnedCommissions = completedOrders.reduce((sum, o) => sum + o.workerCommission, 0);

          return (
            <div 
              key={user.id}
              className="bg-white rounded-sm border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-base">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{user.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">@{user.username}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${roleInfo.color}`}>
                    <RoleIcon className="w-3 h-3" />
                    <span>{roleInfo.label}</span>
                  </span>
                </div>

                {/* Contact & Credentials Details */}
                <div className="bg-slate-50 p-3 rounded-sm border border-slate-200 my-3.5 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>رقم الهاتف:</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800">{user.phone}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <Key className="w-3 h-3 text-slate-400" />
                      <span>رمز الدخول (PIN):</span>
                    </span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-700">
                      {user.pin}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>الحالة التشغيلية:</span>
                    <span className={`font-bold flex items-center gap-1 text-[11px] ${user.active ? 'text-green-700' : 'text-red-600'}`}>
                      {user.active ? <Check className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                      <span>{user.active ? 'نشط في النظام' : 'موقوف مؤقتاً'}</span>
                    </span>
                  </div>
                </div>

                {/* Productivity Indicators */}
                {user.role !== 'admin' && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>إنجاز المهام:</span>
                      <span className="font-bold text-slate-800">
                        {completedOrders.length} من أصل {userOrders.length} ({completionRate}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-sm h-2 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-sm transition-all" 
                        style={{ width: `${completionRate}%` }} 
                      />
                    </div>

                    <div className="flex items-center justify-between bg-blue-50/60 p-2 rounded-sm border border-blue-100 text-[11px]">
                      <span className="text-blue-800 font-bold">العمولة المكتسبة (النشطة):</span>
                      <span className="font-bold text-blue-900 font-mono">
                        {currentEarnedCommissions.toLocaleString()} {CURRENCY}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions footer */}
              {canManage && (
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Toggle Acting Manager button for Admin */}
                  {currentUser.role === 'admin' && user.id !== currentUser.id ? (
                    user.role === 'acting_admin' ? (
                      <button
                        type="button"
                        onClick={() => handleToggleActingAdmin(user)}
                        className="text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-1 rounded transition active:scale-95"
                        title="إلغاء صفة ممثل المدير المؤقت وإعادته لدوره السابق"
                      >
                        إلغاء الإنابة المؤقتة
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleActingAdmin(user)}
                        className="text-[11px] font-bold text-slate-700 hover:text-purple-700 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 px-2 py-1 rounded flex items-center gap-1 transition active:scale-95"
                        title="تعيين هذا العضو كممثل مدير مؤقت يعوض المدير عند غيابه بصلاحيات كاملة"
                      >
                        <ShieldCheck className="w-3 h-3 text-purple-600" />
                        <span>تعيين كمدير مؤقت</span>
                      </button>
                    )
                  ) : <div />}

                  <button
                    onClick={() => handleOpenEdit(user)}
                    className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-600 p-1.5 rounded hover:bg-slate-50 transition active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل الصلاحيات</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* When only admin exists */}
      {users.filter(u => u.role !== 'admin').length === 0 && (
        <div className="p-4 rounded-md bg-blue-50/80 border border-blue-200 text-blue-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-800">لم يتم تسجيل أي عمال أو مناديب بعد</p>
              <p className="text-[11px] text-slate-500">
                يمكنك كمدير النظام (كمال بن عمامو) إضافة عمالك ومندوبيك وتحديد نسب العمولات ورموز الدخول (PIN) لكل عامل.
              </p>
            </div>
          </div>
          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs shrink-0 transition active:scale-95 shadow-xs"
            >
              إضافة عامل جديد +
            </button>
          )}
        </div>
      )}

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base">
                {editingUser ? 'تعديل بيانات المستخدم والصلاحيات' : 'إضافة عضو جديد للفريق'}
              </h3>
              <button 
                onClick={() => {
                  triggerHaptic('light');
                  setIsModalOpen(false);
                }} 
                className="p-1 rounded text-slate-400 hover:text-slate-700 active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs text-right">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يوسف الإدريسي"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المستخدم *</label>
                  <input
                    type="text"
                    required
                    placeholder="yousef10"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رمز الدخول (PIN) *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="4 أرقام"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الجوال *</label>
                <input
                  type="tel"
                  required
                  placeholder="+212 6xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الدور الوظيفي والصلاحية *</label>
                  <select
                    value={role}
                    onChange={(e) => {
                      triggerHaptic('selection');
                      setRole(e.target.value as UserRole);
                    }}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    <option value="worker">عامل / تسجيل طلبيات وتنفيذها</option>
                    <option value="supervisor">مشرف ذو امتيازات</option>
                    <option value="acting_admin">مدير مؤقت (ممثل المدير - وصول كامل)</option>
                    <option value="admin">مدير النظام العام (الرئيسي)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">نسبة العمولة (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="font-bold text-slate-700">حساب نشط ويستقبل تكليفات ومهام</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-md text-slate-600 hover:bg-slate-100 font-medium active:scale-95"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-bold active:scale-95 transition-all touch-manipulation"
                >
                  {editingUser ? 'حفظ التعديلات' : 'إنشاء المستخدم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
