'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Zap, ArrowLeft, Mail, Lock, User, Store, Send } from 'lucide-react';
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
      toast.success('تم إنشاء متجرك بنجاح! 🎉');
      router.push('/overview');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'فشل إنشاء الحساب';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-lg space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-lg leading-none">A.E.E</p>
              <p className="text-slate-400 text-xs">Advanced E-commerce Engine</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">إنشاء متجر جديد</h2>
          <p className="text-slate-400 text-sm mt-1">انضم لآلاف التجار الناجحين على المنصة</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8">
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-slate-300">
                  الاسم الكامل <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="name"
                    value={form.name}
                    onChange={update('name')}
                    placeholder="أحمد حسن"
                    className="pr-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-rose-500"
                  />
                </div>
              </div>

              {/* Store Name */}
              <div className="space-y-1.5">
                <Label htmlFor="store" className="text-slate-300">
                  اسم المتجر <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Store className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="store"
                    value={form.storeName}
                    onChange={update('storeName')}
                    placeholder="متجر حسن للإلكترونيات"
                    className="pr-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300">
                البريد الإلكتروني <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="ahmed@mystore.com"
                  dir="ltr"
                  className="pr-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-rose-500"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-300">
                كلمة المرور <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="8 أحرف على الأقل"
                  dir="ltr"
                  className="pr-9 pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-rose-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500">يجب أن تحتوي على حرف كبير وصغير ورقم</p>
            </div>

            {/* Telegram (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="telegram" className="text-slate-300 flex items-center gap-2">
                <Send className="w-3.5 h-3.5" />
                Telegram Chat ID
                <span className="text-slate-500 font-normal text-xs">(اختياري)</span>
              </Label>
              <Input
                id="telegram"
                value={form.telegramChatId}
                onChange={update('telegramChatId')}
                placeholder="123456789"
                dir="ltr"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-rose-500"
              />
              <p className="text-xs text-slate-500">لاستقبال إشعارات الطلبات فوراً على تيليجرام</p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري الإنشاء...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  إنشاء المتجر مجاناً
                  <ArrowLeft className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="text-rose-500 hover:text-rose-400 font-medium">
            تسجيل الدخول
          </Link>
        </p>

        {/* Trust badges */}
        <div className="flex justify-center gap-6 text-xs text-slate-600">
          <span>🔒 بيانات محمية</span>
          <span>⚡ تفعيل فوري</span>
          <span>🤖 كشف احتيال ذكي</span>
        </div>
      </div>
    </div>
  );
}
