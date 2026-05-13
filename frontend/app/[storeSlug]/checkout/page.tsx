'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Phone, MapPin, ArrowRight, Package, Truck,
  CreditCard, ShieldCheck, ChevronLeft, CheckCircle2, Mail, Info
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatCurrency, cn } from '@/lib/utils';
import api from '@/lib/api';
import { CreateOrderPayload, PaymentMethod } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';

interface PageProps {
  params: { storeSlug: string };
}

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handleChange = (i: number, char: string) => {
    if (!/^\d*$/.test(char)) return;
    const arr = value.split('');
    arr[i] = char.slice(-1);
    const newVal = arr.join('').padEnd(6, '').slice(0, 6).trimEnd();
    onChange(newVal);
    if (char && i < 5) {
      inputRefs.current[i + 1]?.focus();
    }
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center" dir="ltr">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={cn(
            'w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-lg border transition-all outline-none',
            value[i] 
              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 ring-2 ring-indigo-600/20' 
              : 'border-slate-200 bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
          )}
        />
      ))}
    </div>
  );
}

type CheckoutStep = 'form' | 'otp';

export default function CheckoutPage({ params }: PageProps) {
  const { storeSlug } = params;
  const router = useRouter();
  
  const [isMounted, setIsMounted] = useState(false);
  const { items, total, clearCart } = useCartStore();
  
  const [step, setStep] = useState<CheckoutStep>('form');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    customerCity: '',
    notes: '',
    paymentMethod: 'COD' as PaymentMethod,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && items.length === 0 && step === 'form') {
      router.push(`/${storeSlug}`);
    }
  }, [items, step, router, storeSlug, isMounted]);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const validateForm = (): boolean => {
    if (!form.customerName.trim()) { toast.error('يرجى إدخال الاسم بالكامل'); return false; }
    if (!form.customerPhone.trim() || !/^01[0-9]{9}$/.test(form.customerPhone.trim())) {
      toast.error('يرجى إدخال رقم هاتف صحيح'); return false;
    }
    if (!form.customerEmail.trim() || !/^\S+@\S+\.\S+$/.test(form.customerEmail.trim())) {
      toast.error('يرجى إدخال بريد إلكتروني صحيح'); return false;
    }
    if (!form.customerAddress.trim()) { toast.error('يرجى كتابة عنوان التوصيل'); return false; }
    return true;
  };

  const handleSubmitForm = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (form.paymentMethod === 'COD') {
        toast.loading('جاري إرسال رمز التحقق...');
        await api.post('/otp/send-email', { email: form.customerEmail.trim() });
        toast.dismiss();
        toast.success('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
        setStep('otp');
      } 
      // Online payment logic stays commented out as requested
    } catch (err: any) {
      toast.dismiss();
      toast.error(err?.response?.data?.message || 'حدث خطأ أثناء إرسال الكود');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { setOtpError('الرمز يتكون من 6 أرقام'); return; }

    setOtpError('');
    setSubmitting(true);
    try {
      await api.post('/otp/verify-email', { email: form.customerEmail.trim(), otp });

      const payload = {
        storeName: storeSlug,
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerAddress: form.customerAddress.trim(),
        customerCity: form.customerCity || 'Cairo',
        notes: form.notes || undefined,
        paymentMethod: 'COD',
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      };

      const res = await api.post('/orders', payload);
      const orderId = res.data.data.order._id;
      
      clearCart();
      router.push(`/${storeSlug}/success/${orderId}`);
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || 'الرمز غير صحيح، حاول مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isMounted) return null;

  const cartTotal = total();

  return (
    <div dir="rtl" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      
      <nav className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-8">
        <Link href={`/${storeSlug}`} className="hover:text-slate-900 transition-colors flex items-center gap-1">
          <ArrowRight className="w-4 h-4" /> المتجر
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold">إتمام الطلب</span>
      </nav>

      {step === 'otp' ? (
        <div className="max-w-md mx-auto mt-12">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Mail className="w-8 h-8 text-slate-600" />
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 mb-2">تأكيد البريد الإلكتروني</h2>
            <p className="text-sm text-slate-500 mb-1">أدخل رمز التحقق الذي أرسلناه للتو إلى:</p>
            <p className="font-semibold text-slate-900 mb-8" dir="ltr">{form.customerEmail}</p>
            
            <div className="space-y-6">
              <OtpInput value={otp} onChange={setOtp} />
              {otpError && <p className="text-sm text-rose-600 font-medium">{otpError}</p>}
            </div>

            <div className="mt-8 space-y-3">
              <Button 
                onClick={handleVerifyOtp} 
                disabled={submitting || otp.length !== 6} 
                className="w-full h-12 text-base font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
              >
                {submitting ? 'جاري التأكيد...' : 'تأكيد الطلب'}
              </Button>
              <Button variant="ghost" onClick={() => setStep('form')} className="w-full text-sm text-slate-500 hover:text-slate-900">
                تعديل البيانات
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-7 space-y-6">
            
            {/* بيانات التوصيل */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Truck className="w-5 h-5 text-slate-400" />
                <h2 className="font-bold text-slate-900 text-lg">بيانات التوصيل</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">الاسم الكامل</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      value={form.customerName} 
                      onChange={update('customerName')} 
                      placeholder="اكتب اسمك هنا" 
                      className="h-12 pr-10 rounded-lg bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">رقم الموبايل</Label>
                  <div className="relative" dir="ltr">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      value={form.customerPhone} 
                      onChange={update('customerPhone')} 
                      placeholder="01xxxxxxxxx" 
                      className="h-12 pl-10 rounded-lg bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400 text-left" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-5">
                <Label className="text-sm font-semibold text-slate-700">البريد الإلكتروني</Label>
                <div className="relative" dir="ltr">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="email"
                    value={form.customerEmail} 
                    onChange={update('customerEmail')} 
                    placeholder="example@gmail.com" 
                    className="h-12 pl-10 rounded-lg bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400 text-left" 
                  />
                </div>
              </div>

              <div className="space-y-2 mb-5">
                <Label className="text-sm font-semibold text-slate-700">العنوان التفصيلي</Label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    value={form.customerAddress} 
                    onChange={update('customerAddress')} 
                    placeholder="الحي، اسم الشارع، رقم المنزل..." 
                    className="h-12 pr-10 rounded-lg bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                 <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">المحافظة</Label>
                  <Input 
                    value={form.customerCity} 
                    onChange={update('customerCity')} 
                    placeholder="مثال: القاهرة" 
                    className="h-12 rounded-lg bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">ملاحظات (اختياري)</Label>
                  <Input 
                    value={form.notes} 
                    onChange={update('notes')} 
                    placeholder="تعليمات للمندوب" 
                    className="h-12 rounded-lg bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400" 
                  />
                </div>
              </div>
            </div>

            {/* طريقة الدفع */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-5 h-5 text-slate-400" />
                <h2 className="font-bold text-slate-900 text-lg">طريقة الدفع</h2>
              </div>

              <RadioGroup value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v as PaymentMethod })} className="grid grid-cols-1 gap-3">
                <label className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all', 
                  form.paymentMethod === 'COD' 
                    ? 'border-slate-900 bg-slate-50' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                )}>
                  <RadioGroupItem value="COD" className="h-4 w-4" />
                  <div className="flex flex-col flex-1">
                    <span className="font-semibold text-slate-900 text-sm">الدفع عند الاستلام</span>
                    <span className="text-xs text-slate-500">الدفع نقداً للمندوب</span>
                  </div>
                </label>
              </RadioGroup>
              
              <div className="mt-4 flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                 <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                 <p className="text-xs text-slate-600 leading-relaxed">
                   سيتم إرسال كود تحقق (OTP) إلى بريدك الإلكتروني لضمان جدية الطلب.
                 </p>
              </div>
            </div>
          </div>

          {/* ملخص الطلب */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm lg:sticky lg:top-24">
              <div className="flex items-center gap-2 mb-6">
                <Package className="w-5 h-5 text-slate-400" />
                <h2 className="font-bold text-slate-900 text-lg">ملخص الطلب</h2>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-6">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between items-start text-sm">
                    <div className="flex-1 pr-4">
                      <p className="font-semibold text-slate-900 line-clamp-2">{item.name}</p>
                      <p className="text-slate-500 mt-1">الكمية: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-slate-900">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-5 border-t border-slate-100">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>المجموع الفرعي</span>
                  <span className="text-slate-900 font-medium">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>الشحن</span>
                  <span className="text-emerald-600 font-medium">مجاني</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <span className="font-bold text-slate-900">الإجمالي</span>
                  <span className="font-bold text-lg text-slate-900">{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  onClick={handleSubmitForm} 
                  disabled={submitting} 
                  className="w-full h-12 text-base font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                >
                  {submitting ? 'جاري المعالجة...' : 'تأكيد الطلب'}
                </Button>
                
                 </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}