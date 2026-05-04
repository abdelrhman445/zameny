'use client';
import React, { useState } from 'react';
import { User, Mail, Store, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import api from '@/lib/api';
import { toast } from 'sonner';

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
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'فشل تغيير كلمة المرور';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">الملف الشخصي</h1>
        <p className="text-sm text-muted-foreground mt-0.5">إدارة بيانات حسابك</p>
      </div>

      {/* Merchant Info (read-only display) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            بيانات الحساب
          </CardTitle>
          <CardDescription>معلومات حسابك الأساسية</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              {merchant?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{merchant?.name}</p>
              <p className="text-sm text-muted-foreground">{merchant?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="w-3.5 h-3.5" /> الاسم
              </Label>
              <div className="h-10 px-3 rounded-lg border bg-muted/30 flex items-center text-sm text-slate-700">
                {merchant?.name}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="w-3.5 h-3.5" /> البريد الإلكتروني
              </Label>
              <div className="h-10 px-3 rounded-lg border bg-muted/30 flex items-center text-sm text-slate-700" dir="ltr">
                {merchant?.email}
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Store className="w-3.5 h-3.5" /> اسم المتجر
              </Label>
              <div className="h-10 px-3 rounded-lg border bg-muted/30 flex items-center text-sm text-slate-700">
                {merchant?.storeName}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${merchant?.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
              الحساب {merchant?.isActive ? 'نشط' : 'غير نشط'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4" />
            تغيير كلمة المرور
          </CardTitle>
          <CardDescription>يرجى استخدام كلمة مرور قوية تحتوي على أحرف وأرقام</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-pw">كلمة المرور الحالية</Label>
            <div className="relative">
              <Input
                id="current-pw"
                type={showCurrentPw ? 'text' : 'password'}
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                placeholder="••••••••"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-900"
              >
                {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-pw">كلمة المرور الجديدة</Label>
            <div className="relative">
              <Input
                id="new-pw"
                type={showNewPw ? 'text' : 'password'}
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                placeholder="••••••••"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-900"
              >
                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">8 أحرف على الأقل، تشمل حرف كبير وصغير ورقم</p>
          </div>

          <Button onClick={handleChangePassword} disabled={submitting} className="w-full sm:w-auto">
            <Save className="w-4 h-4 ml-1.5" />
            {submitting ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
