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
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const update = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.storeName) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
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
      
      {/* ── Left Panel (Marketing & Branding) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-14 border-l border-slate-800/50 bg-slate-900/20">
        {/* Ambient Glow */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-rose-600/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-16 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-xl tracking-tight">Zameny</p>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Smart Commerce</p>
            </div>
          </Link>

          <h1 className="text-4xl font-black text-white leading-[1.3] mb-6 tracking-tight">
            ابدأ البيع بثقة.<br />
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

        {/* Trust Badges */}
        <div className="relative z-10 flex items-center gap-6 border-t border-slate-800/50 pt-8 mt-12">
          <div className="flex -space-x-3 space-x-reverse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-[#030712] bg-slate-800 overflow-hidden">
                <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" className="w-full h-full object-cover opacity-80" />
              </div>
            ))}
          </div>
          <div>
            <p className="text-white font-bold">انضم لأكثر من 5,000 تاجر</p>
            <p className="text-sm text-slate-400">يثقون في Zameny لإدارة متاجرهم</p>
          </div>
        </div>
      </div>

      {/* ── Right Panel (Registration Form) ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10 overflow-y-auto">
        <div className="w-full max-w-[460px] space-y-8 py-8">
          
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-black text-2xl tracking-tight">Zameny</span>
          </div>

          <div>
            <h2 className="text-3xl font-black text-white mb-2">إنشاء متجر جديد</h2>
            <p className="text-slate-400 text-base">البيانات الأساسية لفتح حسابك كتاجر</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Name (RTL Input) */}
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
                    placeholder="أحمد حسن"
                    className="h-12 pr-11 pl-4 bg-[#0a0f1c] border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-rose-500 focus-visible:border-rose-500 rounded-xl transition-all"
                  />
                </div>
              </div>

              {/* Store Name (RTL Input) */}
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
                    placeholder="متجر الإلكترونيات"
                    className="h-12 pr-11 pl-4 bg-[#0a0f1c] border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-rose-500 focus-visible:border-rose-500 rounded-xl transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Email (LTR Input) */}
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
                  placeholder="admin@mystore.com"
                  className="h-12 pl-11 pr-4 bg-[#0a0f1c] border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-rose-500 focus-visible:border-rose-500 rounded-xl transition-all"
                />
              </div>
            </div>

            {/* Password (LTR Input) */}
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
                  className="h-12 pl-11 pr-12 bg-[#0a0f1c] border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-rose-500 focus-visible:border-rose-500 rounded-xl transition-all tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Telegram (LTR Input - Optional) */}
            <div className="space-y-2 pt-2">
              <Label htmlFor="telegram" className="text-sm font-semibold text-slate-300 flex items-center justify-between">
                <span>معرف تيليجرام (Chat ID)</span>
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
                  placeholder="123456789"
                  className="h-12 pl-11 pr-4 bg-[#0a0f1c] border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-rose-500 focus-visible:border-rose-500 rounded-xl transition-all"
                />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">أضفه الآن أو لاحقاً لاستقبال إشعارات فورية بالطلبات الجديدة مباشرة على هاتفك.</p>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-14 mt-4 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(225,29,72,0.2)] hover:shadow-[0_0_30px_rgba(225,29,72,0.4)] transition-all flex items-center justify-center gap-2" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري تجهيز المتجر...</span>
                </>
              ) : (
                <>
                  <span>إنشاء الحساب مجاناً</span>
                  <ArrowLeft className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {/* Footer & Badges */}
          <div className="space-y-6 pt-4">
            <p className="text-center text-sm font-medium text-slate-500">
              لديك حساب بالفعل؟{' '}
              <Link href="/login" className="text-rose-500 hover:text-rose-400 transition-colors">
                تسجيل الدخول
              </Link>
            </p>

            <div className="flex items-center justify-center gap-5 text-xs font-medium text-slate-500 border-t border-slate-800/50 pt-6">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> تشفير كامل</span>
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-rose-500" /> تفعيل فوري</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}