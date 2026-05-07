'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Zap, ArrowLeft, Mail, Lock, Sparkles, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
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
    <div className="min-h-screen bg-[#030712] flex text-slate-50 selection:bg-rose-500/30 overflow-hidden" dir="rtl">
      
      {/* ── Left Panel (Branding) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-14 border-l border-slate-800/50 bg-slate-900/20">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-600/15 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-16 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-xl tracking-tight">Zameny</p>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Advanced E-commerce Engine</p>
            </div>
          </Link>

          

          <h1 className="text-5xl font-black text-white leading-[1.2] mb-6 tracking-tight">
            لوحة تحكم<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-purple-500">
              التجارة الذكية.
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md font-medium">
            تابع مبيعاتك لحظة بلحظة، احمِ متجرك من الإرجاع الوهمي، وأدر مخزونك بذكاء من مكان واحد.
          </p>
        </div>

        {/* Premium Stats Glass Cards */}
        <div className="relative z-10 grid grid-cols-3 gap-5">
          {[
            { value: '99.9%', label: 'دقة الحماية' },
            { value: '< 1s', label: 'سرعة التحليل' },
            { value: '24/7', label: 'مراقبة آلية' },
          ].map((stat) => (
            <div key={stat.value} className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-5 text-center hover:-translate-y-1 transition-transform duration-300 shadow-2xl">
              <p className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 mb-1">{stat.value}</p>
              <p className="text-xs font-medium text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel (Form) ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-[420px] space-y-8">
          
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-black text-2xl tracking-tight">Zameny</span>
          </div>

          <div>
            <h2 className="text-3xl font-black text-white mb-2">مرحباً بعودتك</h2>
            <p className="text-slate-400 text-base">قم بتسجيل الدخول للوصول إلى متجرك</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-300">البريد الإلكتروني</Label>
              <div className="relative group" dir="ltr">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mystore.com"
                  className="h-14 pl-11 pr-4 bg-[#0a0f1c] border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-rose-500 focus-visible:border-rose-500 rounded-xl text-base transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-300">كلمة المرور</Label>
                <Link href="#" className="text-xs font-medium text-rose-500 hover:text-rose-400 transition-colors">
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <div className="relative group" dir="ltr">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                </div>
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-14 pl-11 pr-12 bg-[#0a0f1c] border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-rose-500 focus-visible:border-rose-500 rounded-xl text-base transition-all tracking-widest"
                  autoComplete="current-password"
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

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-14 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(225,29,72,0.2)] hover:shadow-[0_0_30px_rgba(225,29,72,0.4)] transition-all flex items-center justify-center gap-2" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري الدخول...</span>
                </>
              ) : (
                <>
                  <span>دخول للوحة التحكم</span>
                  <Activity className="w-5 h-5 opacity-80" />
                </>
              )}
            </Button>
          </form>

          {/* Footer Link */}
          <p className="text-center text-sm font-medium text-slate-500 pt-4">
            ليس لديك متجر بعد؟{' '}
            <Link href="/register" className="text-rose-500 hover:text-rose-400 transition-colors">
              ابدأ مجاناً الآن
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}