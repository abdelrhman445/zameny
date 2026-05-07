'use client';

import React, { useState } from 'react';
import { 
  Search, Phone, ShieldAlert, ShieldCheck, AlertTriangle, 
  Package, UserX, History, Activity, TrendingDown 
} from 'lucide-react';
import { CustomerHistoryResponse } from '@/types';
import { cn, formatCurrency, formatDateShort } from '@/lib/utils';
import FraudBadge from '@/components/dashboard/FraudBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import api from '@/lib/api';

const STATUS_LABELS: Record<string, string> = {
  Pending: 'قيد الانتظار', Flagged: 'مشبوه', Confirmed: 'تم التأكيد',
  Shipped: 'جاري الشحن', Delivered: 'تم التسليم', RTO: 'مرتجع', Cancelled: 'ملغي',
};

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-slate-100 text-slate-600', Flagged: 'bg-rose-100 text-rose-700',
  Confirmed: 'bg-blue-100 text-blue-700', Shipped: 'bg-indigo-100 text-indigo-700',
  Delivered: 'bg-emerald-100 text-emerald-700', RTO: 'bg-amber-100 text-amber-700',
  Cancelled: 'bg-slate-100 text-slate-500',
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
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string }; status?: number } }).response?.data?.message;
      const status = (err as { response?: { status?: number } }).response?.status;
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

  // تحديد مستوى الخطر لتلوين الواجهة
  const isDanger = ch?.isBlacklisted || ch?.riskLevel === 'High';
  const isWarning = !isDanger && ch?.riskLevel === 'Medium';
  const isSafe = ch?.riskLevel === 'Low' && !ch?.isBlacklisted;

  return (
    <div className="space-y-6 animate-fade-in pb-10" dir="rtl">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">بحث وسجل العملاء</h1>
          <p className="text-sm font-medium text-slate-500 mt-1.5">
            ابحث برقم هاتف العميل لكشف تاريخه الشرائي ومعدل المرتجعات قبل تأكيد الشحن.
          </p>
        </div>
      </div>

      {/* ── Premium Search Bar ── */}
      <div className="bg-white border border-slate-200/60 p-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col sm:flex-row gap-3 items-center max-w-2xl transition-all">
        <div className="relative w-full group">
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <Phone className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="أدخل رقم هاتف العميل (مثال: 010...)"
            autoComplete="off"
            className="pr-12 h-14 bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 rounded-xl text-lg font-bold text-slate-900 transition-all tracking-wide"
            dir="ltr"
            autoFocus
          />
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={loading || !phone.trim()} 
          className="w-full sm:w-auto h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all text-base"
        >
          <Search className="w-5 h-5 ml-2" /> بحث
        </Button>
      </div>

      {/* ── Loading State ── */}
      {loading && (
        <div className="py-12">
          <PageLoading label="جاري استخراج السجل من قاعدة البيانات..." />
        </div>
      )}

      {/* ── Error / Not Found State ── */}
      {!loading && error && (
        <div className="py-16 flex flex-col items-center justify-center bg-white/50 border border-dashed border-slate-300 rounded-3xl animate-fade-in">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center shadow-sm mb-4 border border-slate-100">
            <UserX className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">{error}</h3>
          <p className="text-slate-500 text-sm mt-2 max-w-sm text-center font-medium leading-relaxed">
            هذا العميل جديد تماماً أو أن الرقم مكتوب بشكل خاطئ.
          </p>
        </div>
      )}

      {/* ── Initial Empty State ── */}
      {!loading && !error && !searched && (
        <div className="py-24 flex flex-col items-center justify-center bg-white/30 border border-dashed border-slate-200 rounded-3xl">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-6 border border-slate-100">
            <Search className="w-10 h-10 text-indigo-200" />
          </div>
          <h3 className="text-2xl font-black text-slate-800">مستكشف العملاء</h3>
          <p className="text-slate-500 text-base mt-2 max-w-md text-center font-medium leading-relaxed">
            استخدم محرك البحث بالأعلى لاستعراض تفاصيل أي عميل وتقييم مدى أمان التعامل معه.
          </p>
        </div>
      )}

      {/* ── Customer Profile Dashboard ── */}
      {!loading && !error && data && ch && (
        <div className="space-y-6 animate-fade-in-up">
          
          {/* Profile Header Card */}
          <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
            {/* Ambient Background Glow based on Risk */}
            <div className={cn(
              "absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none opacity-20",
              isDanger ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
            )} />

            <div className="flex flex-col sm:flex-row sm:items-center gap-6 relative z-10">
              {/* Avatar */}
              <div className={cn(
                'w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border-2',
                isDanger ? 'bg-rose-50 border-rose-100' : isWarning ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'
              )}>
                {isDanger ? (
                  <ShieldAlert className="w-10 h-10 text-rose-600" />
                ) : isSafe ? (
                  <ShieldCheck className="w-10 h-10 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-10 h-10 text-amber-600" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-wider" dir="ltr">{ch.phoneNumber}</h2>
                  {ch.isBlacklisted && (
                    <span className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> عميل محظور
                    </span>
                  )}
                  <FraudBadge
                    fraudAnalysis={{
                      score: ch.fraudScore,
                      riskLevel: ch.riskLevel,
                      reason: '',
                      rtoRate: ch.rtoRate,
                      isNewCustomer: ch.totalOrders === 0,
                      ipMismatch: false,
                    }}
                    showScore
                  />
                </div>
                {ch.lastOrderDate ? (
                  <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-400" />
                    آخر طلب مسجل بتاريخ: <strong className="text-slate-700">{formatDateShort(ch.lastOrderDate)}</strong>
                  </p>
                ) : (
                  <p className="text-sm font-medium text-slate-500">لا يوجد تاريخ طلبات سابقة</p>
                )}
              </div>
            </div>
          </div>

          {/* KPI Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'إجمالي الطلبات', value: ch.totalOrders, icon: Package, color: 'indigo', format: (v: number) => v },
              { label: 'طلبات مرتجعة (RTO)', value: ch.rtoOrders, icon: TrendingDown, color: ch.rtoOrders > 0 ? 'rose' : 'emerald', format: (v: number) => v },
              { label: 'نسبة الإرجاع', value: ch.rtoRate, icon: Activity, color: ch.rtoRate > 0.3 ? 'rose' : ch.rtoRate > 0.15 ? 'amber' : 'emerald', format: (v: number) => `${(v * 100).toFixed(1)}%` },
              { label: 'درجة الأمان', value: ch.fraudScore, icon: ShieldCheck, color: ch.fraudScore >= 80 ? 'emerald' : ch.fraudScore >= 50 ? 'amber' : 'rose', format: (v: number) => `${v}/100` },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className={cn(
                  'rounded-2xl p-5 border relative overflow-hidden group',
                  stat.color === 'indigo' ? 'bg-indigo-50/50 border-indigo-100' :
                  stat.color === 'emerald' ? 'bg-emerald-50/50 border-emerald-100' :
                  stat.color === 'amber' ? 'bg-amber-50/50 border-amber-100' :
                  'bg-rose-50/50 border-rose-100'
                )}>
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <p className="text-xs font-bold text-slate-500">{stat.label}</p>
                    <Icon className={cn("w-5 h-5 opacity-50", 
                      stat.color === 'indigo' ? 'text-indigo-600' :
                      stat.color === 'emerald' ? 'text-emerald-600' :
                      stat.color === 'amber' ? 'text-amber-600' : 'text-rose-600'
                    )} />
                  </div>
                  <p className={cn('text-3xl font-black relative z-10',
                    stat.color === 'indigo' ? 'text-indigo-900' :
                    stat.color === 'emerald' ? 'text-emerald-900' :
                    stat.color === 'amber' ? 'text-amber-900' : 'text-rose-900'
                  )}>{stat.format(stat.value)}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Risk Progress Bar Card */}
            <Card className="lg:col-span-1 border-slate-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-2xl h-max">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 rounded-t-2xl">
                <CardTitle className="text-base font-bold text-slate-800">تفاصيل الخطر و IPs</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-slate-600">مؤشر الثقة</span>
                    <span className="font-black text-slate-900">{ch.fraudScore} من 100</span>
                  </div>
                  <Progress
                    value={ch.fraudScore}
                    className={cn('h-3 bg-slate-100',
                      ch.fraudScore >= 80 ? '[&>div]:bg-emerald-500' :
                      ch.fraudScore >= 50 ? '[&>div]:bg-amber-500' :
                      '[&>div]:bg-rose-500'
                    )}
                  />
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-500">حالة الحظر:</span>
                    <span className={cn('font-bold flex items-center gap-1.5', ch.isBlacklisted ? 'text-rose-600' : 'text-emerald-600')}>
                      {ch.isBlacklisted ? <><ShieldAlert className="w-4 h-4"/> محظور عالمياً</> : <><ShieldCheck className="w-4 h-4"/> سليم</>}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200/60">
                    <span className="font-semibold text-slate-500">الأجهزة (IPs):</span>
                    <span className="font-bold text-slate-900">{ch.knownIps.length} عنوان مسجل</span>
                  </div>
                  
                  {ch.knownIps.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {ch.knownIps.map((ip) => (
                        <span key={ip} className="font-mono text-[11px] font-medium bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-md shadow-sm" dir="ltr">{ip}</span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders Card */}
            <Card className="lg:col-span-2 border-slate-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-400" /> آخر طلبات العميل
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {data.recentOrders && data.recentOrders.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {data.recentOrders.map((order, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50/50 transition-colors gap-4 sm:gap-0">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 shrink-0">
                            <Package className="w-5 h-5 text-indigo-500" />
                          </div>
                          <div>
                            <p className="text-sm font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded inline-block mb-1">{order.orderNumber}</p>
                            {order.createdAt && (
                              <p className="text-[11px] font-medium text-slate-500">{formatDateShort(order.createdAt)}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {order.fraudAnalysis && (
                            <FraudBadge fraudAnalysis={order.fraudAnalysis as Parameters<typeof FraudBadge>[0]['fraudAnalysis']} showScore />
                          )}
                          {order.status && (
                            <span className={cn('text-xs px-2.5 py-1 rounded-lg font-bold border whitespace-nowrap', STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600 border-slate-200')}>
                              {STATUS_LABELS[order.status] || order.status}
                            </span>
                          )}
                          {order.totalAmount !== undefined && (
                            <span className="text-sm font-black text-slate-900 whitespace-nowrap w-24 text-left">
                              {formatCurrency(order.totalAmount)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center">
                    <p className="text-sm font-medium text-slate-500">لا توجد طلبات سريعة العرض لهذا العميل.</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      )}
    </div>
  );
}