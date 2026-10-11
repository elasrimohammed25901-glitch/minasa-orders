import React, { useState } from 'react';
import { 
  History, 
  Search, 
  FileSpreadsheet, 
  User, 
  Package, 
  Clock, 
  Shield, 
  Truck, 
  Lock, 
  Filter 
} from 'lucide-react';
import { AuditLogEntry, User as UserModel } from '../types';
import { exportAuditLogsToExcel } from '../utils/export';
import { triggerHaptic } from '../utils/haptics';

interface AuditLogViewProps {
  auditLogs: AuditLogEntry[];
  users: UserModel[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ auditLogs, users }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || log.userRole === roleFilter;
    const matchesEntity = entityFilter === 'all' || log.entityType === entityFilter;

    return matchesSearch && matchesRole && matchesEntity;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'مدير النظام', color: 'bg-blue-100 text-blue-800' };
      case 'acting_admin':
        return { label: 'مدير مؤقت (ممثل المدير)', color: 'bg-amber-100 text-amber-800' };
      case 'supervisor':
        return { label: 'مشرف', color: 'bg-purple-100 text-purple-800' };
      default:
        return { label: 'عامل', color: 'bg-emerald-100 text-emerald-800' };
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'order':
        return Package;
      case 'auth':
        return Lock;
      case 'user':
        return User;
      case 'product':
        return Filter;
      default:
        return History;
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-sm border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>سجل النشاطات والتغيرات (Audit Log)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل زمني دقيق لكافة العمليات، إدخالات العمال، وتغييرات حالات الطلبيات (للمدير فقط)
          </p>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            exportAuditLogsToExcel(filteredLogs);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition active:scale-95 shadow-2xs"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>تصدير السجل لإكسل</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="بحث بالاسم، الإجراء، أو التفاصيل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pr-9 pl-3 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        {/* Role Filter */}
        <div>
          <select
            value={roleFilter}
            onChange={(e) => {
              triggerHaptic('selection');
              setRoleFilter(e.target.value);
            }}
            className="w-full text-xs px-3 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          >
            <option value="all">جميع الصلاحيات</option>
            <option value="worker">إجراءات العمال فقط</option>
            <option value="admin">إجراءات المدير العام</option>
            <option value="acting_admin">إجراءات المدير المؤقت (الممثل)</option>
            <option value="supervisor">إجراءات المشرفين</option>
          </select>
        </div>

        {/* Entity Filter */}
        <div>
          <select
            value={entityFilter}
            onChange={(e) => {
              triggerHaptic('selection');
              setEntityFilter(e.target.value);
            }}
            className="w-full text-xs px-3 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          >
            <option value="all">جميع أنواع العمليات</option>
            <option value="order">حركات الطلبيات</option>
            <option value="auth">تسجيلات الدخول</option>
            <option value="user">المستخدمين</option>
            <option value="product">المنتجات</option>
            <option value="system">النظام والصيانة</option>
          </select>
        </div>
      </div>

      {/* Logs Timeline / Table */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-sm border border-slate-200 text-center py-16 px-4 text-slate-400 shadow-xs">
          <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
          <p className="font-bold text-slate-700 text-sm">لا توجد سجلات تطابق شروط البحث</p>
          <p className="text-xs text-slate-400 mt-1">سيتم توثيق كل حركة في النظام تلقائياً هنا</p>
        </div>
      ) : (
        <div className="bg-white rounded-sm border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="p-3.5">الوقت والتاريخ</th>
                  <th className="p-3.5">المستخدم المسؤول</th>
                  <th className="p-3.5">نوع العملية</th>
                  <th className="p-3.5">التفاصيل والبيان</th>
                  <th className="p-3.5 text-center">التصنيف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const roleBadge = getRoleBadge(log.userRole);
                  const Icon = getEntityIcon(log.entityType);

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString('ar-SA', {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{log.userName}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${roleBadge.color}`}>
                            {roleBadge.label}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 font-bold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.action}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-600 leading-relaxed max-w-md">
                        {log.details}
                      </td>

                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          {log.entityType}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
