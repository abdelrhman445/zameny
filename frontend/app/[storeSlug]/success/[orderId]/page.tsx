'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, Package, Clock, ArrowRight, Truck, MapPin, 
  ReceiptText, XCircle, AlertTriangle 
} from 'lucide-react';
import { io } from 'socket.io-client';
import { Order, SingleOrderResponse } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import api from '@/lib/api';

interface PageProps {
  params: { storeSlug: string; orderId: string };
}

const STATUS_LABELS: Record<string, string> = {
  Pending: 'قيد المراجعة', 
  Confirmed: 'تم التأكيد', 
  Shipped: 'جاري الشحن', 
  Delivered: 'تم التسليم',
  Cancelled: 'ملغي',
  Flagged: 'مرفوض'
};

const STATUS_STEPS = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];

export default function SuccessPage({ params }: PageProps) {
  const { storeSlug, orderId } = params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const fetchOrder = async () => {
      try {
        const res = await api.get<SingleOrderResponse>(`/orders/${orderId}/public`);
        setOrder(res.data.data.order);
      } catch (err) {
        console.error("Fetch error");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    const socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
    });

    socket.emit('joinOrderRoom', orderId);
    socket.on('orderUpdated', (updatedOrder: Order) => setOrder(updatedOrder));

    return () => {
      socket.emit('leaveOrderRoom', orderId);
      socket.off('orderUpdated');
      socket.disconnect();
    };
  }, [orderId]);

  if (!isMounted || loading) return <div className="min-h-[60vh] flex items-center justify-center"><PageLoading label="جاري تحميل بيانات الطلب..." /></div>;
  
  if (!order) return (
    <div className="py-20 text-center px-4" dir="rtl">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
        <Package className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">الطلب غير موجود</h2>
      <Button asChild variant="link" className="mt-2 text-indigo-600 font-semibold">
        <Link href={`/${storeSlug}`}>العودة للمتجر</Link>
      </Button>
    </div>
  );

  const currentStatus = order.status;
  const currentStepIndex = STATUS_STEPS.indexOf(currentStatus);
  const isFailed = ['Cancelled', 'Flagged'].includes(currentStatus);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12 space-y-6 md:space-y-8" dir="rtl">
      
      {/* الحالة العامة للطلب */}
      <div className="text-center py-6">
        <div className={cn(
          'w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 transition-colors duration-500',
          currentStatus === 'Pending' ? 'bg-slate-900' : isFailed ? 'bg-rose-600' : 'bg-emerald-500'
        )}>
          {currentStatus === 'Pending' ? <Clock className="w-10 h-10 text-white" /> : 
           isFailed ? <XCircle className="w-10 h-10 text-white" /> : 
           <CheckCircle2 className="w-10 h-10 text-white" />}
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          {isFailed ? STATUS_LABELS[currentStatus] : (currentStatus === 'Pending' ? 'طلبك قيد المراجعة' : 'شكراً لك، تم استلام طلبك!')}
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          رقم الطلب: <span className="text-indigo-600 font-mono">#{order.orderNumber}</span>
        </p>
      </div>

      {/* شريط التتبع (يختفي في حالة الإلغاء) */}
      {!isFailed && (
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 p-6 md:p-10 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-bold text-slate-900 text-lg">تتبع الطلب</h2>
            
          </div>

          <div className="relative pt-2 pb-2">
            <div className="flex justify-between relative">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex flex-col items-center gap-3 z-10 flex-1">
                  <div className={cn(
                    'w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border-2 bg-white flex items-center justify-center transition-all duration-300',
                    i <= currentStepIndex ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 text-slate-300'
                  )}>
                    {i < currentStepIndex ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : 
                     i === currentStepIndex ? <div className="relative">{i === 2 ? <Truck className="w-5 h-5 md:w-6 md:h-6" /> : i === 3 ? <Package className="w-5 h-5 md:w-6 md:h-6" /> : <Clock className="w-5 h-5 md:w-6 md:h-6" />}</div> : 
                     <span className="text-xs font-bold">{i + 1}</span>}
                  </div>
                  <span className={cn(
                    'text-[10px] md:text-xs font-bold whitespace-nowrap', 
                    i <= currentStepIndex ? 'text-slate-900' : 'text-slate-400'
                  )}>
                    {STATUS_LABELS[step]}
                  </span>
                </div>
              ))}
              
              {/* خط التقدم الخلفي */}
              <div className="absolute top-5 md:top-6 left-[10%] right-[10%] h-[2px] bg-slate-100 -z-0" />
              {/* خط التقدم الفعلي */}
              <div 
                className="absolute top-5 md:top-6 right-[12.5%] h-[2px] bg-emerald-500 transition-all duration-700 -z-0" 
                style={{ width: currentStepIndex > 0 ? `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 75}%` : '0%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* تفاصيل الفاتورة */}
      <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <ReceiptText className="w-4 h-4 text-indigo-500" />
            <span>ملخص الطلب</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400" dir="ltr">
            {new Date(order.createdAt).toLocaleDateString('ar-EG')}
          </span>
        </div>
        
        <div className="p-6 md:p-8 space-y-5">
          <div className="divide-y divide-slate-50">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-3 text-sm">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900">{item.name}</span>
                  <span className="text-xs text-slate-500">الكمية: {item.quantity}</span>
                </div>
                <span className="font-bold text-slate-900">{formatCurrency(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="pt-5 border-t border-slate-100 space-y-2">
            <div className="flex justify-between text-sm text-slate-500 font-medium">
              <span>المجموع</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm text-emerald-600 font-medium">
              <span>الشحن</span>
              <span>مجاني</span>
            </div>
            <div className="flex justify-between pt-4 border-t border-slate-100">
              <span className="font-bold text-slate-900">الإجمالي النهائي</span>
              <span className="text-xl font-bold text-indigo-600">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
          
          {/* عنوان التوصيل */}
          <div className="mt-6 flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">عنوان التوصيل:</p>
              <p className="text-sm font-bold text-slate-900 leading-relaxed">
                {order.customerAddress}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* الإجراءات النهائية */}
      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <Button asChild className="w-full h-14 text-base font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all border-none">
            <Link href={`/${storeSlug}`} className="flex items-center justify-center gap-2">
              <ArrowRight className="w-4 h-4" />
              العودة للمتجر
            </Link>
        </Button>
      </div>

    </div>
  );
}