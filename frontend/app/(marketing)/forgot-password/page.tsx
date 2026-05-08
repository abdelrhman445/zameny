'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ShieldCheck, ArrowRight, Eye, EyeOff, Activity, KeyRound, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { toast } from 'sonner';

type Step = 'email' | 'otp' | 'reset';

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  // ── States ──
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. إرسال كود الـ OTP للبريد الإلكتروني
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('يرجى إدخال البريد الإلكتروني'); return; }
    
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('تم إرسال كود التحقق إلى بريدك الإلكتروني');
      setStep('otp');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء إرسال الكود');
    } finally {
      setLoading(false);
    }
  };

  // 2. ✅ التحقق الفعلي من الـ OTP عبر السيرفر
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) { 
      toast.error('يرجى إدخال كود التحقق المكون من 6 أرقام'); 
      return; 
    }
    
    setLoading(true);
    try {
      // نتحقق من الكود أولاً قبل السماح بتغيير الباسورد
      await api.post('/auth/verify-otp', { email, otp });
      
      toast.success('تم التحقق من الكود بنجاح');
      setStep('reset');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'كود التحقق غير صحيح أو منتهي الصلاحية');
    } finally {
      setLoading(false);
    }
  };

  // 3. تعيين كلمة المرور الجديدة نهائياً
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      // نرسل الإيميل، الكود، والباسورد الجديد معاً لتأكيد العملية في السيرفر
      await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء حفظ كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6 text-slate-50 selection:bg-rose-500/30 overflow-hidden relative" dir="rtl">
      
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-rose-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[460px] relative z-10 animate-in fade-in zoom-in duration-500">
        
        {/* Top Icon & Title */}
        <div className="text-center mb-8">
          
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">استعادة الوصول</h1>
          <p className="text-slate-400 font-medium px-4">
            {step === 'email' && 'أدخل بريدك الإلكتروني وسنرسل لك كود التحقق.'}
            {step === 'otp' && 'أدخل كود التحقق المكون من 6 أرقام المرسل لبريدك.'}
            {step === 'reset' && 'أدخل كلمة المرور الجديدة القوية لمتجرك.'}
          </p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-8 shadow-2xl">
          
          {/* STEP 1: Enter Email */}
          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-sm font-bold text-slate-300">البريد الإلكتروني المسجل</Label>
                <div className="relative group" dir="ltr">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your-email@example.com"
                    className="h-14 pl-11 pr-4 bg-white border-slate-200 text-slate-900 font-bold placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-rose-500 rounded-xl transition-all"
                    autoFocus
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-14 bg-rose-600 hover:bg-rose-500 text-white font-bold text-lg rounded-xl transition-all" disabled={loading}>
                {loading ? 'جاري إرسال الكود ...' : 'إرسال كود التحقق'}
              </Button>
            </form>
          )}

          {/* STEP 2: Enter OTP Code */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="otp" className="text-sm font-bold text-slate-300">كود التحقق (6 أرقام)</Label>
                  <button type="button" onClick={() => setStep('email')} className="text-xs text-rose-400 hover:text-rose-300 font-bold">تغيير الإيميل؟</button>
                </div>
                <div className="relative group" dir="ltr">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                  </div>
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="h-14 pl-11 pr-4 bg-white border-slate-200 text-slate-900 font-black tracking-[0.5em] text-center placeholder:tracking-normal focus-visible:ring-2 focus-visible:ring-rose-500 rounded-xl transition-all"
                    autoFocus
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-14 bg-rose-600 hover:bg-rose-500 text-white font-bold text-lg rounded-xl transition-all" disabled={loading}>
                {loading ? 'جاري التحقق...' : 'تحقق والمتابعة'}
              </Button>
            </form>
          )}

          {/* STEP 3: Reset Password */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <Label htmlFor="newPassword" className="text-sm font-bold text-slate-300">كلمة المرور الجديدة</Label>
                  <div className="relative group" dir="ltr">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                    </div>
                    <Input
                      id="newPassword"
                      type={showPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-14 pl-11 pr-12 bg-white border-slate-200 text-slate-900 font-bold tracking-widest focus-visible:ring-2 focus-visible:ring-rose-500 rounded-xl transition-all"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-rose-500 transition-colors">
                      {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-bold text-slate-300">تأكيد كلمة المرور</Label>
                  <div className="relative group" dir="ltr">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <CheckCircle2 className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-14 pl-11 pr-4 bg-white border-slate-200 text-slate-900 font-bold tracking-widest focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl transition-all"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2" disabled={loading}>
                {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور والدخول'}
              </Button>
            </form>
          )}

        </div>

        {/* Footer Back Link */}
        <div className="mt-8 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-white transition-colors">
            <ArrowRight className="w-4 h-4" /> العودة لتسجيل الدخول
          </Link>
        </div>

      </div>
    </div>
  );
}