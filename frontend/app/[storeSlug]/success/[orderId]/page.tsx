'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Package, Clock, ShieldCheck } from 'lucide-react';
import { io } from 'socket.io-client'; // 1. استيراد المكتبة
import { Order, SingleOrderResponse } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import api from '@/lib/api';

interface PageProps {
  params: { storeSlug: string; orderId: string };
}

const STATUS_LABELS: Record<string, string> = {
  Pending: 'في الانتظار', Confirmed: 'تم التأكيد', Shipped: 'في الشحن', Delivered: 'تم التسليم',
};

const STATUS_STEPS = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];

export default function SuccessPage({ params }: PageProps) {
  const { storeSlug, orderId } = params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // 2. دالة جلب البيانات الأولية (عشان لو العميل عمل ريفريش)
    const fetchOrder = async () => {
      try {
        const res = await api.get<SingleOrderResponse>(`/orders/${orderId}`);
        setOrder(res.data.data.order);
      } catch (err) {
        console.error("Failed to fetch order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // 3. إعداد الاتصال بالـ Socket
    // استبدل الرابط برابط الباك إند بتاعك (ممكن تحطه في .env)
  const socket = io('http://localhost:5000', {
    transports: ['polling', 'websocket'], // ابدأ بـ polling الأول عشان يشبك أسرع
    withCredentials: true
});

    // الانضمام لغرفة الأوردر ده بس عشان الأمان وخصوصية البيانات
    socket.emit('joinOrderRoom', orderId);

    // الاستماع لحدث التحديث (لما الباك إند يخلص شغل الويب هوك)
    socket.on('orderUpdated', (updatedOrder: Order) => {
      console.log("⚡ Order Status Updated via Socket:", updatedOrder.status);
      setOrder(updatedOrder);
    });

    // 4. الـ Cleanup عند الخروج من الصفحة
    return () => {
      socket.emit('leaveOrderRoom', orderId);
      socket.off('orderUpdated');
      socket.disconnect();
    };
  }, [orderId]);

  if (!isMounted || loading) return <PageLoading label="جاري تحميل تفاصيل طلبك..." />;
  if (!order) return <div className="py-20 text-center">لم يتم العثور على الطلب</div>;

  // تحديد الحالة الفعلية (لو مدفوع أونلاين ولسه بنأكد بنعرض Confirmed)
  const effectiveStatus = (order.paymentStatus === 'Paid' && order.status === 'Pending') ? 'Confirmed' : order.status;
  const currentStepIndex = STATUS_STEPS.indexOf(effectiveStatus);

  return (
    <div className="max-w-2xl mx-auto space-y-6" dir="rtl">
      {/* Header القسم العلوي */}
      <div className="text-center py-8">
        <div className={cn(
          'w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 transition-all duration-500',
          effectiveStatus === 'Pending' ? 'bg-slate-100' : 'bg-emerald-100'
        )}>
          {effectiveStatus === 'Pending' ? (
            <Clock className="w-10 h-10 text-slate-400 animate-pulse" />
          ) : (
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          {effectiveStatus === 'Pending' ? 'جاري تأكيد الدفع...' : 'تم تأكيد طلبك بنجاح! 🎉'}
        </h1>
        <p className="text-slate-500 mt-2">رقم الطلب: {order.orderNumber}</p>
      </div>

      {/* شريط تتبع حالة الطلب (Timeline) */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <h2 className="font-bold text-slate-900 mb-6 tracking-tight">تتبع حالة الطلب</h2>
        <div className="relative">
          <div className="flex justify-between relative">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex flex-col items-center gap-2 z-10">
                <div className={cn(
                  'w-10 h-10 rounded-full border-2 bg-white flex items-center justify-center transition-colors duration-300',
                  i <= currentStepIndex ? 'border-emerald-500 text-emerald-500' : 'border-slate-200 text-slate-300'
                )}>
                  {i < currentStepIndex ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-xs font-bold">{i + 1}</span>}
                </div>
                <span className={cn('text-xs font-medium', i <= currentStepIndex ? 'text-slate-900' : 'text-slate-400')}>
                  {STATUS_LABELS[step]}
                </span>
              </div>
            ))}
            {/* خط الخلفية للـ Timeline */}
            <div className="absolute top-5 left-0 right-0 h-[2px] bg-slate-100 -z-0" />
            <div 
              className="absolute top-5 right-0 h-[2px] bg-emerald-500 transition-all duration-500 -z-0" 
              style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ملخص الفاتورة */}
      <div className="bg-white rounded-2xl border p-6 space-y-4 shadow-sm">
        <h2 className="font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
          <Package className="w-5 h-5 text-emerald-600" />
          <span>تفاصيل الطلب النهائي</span>
        </h2>
        
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-slate-600">{item.name} × {item.quantity}</span>
              <span className="font-medium">{formatCurrency(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-dashed flex justify-between font-bold text-lg text-slate-900">
          <span>الإجمالي النهائي</span>
          <span className="text-emerald-600">{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>
      
      {/* الأزرار السفلى */}
      <div className="flex flex-col gap-3 text-center pb-10">
        <Button asChild className="bg-slate-900 text-white hover:bg-slate-800 h-12 rounded-xl">
            <Link href={`/${storeSlug}/orders`}>عرض كافة طلباتي</Link>
        </Button>
        <Button asChild variant="ghost" className="text-slate-500">
            <Link href={`/${storeSlug}`}>العودة للمتجر</Link>
        </Button>
      </div>
    </div>
  );
}