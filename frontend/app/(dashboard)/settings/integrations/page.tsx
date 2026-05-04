'use client';
import React, { useState } from 'react';
import { Send, Copy, ExternalLink, CheckCircle, Store, Link2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function IntegrationsPage() {
  const { merchant, setMerchant } = useAuthStore();
  const [telegramId, setTelegramId] = useState(merchant?.telegramChatId || '');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const storeSlug = merchant?.storeSlug ||
    merchant?.storeName?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '';
  const storeUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/${storeSlug}`;

  const handleSaveTelegram = async () => {
    if (!telegramId.trim()) { toast.error('يرجى إدخال Chat ID'); return; }
    setSaving(true);
    try {
      const res = await api.patch('/auth/update-telegram', { telegramChatId: telegramId.trim() });
      setMerchant(res.data.data.merchant);
      toast.success('تم ربط تيليجرام بنجاح ✅');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'فشل الحفظ';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const copyStoreUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    toast.success('تم نسخ رابط المتجر');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">الربط والتكامل</h1>
        <p className="text-sm text-muted-foreground mt-0.5">اربط متجرك مع الخدمات الخارجية</p>
      </div>

      {/* Store Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="w-4 h-4" />
            رابط متجرك
          </CardTitle>
          <CardDescription>شارك هذا الرابط مع عملائك للوصول لمتجرك</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 h-10 px-3 rounded-lg border bg-slate-50 flex items-center text-sm text-slate-700 font-mono overflow-hidden" dir="ltr">
              <span className="truncate">{storeUrl}</span>
            </div>
            <Button variant="outline" size="icon" onClick={copyStoreUrl}>
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="icon" asChild>
              <a href={`/${storeSlug}`} target="_blank">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Link2 className="w-3 h-3" />
            يمكن مشاركة هذا الرابط على وسائل التواصل الاجتماعي أو في إعلاناتك
          </p>
        </CardContent>
      </Card>

      {/* Telegram Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="w-4 h-4" />
            ربط تيليجرام
            {merchant?.telegramChatId && (
              <span className="mr-auto text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                ✅ مربوط
              </span>
            )}
          </CardTitle>
          <CardDescription>
            استقبل إشعارات الطلبات الجديدة فوراً على تيليجرام مع إمكانية تأكيد أو رفض الطلب مباشرة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-blue-800">كيفية الحصول على Chat ID:</p>
            <ol className="space-y-2 text-sm text-blue-700">
              <li className="flex gap-2">
                <span className="font-bold text-blue-900 flex-shrink-0">1.</span>
                افتح تيليجرام وابحث عن{' '}
                <a href="https://t.me/userinfobot" target="_blank" className="underline font-medium">@userinfobot</a>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-900 flex-shrink-0">2.</span>
                أرسل له أي رسالة وسيرد بـ Chat ID الخاص بك
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-900 flex-shrink-0">3.</span>
                انسخ الرقم وألصقه في الحقل أدناه
              </li>
            </ol>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telegram-id">Telegram Chat ID</Label>
            <div className="flex gap-2">
              <Input
                id="telegram-id"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="123456789"
                dir="ltr"
                className="flex-1"
              />
              <Button onClick={handleSaveTelegram} disabled={saving}>
                <Send className="w-4 h-4 ml-1.5" />
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </div>
          </div>

          {merchant?.telegramChatId && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-800">تيليجرام مربوط بنجاح</p>
                <p className="text-xs text-emerald-600" dir="ltr">Chat ID: {merchant.telegramChatId}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            معلومات API
          </CardTitle>
          <CardDescription>للمطورين الراغبين في بناء تكاملات مخصصة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-slate-900 rounded-xl p-4 text-sm font-mono">
            <p className="text-slate-400 text-xs mb-2"># Base URL</p>
            <p className="text-emerald-400">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}</p>
            <p className="text-slate-400 text-xs mt-3 mb-2"># Auth Header</p>
            <p className="text-blue-400">Authorization: Bearer {'<token>'}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            يمكنك الرجوع إلى توثيق API الخاص بالمنصة لمعرفة المزيد من endpoints المتاحة
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
