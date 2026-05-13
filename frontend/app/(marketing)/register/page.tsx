'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Zap, ArrowLeft, Mail, Lock, User, Store, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { AuthResponse } from '@/types';
import { toast } from 'sonner';

interface FormData {
  name: string;
  email: string;
  password: string;
  storeName: string;
  telegramChatId: string;
}

export default function RegisterPage() {
  const [form, setForm] = useState<FormData>({
    name: '', email: '', password: '', storeName: '', telegramChatId: '',
  });
  
  // ✅ إضافة حالة الموافقة على الشروط
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const update = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ التحقق من الحقول المطلوبة
    if (!form.name || !form.email || !form.password || !form.storeName) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    // ✅ التحقق من الموافقة على الشروط
    if (!agreedToTerms) {
      toast.error('يجب الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة');
      return;
    }

    if (form.password.length < 8) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        telegramChatId: form.telegramChatId || undefined,
      };
      const res = await api.post<AuthResponse>('/auth/register', payload);
      const { token, data } = res.data;
      setAuth(data.merchant, token);
      toast.success('تم إنشاء متجرك بنجاح!');
      router.push('/overview');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'تعذر إنشاء الحساب، يرجى المحاولة مرة أخرى';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex text-slate-50 selection:bg-rose-500/30 overflow-hidden" dir="rtl">
      
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-14 border-l border-slate-800/50 bg-slate-900/20">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-rose-600/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-16 hover:opacity-80 transition-opacity">
            <div>
              <p className="text-white font-black text-xl tracking-tight">Zameny Store</p>
            </div>
          </Link>

          <h1 className="text-4xl font-black text-white leading-[1.3] mb-6 tracking-tight">
            ابدا معنا وثق في مكاننا<br />
            <span className="text-slate-400 font-medium text-3xl">نحن نتولى حماية أرباحك.</span>
          </h1>
          
          <div className="space-y-6 mt-10">
            {[
              { title: 'كشف فوري للاحتيال', desc: 'فلترة آلية لطلبات الإرجاع الوهمية قبل شحنها.' },
              { title: 'إدارة متكاملة للمخزون', desc: 'تتبع كميات منتجاتك ومبيعاتك من لوحة تحكم واحدة.' },
              { title: 'ربط مباشر مع تيليجرام', desc: 'استقبل طلبات متجرك وقم بإدارتها من هاتفك مباشرة.' }
            ].map((feature, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 mt-1 border border-rose-500/20">
                  <CheckCircle2 className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-200">{feature.title}</h3>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6 border-t border-slate-800/50 pt-8 mt-12">
          <p className="text-sm text-slate-500">All Rights Reserved to Zameny Store © 2026 | <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link> | <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10 overflow-y-auto">
        <div className="w-full max-w-[460px] space-y-8 py-8">
          
          <div className="flex items-center gap-3 lg:hidden mb-8">
            
            <span className="text-white font-black text-2xl tracking-tight">Zameny</span>
          </div>

          <div>
            <h2 className="text-3xl font-black text-white mb-2">إنشاء متجر جديد</h2>
            <p className="text-slate-400 text-base">البيانات الأساسية لفتح حسابك كتاجر</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-slate-300">الاسم الكامل <span className="text-rose-500">*</span></Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                  </div>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={update('name')}
                    placeholder="أدخل اسمك الكامل"
                    className="h-12 pr-11 pl-4 bg-white border-slate-200 text-slate-950 font-bold placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-rose-500 focus-visible:border-rose-500 rounded-xl transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="store" className="text-sm font-semibold text-slate-300">اسم المتجر <span className="text-rose-500">*</span></Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Store className="w-5 h-5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                  </div>
                  <Input
                    id="store"
                    value={form.storeName}
                    onChange={update('storeName')}
                    placeholder="متجري الإلكتروني"
                    className="h-12 pr-11 pl-4 bg-white border-slate-200 text-slate-950 font-bold placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-rose-500 focus-visible:border-rose-500 rounded-xl transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-300">البريد الإلكتروني <span className="text-rose-500">*</span></Label>
              <div className="relative group" dir="ltr">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="your-email@example.com"
                  className="h-12 pl-11 pr-4 bg-white border-slate-200 text-slate-950 font-bold placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-rose-500 focus-visible:border-rose-500 rounded-xl transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-300">كلمة المرور <span className="text-rose-500">*</span></Label>
              <div className="relative group" dir="ltr">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                </div>
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="••••••••"
                  className="h-12 pl-11 pr-12 bg-white border-slate-200 text-slate-950 font-bold placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-rose-500 focus-visible:border-rose-500 rounded-xl transition-all tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="telegram" className="text-sm font-semibold text-slate-300 flex items-center justify-between">
                <span>ايدي تيليجرام</span>
                <span className="text-xs text-slate-500 font-normal bg-slate-800 px-2 py-0.5 rounded-md">اختياري</span>
              </Label>
              <div className="relative group" dir="ltr">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Send className="w-4 h-4 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                </div>
                <Input
                  id="telegram"
                  value={form.telegramChatId}
                  onChange={update('telegramChatId')}
                  placeholder="معرف الشات الخاص بك (مثال: -1001234567890)"
                  className="h-12 pl-11 pr-4 bg-white border-slate-200 text-slate-950 font-bold placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-rose-500 focus-visible:border-rose-500 rounded-xl transition-all"
                />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">أضفه لاستقبال إشعارات فورية بالطلبات الجديدة.</p>
            </div>

            {/* ✅ إضافة خانة الموافقة على الشروط والخصوصية */}
            <div className="flex items-start gap-3 pt-2">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-800 bg-white text-rose-500 focus:ring-rose-500 focus:ring-offset-0 transition-all cursor-pointer"
              />
              <Label htmlFor="terms" className="text-xs text-slate-400 font-medium leading-relaxed cursor-pointer select-none">
                أوافق على <Link href="/terms" className="text-rose-500 hover:underline">شروط الاستخدام</Link> و <Link href="/privacy" className="text-rose-500 hover:underline">سياسة الخصوصية</Link> الخاصة بمتجر زمني.
              </Label>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 mt-4 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(225,29,72,0.2)] transition-all flex items-center justify-center gap-2" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري تجهيز المتجر ...</span>
                </>
              ) : (
                <>
                  <span>إنشاء الحساب مجاناً</span>
                  <ArrowLeft className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          <div className="space-y-6 pt-4">
            <p className="text-center text-sm font-medium text-slate-500">
              لديك حساب بالفعل؟{' '}
              <Link href="/login" className="text-rose-500 hover:text-rose-400 transition-colors">
                تسجيل الدخول
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}