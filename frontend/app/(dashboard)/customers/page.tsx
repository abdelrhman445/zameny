'use client';

import React, { useState } from 'react';
import { 
  Search, Phone, ShieldAlert, ShieldCheck, AlertTriangle, 
  Package, UserX, History, Activity, TrendingDown, Laptop
} from 'lucide-react';
import { CustomerHistoryResponse } from '@/types';
import { cn, formatCurrency, formatDateShort } from '@/lib/utils';
import FraudBadge from '@/components/dashboard/FraudBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import api from '@/lib/api';

// تعريف الأنواع لضمان توافق TypeScript
const STATUS_LABELS: Record<string, string> = {
  Pending: 'قيد الانتظار', 
  Flagged: 'مشبوه', 
  Confirmed: 'تم التأكيد',
  Shipped: 'جاري الشحن', 
  Delivered: 'تم التسليم', 
  RTO: 'مرتجع', 
  Cancelled: 'ملغي',
};

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-slate-100 text-slate-600 border-slate-200', 
  Flagged: 'bg-rose-50 text-rose-700 border-rose-200',
  Confirmed: 'bg-blue-50 text-blue-700 border-blue-200', 
  Shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
  RTO: 'bg-amber-50 text-amber-700 border-amber-200',
  Cancelled: 'bg-slate-50 text-slate-500 border-slate-200',
};

