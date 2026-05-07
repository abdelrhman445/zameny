import React from 'react';
import Link from 'next/link';
import { Zap, ShieldCheck, Truck, BarChart3, Bot, ArrowLeft, ChevronLeft, Sparkles, Activity } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-50 selection:bg-rose-500/30 overflow-hidden" dir="rtl">
      
      {/* Background Glow Effects (الإضاءة المحيطية) */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-rose-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>

      {/* Floating Navbar */}
      <div className="fixed top-0 inset-x-0 z-50 px-6 py-4">
        <nav className="max-w-6xl mx-auto bg-slate-900/50 backdrop-blur-md border border-slate-800/50 rounded-2xl px-6 py-3 flex items-center justify-between shadow-2xl shadow-black/50 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-l from-white to-slate-400">
              Zameny
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              دخول
            </Link>
            <Link
              href="/register"
              className="relative group overflow-hidden bg-white text-slate-950 text-sm font-bold px-5 py-2.5 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                ابدأ مجاناً <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="relative max-w-6xl mx-auto px-6 pt-40 pb-20 text-center z-10">
        <div className="animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm border border-rose-500/30 text-rose-400 text-sm font-medium px-4 py-2 rounded-full mb-8 shadow-[0_0_20px_rgba(225,29,72,0.15)]">
            <Sparkles className="w-4 h-4" />
            <span>الجيل الجديد من التجارة الإلكترونية في مصر</span>
          </div>
          <h1 className="text-6xl lg:text-8xl font-black leading-[1.1] mb-8 tracking-tight">
            بيع بثقة.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-rose-500 to-purple-500 drop-shadow-sm">
              احمِ أرباحك بذكاء.
            </span>
          </h1>
          <p className="text-slate-400 text-lg lg:text-xl max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
            المنصة الوحيدة المدمج بها <strong className="text-white font-bold">محرك ذكاء اصطناعي</strong> لكشف طلبات الإرجاع المزيفة (RTO). انسَ خسائر الشحن وركز على نمو مبيعاتك.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link
              href="/register"
              className="group relative bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all shadow-[0_0_40px_rgba(225,29,72,0.4)] hover:shadow-[0_0_60px_rgba(225,29,72,0.6)] hover:-translate-y-1 flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              ابدأ تجربتك المجانية <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="group bg-slate-900/50 hover:bg-slate-800 backdrop-blur-md border border-slate-700 text-slate-300 hover:text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              استكشف لوحة التحكم <Activity className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features - Glassmorphism Cards */}
      <section className="relative max-w-7xl mx-auto px-6 py-24 z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'group-hover:border-emerald-500/50',
              title: 'درع الحماية الذكي',
              desc: 'تحليل فوري لكل طلب لحساب نسبة الخطر بناءً على الـ IP، سجل المشتريات، وتاريخ الاستلام.',
            },
            {
              icon: Bot, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'group-hover:border-blue-500/50',
              title: 'أتمتة عبر تيليجرام',
              desc: 'لا حاجة لفتح الموقع دائماً. استقبل الطلبات ووافق عليها أو ارفضها بضغطة زر من تيليجرام.',
            },
            {
              icon: BarChart3, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'group-hover:border-rose-500/50',
              title: 'إحصائيات عميقة',
              desc: 'لوحة تحكم خرافية تعرض لك كل مليم يدخل متجرك، مع تنبيهات فورية لنواقص المخزون.',
            },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className={`group relative bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 hover:-translate-y-2 transition-all duration-300 ${f.border} overflow-hidden`}>
                {/* Hover Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${f.bg}`}>
                  <Icon className={`w-7 h-7 ${f.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{f.title}</h3>
                <p className="text-slate-400 text-base leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats - Premium Look */}
      <section className="relative z-10 py-20 border-y border-slate-800/50 bg-slate-900/20 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-12 text-center divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-slate-800">
          {[
            { value: '99.9%', label: 'دقة كشف الاحتيال' },
            { value: '< 200ms', label: 'زمن استجابة المحرك' },
            { value: '∞', label: 'طلبات ومدفوعات غير محدودة' },
          ].map((s) => (
            <div key={s.value} className="pt-8 sm:pt-0">
              <p className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500 mb-3">{s.value}</p>
              <p className="text-slate-400 font-medium text-lg">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="relative max-w-4xl mx-auto px-6 py-32 text-center z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-transparent blur-3xl -z-10 rounded-full" />
        <h2 className="text-4xl md:text-5xl font-black mb-6">مستعد لنقل متجرك للمستوى التالي؟</h2>
        <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
          انضم لنخبة التجار الذين يعتمدون على Zameny لزيادة أرباحهم وتقليل خسائر الشحن. الإعداد يستغرق دقيقة واحدة.
        </p>
        <Link
          href="/register"
          className="group relative inline-flex items-center gap-2 bg-white text-slate-950 font-bold px-10 py-5 rounded-2xl text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
        >
          أنشئ متجرك مجاناً <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-950 py-8 text-center relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-rose-500" />
            <span className="font-bold text-lg text-white">Zameny</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Zameny © {new Date().getFullYear()} — جميع الحقوق محفوظة
          </p>
        </div>
      </footer>
    </div>
  );
}