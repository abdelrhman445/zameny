'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck, FileText, Scale, Zap, Lock, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsPage() {
  const router = useRouter();

  const sections = [
    {
      icon: <FileText className="w-5 h-5 text-rose-500" />,
      title: '1. مقدمة وقبول الشروط',
      content: 'باستخدامك لمنصة Zameny Store، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء منها، يرجى عدم استخدام المنصة.'
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-rose-500" />,
      title: '2. حسابات التجار',
      content: 'أنت مسؤول عن الحفاظ على سرية بيانات حسابك ونشاطه. يجب أن تكون جميع البيانات المقدمة (الاسم، البريد، ايدي التيليجرام) دقيقة ومحدثة.'
    },
    {
      icon: <Zap className="w-5 h-5 text-rose-500" />,
      title: '3. الخدمات والاشتراكات',
      content: 'نحن نوفر خدمات إدارة المتاجر، كشف الاحتيال، والربط مع تيليجرام. قد تختلف الميزات المتاحة بناءً على باقة الاشتراك المختارة (Free, Pro, Enterprise).'
    },
    {
      icon: <Lock className="w-5 h-5 text-rose-500" />,
      title: '4. الملكية الفكرية',
      content: 'جميع المحتويات والبرمجيات والعلامات التجارية الخاصة بـ Zameny Store هي ملكية حصرية لنا، ولا يجوز نسخها أو استخدامها بدون إذن كتابي.'
    },
    {
      icon: <Scale className="w-5 h-5 text-rose-500" />,
      title: '5. حدود المسؤولية',
      content: 'نحن نسعى لتقديم أفضل خدمة، لكننا لا نتحمل المسؤولية عن أي خسائر تجارية مباشرة أو غير مباشرة ناتجة عن استخدام المنصة أو توقفها المؤقت.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 selection:bg-rose-500/30 pb-20" dir="rtl">
      
      {/* ── Background Glows ── */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 bg-[#030712]/80 backdrop-blur-md border-b border-slate-800/50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-rose-500 fill-rose-500" />
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
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">شروط الاستخدام</h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            آخر تحديث: 8 مايو 2026. يرجى قراءة هذه الشروط بعناية قبل البدء في إدارة متجرك.
          </p>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="px-6 max-w-4xl mx-auto">
        <div className="grid gap-8">
          {sections.map((section, index) => (
            <div 
              key={index} 
              className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-8 hover:border-rose-500/30 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-rose-500/10 rounded-2xl group-hover:scale-110 transition-transform">
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

        {/* ── Support Section ── */}
        <div className="mt-16 bg-gradient-to-br from-slate-900 to-[#030712] border border-slate-800 rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <HelpCircle className="w-24 h-24 text-white" />
          </div>
          <h3 className="text-2xl font-black text-white mb-4">هل لديك استفسار قانوني؟</h3>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            فريق الدعم الفني والقانوني متاح دائماً للإجابة على تساؤلاتكم بخصوص الخصوصية والشروط.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="mailto:support@zameny.tech">
              <Button className="bg-rose-600 hover:bg-rose-500 text-white font-bold h-12 px-8 rounded-xl">
                تواصل معنا عبر البريد
              </Button>
            </Link>
            <Link href="/privacy">
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white h-12 px-8 rounded-xl">
                سياسة الخصوصية
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-20 border-t border-slate-800/50 pt-10 text-center">
        <p className="text-slate-500 text-sm font-medium">
          Zameny Store © 2026 - جميع الحقوق محفوظة
        </p>
      </footer>
    </div>
  );
}