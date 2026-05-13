'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, User, Phone, MapPin, Package, ShieldCheck, 
  AlertTriangle, CheckCircle2, XCircle, Truck, 
  Calendar, CreditCard, Receipt, AlertCircle, CheckCheck
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'sonner';

interface OrderDrawerProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdated: (orderId: string, status: OrderStatus) => void;
}

const ALLOWED_TRANSITIONS: Record<string, OrderStatus[]> = {
  Pending: ['Confirmed', 'Cancelled'],
  Flagged: ['Confirmed', 'Cancelled'],
  Confirmed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered', 'RTO'],
  Delivered: [],
  RTO: [],
  Cancelled: [],
};

const STATUS_LABELS: Record<string, string> = {
  Pending: 'قيد الانتظار', Flagged: 'مشبوه', Confirmed: 'تم التأكيد',
  Shipped: 'جاري الشحن', Delivered: 'تم التسليم', RTO: 'مرتجع', Cancelled: 'ملغي',
};

export default function OrderDrawer({ order, open, onClose, onStatusUpdated }: OrderDrawerProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  
  // ✅ إضافة حالة محلية لمتابعة حالة الطلب وتحديث الواجهة فوراً
  const [currentStatus, setCurrentStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setNewStatus('');
      // مزامنة الحالة المحلية مع حالة الطلب عند الفتح
      if (order) setCurrentStatus(order.status);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [open, order]);

  if (!order || !currentStatus) return null;

  const isHighRisk = order.fraudAnalysis?.riskLevel === 'High';
  const isMediumRisk = order.fraudAnalysis?.riskLevel === 'Medium';
  
  // استخدام الحالة المحلية بدلاً من prop order.status
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];

  const handleAction = async (status: OrderStatus, actionName?: string) => {
    setLoadingAction(status);
    try {
      await api.patch(`/orders/${order._id}/status`, { status });
      toast.success(`تم تحديث حالة الطلب إلى "${actionName || STATUS_LABELS[status]}"`);
      
      // ✅ التحديث السحري: نحدث الحالة المحلية فوراً
      setCurrentStatus(status);
      onStatusUpdated(order._id, status);
      setNewStatus('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'حدث خطأ أثناء التحديث';
      toast.error(msg);
    } finally {
      setLoadingAction(null);
    }
  };

  const customerName = order.customerName || 'عميل غير معروف';
  const firstLetter = customerName.charAt(0) || 'U';
  const totalAmount = order.totalAmount || 0;
  const fraudScore = order.fraudAnalysis?.score ?? 100;

  const fullAddress = order.customerAddress 
    ? `${order.customerAddress}${order.customerCity ? `، ${order.customerCity}` : ''}`
    : 'العنوان غير متوفر';

  return (
    <div className={cn(
      "fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 transition-all duration-300",
      open ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
    )}>
      
      <div className={cn("absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300", open ? "opacity-100" : "opacity-0")} onClick={onClose} />
      
      <div dir="rtl" className={cn("relative w-full max-w-[420px] max-h-[90vh] bg-slate-50/90 rounded-[1.5rem] shadow-2xl flex flex-col overflow-hidden transform transition-all duration-300", open ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-8 opacity-0")}>
        
        {/* ── Header ── */}
        <div className="flex-shrink-0 px-5 py-4 bg-white border-b border-slate-200/60 flex items-center justify-between z-10 shadow-sm">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              تفاصيل الطلب
              <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50 mt-0.5 select-all">
                {order.orderNumber || 'بدون رقم'}
              </span>
            </h2>
            <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 mt-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {order.createdAt ? formatDate(order.createdAt) : 'تاريخ غير متوفر'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 scrollbar-thin scrollbar-thin-slate">
          
          {/* Status Badge - Updated with local state */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
            <span className="text-xs font-bold text-slate-600">الحالة الحالية:</span>
            <span className="px-3 py-1 rounded-lg text-xs font-black bg-slate-50 border border-slate-200/60 text-slate-800 animate-in fade-in zoom-in duration-300">
              {STATUS_LABELS[currentStatus] || currentStatus}
            </span>
          </div>

          {/* Customer */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)] space-y-3">
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-indigo-500" /> العميل</h3>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm shrink-0 border border-indigo-100/50">{firstLetter}</div>
              <div>
                <p className="text-sm font-bold text-slate-900">{customerName}</p>
                <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5" dir="ltr"><Phone className="w-3 h-3" />{order.customerPhone || 'رقم غير متوفر'}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-50 flex items-start gap-2 text-xs">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-slate-600 font-medium leading-relaxed">{fullAddress}</p>
            </div>
          </div>

          {/* Fraud Analysis */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5"><ShieldCheck className={cn("w-3.5 h-3.5", isHighRisk ? "text-rose-500" : isMediumRisk ? "text-amber-500" : "text-emerald-500")} /> مؤشر الأمان</h3>
              <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-black border", isHighRisk ? "bg-rose-50 text-rose-700 border-rose-200" : isMediumRisk ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200")}>{fraudScore} / 100</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-1000", isHighRisk ? "bg-rose-500" : isMediumRisk ? "bg-amber-400" : "bg-emerald-500")} style={{ width: `${fraudScore}%` }} />
            </div>
          </div>

          {/* Invoice */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)] space-y-3">
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5 text-indigo-500" /> الفاتورة</h3>
            <div className="space-y-2">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center shadow-sm"><Package className="w-3.5 h-3.5 text-slate-400" /></div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">{item.name || item.productName || 'اسم المنتج'}</p>
                      <p className="text-[10px] font-medium text-slate-500">الكمية: <span className="font-bold text-slate-700">{item.quantity || 1}</span></p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-800 bg-white px-2 py-1 rounded-md border border-slate-100">{formatCurrency(item.subtotal || ((item.price || 0) * (item.quantity || 1)))}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-50 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500"><span>طريقة الدفع</span><span className="text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">{order.paymentMethod === 'COD' ? 'دفع عند الاستلام' : order.paymentMethod || 'دفع عند الاستلام'}</span></div>
              <div className="flex items-center justify-between pt-1"><span className="text-sm font-black text-slate-900">الإجمالي</span><span className="text-base font-black text-indigo-600">{formatCurrency(totalAmount)}</span></div>
            </div>
          </div>
        </div>

        {/* ── Footer - Updated to react to currentStatus ── */}
        <div className="flex-shrink-0 p-4 bg-white border-t border-slate-200/60 rounded-b-[1.5rem] z-10 shadow-sm">
          {(currentStatus === 'Pending' || currentStatus === 'Flagged') ? (
            <div className="flex gap-2">
              <Button onClick={() => handleAction('Confirmed', 'تم التأكيد')} disabled={!!loadingAction} className="flex-1 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-md shadow-emerald-500/20 text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 ml-1.5" /> {loadingAction === 'Confirmed' ? 'جاري...' : 'تأكيد وشحن'}
              </Button>
              <Button variant="outline" onClick={() => handleAction('Cancelled', 'ملغي')} disabled={!!loadingAction} className="h-10 px-4 sm:px-5 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 font-bold text-xs sm:text-sm bg-white">
                <XCircle className="w-4 h-4 ml-1.5" /> إلغاء
              </Button>
            </div>
          ) : currentStatus === 'Confirmed' ? (
            <Button onClick={() => handleAction('Shipped', 'تم الشحن')} disabled={!!loadingAction} className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md shadow-indigo-600/20 text-sm">
              <Truck className="w-4 h-4 ml-1.5" /> {loadingAction === 'Shipped' ? 'جاري...' : 'تحويل لـ "جاري الشحن"'}
            </Button>
          ) : allowedNext.length > 0 ? (
            <div className="flex gap-2 w-full">
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
                <SelectTrigger className="flex-1 h-10 rounded-xl bg-slate-50 border-slate-200/60 font-bold text-slate-700 text-xs focus:ring-0">
                  <SelectValue placeholder="اختر الحالة الجديدة..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  {allowedNext.map((s) => (
                    <SelectItem key={s} value={s} className="font-bold text-xs">{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => handleAction(newStatus as OrderStatus)} disabled={!newStatus || !!loadingAction} className="h-10 px-6 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-md transition-all text-xs">
                {loadingAction ? '...' : 'تحديث'}
              </Button>
            </div>
          ) : (
            <div className="h-10 w-full flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200/60 text-slate-500 font-bold text-xs shadow-sm">
              الحالة النهائية: {STATUS_LABELS[currentStatus]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}