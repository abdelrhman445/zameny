'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Zap, ArrowLeft, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/useAuthStore';
import api, { setToken } from '@/lib/api';
import { AuthResponse } from '@/types';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('يرجى ملء جميع الحقول'); return; }
    setLoading(true);
    try {
      const res = await api.post<AuthResponse>('/auth/login', { email, password });
      const { token, data } = res.data;
      setAuth(data.merchant, token);
      toast.success(`أهلاً ${data.merchant.name}!`);
      router.push('/overview');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'بيانات الدخول غير صحيحة';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex" dir="rtl">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none">A.E.E</p>
              <p className="text-slate-400 text-xs">Advanced E-commerce Engine</p>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            منصة التجارة<br />
            <span className="text-rose-500">الأكثر ذكاءً</span><br />
            في مصر
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            محرك كشف الاحتيال المدمج يحمي متجرك من طلبات الإرجاع المزيفة ويرفع نسبة التسليم.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: '98%', label: 'نسبة التسليم' },
            { value: '0.3s', label: 'تحليل الاحتيال' },
            { value: '24/7', label: 'تنبيهات فورية' },
          ].map((stat) => (
            <div key={stat.value} className="bg-white/5 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold">A.E.E</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">تسجيل الدخول</h2>
            <p className="text-slate-400 mt-1 text-sm">مرحباً بعودتك إلى لوحة التحكم</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ahmed@mystore.com"
                  dir="ltr"
                  className="pr-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-rose-500"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-300">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="pr-9 pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-rose-500"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-semibold" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري الدخول...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  تسجيل الدخول
                  <ArrowLeft className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            ليس لديك حساب؟{' '}
            <Link href="/register" className="text-rose-500 hover:text-rose-400 font-medium">
              إنشاء متجر جديد
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
