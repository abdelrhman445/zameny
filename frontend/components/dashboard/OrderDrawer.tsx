'use client';
import React, { useState } from 'react';
import { X, Phone, MapPin, Package, Clock, CheckCircle2, XCircle, Truck, AlertTriangle } from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { cn, formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import FraudBadge from './FraudBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'sonner';

interface OrderDrawerProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdated: (orderId: string, newStatus: OrderStatus) => void;
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  Pending: ['Confirmed', 'Cancelled'],
  Flagged: ['Confirmed', 'Cancelled'],
  Confirmed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered', 'RTO'],
  Delivered: [],
  RTO: [],
  Cancelled: [],
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  Pending: 'انتظار',
  Flagged: 'مشبوه',
  Confirmed: 'مؤكد',
  Shipped: 'شحن',
  Delivered: 'مسلّم',
  RTO: 'مرتجع',
  Cancelled: 'ملغي',
};

export default function OrderDrawer({ order, open, onClose, onStatusUpdated }: OrderDrawerProps) {
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');

  if (!order) return null;

  const allowedNext = ALLOWED_TRANSITIONS[order.status] || [];

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      await api.patch(`/orders/${order._id}/status`, { status: newStatus });
      toast.success(`تم تحديث الطلب إلى "${STATUS_LABELS[newStatus]}"`);
      onStatusUpdated(order._id, newStatus);
      setNewStatus('');
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'حدث خطأ';
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn('fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity', open ? 'opacity-100' : 'opacity-0 pointer-events-none')}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed left-0 top-0 h-screen w-full max-w-lg bg-white shadow-2xl z-50 transition-transform duration-300 overflow-y-auto scrollbar-thin',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">تفاصيل الطلب</h2>
            <p className="text-xs text-muted-foreground font-mono">{order.orderNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Fraud */}
          <div className="flex items-center justify-between">
            <span className={cn('px-3 py-1.5 rounded-full text-xs font-bold', getStatusColor(order.status))}>
              {STATUS_LABELS[order.status]}
            </span>
            <FraudBadge fraudAnalysis={order.fraudAnalysis} showScore />
          </div>

          {/* Customer Info */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">بيانات العميل</h3>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p className="font-semibold text-slate-900">{order.customerName}</p>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-3.5 h-3.5" />
                <span dir="ltr">{order.customerPhone}</span>
              </div>
              {order.customerAddress && (
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{order.customerAddress}</span>
                </div>
              )}
            </div>
          </section>

          {/* Fraud Details */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">تحليل الاحتيال</h3>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">درجة الأمان</span>
                <span className="font-bold">{order.fraudAnalysis.score}/100</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className={cn('h-2 rounded-full transition-all', {
                    'bg-emerald-500': order.fraudAnalysis.riskLevel === 'Low',
                    'bg-amber-500': order.fraudAnalysis.riskLevel === 'Medium',
                    'bg-red-500': order.fraudAnalysis.riskLevel === 'High',
                  })}
                  style={{ width: `${order.fraudAnalysis.score}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{order.fraudAnalysis.reason}</p>
              <div className="flex gap-4 text-xs">
                <span className={cn('font-medium', order.fraudAnalysis.isNewCustomer ? 'text-amber-600' : 'text-emerald-600')}>
                  {order.fraudAnalysis.isNewCustomer ? '🟡 عميل جديد' : '🟢 عميل سابق'}
                </span>
                <span className={cn('font-medium', order.fraudAnalysis.ipMismatch ? 'text-red-600' : 'text-emerald-600')}>
                  {order.fraudAnalysis.ipMismatch ? '🔴 IP مختلف' : '🟢 IP عادي'}
                </span>
              </div>
            </div>
          </section>

          {/* Order Items */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">المنتجات</h3>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">× {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-semibold text-slate-900">الإجمالي</span>
              <span className="text-lg font-bold text-slate-900">{formatCurrency(order.totalAmount)}</span>
            </div>
          </section>

          {/* Status Timeline */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">سجل الحالة</h3>
            <div className="space-y-2">
              {order.statusHistory.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
                  <span className={cn('font-medium px-2 py-0.5 rounded text-xs', getStatusColor(entry.status as OrderStatus))}>
                    {STATUS_LABELS[entry.status as OrderStatus] || entry.status}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(entry.changedAt)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Status Update */}
          {allowedNext.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">تغيير الحالة</h3>
              <div className="flex gap-2">
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="اختر الحالة الجديدة" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedNext.map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleStatusUpdate}
                  disabled={!newStatus || updating}
                  className="flex-shrink-0"
                >
                  {updating ? 'جاري...' : 'تحديث'}
                </Button>
              </div>
              {/* Quick actions */}
              <div className="flex gap-2">
                {order.status === 'Pending' || order.status === 'Flagged' ? (
                  <>
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => { setNewStatus('Confirmed'); }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> تأكيد الطلب
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => { setNewStatus('Cancelled'); }}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> إلغاء
                    </Button>
                  </>
                ) : order.status === 'Confirmed' ? (
                  <Button
                    size="sm"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => { setNewStatus('Shipped'); }}
                  >
                    <Truck className="w-3.5 h-3.5 mr-1" /> تحديد كـ"شحن"
                  </Button>
                ) : null}
              </div>
            </section>
          )}

          {/* Notes */}
          {order.notes && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ملاحظات</h3>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{order.notes}</p>
            </section>
          )}

          <div className="text-xs text-muted-foreground">
            <p>تاريخ الطلب: {formatDate(order.createdAt)}</p>
            <p>طريقة الدفع: {order.paymentMethod === 'COD' ? 'الدفع عند الاستلام' : 'دفع إلكتروني'}</p>
          </div>
        </div>
      </div>
    </>
  );
}
