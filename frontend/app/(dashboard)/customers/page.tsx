'use client';
import React, { useState } from 'react';
import { Search, Phone, ShieldAlert, ShieldCheck, AlertTriangle, Clock, Package } from 'lucide-react';
import { CustomerHistoryResponse, CustomerHistory } from '@/types';
import { cn, formatCurrency, formatDate, formatDateShort } from '@/lib/utils';
import FraudBadge from '@/components/dashboard/FraudBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import api from '@/lib/api';

const STATUS_LABELS: Record<string, string> = {
  Pending: 'انتظار', Flagged: 'مشبوه', Confirmed: 'مؤكد',
  Shipped: 'شحن', Delivered: 'مسلّم', RTO: 'مرتجع', Cancelled: 'ملغي',
};
const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-slate-100 text-slate-600', Flagged: 'bg-red-100 text-red-700',
  Confirmed: 'bg-blue-100 text-blue-700', Shipped: 'bg-indigo-100 text-indigo-700',
  Delivered: 'bg-emerald-100 text-emerald-700', RTO: 'bg-orange-100 text-orange-700',
  Cancelled: 'bg-gray-100 text-gray-600',
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
        setError('لم يتم العثور على سجل لهذا الرقم');
      } else {
        setError(msg || 'فشل البحث');
      }
    } finally {
      setLoading(false);
    }
  };

  const ch = data?.customerHistory;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">بحث العملاء</h1>
        <p className="text-sm text-muted-foreground mt-0.5">اعرف سجل أي عميل بناءً على رقم هاتفه</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 max-w-lg">
        <div className="relative flex-1">
          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="أدخل رقم هاتف العميل..."
            className="pr-9 text-sm"
            dir="ltr"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading || !phone.trim()}>
          <Search className="w-4 h-4 ml-1.5" />
          بحث
        </Button>
      </div>

      {/* Loading */}
      {loading && <PageLoading label="جاري البحث عن سجل العميل..." />}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center py-12 gap-3">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center">
            <Phone className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      )}

      {/* No results yet */}
      {!loading && !error && !searched && (
        <div className="flex flex-col items-center py-16 gap-3 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <Search className="w-7 h-7 text-slate-400" />
          </div>
          <p className="font-medium text-slate-700">ابحث عن عميل</p>
          <p className="text-sm text-muted-foreground">أدخل رقم هاتف العميل للاطلاع على سجله وتحليل مستوى خطره</p>
        </div>
      )}

      {/* Customer Profile */}
      {!loading && !error && data && ch && (
        <div className="space-y-5 animate-fade-in">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Avatar */}
            <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0',
              ch.isBlacklisted ? 'bg-red-100' : ch.riskLevel === 'Low' ? 'bg-emerald-100' : ch.riskLevel === 'Medium' ? 'bg-amber-100' : 'bg-red-100'
            )}>
              {ch.isBlacklisted ? (
                <ShieldAlert className="w-7 h-7 text-red-600" />
              ) : ch.riskLevel === 'Low' ? (
                <ShieldCheck className="w-7 h-7 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-7 h-7 text-amber-600" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900" dir="ltr">{ch.phoneNumber}</h2>
                {ch.isBlacklisted && (
                  <span className="px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                    🚫 محظور
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
              {ch.lastOrderDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  آخر طلب: {formatDateShort(ch.lastOrderDate)}
                </p>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'إجمالي الطلبات', value: ch.totalOrders, color: 'blue' },
              { label: 'طلبات مرتجعة (RTO)', value: ch.rtoOrders, color: ch.rtoOrders > 0 ? 'red' : 'emerald' },
              { label: 'نسبة الإرجاع', value: `${(ch.rtoRate * 100).toFixed(1)}%`, color: ch.rtoRate > 0.3 ? 'red' : 'emerald' },
              { label: 'درجة الأمان', value: `${ch.fraudScore}/100`, color: ch.fraudScore >= 80 ? 'emerald' : ch.fraudScore >= 50 ? 'amber' : 'red' },
            ].map((stat) => (
              <div key={stat.label} className={cn('rounded-xl p-4 border',
                stat.color === 'blue' ? 'bg-blue-50 border-blue-100' :
                stat.color === 'emerald' ? 'bg-emerald-50 border-emerald-100' :
                stat.color === 'amber' ? 'bg-amber-50 border-amber-100' :
                'bg-red-50 border-red-100'
              )}>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={cn('text-xl font-bold mt-1',
                  stat.color === 'blue' ? 'text-blue-800' :
                  stat.color === 'emerald' ? 'text-emerald-800' :
                  stat.color === 'amber' ? 'text-amber-800' :
                  'text-red-800'
                )}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Fraud Score Bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">تحليل مستوى الخطر</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>درجة الأمان</span>
                <span className="font-bold text-slate-900">{ch.fraudScore} / 100</span>
              </div>
              <Progress
                value={ch.fraudScore}
                className={cn('h-3',
                  ch.fraudScore >= 80 ? '[&>div]:bg-emerald-500' :
                  ch.fraudScore >= 50 ? '[&>div]:bg-amber-500' :
                  '[&>div]:bg-red-500'
                )}
              />
              <div className="flex gap-4 text-xs">
                <span className="text-slate-500">IPs المعروفة: {ch.knownIps.length}</span>
                <span className={cn('font-medium', ch.isBlacklisted ? 'text-red-600' : 'text-emerald-600')}>
                  {ch.isBlacklisted ? '🚫 محظور' : '✅ غير محظور'}
                </span>
              </div>
              {ch.knownIps.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {ch.knownIps.map((ip) => (
                    <span key={ip} className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded" dir="ltr">{ip}</span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          {data.recentOrders && data.recentOrders.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">آخر الطلبات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.recentOrders.map((order, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-mono font-medium text-slate-800">{order.orderNumber}</p>
                          {order.createdAt && (
                            <p className="text-[10px] text-muted-foreground">{formatDateShort(order.createdAt)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {order.fraudAnalysis && (
                          <FraudBadge fraudAnalysis={order.fraudAnalysis as Parameters<typeof FraudBadge>[0]['fraudAnalysis']} showScore />
                        )}
                        {order.status && (
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600')}>
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        )}
                        {order.totalAmount !== undefined && (
                          <span className="text-sm font-bold text-slate-900 whitespace-nowrap">{formatCurrency(order.totalAmount)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