export default function CustomersPage() {
  const [phone, setPhone] = useState('');
  const [data, setData] = useState<CustomerHistoryResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const cleaned = phone.trim().replace(/\s+/g, '');
    if (!cleaned) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await api.get<CustomerHistoryResponse>(`/orders/customer/${cleaned}`);
      setData(res.data.data);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      const status = err.response?.status;
      if (status === 404) {
        setData(null);
        setError('لم يتم العثور على أي سجل طلبات لهذا الرقم.');
      } else {
        setError(msg || 'حدث خطأ أثناء البحث، يرجى المحاولة لاحقاً.');
      }
    } finally {
      setLoading(false);
    }
  };

  const ch = data?.customerHistory;

  const isDanger = ch?.isBlacklisted || ch?.riskLevel === 'High';
  const isWarning = !isDanger && ch?.riskLevel === 'Medium';
  const isSafe = ch?.riskLevel === 'Low' && !ch?.isBlacklisted;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-10 sm:pb-14 max-w-7xl mx-auto" dir="rtl">
      
      {/* ── Header ── */}
      <div className="px-1 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">استكشاف العملاء</h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1.5 sm:mt-2">
          ابحث برقم الهاتف لكشف التاريخ الشرائي وتقييم الأمان قبل الشحن.
        </p>
      </div>

      {/* ── Search Bar ── */}
      <div className="bg-white border border-slate-200/60 p-2 sm:p-2.5 rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-2xl transition-all mx-1 sm:mx-0">
        <div className="relative w-full flex-1 group">
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <Phone className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="أدخل رقم هاتف العميل"
            autoComplete="off"
            className="pr-12 h-12 sm:h-14 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base sm:text-lg font-black text-slate-900 placeholder:text-slate-400 placeholder:font-medium tracking-widest transition-all"
            dir="rtl"
            autoFocus
          />
        </div>
        <div className="w-full sm:w-auto shrink-0 flex items-center justify-center p-1 sm:p-0">
           <Button 
            onClick={handleSearch} 
            disabled={loading || !phone.trim()} 
            className="w-full sm:w-32 h-12 sm:h-14 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-md transition-all text-sm"
          >
            <Search className="w-4 h-4 ml-1.5" /> بحث
          </Button>
        </div>
      </div>

      {/* ── States ── */}
      {loading && (
        <div className="py-16 sm:py-24">
          <PageLoading label="جاري استخراج السجل من قاعدة البيانات..." />
        </div>
      )}

      {!loading && error && (
        <div className="py-16 sm:py-20 mx-1 sm:mx-0 flex flex-col items-center justify-center bg-white/40 border border-dashed border-slate-300 rounded-[2rem] animate-fade-in">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-4 sm:mb-5 border border-slate-100">
            <UserX className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-800 text-center px-4">{error}</h3>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-sm text-center font-medium leading-relaxed px-4">
            هذا العميل جديد تماماً أو أن الرقم مكتوب بشكل خاطئ.
          </p>
        </div>
      )}

      {!loading && !error && !searched && (
        <div className="py-20 sm:py-24 mx-1 sm:mx-0 flex flex-col items-center justify-center bg-white/40 border border-dashed border-slate-300 rounded-[2rem]">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-3xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.03)] mb-4 sm:mb-5 border border-slate-100">
            <Search className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800 text-center px-4">مستكشف العملاء</h3>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-sm text-center font-medium leading-relaxed px-6">
            استخدم محرك البحث بالأعلى لاستعراض تفاصيل أي عميل وتقييم مدى أمان التعامل معه.
          </p>
        </div>
      )}

      {/* ── Dashboard ── */}
      {!loading && !error && data && ch && (
        <div className="space-y-5 sm:space-y-6 animate-fade-in-up">
          
          {/* Header Card */}
          <div className="bg-white border border-slate-200/60 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 md:p-10 shadow-[0_4px_20px_rgb(0,0,0,0.02)] relative overflow-hidden">
            <div className={cn(
              "absolute top-0 left-0 w-48 h-48 sm:w-64 sm:h-64 rounded-full blur-3xl -ml-16 -mt-16 sm:-ml-20 sm:-mt-20 pointer-events-none opacity-10",
              isDanger ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
            )} />

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 relative z-10">
              <div className={cn(
                'w-16 h-16 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border-2',
                isDanger ? 'bg-rose-50 border-rose-100' : isWarning ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'
              )}>
                {isDanger ? <ShieldAlert className="w-8 h-8 sm:w-12 sm:h-12 text-rose-600" /> : 
                 isSafe ? <ShieldCheck className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-600" /> : 
                 <AlertTriangle className="w-8 h-8 sm:w-12 sm:h-12 text-amber-600" />}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
                  <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-wider" dir="ltr">{ch.phoneNumber}</h2>
                  {ch.isBlacklisted && (
                    <span className="px-2.5 py-1 bg-rose-600 text-white text-[10px] sm:text-xs font-black rounded-lg shadow-sm flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> عميل محظور
                    </span>
                  )}
                  <FraudBadge
                    fraudAnalysis={{
                      score: ch.fraudScore ?? 100,
                      riskLevel: ch.riskLevel || 'Low',
                      reason: '',
                      rtoRate: ch.rtoRate ?? 0,
                      isNewCustomer: (ch.totalOrders ?? 0) === 0,
                      ipMismatch: false,
                    }}
                    showScore
                  />
                </div>
                {ch.lastOrderDate ? (
                  <p className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-400" />
                    آخر طلب مسجل بتاريخ: <strong className="text-slate-700">{formatDateShort(ch.lastOrderDate)}</strong>
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm font-medium text-slate-500">لا يوجد تاريخ طلبات سابقة</p>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {[
              { label: 'إجمالي الطلبات', value: ch.totalOrders ?? 0, icon: Package, color: 'indigo', format: (v: number) => v },
              { label: 'طلبات مرتجعة (RTO)', value: ch.rtoOrders ?? 0, icon: TrendingDown, color: (ch.rtoOrders ?? 0) > 0 ? 'rose' : 'emerald', format: (v: number) => v },
              { label: 'نسبة الإرجاع', value: ch.rtoRate ?? 0, icon: Activity, color: (ch.rtoRate ?? 0) > 0.3 ? 'rose' : (ch.rtoRate ?? 0) > 0.15 ? 'amber' : 'emerald', format: (v: number) => `${(v * 100).toFixed(1)}%` },
              { label: 'مؤشر الأمان', value: ch.fraudScore ?? 100, icon: ShieldCheck, color: (ch.fraudScore ?? 100) >= 80 ? 'emerald' : (ch.fraudScore ?? 100) >= 50 ? 'amber' : 'rose', format: (v: number) => `${v}/100` },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2 relative z-10">
                    <p className="text-[11px] sm:text-xs font-bold text-slate-500">{stat.label}</p>
                    <div className={cn(
                      "w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center border shrink-0",
                      stat.color === 'indigo' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
                      stat.color === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                      stat.color === 'amber' ? 'bg-amber-50 border-amber-100 text-amber-600' : 
                      'bg-rose-50 border-rose-100 text-rose-600'
                    )}>
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <p className={cn('text-xl sm:text-3xl font-black relative z-10 tracking-tight',
                    stat.color === 'indigo' ? 'text-indigo-900' :
                    stat.color === 'emerald' ? 'text-emerald-900' :
                    stat.color === 'amber' ? 'text-amber-900' : 'text-rose-900'
                  )}>{stat.format(stat.value)}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            
            {/* IPs & Detail */}
            <div className="lg:col-span-1 bg-white border border-slate-200/60 shadow-sm rounded-[1.5rem] p-5 sm:p-7 h-max space-y-6">
              <h3 className="text-base font-black text-slate-800">تفاصيل الخطر والأجهزة</h3>
              
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-2.5">
                  <span className="font-bold text-slate-600">مؤشر الثقة</span>
                  <span className="font-black text-slate-900">{ch.fraudScore ?? 100} / 100</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-1000", 
                      (ch.fraudScore ?? 100) >= 80 ? 'bg-emerald-500' : 
                      (ch.fraudScore ?? 100) >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                    )}
                    style={{ width: `${ch.fraudScore ?? 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-50/50 rounded-xl p-4 sm:p-5 border border-slate-100 space-y-4">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-slate-500">حالة الحظر:</span>
                  <span className={cn('text-[10px] sm:text-xs font-black flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border', 
                    ch.isBlacklisted ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  )}>
                    {ch.isBlacklisted ? <><ShieldAlert className="w-3.5 h-3.5"/> محظور</> : <><ShieldCheck className="w-3.5 h-3.5"/> سليم</>}
                  </span>
                </div>
                
                <div className="pt-4 border-t border-slate-200/60">
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-3.5">
                    <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                      <Laptop className="w-4 h-4 text-slate-400" /> الأجهزة:
                    </span>
                    <span className="font-black text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 text-[10px] sm:text-xs">
                      {(ch.knownIps || []).length} عنوان
                    </span>
                  </div>
                  
                  {(ch.knownIps || []).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {ch.knownIps?.map((ip) => (
                        <span key={ip} className="font-mono text-[10px] sm:text-xs font-bold bg-white border border-slate-200 text-slate-600 px-2 sm:px-2.5 py-1 rounded-md shadow-sm" dir="ltr">{ip}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium">لا توجد أجهزة مسجلة</p>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="lg:col-span-2 bg-white border border-slate-200/60 shadow-sm rounded-[1.5rem] overflow-hidden flex flex-col">
              <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2.5">
                  <History className="w-5 h-5 text-indigo-500" /> آخر طلبات العميل
                </h3>
              </div>
              
              <div className="p-0 overflow-x-auto">
                {data.recentOrders && data.recentOrders.length > 0 ? (
                  <table className="w-full text-right text-sm">
                    <thead className="bg-white border-b border-slate-100 hidden sm:table-header-group">
                      <tr>
                        <th className="px-6 py-4 font-bold text-slate-400 text-xs tracking-wider">الطلب / التاريخ</th>
                        <th className="px-6 py-4 font-bold text-slate-400 text-xs tracking-wider">الحالة</th>
                        <th className="px-6 py-4 font-bold text-slate-400 text-xs tracking-wider">الأمان</th>
                        <th className="px-6 py-4 font-bold text-slate-400 text-xs tracking-wider text-left">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.recentOrders.map((order, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors flex flex-col sm:table-row py-2 sm:py-0 border-b sm:border-0 border-slate-100 last:border-0">
                          <td className="px-5 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:table-cell">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0 hidden sm:flex">
                                <Package className="w-4 h-4 text-slate-400" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-xs sm:text-sm font-mono font-bold text-slate-800 bg-slate-100 sm:px-1.5 py-0.5 px-2 rounded-md w-max">{order.orderNumber}</span>
                                {order.createdAt && <span className="text-[10px] sm:text-[11px] font-medium text-slate-500">{formatDateShort(order.createdAt)}</span>}
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-5 sm:px-6 py-1.5 sm:py-4">
                            {/* ✅ الإصلاح لـ STATUS_COLORS */}
                            <span className={cn(
                              'text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-md font-bold border inline-flex items-center gap-1.5', 
                              (order.status && STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]) || 'bg-slate-50 text-slate-600 border-slate-200'
                            )}>
                               <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-current opacity-70" />
                               {/* ✅ الإصلاح لـ STATUS_LABELS */}
                               {(order.status && STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]) || order.status}
                            </span>
                          </td>
                          
                          <td className="px-5 sm:px-6 py-1.5 sm:py-4">
                            {order.fraudAnalysis && (
                              <div className="scale-90 origin-right sm:scale-100">
                                <FraudBadge fraudAnalysis={order.fraudAnalysis as any} showScore />
                              </div>
                            )}
                          </td>
                          
                          <td className="px-5 sm:px-6 pt-1.5 pb-4 sm:py-4 sm:text-left">
                            {order.totalAmount !== undefined && (
                              <span className="text-xs sm:text-sm font-black text-indigo-600 bg-indigo-50 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md inline-block w-max">
                                {formatCurrency(order.totalAmount)}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-10 sm:p-14 flex flex-col items-center justify-center text-center">
                    <Package className="w-8 h-8 text-slate-200 mb-3" />
                    <p className="text-xs sm:text-sm font-medium text-slate-500">لا توجد طلبات سابقة مسجلة لهذا العميل.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}