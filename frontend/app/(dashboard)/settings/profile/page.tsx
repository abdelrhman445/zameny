'use client';

import React, { useState } from 'react';
import { User, Mail, Store, Lock, Save, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { merchant, setMerchant } = useAuthStore();
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.patch('/auth/change-password', pwForm);
      // Update token in store if returned
      if (res.data.data?.merchant) setMerchant(res.data.data.merchant);
      toast.success('تم تغيير كلمة المرور بنجاح');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'تعذر تغيير كلمة المرور، يرجى المحاولة لاحقاً';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl animate-fade-in pb-10" dir="rtl">
      
      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">الملف الشخصي</h1>
        <p className="text-sm font-medium text-slate-500 mt-1.5">
          إدارة بيانات حسابك وتأمين تسجيل الدخول الخاص بمتجرك.
        </p>
      </div>

      {/* ── Merchant Info (Read-only) ── */}
      <Card className="border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" />
            البيانات الأساسية
          </CardTitle>
          <CardDescription className="font-medium text-slate-500">
            المعلومات المرتبطة بحسابك كتاجر على منصة Zameny.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          
          {/* Avatar & Status Highlight */}
          <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-3xl font-black shadow-md shrink-0">
              {merchant?.name?.[0]?.toUpperCase() || 'Z'}
            </div>
            <div>
              <p className="font-black text-xl text-slate-900 mb-1">{merchant?.name}</p>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border', 
                  merchant?.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", merchant?.isActive ? "bg-emerald-500" : "bg-rose-500")} />
                  {merchant?.isActive ? 'حساب نشط' : 'حساب موقوف'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Name Field */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                الاسم الكامل
              </Label>
              <div className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center text-sm font-bold text-slate-900 select-none">
                {merchant?.name}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                البريد الإلكتروني
              </Label>
              <div className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center text-sm font-bold text-slate-900 select-none" dir="ltr">
                {merchant?.email}
              </div>
            </div>

            {/* Store Name Field */}
            <div className="space-y-2 sm:col-span-2">
              <Label className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                اسم المتجر
              </Label>
              <div className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center text-sm font-bold text-slate-900 select-none">
                <Store className="w-4 h-4 text-slate-400 ml-2" />
                {merchant?.storeName}
              </div>
              <p className="text-xs font-medium text-slate-400 mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> هذه البيانات موثقة ولا يمكن تعديلها يدوياً لأغراض أمنية.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Change Password ── */}
      <Card className="border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-500" />
            تأمين الحساب
          </CardTitle>
          <CardDescription className="font-medium text-slate-500">
            تحديث كلمة المرور الخاصة بتسجيل الدخول لمتجرك.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-5">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current-pw" className="text-sm font-bold text-slate-700">كلمة المرور الحالية</Label>
            <div className="relative group" dir="ltr">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <Input
                id="current-pw"
                type={showCurrentPw ? 'text' : 'password'}
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                placeholder="••••••••"
                autoComplete="off"
                className="h-12 pl-11 pr-12 rounded-xl bg-white border-slate-200 focus-visible:ring-indigo-500 text-slate-900 font-bold font-mono tracking-widest text-lg transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                title={showCurrentPw ? "إخفاء" : "إظهار"}
              >
                {showCurrentPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-pw" className="text-sm font-bold text-slate-700">كلمة المرور الجديدة</Label>
            <div className="relative group" dir="ltr">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <Input
                id="new-pw"
                type={showNewPw ? 'text' : 'password'}
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                placeholder="••••••••"
                autoComplete="off"
                className="h-12 pl-11 pr-12 rounded-xl bg-white border-slate-200 focus-visible:ring-indigo-500 text-slate-900 font-bold font-mono tracking-widest text-lg transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                title={showNewPw ? "إخفاء" : "إظهار"}
              >
                {showNewPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1 leading-relaxed">
              يجب أن تتكون من 8 أحرف على الأقل، ويفضل أن تحتوي على مزيج من الأحرف الكبيرة والصغيرة والأرقام.
            </p>
          </div>

          <div className="pt-2">
            <Button 
              onClick={handleChangePassword} 
              disabled={submitting} 
              className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/20 w-full sm:w-auto transition-all"
            >
              {submitting ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
              {!submitting && <Save className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}