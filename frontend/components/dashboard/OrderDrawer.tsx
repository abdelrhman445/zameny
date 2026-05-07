'use client';

import React, { useState } from 'react';
import { 
  X, Phone, MapPin, Package, Clock, CheckCircle2, 
  XCircle, Truck, ShieldAlert, User, ShieldCheck, CreditCard 
} from 'lucide-react';
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
  Pending: 'قيد الانتظار',
  Flagged: 'مشبوه',
  Confirmed: 'تم التأكيد',
  Shipped: 'جاري الشحن',
  Delivered: 'تم التسليم',
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
      toast.success(`تم تحديث حالة الطلب إلى "${STATUS_LABELS[newStatus]}"`);
      onStatusUpdated(order._id, newStatus);
      setNewStatus('');
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'حدث خطأ أثناء التحديث';
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className={cn(
          'fixed inset-0 bg-slate-900/40 backdrop-blur-md z-40 transition-all duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* ── Drawer ── */}
      <div
        className={cn(
          'fixed left-0 top-0 h-screen w-full sm:w-[480px] bg-[#f8fafc] shadow-[20px_0_50px_rgba(0,0,0,0.1)] z-50 transition-transform duration-500 ease-in-out overflow-y-auto scrollbar-thin',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        dir="rtl"
      >
        {/* ── Sticky Header ── */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-5 flex items-center justify-between z-20">
          <div>
            <h2 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-500" /> تفاصيل الطلب
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-mono select-all">
                {order.orderNumber}
              </p>
              <span className="text-slate-300">•</span>
              <p className="text-xs font-medium text-slate-500">{formatDate(order.createdAt)}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 pb-24">
          
          {/* ── Status & Fraud Header ── */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">الحالة الحالية</span>
              <span className={cn('px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 w-max', getStatusColor(order.status))}>
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                {STATUS_LABELS[order.status]}
              </span>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">مؤشر الأمان</span>
              <FraudBadge fraudAnalysis={order.fraudAnalysis} showScore />
            </div>
          </div>

          {/* ── Customer Info Card ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-black text-indigo-500/80 uppercase tracking-widest px-1">بيانات العميل</h3>
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="font-black text-slate-900 text-base">{order.customerName}</p>
              </div>
              
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span dir="ltr" className="select-all">{order.customerPhone}</span>
                </div>
                {order.customerAddress && (
                  <div className="flex items-start gap-3 text-sm font-bold text-slate-600 bg-slate-50 p-3 rounded-xl">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{order.customerAddress} {order.customerCity && `، ${order.customerCity}`}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── Fraud Analysis Details ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-black text-indigo-500/80 uppercase tracking-widest px-1">تحليل محرك الاحتيال</h3>
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-600">درجة الثقة والأمان</span>
                  <span className="font-black text-slate-900">{order.fraudAnalysis.score} / 100</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-1000', {
                      'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]': order.fraudAnalysis.riskLevel === 'Low',
                      'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]': order.fraudAnalysis.riskLevel === 'Medium',
                      'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]': order.fraudAnalysis.riskLevel === 'High',
                    })}
                    style={{ width: `${order.fraudAnalysis.score}%` }}
                  />
                </div>
                {order.fraudAnalysis.reason && (
                  <p className="text-xs font-medium text-slate-500 leading-relaxed pt-1">{order.fraudAnalysis.reason}</p>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                <span className={cn('text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border', 
                  order.fraudAnalysis.isNewCustomer ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                )}>
                  {order.fraudAnalysis.isNewCustomer ? '🟡 عميل جديد' : '🟢 عميل سابق وموثوق'}
                </span>
                <span className={cn('text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border', 
                  order.fraudAnalysis.ipMismatch ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                )}>
                  {order.fraudAnalysis.ipMismatch ? '🔴 اختلاف في الـ IP' : '🟢 IP متطابق'}
                </span>
              </div>
            </div>
          </section>

          {/* ── Order Items & Financials ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-black text-indigo-500/80 uppercase tracking-widest px-1">المنتجات والفاتورة</h3>
            <div className="bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
              <div className="divide-y divide-slate-100">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                        <Package className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-slate-900">{item.name}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">الكمية: <span className="font-bold text-indigo-600">{item.quantity}</span></p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-slate-900">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>
              
              <div className="p-5 bg-white border-t border-slate-100 space-y-3">
                <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                  <span>طريقة الدفع</span>
                  <span className="flex items-center gap-1.5 text-slate-900">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    {order.paymentMethod === 'COD' ? 'الدفع عند الاستلام' : 'دفع إلكتروني'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-dashed border-slate-200">
                  <span className="font-black text-slate-900">الإجمالي النهائي</span>
                  <span className="text-2xl font-black text-indigo-600 tracking-tighter">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Notes ── */}
          {order.notes && (
            <section className="space-y-3">
              <h3 className="text-xs font-black text-indigo-500/80 uppercase tracking-widest px-1">ملاحظات العميل</h3>
              <p className="text-sm font-bold text-slate-700 bg-amber-50/50 border border-amber-100 rounded-2xl p-4 leading-relaxed">
                {order.notes}
              </p>
            </section>
          )}

          {/* ── Status Timeline ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-black text-indigo-500/80 uppercase tracking-widest px-1">سجل الحالات</h3>
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
              <div className="relative border-r-2 border-slate-100 pr-4 space-y-6">
                {order.statusHistory.map((entry, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -right-[23px] top-1 w-3 h-3 rounded-full bg-slate-200 border-2 border-white shadow-sm" />
                    <div className="flex flex-col gap-1">
                      <span className={cn('w-max px-2.5 py-1 rounded-md text-[10px] font-black', getStatusColor(entry.status as OrderStatus))}>
                        {STATUS_LABELS[entry.status as OrderStatus] || entry.status}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">{formatDate(entry.changedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>

        {/* ── Fixed Bottom Actions (Update Status) ── */}
        {allowedNext.length > 0 && (
          <div className="fixed bottom-0 left-0 w-full sm:w-[480px] bg-white/90 backdrop-blur-xl border-t border-slate-200/60 p-4 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] space-y-3">
            
            {/* Quick Action Buttons (If applicable) */}
            <div className="flex gap-2 w-full">
              {order.status === 'Pending' || order.status === 'Flagged' ? (
                <>
                  <Button
                    className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95"
                    onClick={() => { setNewStatus('Confirmed'); handleStatusUpdate(); }}
                    disabled={updating}
                  >
                    <CheckCircle2 className="w-5 h-5 ml-1.5" /> تأكيد وشحن
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-12 border-rose-200 text-rose-600 hover:bg-rose-50 font-black rounded-xl transition-all active:scale-95"
                    onClick={() => { setNewStatus('Cancelled'); handleStatusUpdate(); }}
                    disabled={updating}
                  >
                    <XCircle className="w-5 h-5 ml-1.5" /> إلغاء الطلب
                  </Button>
                </>
              ) : order.status === 'Confirmed' ? (
                <Button
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
                  onClick={() => { setNewStatus('Shipped'); handleStatusUpdate(); }}
                  disabled={updating}
                >
                  <Truck className="w-5 h-5 ml-1.5" /> تحويل إلى "جاري الشحن"
                </Button>
              ) : (
                /* Custom Select for other transitions */
                <div className="flex gap-2 w-full">
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
                    <SelectTrigger className="flex-1 h-12 rounded-xl bg-slate-50 border-slate-200 font-bold text-slate-700">
                      <SelectValue placeholder="اختر الحالة الجديدة..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                      {allowedNext.map((s) => (
                        <SelectItem key={s} value={s} className="font-bold">{STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={!newStatus || updating}
                    className="h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-md transition-all active:scale-95"
                  >
                    {updating ? 'جاري...' : 'تحديث'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}