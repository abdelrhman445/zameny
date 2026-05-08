'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Eye, Database, Share2, UserCheck, Zap, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPage() {
  const router = useRouter();

  const sections = [
    {
      icon: <Database className="w-5 h-5 text-indigo-500" />,
      title: '1. البيانات التي نجمعها',
      content: 'نجمع البيانات الضرورية لتقديم خدماتنا، وتشمل: اسمك، بريدك الإلكتروني، اسم متجرك، ومعرف (ID) حساب التيليجرام الخاص بك لتفعيل الإشعارات الفورية.'
    },
    {
      icon: <Eye className="w-5 h-5 text-indigo-500" />,
      title: '2. كيف نستخدم بياناتك',
      content: 'نستخدم بياناتك لإدارة حسابك، معالجة اشتراكاتك، إرسال أكواد التحقق (OTP)، وتزويدك بإحصائيات دقيقة حول مبيعات متجرك وكشف محاولات الاحتيال.'
    },
    {
      icon: <Lock className="w-5 h-5 text-indigo-500" />,
      title: '3. حماية وتشفير البيانات',
      content: 'تُخزن كلمات المرور وأكواد التحقق باستخدام تقنيات تشفير متطورة (Hashing). نحن نطبق معايير أمنية صارمة لمنع أي وصول غير مصرح به لبيانات متجرك.'
    },
    {
      icon: <Share2 className="w-5 h-5 text-indigo-500" />,
      title: '4. مشاركة البيانات مع أطراف ثالثة',
      content: 'لا نقوم ببيع بياناتك أبداً. نشارك فقط المعلومات اللازمة مع مقدمي الخدمات الموثوقين مثل Stripe للمدفوعات و Resend لإرسال رسائل البريد الإلكتروني.'
    },
    {
      icon: <UserCheck className="w-5 h-5 text-indigo-500" />,
      title: '5. حقوقك كتاجر',
      content: 'لديك الحق الكامل في الوصول إلى بياناتك، تعديلها، أو طلب حذف حسابك بالكامل من منصتنا في أي وقت من خلال إعدادات الحساب أو التواصل مع الدعم.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 selection:bg-indigo-500/30 pb-20" dir="rtl">
      
      {/* ── Background Glows ── */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-rose-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 bg-[#030712]/80 backdrop-blur-md border-b border-slate-800/50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-indigo-500 fill-indigo-500" />
            <span className="text-white font-black text-xl tracking-tight">Zameny Store</span>
          </Link>
          <Button variant="ghost" onClick={() => router.back()} className="text-slate-400 hover:text-white">
            <ArrowRight className="ml-2 w-4 h-4" /> العودة
          </Button>
        </div>
      </nav>

      {/* ── Header ── */}
      <header className="py-20 px-6 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto">
          
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">سياسة الخصوصية</h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto">
            نحن في زمني ستور نلتزم بحماية بياناتك الشخصية والتجارية بأعلى معايير الأمان الرقمي المعترف بها عالمياً.
          </p>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="px-6 max-w-4xl mx-auto">
        <div className="grid gap-8">
          {sections.map((section, index) => (
            <div 
              key={index} 
              className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-8 hover:border-indigo-500/30 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-500/10 rounded-2xl group-hover:rotate-12 transition-transform">
                  {section.icon}
                </div>
                <h2 className="text-xl font-black text-white">{section.title}</h2>
              </div>
              <p className="text-slate-400 leading-relaxed text-base font-medium mr-14">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* ── Support & Contact ── */}
        <div className="mt-16 bg-gradient-to-br from-indigo-900/20 to-transparent border border-slate-800 rounded-3xl p-10 text-center relative overflow-hidden">
          <h3 className="text-2xl font-black text-white mb-4">هل لديك استفسار حول بياناتك؟</h3>
          <p className="text-slate-400 mb-8 max-w-md mx-auto font-medium">
            إذا كنت ترغب في معرفة المزيد عن كيفية تعاملنا مع بياناتك، لا تتردد في مراسلة فريق حماية البيانات لدينا.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="mailto:privacy@zameny.tech">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 px-8 rounded-xl flex items-center gap-2">
                <Mail className="w-4 h-4" /> مراسلة مسؤول الخصوصية
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-20 border-t border-slate-800/50 pt-10 text-center px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-slate-500 text-sm font-medium">
            Zameny Store © 2026 - خصوصيتك أمانة نعتز بها.
          </p>
          <div className="flex items-center gap-6 text-sm font-bold text-slate-400">
            <Link href="/terms" className="hover:text-white transition-colors">شروط الاستخدام</Link>
            <Link href="/help" className="hover:text-white transition-colors">مركز المساعدة</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}