'use client';

import React, { useEffect, useState } from 'react';
import {
  ShoppingCart, TrendingUp, AlertTriangle, Package,
  ShieldCheck, Clock, Truck, CheckCircle, Activity, ArrowUpRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { StatsResponse, OrderStat } from '@/types';
import { formatCurrency } from '@/lib/utils';

const RISK_COLORS = { Low: '#10b981', Medium: '#f59e0b', High: '#f43f5e' };

export default function OverviewPage() {
  const { merchant } = useAuthStore();
  const [stats, setStats] = useState<StatsResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('أهلاً');

  // تحديد التحية حسب الوقت
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('صباح الخير');
    else if (hour < 18) setGreeting('مساء الخير');
    else setGreeting('مرحباً');
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<StatsResponse>('/orders/stats/summary');
      setStats(res.data.data);
    } catch {
      setError('تعذر تحميل الإحصائيات، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) return <PageLoading label="جاري تجميع بيانات متجرك..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchStats} />;

  // الحسابات
  const totalOrders = stats?.orderStats.reduce((sum, s) => sum + s.count, 0) || 0;
  const totalRevenue = stats?.orderStats.reduce((sum, s) => sum + s.totalRevenue, 0) || 0;
  const deliveredCount = stats?.orderStats.find((s) => s._id === 'Delivered')?.count || 0;
  const rtoCount = stats?.orderStats.find((s) => s._id === 'RTO')?.count || 0;
  const flaggedCount = stats?.orderStats.find((s) => s._id === 'Flagged')?.count || 0;
  const rtoRate = totalOrders > 0 ? ((rtoCount / totalOrders) * 100).toFixed(1) : '0';

  // داتا الرسوم البيانية
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
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 mb-3 shadow-sm">
            <Activity className="w-3.5 h-3.5 text-rose-500" />
            <span>تحديث مباشر</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {greeting}، {merchant?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1.5">
            نظرة عامة على أداء متجرك <strong className="text-slate-700">{merchant?.storeName}</strong> حتى هذه اللحظة.
          </p>
        </div>
      </div>

      {/* ── Primary KPI Cards (Premium SaaS Style) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* إجمالي الإيرادات */}
        <div className="relative overflow-hidden bg-white border border-slate-200/60 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-all group-hover:bg-emerald-500/20" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <p className="text-sm font-bold text-slate-500">إجمالي الإيرادات</p>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-black text-slate-900">{formatCurrency(totalRevenue)}</h3>
            <p className="text-xs font-medium text-emerald-600 mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> شامل الطلبات المسلمة
            </p>
          </div>
        </div>

        {/* إجمالي الطلبات */}
        <div className="relative overflow-hidden bg-white border border-slate-200/60 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-all group-hover:bg-indigo-500/20" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <p className="text-sm font-bold text-slate-500">إجمالي الطلبات</p>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <ShoppingCart className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-black text-slate-900">{totalOrders.toLocaleString()} <span className="text-base font-semibold text-slate-400">طلب</span></h3>
            <p className="text-xs font-medium text-indigo-600 mt-2 flex items-center gap-1">
              أداء مستقر
            </p>
          </div>
        </div>

        {/* معدل الإرجاع */}
        <div className="relative overflow-hidden bg-white border border-slate-200/60 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-all group-hover:bg-amber-500/20" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <p className="text-sm font-bold text-slate-500">نسبة الإرجاع (RTO)</p>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-black text-slate-900">{rtoRate}%</h3>
            <p className={`text-xs font-medium mt-2 flex items-center gap-1 ${parseFloat(rtoRate) > 15 ? 'text-rose-600' : 'text-amber-600'}`}>
              يمثل {rtoCount} طلب مرتجع
            </p>
          </div>
        </div>

        {/* طلبات مشبوهة */}
        <div className="relative overflow-hidden bg-white border border-slate-200/60 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-all group-hover:bg-rose-500/20" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <p className="text-sm font-bold text-slate-500">طلبات مشبوهة</p>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${flaggedCount > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <ShieldCheck className={`w-5 h-5 ${flaggedCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-black text-slate-900">{flaggedCount} <span className="text-base font-semibold text-slate-400">طلب</span></h3>
            <p className={`text-xs font-medium mt-2 flex items-center gap-1 ${flaggedCount > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
              {flaggedCount > 0 ? 'تتطلب مراجعتك فوراً' : 'متجرك آمن حالياً'}
            </p>
          </div>
        </div>

      </div>

      {/* ── Secondary Stats (Minimal Badges) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'قيد الانتظار', count: stats?.orderStats.find(s => s._id === 'Pending')?.count || 0, icon: Clock, bg: 'bg-slate-50', text: 'text-slate-600' },
          { label: 'تم التأكيد', count: stats?.orderStats.find(s => s._id === 'Confirmed')?.count || 0, icon: CheckCircle, bg: 'bg-blue-50/50', text: 'text-blue-600' },
          { label: 'جاري الشحن', count: stats?.orderStats.find(s => s._id === 'Shipped')?.count || 0, icon: Truck, bg: 'bg-indigo-50/50', text: 'text-indigo-600' },
          { label: 'تم التسليم', count: deliveredCount, icon: Package, bg: 'bg-emerald-50/50', text: 'text-emerald-600' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`rounded-2xl p-5 border border-slate-100 flex items-center justify-between ${item.bg}`}>
              <div>
                <p className="text-xs font-bold text-slate-500 mb-1">{item.label}</p>
                <p className="text-2xl font-black text-slate-900">{item.count}</p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm ${item.text}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar chart */}
        <Card className="lg:col-span-2 border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle className="text-base font-bold text-slate-800">توزيع الطلبات حسب الحالة</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 700 }}
                  labelStyle={{ color: '#64748b', fontWeight: 600, marginBottom: '4px' }}
                  formatter={(v: number, name: string) => [
                    name === 'إيراد' ? formatCurrency(v) : v,
                    name,
                  ]}
                />
                <Bar dataKey="طلبات" fill="url(#colorCount)" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fraud Donut chart */}
        <Card className="border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle className="text-base font-bold text-slate-800">تحليل محرك الاحتيال (الخطر)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={RISK_COLORS[entry.name as keyof typeof RISK_COLORS] || '#cbd5e1'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 700 }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Custom Legend */}
            <div className="flex justify-center gap-5 mt-4 pt-4 border-t border-slate-100">
              {Object.entries(RISK_COLORS).map(([key, color]) => {
                const translation = key === 'Low' ? 'آمن' : key === 'Medium' ? 'متوسط' : 'عالي الخطر';
                return (
                  <div key={key} className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                      <span className="text-xs font-bold text-slate-600">{translation}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}