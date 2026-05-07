'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Package, Clock, ShieldCheck, ArrowRight, Truck, MapPin, ReceiptText } from 'lucide-react';
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
  Pending: 'قيد المراجعة', Confirmed: 'تم التأكيد', Shipped: 'جاري الشحن', Delivered: 'تم التسليم',
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
        console.error("Failed to fetch order details");
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

    socket.on('orderUpdated', (updatedOrder: Order) => {
      setOrder(updatedOrder);
    });

    return () => {
      socket.emit('leaveOrderRoom', orderId);
      socket.off('orderUpdated');
      socket.disconnect();
    };
  }, [orderId]);

  if (!isMounted || loading) return <div className="py-20"><PageLoading label="جاري عرض تفاصيل أوردرك..." /></div>;
  
  if (!order) return (
    <div className="py-32 text-center animate-fade-in" dir="rtl">
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
        <Package className="w-10 h-10 text-slate-300" />
      </div>
      <h2 className="text-2xl font-black text-slate-800">عذراً، لم نجد هذا الطلب</h2>
      <Button asChild variant="link" className="mt-4 text-indigo-600 font-bold">
        <Link href={`/${storeSlug}`}>العودة للتسوق</Link>
      </Button>
    </div>
  );

  const effectiveStatus = (order.paymentStatus === 'Paid' && order.status === 'Pending') ? 'Confirmed' : order.status;
  const currentStepIndex = STATUS_STEPS.indexOf(effectiveStatus);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up pb-20" dir="rtl">
      
      {/* ── Hero Success Header ── */}
      <div className="text-center py-10 relative overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className={cn(
          'w-24 h-24 mx-auto rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl transition-all duration-700 relative z-10',
          effectiveStatus === 'Pending' ? 'bg-slate-900 shadow-slate-200' : 'bg-emerald-500 shadow-emerald-200'
        )}>
          {effectiveStatus === 'Pending' ? (
            <Clock className="w-12 h-12 text-white animate-pulse" />
          ) : (
            <CheckCircle2 className="w-12 h-12 text-white animate-bounce-short" />
          )}
        </div>
        
        <h1 className="text-4xl font-black text-slate-900 tracking-tight relative z-10">
          {effectiveStatus === 'Pending' ? 'جاري مراجعة طلبك' : 'تم استلام طلبك بنجاح!'}
        </h1>
        <p className="text-lg font-medium text-slate-500 mt-3 relative z-10">
         your order number: <span className="text-indigo-600 font-mono font-black select-all">#{order.orderNumber}</span>
        </p>
      </div>

      {/* ── Order Tracking Timeline ── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200/60 p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-black text-slate-900 text-xl tracking-tight">حالة الأوردر الآن</h2>
          <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-indigo-100">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" /> تحديث حي
          </span>
        </div>

        <div className="relative">
          <div className="flex justify-between relative px-2 sm:px-4">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex flex-col items-center gap-3 z-10">
                <div className={cn(
                  'w-12 h-12 rounded-2xl border-2 bg-white flex items-center justify-center transition-all duration-500 shadow-sm',
                  i <= currentStepIndex ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 text-slate-300'
                )}>
                  {i < currentStepIndex ? (
                    <CheckCircle2 className="w-6 h-6 stroke-[3px]" />
                  ) : i === currentStepIndex ? (
                    <div className="relative">
                      {i === 2 ? <Truck className="w-6 h-6" /> : i === 3 ? <Package className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    </div>
                  ) : (
                    <span className="text-sm font-black">{i + 1}</span>
                  )}
                </div>
                <span className={cn(
                  'text-[11px] sm:text-xs font-black tracking-tight whitespace-nowrap', 
                  i <= currentStepIndex ? 'text-slate-900' : 'text-slate-400'
                )}>
                  {STATUS_LABELS[step]}
                </span>
              </div>
            ))}
            
            {/* Base Progress Line */}
            <div className="absolute top-6 left-6 right-6 h-[4px] bg-slate-100 rounded-full -z-0" />
            
            {/* Active Progress Line */}
            <div 
              className="absolute top-6 right-6 h-[4px] bg-emerald-500 transition-all duration-1000 ease-in-out rounded-full -z-0 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
              style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Order Summary Receipt ── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-black text-slate-800 flex items-center gap-2.5">
            <ReceiptText className="w-5 h-5 text-indigo-500" />
            <span>ملخص الفاتورة</span>
          </h2>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest" dir="ltr">{new Date().toLocaleDateString('ar-EG')}</span>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm group">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{item.name}</span>
                  <span className="text-[11px] font-medium text-slate-400">الكمية: {item.quantity}</span>
                </div>
                <span className="font-black text-slate-900">{formatCurrency(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-dashed border-slate-200 space-y-3">
            <div className="flex justify-between text-sm font-medium text-slate-500">
              <span>المجموع الفرعي</span>
              <span className="font-bold">{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-emerald-600">
              <span>مصاريف الشحن</span>
              <span className="font-black">مجاني</span>
            </div>
            <div className="flex justify-between pt-4 border-t border-slate-100">
              <span className="text-xl font-black text-slate-900">الإجمالي النهائي</span>
              <span className="text-2xl font-black text-indigo-600 tracking-tighter">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
            <MapPin className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-black text-indigo-900">عنوان التوصيل المسجل:</span>
              <span className="text-xs font-bold text-indigo-600/80 leading-relaxed">{order.customerAddress}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* ── Final Actions ── */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button asChild className="flex-1 h-14 text-lg font-black bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl shadow-xl transition-all group">
            <Link href={`/${storeSlug}`}>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:-translate-x-1 transition-transform" />
              العودة للمتجر والتسوق
            </Link>
        </Button>
        <div className="flex items-center justify-center gap-2 px-6 h-14 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-500 shrink-0">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <span>حماية Zameny تضمن حقك</span>
        </div>
      </div>

    </div>
  );
}