'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Search, Filter, ChevronLeft, ChevronRight, Eye, CheckCircle2,
  XCircle, RefreshCw, Download,
} from 'lucide-react';
import { Order, OrdersResponse, OrderStatus, RiskLevel } from '@/types';
import { cn, formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import FraudBadge from '@/components/dashboard/FraudBadge';
import OrderDrawer from '@/components/dashboard/OrderDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import api from '@/lib/api';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  Pending: 'انتظار', Flagged: 'مشبوه', Confirmed: 'مؤكد',
  Shipped: 'شحن', Delivered: 'مسلّم', RTO: 'مرتجع', Cancelled: 'ملغي',
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
      setError('فشل تحميل الطلبات');
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
      toast.success(`تم تحديث الطلب إلى "${label}"`);
      handleStatusUpdated(orderId, status);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'حدث خطأ';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة الطلبات</h1>
          <p className="text-sm text-muted-foreground mt-0.5">إجمالي {total} طلب</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders}>
          <RefreshCw className="w-4 h-4 ml-1.5" /> تحديث
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث برقم الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
            className="pr-9 text-sm"
            dir="ltr"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="مستوى الخطر" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المستويات</SelectItem>
            <SelectItem value="Low">🟢 آمن</SelectItem>
            <SelectItem value="Medium">🟡 متوسط</SelectItem>
            <SelectItem value="High">🔴 خطر</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <PageLoading label="جاري تحميل الطلبات..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchOrders} />
      ) : orders.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <ShoppingCartEmpty />
          <p className="mt-3 text-sm">لا توجد طلبات بهذه المعايير</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs whitespace-nowrap">رقم الطلب</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs whitespace-nowrap">العميل</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs whitespace-nowrap">المبلغ</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs whitespace-nowrap">الحالة</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs whitespace-nowrap">درجة الأمان</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs whitespace-nowrap">التاريخ</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs whitespace-nowrap">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    className={cn(
                      'hover:bg-slate-50/80 transition-colors group',
                      order.fraudAnalysis.riskLevel === 'High' && 'bg-red-50/30 hover:bg-red-50/50'
                    )}
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-medium text-slate-700">{order.orderNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">{order.customerPhone}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap', getStatusColor(order.status))}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <FraudBadge fraudAnalysis={order.fraudAnalysis} showScore />
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleViewOrder(order)}
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {(order.status === 'Pending' || order.status === 'Flagged') && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleQuickAction(order._id, 'Confirmed', 'مؤكد')}
                              title="تأكيد"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleQuickAction(order._id, 'Cancelled', 'ملغي')}
                              title="إلغاء"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
              <p className="text-xs text-muted-foreground">
                صفحة {page} من {totalPages} ({total} طلب)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Detail Drawer */}
      <OrderDrawer
        order={selectedOrder}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedOrder(null); }}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
}

function ShoppingCartEmpty() {
  return (
    <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
      <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    </div>
  );
}
