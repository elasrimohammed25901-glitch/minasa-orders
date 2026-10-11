import React, { useState } from 'react';
import { Shield, Truck, Lock, User as UserIcon, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface LoginPageProps {
  allUsers?: User[];
  users?: User[];
  onLogin?: (user: User) => void;
  onLoginSuccess?: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  allUsers, 
  users, 
  onLogin, 
  onLoginSuccess 
}) => {
  const usersList = allUsers || users || [];
  const handleLogin = onLogin || onLoginSuccess || (() => {});

  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanPin = pin.trim();

    // Match by username, phone, or name
    const foundUser = usersList.find(u => 
      u.username.toLowerCase() === cleanIdentifier || 
      u.phone === cleanIdentifier ||
      u.name.toLowerCase() === cleanIdentifier
    );

    if (!foundUser) {
      triggerHaptic('warning');
      setErrorMsg('اسم المستخدم أو رقم الهاتف غير مسجل في النظام');
      setIsSubmitting(false);
      return;
    }

    if (!foundUser.active) {
      triggerHaptic('warning');
      setErrorMsg('هذا الحساب معطل حالياً من قبل الإدارة، يرجى مراجعة المسؤول');
      setIsSubmitting(false);
      return;
    }

    // Verify PIN / Password
    if (foundUser.pin !== cleanPin) {
      triggerHaptic('warning');
      setErrorMsg('رمز المرور (PIN) غير صحيح، يرجى المحاولة مرة أخرى');
      setIsSubmitting(false);
      return;
    }

    triggerHaptic('success');
    handleLogin(foundUser);
  };

  const handleQuickLogin = (user: User) => {
    triggerHaptic('medium');
    setIdentifier(user.username);
    setPin(user.pin);
    setErrorMsg(null);
    handleLogin(user);
  };

  const adminUser = usersList.find(u => u.role === 'admin') || usersList[0];
  const workers = usersList.filter(u => u.role === 'worker');

  return (
    <div 
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-['Tajawal',Arial,sans-serif]" 
      dir="rtl"
    >
      {/* Background Subtle Accent Grids */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 mb-0.5">
            <div className="w-6 h-6 border-2 border-white rounded-md rotate-45 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-white rounded-xs" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">إنجاز تك • للأزياء النسائية</h1>
            <div className="mt-1 flex items-center justify-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-pink-500/15 text-pink-300 border border-pink-500/30 rounded-full text-[11px] font-semibold">
                عبايات • حجابات • جلابيب • ملابس صلاة
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            منظومة إدارة طلبيات الميدان والمخزون وحساب عمولات المندوبين مع الفصل التام للصلاحيات
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-200">تسجيل الدخول للنظام</h2>
            <p className="text-xs text-slate-400 mt-0.5">أدخل بيانات الاعتماد الخاصة بك للوصول لبيئة عملك</p>
          </div>

          {/* Quick Admin Access Card */}
          {adminUser && (
            <div className="p-3.5 bg-gradient-to-r from-blue-950/80 to-slate-900 border border-blue-600/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-blue-500/30">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">حساب مدير النظام ({adminUser.name})</h3>
                    <p className="text-[10px] text-blue-300 font-mono">الهاتف: {adminUser.phone} | الرمز: {adminUser.pin}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-400/30">
                  صلاحيات كاملة 👑
                </span>
              </div>
              <button
                type="button"
                id="btn-quick-admin-login"
                onClick={() => handleQuickLogin(adminUser)}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center justify-center gap-2"
              >
                <span>دخول فوري بنقرة واحدة كمدير النظام</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-500 font-medium">أو تسجيل الدخول اليدوي</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                اسم المستخدم أو رقم الهاتف
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="مثال: admin أو 0642815566"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full text-xs pr-9 pl-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                رمز المرور (PIN / كلمة السر)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  maxLength={10}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full text-xs pr-9 pl-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent tracking-widest transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-xs rounded-lg transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              <span>دخول النظام</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Login Chips for Evaluation & Testing */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">تسجيل دخول تجريبي سريع:</span>
              <span className="text-[10px] text-slate-500">نقرة واحدة للفحص</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {/* Admin Quick Login */}
              {adminUser && (
                <button
                  type="button"
                  onClick={() => handleQuickLogin(adminUser)}
                  className="w-full p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-blue-500/50 flex items-center justify-between transition text-right group active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-blue-300 transition">
                        {adminUser.name} <span className="text-[10px] text-blue-400 font-normal">(مدير النظام الكامل)</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">اسم المستخدم: {adminUser.username} | PIN: {adminUser.pin}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-medium">
                    دخول كمدير 👑
                  </span>
                </button>
              )}

              {/* Worker 1 Quick Login */}
              {workers[0] && (
                <button
                  type="button"
                  onClick={() => handleQuickLogin(workers[0])}
                  className="w-full p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/50 flex items-center justify-between transition text-right group active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Truck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                        {workers[0].name} <span className="text-[10px] text-emerald-400 font-normal">(عامل تنفيذ معزول)</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">اسم المستخدم: {workers[0].username} | PIN: {workers[0].pin}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium">
                    دخول كعامل 🚚
                  </span>
                </button>
              )}

              {/* Worker 2 Quick Login */}
              {workers[1] && (
                <button
                  type="button"
                  onClick={() => handleQuickLogin(workers[1])}
                  className="w-full p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-amber-500/50 flex items-center justify-between transition text-right group active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Truck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                        {workers[1].name} <span className="text-[10px] text-amber-400 font-normal">(عامل تنفيذ ثانٍ)</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">اسم المستخدم: {workers[1].username} | PIN: {workers[1].pin}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-medium">
                    دخول كعامل 🚚
                  </span>
                </button>
              )}

              {workers.length === 0 && (
                <p className="text-[11px] text-slate-500 py-1 text-center bg-slate-900/50 rounded p-2 border border-slate-800">
                  لم يتم إضافة أي عمال بعد. يمكن لمدير النظام (كمال بن عمامو) تسجيل الدخول وإضافة العمال من لوحة التحكم.
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Security and Offline note */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>تخزين سحابي آمن مع Cloudflare D1 وحماية معزولة للبيانات</span>
        </div>

      </div>
    </div>
  );
};
