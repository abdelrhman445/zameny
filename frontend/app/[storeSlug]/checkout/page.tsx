'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Phone, MapPin, ArrowRight, Package, Truck,
  CreditCard, ShieldCheck, ChevronLeft, KeyRound,
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

// --- استدعاءات فايربيز ---
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

interface PageProps {
  params: { storeSlug: string };
}

// مكون مدخل الـ OTP (محسن لمنع أخطاء الريندر)
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
    <div className="flex gap-2 justify-center" dir="ltr">
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
            'w-11 h-12 text-center text-xl font-bold rounded-xl border-2 transition-all',
            'focus:border-slate-900 focus:ring-0 outline-none',
            value[i] ? 'border-slate-900 bg-slate-50' : 'border-slate-300 bg-white'
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
  
  // ✅ حل مشكلة الـ Hydration المتبع في الـ Layout
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
    customerCity: 'Cairo',
    notes: '',
    paymentMethod: 'COD' as PaymentMethod,
  });

  useEffect(() => {
    setIsMounted(true); // نعلن أن المكون أصبح جاهزاً
  }, []);

  useEffect(() => {
    if (isMounted && items.length === 0 && step === 'form') {
      router.push(`/${storeSlug}`);
    }
  }, [items, step, router, storeSlug, isMounted]);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const validateForm = (): boolean => {
    if (!form.customerName.trim()) { toast.error('يرجى إدخال الاسم'); return false; }
    if (!form.customerPhone.trim() || !/^01[0-9]{9}$/.test(form.customerPhone.trim())) {
      toast.error('يرجى إدخال رقم هاتف مصري صحيح'); return false;
    }
    if (!form.customerAddress.trim()) { toast.error('يرجى إدخال العنوان'); return false; }
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
        toast.loading('جاري إرسال الرمز...');
        const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        setConfirmationResult(confirmation);
        toast.dismiss();
        toast.success('تم إرسال رمز OTP لرقم هاتفك');
        setStep('otp');
      } else {
        const payload: CreateOrderPayload = {
          customerName: form.customerName.trim(),
          customerPhone: form.customerPhone.trim(),
          customerAddress: form.customerAddress.trim(),
          customerCity: form.customerCity,
          notes: form.notes || undefined,
          paymentMethod: form.paymentMethod,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        };

        const res = await api.post('/orders', payload);
        const { paymentUrl, order } = res.data.data;

        if (paymentUrl) {
          // التوجه لبوابة الدفع، وسيتم التعامل مع الحالة في صفحة النجاح لاحقاً
          window.location.href = paymentUrl;
        } else {
          const orderId = order._id;
          clearCart();
          router.push(`/${storeSlug}/success/${orderId}`);
        }
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || 'حدث خطأ ما');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { setOtpError('يرجى إدخال 6 أرقام'); return; }
    if (!confirmationResult) { setOtpError('يرجى طلب الكود مرة أخرى'); return; }

    setOtpError('');
    setSubmitting(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();

      const payload = {
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerAddress: form.customerAddress.trim(),
        customerCity: form.customerCity,
        notes: form.notes || undefined,
        paymentMethod: 'COD',
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      };

      const res = await api.post('/orders', payload, {
        headers: { 'X-Firebase-IdToken': idToken }
      });

      const orderId = res.data.data.order._id;
      clearCart();
      router.push(`/${storeSlug}/success/${orderId}`); // التوجه لصفحة النجاح لبدء التتبع[cite: 1]
    } catch (err: any) {
      setOtpError('الرمز غير صحيح');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ تجنب أخطاء الهيدريشن: لا رندر قبل التأكد من الـ mount
  if (!isMounted) return null;

  const cartTotal = total();

  return (
    <div dir="rtl" className="pb-20">
      <div id="recaptcha-container"></div>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 px-4 pt-6">
        <Link href={`/${storeSlug}`} className="hover:text-slate-900 flex items-center gap-1">
          <ArrowRight className="w-3.5 h-3.5" /> المتجر
        </Link>
        <span>/</span>
        <span className="text-slate-900">إتمام الشراء</span>
      </div>

      {step === 'otp' ? (
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 mx-auto bg-slate-900 rounded-2xl flex items-center justify-center">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">التحقق من رقم الهاتف</h2>
              <p className="text-sm text-muted-foreground mt-2">تم إرسال رمز إلى</p>
              <p className="font-bold text-slate-900 mt-1" dir="ltr">{form.customerPhone}</p>
            </div>
            <div className="space-y-3">
              <OtpInput value={otp} onChange={setOtp} />
              {otpError && <p className="text-sm text-red-600 font-medium">{otpError}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={handleVerifyOtp} disabled={submitting || otp.length !== 6} className="w-full h-11">
                {submitting ? 'جاري التحقق...' : 'تأكيد الطلب'}
              </Button>
              <Button variant="ghost" onClick={() => setStep('form')} className="text-sm text-slate-500">
                تعديل البيانات
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-7xl mx-auto px-4">
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <User className="w-5 h-5" /> بيانات التوصيل
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>الاسم الكامل *</Label>
                  <Input value={form.customerName} onChange={update('customerName')} placeholder="محمد علي" />
                </div>
                <div className="space-y-1.5">
                  <Label>رقم الهاتف *</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={form.customerPhone} onChange={update('customerPhone')} placeholder="01012345678" dir="ltr" className="pr-9" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>العنوان بالتفصيل *</Label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input value={form.customerAddress} onChange={update('customerAddress')} placeholder="اسم الشارع / رقم العقار" className="pr-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>المدينة</Label>
                <Input value={form.customerCity} onChange={update('customerCity')} placeholder="مثال: الزقازيق" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> طريقة الدفع
              </h2>
              <RadioGroup value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v as PaymentMethod })} className="space-y-3">
                <label className={cn('flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all', form.paymentMethod === 'COD' ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300')}>
                  <RadioGroupItem value="COD" />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Truck className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">الدفع عند الاستلام</p>
                      <p className="text-xs text-muted-foreground">يتطلب التحقق من الهاتف</p>
                    </div>
                  </div>
                </label>
                <label className={cn('flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all', form.paymentMethod === 'Online' ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300')}>
                  <RadioGroupItem value="Online" />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">الدفع الإلكتروني</p>
                      <p className="text-xs text-muted-foreground">فيزا / فودافون كاش</p>
                    </div>
                  </div>
                </label>
              </RadioGroup>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm lg:sticky lg:top-6">
              <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Package className="w-5 h-5" /> ملخص الطلب
              </h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between gap-3 border-b border-slate-50 pb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>المجموع الفرعي</span>
                  <span suppressHydrationWarning>{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>الشحن</span>
                  <span>مجاني</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-3 border-t">
                  <span>الإجمالي</span>
                  <span suppressHydrationWarning>{formatCurrency(cartTotal)}</span>
                </div>
              </div>
              <Button onClick={handleSubmitForm} disabled={submitting} className="w-full h-12 text-base font-bold bg-slate-900 hover:bg-slate-800">
                {submitting ? 'جاري المعالجة...' : (
                  <span className="flex items-center gap-2">
                    {form.paymentMethod === 'COD' ? 'التحقق وتأكيد الطلب' : 'الدفع الآن'}
                    <ChevronLeft className="w-4 h-4" />
                  </span>
                )}
              </Button>
              <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground pt-2">
                <ShieldCheck className="w-3 h-3" /> بياناتك مشفرة وآمنة تماماً
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}