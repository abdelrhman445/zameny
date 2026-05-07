'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Search, Filter, ChevronLeft, ChevronRight, Eye, CheckCircle2,
  XCircle, RefreshCw, Download, Inbox, Truck
} from 'lucide-react';
import { Order, OrdersResponse, OrderStatus, RiskLevel } from '@/types';
import { cn, formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import FraudBadge from '@/components/dashboard/FraudBadge';
import OrderDrawer from '@/components/dashboard/OrderDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import api from '@/lib/api';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  Pending: 'قيد الانتظار', Flagged: 'مشبوه', Confirmed: 'تم التأكيد',
  Shipped: 'جاري الشحن', Delivered: 'تم التسليم', RTO: 'مرتجع', Cancelled: 'ملغي',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (riskFilter !== 'all') params.riskLevel = riskFilter;
      if (search.trim()) params.phone = search.trim();

      const res = await api.get<OrdersResponse>('/orders', { params });
      setOrders(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch {
      setError('تعذر تحميل الطلبات، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, riskFilter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [statusFilter, riskFilter]);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const handleStatusUpdated = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => o._id === orderId ? { ...o, status: newStatus } : o)
    );
  };

  const handleQuickAction = async (orderId: string, status: OrderStatus, label: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      toast.success(`تم تحديث حالة الطلب إلى "${label}"`);
      handleStatusUpdated(orderId, status);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'حدث خطأ أثناء التحديث';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10" dir="rtl">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة الطلبات</h1>
          <p className="text-sm font-medium text-slate-500 mt-1.5">
            تتبع ومراجعة جميع طلبات متجرك (إجمالي <strong className="text-slate-700">{total}</strong> طلب)
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchOrders} 
          className="rounded-xl border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm h-11 px-6 transition-all flex items-center gap-2 font-bold"
        >
          <RefreshCw className={cn("w-4 h-4 text-slate-500", loading && "animate-spin")} />
          تحديث البيانات
        </Button>
      </div>

      {/* ── Action Bar (Filters & Search) ── */}
      <div className="bg-white border border-slate-200/60 p-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col md:flex-row gap-3 items-center justify-between transition-all">
        
        {/* Search */}
        <div className="relative w-full md:max-w-md group">
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <Input
            placeholder="ابحث برقم هاتف العميل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
            autoComplete="off"
            className="pr-11 h-12 bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 rounded-xl text-sm font-bold text-slate-900 transition-all"
            dir="ltr"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50/50 border border-slate-200 rounded-xl px-2 h-12 hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] border-0 bg-transparent shadow-none focus:ring-0 px-1 text-sm font-bold text-slate-700">
                <SelectValue placeholder="حالة الطلب" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                <SelectItem value="all" className="font-bold">كل الحالات</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="font-bold">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-[160px] h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:ring-indigo-500 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
              <SelectValue placeholder="مستوى الخطر" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
              <SelectItem value="all" className="font-bold">كل المستويات</SelectItem>
              <SelectItem value="Low" className="font-bold">🟢 آمن</SelectItem>
              <SelectItem value="Medium" className="font-bold">🟡 خطر متوسط</SelectItem>
              <SelectItem value="High" className="font-bold">🔴 عالي الخطر</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Data Grid (Table) ── */}
      {loading ? (
        <PageLoading label="جاري جلب الطلبات..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchOrders} />
      ) : orders.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center bg-white/50 border border-dashed border-slate-300 rounded-[2.5rem]">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-5 border border-slate-100">
            <Inbox className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-800">لا توجد طلبات هنا</h3>
          <p className="text-slate-500 text-sm mt-2 max-w-sm text-center font-medium leading-relaxed">
            لم نعثر على أي طلبات تطابق معايير البحث الحالية. جرب تغيير الفلاتر أو امسح رقم الهاتف للبحث من جديد.
          </p>
          {search && (
             <Button variant="outline" className="mt-6 rounded-xl font-bold" onClick={() => setSearch('')}>مسح البحث</Button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/60 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all">
          
          {/* ✅ حاوية الجدول مع تحديد أدنى للعرض وسكرول أفقي للموبايل */}
          <div className="w-full overflow-x-auto scrollbar-thin pb-2">
            <table className="w-full text-sm text-right min-w-[1050px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="py-5 px-6 font-black text-slate-400 text-xs tracking-wider whitespace-nowrap w-[120px]">رقم الطلب</th>
                  <th className="py-5 px-6 font-black text-slate-400 text-xs tracking-wider whitespace-nowrap w-[200px]">العميل</th>
                  <th className="py-5 px-6 font-black text-slate-400 text-xs tracking-wider whitespace-nowrap">إجمالي المبلغ</th>
                  <th className="py-5 px-6 font-black text-slate-400 text-xs tracking-wider whitespace-nowrap">حالة الطلب</th>
                  <th className="py-5 px-6 font-black text-slate-400 text-xs tracking-wider whitespace-nowrap">مؤشر الأمان</th>
                  <th className="py-5 px-6 font-black text-slate-400 text-xs tracking-wider whitespace-nowrap">تاريخ الطلب</th>
                  <th className="py-5 px-6 font-black text-slate-400 text-xs tracking-wider whitespace-nowrap text-left w-[240px]">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const isHighRisk = order.fraudAnalysis.riskLevel === 'High';
                  return (
                    <tr
                      key={order._id}
                      className={cn(
                        'hover:bg-slate-50/50 transition-colors group relative',
                        isHighRisk && 'bg-rose-50/20 hover:bg-rose-50/40'
                      )}
                    >
                      {/* High Risk Indicator Line */}
                      {isHighRisk && (
                        <td className="absolute right-0 top-0 bottom-0 w-1.5 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]" />
                      )}

                      <td className="py-4 px-6">
                        <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg select-all inline-block">
                          {order.orderNumber}
                        </span>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-900 text-sm truncate max-w-[180px]" title={order.customerName}>{order.customerName}</span>
                          <span className="text-[11px] font-bold text-slate-500" dir="ltr">{order.customerPhone}</span>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6 font-black text-slate-900 whitespace-nowrap text-base">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={cn('px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 border', getStatusColor(order.status))}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      
                      <td className="py-4 px-6 whitespace-nowrap">
                        <FraudBadge fraudAnalysis={order.fraudAnalysis} showScore />
                      </td>
                      
                      <td className="py-4 px-6 text-xs font-bold text-slate-500 whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap min-w-max">
                          
                          {/* Quick Actions for Pending/Flagged */}
                          {(order.status === 'Pending' || order.status === 'Flagged') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-3 rounded-lg border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 font-bold transition-colors"
                                onClick={() => handleQuickAction(order._id, 'Confirmed', 'تم التأكيد')}
                                title="تأكيد الطلب"
                              >
                                <CheckCircle2 className="w-4 h-4 ml-1.5" /> تأكيد
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-3 rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 font-bold transition-colors"
                                onClick={() => handleQuickAction(order._id, 'Cancelled', 'ملغي')}
                                title="إلغاء الطلب"
                              >
                                <XCircle className="w-4 h-4 ml-1.5" /> إلغاء
                              </Button>
                              <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block" />
                            </>
                          )}

                          {/* Quick Action for Confirmed (Ship it) */}
                          {order.status === 'Confirmed' && (
                             <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-3 rounded-lg border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 font-bold transition-colors"
                                onClick={() => handleQuickAction(order._id, 'Shipped', 'تم الشحن')}
                              >
                                <Truck className="w-4 h-4 ml-1.5" /> شحن
                              </Button>
                              <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block" />
                             </>
                          )}

                          {/* View Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-3 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 font-bold transition-colors"
                            onClick={() => handleViewOrder(order)}
                            title="عرض التفاصيل الكاملة"
                          >
                            <Eye className="w-4 h-4 ml-1.5" /> التفاصيل
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4">
              <p className="text-xs font-bold text-slate-500">
                عرض الصفحة <strong className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{page}</strong> من <strong className="text-slate-900">{totalPages}</strong>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-10 w-10 p-0 border-slate-200 hover:bg-slate-100 shadow-sm transition-colors"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
                <div className="flex items-center justify-center min-w-[40px]">
                  <span className="text-sm font-black text-slate-700">{page}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-10 w-10 p-0 border-slate-200 hover:bg-slate-100 shadow-sm transition-colors"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Order Detail Drawer ── */}
      <OrderDrawer
        order={selectedOrder}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedOrder(null); }}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
}