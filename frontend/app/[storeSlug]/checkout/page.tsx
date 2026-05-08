'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Phone, MapPin, ArrowRight, Package, Truck,
  CreditCard, ShieldCheck, ChevronLeft, KeyRound, CheckCircle2, Lock, Info
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

// --- استدعاءات فايربيز (المنطق الأصلي كما هو) ---
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

interface PageProps {
  params: { storeSlug: string };
}

// مكون مدخل الـ OTP (تصميم Zameny Premium)
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
            'w-12 h-14 text-center text-2xl font-black rounded-xl border-2 transition-all shadow-sm',
            'focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 outline-none',
            value[i] ? 'border-indigo-600 bg-indigo-50/30 text-indigo-700' : 'border-slate-200 bg-white text-slate-900'
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
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
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
      toast.error('يرجى إدخال رقم هاتف صحيح (01xxxxxxxxx)'); return false;
    }
    if (!form.customerAddress.trim()) { toast.error('يرجى كتابة عنوان التوصيل'); return false; }
    return true;
  };

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  };

  const handleSubmitForm = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (form.paymentMethod === 'COD') {
        setupRecaptcha();
        const phoneNumber = `+2${form.customerPhone.trim()}`;
        const appVerifier = (window as any).recaptchaVerifier;
        toast.loading('جاري إرسال رمز التحقق...');
        const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        setConfirmationResult(confirmation);
        toast.dismiss();
        toast.success('وصلك رمز OTP الآن');
        setStep('otp');
      } else {
        // ✅ إضافة storeName للـ Payload في حالة الدفع الأونلاين
        const payload: CreateOrderPayload & { storeName: string } = {
          storeName: storeSlug,
          customerName: form.customerName.trim(),
          customerPhone: form.customerPhone.trim(),
          customerAddress: form.customerAddress.trim(),
          customerCity: form.customerCity || 'Cairo',
          notes: form.notes || undefined,
          paymentMethod: form.paymentMethod,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        };

        const res = await api.post('/orders', payload);
        const { paymentUrl, order } = res.data.data;

        if (paymentUrl) {
          window.location.href = paymentUrl;
        } else {
          const orderId = order._id;
          clearCart();
          router.push(`/${storeSlug}/success/${orderId}`);
        }
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || 'حدث خطأ أثناء معالجة الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { setOtpError('الرمز يتكون من 6 أرقام'); return; }
    if (!confirmationResult) { setOtpError('يرجى طلب الرمز مرة أخرى'); return; }

    setOtpError('');
    setSubmitting(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();

      // ✅ إضافة storeName للـ Payload في حالة الـ COD
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

      const res = await api.post('/orders', payload, {
        headers: { 'X-Firebase-IdToken': idToken }
      });

      const orderId = res.data.data.order._id;
      clearCart();
      router.push(`/${storeSlug}/success/${orderId}`);
    } catch (err: any) {
      setOtpError('الرمز غير صحيح، حاول مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isMounted) return null;

  const cartTotal = total();

  return (
    <div dir="rtl" className="pb-24 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div id="recaptcha-container"></div>
      
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-8 mt-6 bg-white/50 w-max px-4 py-2 rounded-full border border-slate-100 shadow-sm">
        <Link href={`/${storeSlug}`} className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
          <ArrowRight className="w-4 h-4 ml-1" /> المتجر
        </Link>
        <span className="text-slate-200">/</span>
        <span className="text-slate-900">مراجعة البيانات والدفع</span>
      </nav>

      {step === 'otp' ? (
        /* ── OTP Verification UI ── */
        <div className="max-w-md mx-auto py-8 animate-fade-in-up">
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 p-8 sm:p-12 text-center space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">تأكيد رقم الهاتف</h2>
              <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
                أدخل رمز التحقق المرسل في رسالة نصية إلى:
              </p>
              <p className="font-black text-indigo-600 mt-1 text-lg tracking-widest" dir="ltr">{form.customerPhone}</p>
            </div>
            
            <div className="space-y-4">
              <OtpInput value={otp} onChange={setOtp} />
              {otpError && <p className="text-sm text-rose-600 font-bold bg-rose-50 py-2 rounded-lg border border-rose-100">{otpError}</p>}
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleVerifyOtp} 
                disabled={submitting || otp.length !== 6} 
                className="w-full h-14 text-lg font-black bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl shadow-xl transition-all active:scale-95"
              >
                {submitting ? 'جاري التأكيد...' : 'تأكيد وشحن الطلب'}
              </Button>
              <Button variant="ghost" onClick={() => setStep('form')} className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">
                الرجوع لتعديل البيانات
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Form Layout ── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Content */}
          <div className="lg:col-span-7 space-y-8 animate-fade-in-up">
            
            {/* Delivery Info Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 p-6 sm:p-10 space-y-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                   <Truck className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="font-black text-slate-900 text-xl tracking-tight">بيانات التوصيل</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label className="text-sm font-bold text-slate-700 pr-1">الاسم الكامل *</Label>
                  <div className="relative group">
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input 
                      value={form.customerName} 
                      onChange={update('customerName')} 
                      placeholder="اكتب اسمك هنا" 
                      autoComplete="off"
                      className="h-14 pr-12 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500 font-bold text-slate-900 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-sm font-bold text-slate-700 pr-1">رقم الموبايل *</Label>
                  <div className="relative group" dir="ltr">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input 
                      value={form.customerPhone} 
                      onChange={update('customerPhone')} 
                      placeholder="01xxxxxxxxx" 
                      autoComplete="off"
                      className="h-14 pl-12 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500 font-bold text-slate-900 tracking-wider transition-all placeholder:text-slate-400" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <Label className="text-sm font-bold text-slate-700 pr-1">العنوان التفصيلي *</Label>
                <div className="relative group">
                  <MapPin className="absolute right-4 top-4 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <Input 
                    value={form.customerAddress} 
                    onChange={update('customerAddress')} 
                    placeholder="الحي، اسم الشارع، رقم المنزل..." 
                    autoComplete="off"
                    className="h-14 pr-12 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500 font-bold text-slate-900 transition-all placeholder:text-slate-400" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="space-y-2.5">
                  <Label className="text-sm font-bold text-slate-700 pr-1">المحافظة</Label>
                  <Input 
                    value={form.customerCity} 
                    onChange={update('customerCity')} 
                    placeholder="مثال: القاهرة" 
                    autoComplete="off"
                    className="h-14 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500 font-bold text-slate-900 transition-all placeholder:text-slate-400" 
                  />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-sm font-bold text-slate-700 pr-1">تعليمات إضافية</Label>
                  <Input 
                    value={form.notes} 
                    onChange={update('notes')} 
                    placeholder="مثال: أي ملاحظات للمندوب" 
                    autoComplete="off"
                    className="h-14 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500 font-bold text-slate-900 transition-all placeholder:text-slate-400" 
                  />
                </div>
              </div>
            </div>

            {/* Payment Options Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 p-6 sm:p-10 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                   <CreditCard className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="font-black text-slate-900 text-xl tracking-tight">طريقة الدفع المفضلة</h2>
              </div>

              <RadioGroup value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v as PaymentMethod })} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={cn(
                  'relative flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300', 
                  form.paymentMethod === 'COD' 
                    ? 'border-indigo-600 bg-indigo-50/30 ring-4 ring-indigo-500/5 shadow-md' 
                    : 'border-slate-100 hover:border-slate-300 bg-white shadow-sm'
                )}>
                  <RadioGroupItem value="COD" className="h-5 w-5" />
                  <div className="flex flex-col gap-0.5">
                    <p className="font-black text-slate-900 text-base">الدفع عند الاستلام</p>
                    <p className="text-xs font-bold text-slate-500">كاش للمندوب</p>
                  </div>
                  <div className="mr-auto">
                    <Truck className={cn("w-6 h-6", form.paymentMethod === 'COD' ? "text-indigo-600" : "text-slate-300")} />
                  </div>
                </label>

                <label className={cn(
                  'relative flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300', 
                  form.paymentMethod === 'Online' 
                    ? 'border-indigo-600 bg-indigo-50/30 ring-4 ring-indigo-500/5 shadow-md' 
                    : 'border-slate-100 hover:border-slate-300 bg-white shadow-sm'
                )}>
                  <RadioGroupItem value="Online" className="h-5 w-5" />
                  <div className="flex flex-col gap-0.5">
                    <p className="font-black text-slate-900 text-base">دفع إلكتروني</p>
                    <p className="text-xs font-bold text-slate-500">فيزا / محافظ / فوراً</p>
                  </div>
                  <div className="mr-auto">
                    <CreditCard className={cn("w-6 h-6", form.paymentMethod === 'Online' ? "text-indigo-600" : "text-slate-300")} />
                  </div>
                </label>
              </RadioGroup>
              
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                 <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                 <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                   * في حالة اختيار الدفع عند الاستلام، سيطلب منك النظام تأكيد رقم هاتفك عبر كود OTP لضمان جدية الطلب وسرعة الشحن.
                 </p>
              </div>
            </div>
          </div>

          {/* Sticky Order Summary Sidebar */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-[2rem] border border-slate-200/60 p-6 sm:p-8 space-y-6 shadow-xl lg:sticky lg:top-24 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              
              <h2 className="font-black text-slate-900 text-xl flex items-center gap-2 relative z-10">
                <Package className="w-5 h-5 text-indigo-500" /> ملخص الطلب
              </h2>

              <div className="space-y-4 max-h-[350px] overflow-y-auto scrollbar-thin pr-2 relative z-10">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-start justify-between gap-4 py-3 border-b border-slate-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate">{item.name}</p>
                      <p className="text-xs font-bold text-slate-400 mt-1">الكمية: <span className="text-indigo-600">{item.quantity}</span></p>
                    </div>
                    <p className="text-sm font-black text-slate-900 whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100 relative z-10">
                <div className="flex justify-between text-sm font-bold text-slate-500">
                  <span>المجموع الفرعي</span>
                  <span suppressHydrationWarning className="text-slate-900">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-emerald-600">
                  <span>مصاريف الشحن</span>
                  <span className="font-black">مجاني لفترة محدودة</span>
                </div>
                <div className="flex justify-between font-black text-3xl pt-5 border-t border-slate-200 text-slate-900 tracking-tighter">
                  <span>الإجمالي</span>
                  <span suppressHydrationWarning className="text-indigo-600">{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              <div className="pt-4 relative z-10">
                <Button 
                  onClick={handleSubmitForm} 
                  disabled={submitting} 
                  className="w-full h-[70px] text-xl font-black bg-slate-900 hover:bg-indigo-600 text-white rounded-[1.25rem] shadow-2xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  {submitting ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري التنفيذ...
                    </>
                  ) : (
                    <>
                      <span>{form.paymentMethod === 'COD' ? 'إرسال طلبك الآن' : 'إتمام الدفع الآمن'}</span>
                      <ChevronLeft className="w-6 h-6 stroke-[3px]" />
                    </>
                  )}
                </Button>
                
                <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 mt-6 bg-slate-50 py-3 rounded-xl border border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>نظام Zameny المحمي لضمان حقوق المشتري والتاجر</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
