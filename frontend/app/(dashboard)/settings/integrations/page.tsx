'use client';

import React, { useState, useEffect } from 'react';
import { Send, Copy, ExternalLink, CheckCircle, Store, Link2, Terminal, Code2, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function IntegrationsPage() {
  const { merchant, setMerchant } = useAuthStore();
  const [telegramId, setTelegramId] = useState(merchant?.telegramChatId || '');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [origin, setOrigin] = useState('https://zameny.com');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // ✅ إصلاح مشكلة مسح الحروف العربية من الرابط
  const storeSlug = merchant?.storeSlug ||
    merchant?.storeName?.trim().replace(/\s+/g, '-') || '';
    
  const storeUrl = `${origin}/${storeSlug}`;

  const handleSaveTelegram = async () => {
    if (!telegramId.trim()) { toast.error('يرجى إدخال معرف المحادثة (Chat ID) أولاً'); return; }
    setSaving(true);
    try {
      const res = await api.patch('/auth/update-telegram', { telegramChatId: telegramId.trim() });
      setMerchant(res.data.data.merchant);
      toast.success('تم ربط حساب تيليجرام بنجاح');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'حدث خطأ أثناء الربط، يرجى المحاولة لاحقاً';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const copyStoreUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    toast.success('تم نسخ رابط المتجر إلى الحافظة');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-3xl animate-fade-in pb-10" dir="rtl">
      
      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">الربط والتكامل</h1>
        <p className="text-sm font-medium text-slate-500 mt-1.5">
          أدوات إضافية لربط متجرك مع الخدمات الخارجية وأتمتة عملياتك بالكامل.
        </p>
      </div>

      {/* ── Store Link Integration ── */}
      <Card className="border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Store className="w-5 h-5 text-indigo-500" />
            رابط المتجر الأساسي
          </CardTitle>
          <CardDescription className="font-medium text-slate-500">
            الرابط العام لمتجرك، شاركه مع عملائك للبدء في استقبال الطلبات.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* ✅ إصلاح ظهور الرابط بالكامل مع إمكانية التمرير لو طويل */}
            <div className="flex-1 h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center text-sm text-slate-700 font-mono font-bold overflow-x-auto whitespace-nowrap scrollbar-thin" dir="ltr">
              {storeUrl}
            </div>
            <div className="flex gap-2 shrink-0">
              {/* ✅ تظبيط مسافات الأيقونة والزرار (gap-2.5) */}
              <Button 
                variant="outline" 
                className={cn("h-12 px-5 rounded-xl border-slate-200 shadow-sm transition-all font-bold flex items-center gap-2.5", copied && "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700")} 
                onClick={copyStoreUrl}
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
              </Button>
              <Button variant="outline" className="h-12 w-12 p-0 rounded-xl border-slate-200 shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-colors shrink-0" asChild title="فتح المتجر">
                <a href={`/${storeSlug}`} target="_blank">
                  <ExternalLink className="w-5 h-5" />
                </a>
              </Button>
            </div>
          </div>
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-slate-400" />
            يمكنك وضع هذا الرابط في الـ Bio الخاص بك على انستجرام أو تيك توك.
          </p>
        </CardContent>
      </Card>

      {/* ── Telegram Integration ── */}
      <Card className="border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Send className="w-5 h-5 text-[#0088cc]" />
                روبوت تيليجرام
              </CardTitle>
              <CardDescription className="font-medium text-slate-500 mt-1">
                استقبل إشعارات لحظية، وقم بتأكيد أو إلغاء الطلبات مباشرة من هاتفك.
              </CardDescription>
            </div>
            {merchant?.telegramChatId && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg font-bold shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" /> متصل
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          
          <div className="bg-[#0088cc]/5 border border-[#0088cc]/10 rounded-2xl p-5 space-y-3">
            <p className="text-sm font-bold text-[#0088cc] mb-1">خطوات الربط (أقل من دقيقة):</p>
            <ol className="space-y-3 text-sm font-medium text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#0088cc]/10 text-[#0088cc] font-bold text-xs shrink-0 mt-0.5">1</span>
                <span>افتح تطبيق تيليجرام وابحث عن البوت <a href="https://t.me/userinfobot" target="_blank" className="text-[#0088cc] hover:underline font-bold" dir="ltr">@userinfobot</a></span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#0088cc]/10 text-[#0088cc] font-bold text-xs shrink-0 mt-0.5">2</span>
                <span>أرسل له أي رسالة (مثلاً كلمة <code>/start</code>)، وسيقوم بالرد بمعرفك الشخصي (Id).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#0088cc]/10 text-[#0088cc] font-bold text-xs shrink-0 mt-0.5">3</span>
                <span>انسخ الرقم الذي سيظهر لك (عادة يتكون من 9 أرقام أو أكثر) وألصقه في الحقل بالأسفل.</span>
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram-id" className="text-sm font-bold text-slate-700">معرف المحادثة (Telegram Chat ID)</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                id="telegram-id"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="مثال: 123456789"
                dir="ltr"
                autoComplete="off"
                className="flex-1 h-12 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-[#0088cc] text-slate-900 font-bold font-mono text-lg transition-all"
              />
              {/* ✅ تظبيط مسافات الأيقونة والزرار هنا أيضاً */}
              <Button 
                onClick={handleSaveTelegram} 
                disabled={saving}
                className="h-12 px-8 rounded-xl bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold shadow-lg shadow-[#0088cc]/20 transition-all flex items-center gap-2.5"
              >
                {saving ? (
                  <span>جاري الاتصال...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>حفظ وتفعيل</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {merchant?.telegramChatId && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl shadow-sm">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-800">البوت متصل ويعمل بنجاح</p>
                <p className="text-xs font-medium text-emerald-600 mt-0.5">سيتم إرسال إشعارات الطلبات الجديدة إلى معرفك المسجل.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── API Information (Terminal Look) ── */}
      <Card className="border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-700" />
            للمطورين (API Access)
          </CardTitle>
          <CardDescription className="font-medium text-slate-500">
            بيانات الاتصال البرمجي لبناء تكاملات مخصصة لمتجرك.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          
          <div className="bg-[#0f172a] rounded-2xl p-5 shadow-inner border border-slate-800 relative overflow-hidden group">
            <div className="flex gap-1.5 mb-4 opacity-50 group-hover:opacity-100 transition-opacity absolute top-4 left-4" dir="ltr">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>

            <div className="text-sm font-mono leading-loose" dir="ltr">
              <p className="text-slate-500 select-none"># Base API Endpoint</p>
              <p className="text-emerald-400 break-all bg-emerald-400/10 px-2 py-0.5 rounded inline-block mb-4 border border-emerald-400/20">
                {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}
              </p>
              
              <p className="text-slate-500 select-none mt-2"># Authentication Header</p>
              <div className="text-blue-400 flex flex-wrap gap-2 items-center">
                <span className="text-purple-400">Authorization:</span>
                <span>Bearer</span>
                <span className="text-amber-300">{'<your_access_token>'}</span>
              </div>
            </div>
          </div>

          <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-slate-400" />
            للحصول على الـ Token الخاص بك، يمكنك نسخه من طلبات تسجيل الدخول (Network Tab) كحل مؤقت لحين إضافة واجهة لإنشاء الـ Tokens.
          </p>
        </CardContent>
      </Card>
      
    </div>
  );
}