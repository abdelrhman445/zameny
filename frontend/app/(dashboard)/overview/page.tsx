'use client';
import React, { useEffect, useState } from 'react';
import {
  ShoppingCart, TrendingUp, AlertTriangle, Package,
  ShieldCheck, Clock, Truck, CheckCircle,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { StatsResponse, OrderStat } from '@/types';
import { formatCurrency } from '@/lib/utils';

const RISK_COLORS = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' };
const STATUS_COLORS: Record<string, string> = {
  Pending: '#94a3b8', Confirmed: '#3b82f6', Delivered: '#10b981',
  RTO: '#f97316', Cancelled: '#6b7280', Flagged: '#ef4444', Shipped: '#6366f1',
};

export default function OverviewPage() {
  const { merchant } = useAuthStore();
  const [stats, setStats] = useState<StatsResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<StatsResponse>('/orders/stats/summary');
      setStats(res.data.data);
    } catch {
      setError('فشل تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) return <PageLoading label="جاري تحميل لوحة التحكم..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchStats} />;

  const totalOrders = stats?.orderStats.reduce((sum, s) => sum + s.count, 0) || 0;
  const totalRevenue = stats?.orderStats.reduce((sum, s) => sum + s.totalRevenue, 0) || 0;
  const deliveredCount = stats?.orderStats.find((s) => s._id === 'Delivered')?.count || 0;
  const rtoCount = stats?.orderStats.find((s) => s._id === 'RTO')?.count || 0;
  const flaggedCount = stats?.orderStats.find((s) => s._id === 'Flagged')?.count || 0;
  const rtoRate = totalOrders > 0 ? ((rtoCount / totalOrders) * 100).toFixed(1) : '0';

  const barData = stats?.orderStats.map((s: OrderStat) => ({
    name: s._id,
    طلبات: s.count,
    إيراد: s.totalRevenue,
  })) || [];

  const pieData = stats?.fraudStats.map((f) => ({
    name: f._id,
    value: f.count,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          أهلاً، {merchant?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          إليك ملخص أداء متجرك <strong>{merchant?.storeName}</strong>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="إجمالي الطلبات"
          value={totalOrders.toLocaleString()}
          icon={ShoppingCart}
          color="blue"
        />
        <StatsCard
          title="إجمالي الإيرادات"
          value={formatCurrency(totalRevenue)}
          icon={TrendingUp}
          color="emerald"
        />
        <StatsCard
          title="نسبة الإرجاع (RTO)"
          value={`${rtoRate}%`}
          subtitle={`${rtoCount} طلب مرتجع`}
          icon={AlertTriangle}
          color={parseFloat(rtoRate) > 30 ? 'red' : 'amber'}
        />
        <StatsCard
          title="طلبات مشبوهة"
          value={flaggedCount}
          subtitle="تحتاج مراجعة"
          icon={ShieldCheck}
          color={flaggedCount > 0 ? 'red' : 'emerald'}
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'انتظار', count: stats?.orderStats.find(s => s._id === 'Pending')?.count || 0, icon: Clock, color: 'bg-slate-100 text-slate-600' },
          { label: 'مؤكدة', count: stats?.orderStats.find(s => s._id === 'Confirmed')?.count || 0, icon: CheckCircle, color: 'bg-blue-50 text-blue-700' },
          { label: 'شحن', count: stats?.orderStats.find(s => s._id === 'Shipped')?.count || 0, icon: Truck, color: 'bg-indigo-50 text-indigo-700' },
          { label: 'مسلّمة', count: deliveredCount, icon: Package, color: 'bg-emerald-50 text-emerald-700' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`rounded-xl p-4 ${item.color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium opacity-70">{item.label}</p>
                  <p className="text-2xl font-bold">{item.count}</p>
                </div>
                <Icon className="w-6 h-6 opacity-60" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">توزيع الطلبات حسب الحالة</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Cairo' }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontFamily: 'Cairo', fontSize: 12, borderRadius: 8 }}
                  formatter={(v: number, name: string) => [
                    name === 'إيراد' ? formatCurrency(v) : v,
                    name,
                  ]}
                />
                <Bar dataKey="طلبات" fill="#1e293b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fraud Pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">توزيع مستوى الخطر</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={RISK_COLORS[entry.name as keyof typeof RISK_COLORS] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontFamily: 'Cairo', fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {Object.entries(RISK_COLORS).map(([key, color]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs text-muted-foreground">{key}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
