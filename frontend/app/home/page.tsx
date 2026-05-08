import React from 'react';
import Link from 'next/link';
import { Zap, ShieldCheck, Truck, BarChart3, Bot, ArrowLeft, ChevronLeft, Sparkles, Activity } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-50 selection:bg-rose-500/30 overflow-hidden" dir="rtl">
      
      {/* Background Glow Effects (الإضاءة المحيطية) */}
      <div className="absolute top-[-10%] right-[-5%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-rose-600/20 blur-[80px] sm:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full bg-indigo-600/10 blur-[80px] sm:blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>

      {/* Floating Navbar */}
      <div className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 py-4">
        <nav className="max-w-6xl mx-auto bg-slate-900/50 backdrop-blur-md border border-slate-800/50 rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xl shadow-black/50 transition-all">
          <div className="flex items-center gap-3">
            <span className="font-black text-lg sm:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-l from-white to-slate-400">
              Zameny
            </span>
          </div>
          {/* ✅ تم تعديل الأزرار هنا (تكبير المسافة، تحويل دخول لزرار، وتكبير ابدأ مجاناً) */}
          <div className="flex items-center gap-3 sm:gap-5">
            <Link 
              href="/login" 
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-300 bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all"
            >
              تسجيل دخول
            </Link>
            <Link
              href="/register"
              className="relative group overflow-hidden bg-white text-slate-950 text-sm sm:text-base font-black px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                ابدأ مجاناً <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-32 sm:pt-40 pb-16 sm:pb-20 text-center z-10">
        <div className="animate-fade-in-up">
          {/* ✅ تم تعديل العنوان هنا لمنع التلاصق وعمل مسافة ممتازة */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.15] sm:leading-[1.1] mb-6 sm:mb-8 tracking-tight">
            بيع بثقة.
            <span className="block mt-3 sm:mt-6 pb-2 bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-rose-500 to-purple-500 drop-shadow-sm">
              احمِ أرباحك بذكاء.
            </span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg lg:text-xl max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed font-medium">
            المنصة الوحيدة المدمج بها <strong className="text-white font-bold"> ذكاء اصطناعي</strong> لكشف طلبات الإرجاع المزيفة (RTO). انسَ خسائر الشحن وركز على نمو مبيعاتك.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-center">
            <Link
              href="/register"
              className="group relative bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-base sm:text-lg transition-all shadow-[0_0_40px_rgba(225,29,72,0.4)] hover:shadow-[0_0_60px_rgba(225,29,72,0.6)] hover:-translate-y-1 flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              ابدأ تجربتك المجانية <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="group bg-slate-900/50 hover:bg-slate-800 backdrop-blur-md border border-slate-700 text-slate-300 hover:text-white font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-base sm:text-lg transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              استكشف لوحة التحكم <Activity className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features - Glassmorphism Cards */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {[
            {
              icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'hover:border-emerald-500/50',
              title: 'كشف الاحتيال بالذكاء الاصطناعي',
              desc: 'كشف الطلبات المزيفة بفعالية عالية باستخدام تقنيات الذكاء الاصطناعي.',
            },
            {
              icon: Bot, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'hover:border-blue-500/50',
              title: 'متابعة فورية عبر تيليجرام',
              desc: 'لا حاجة لفتح الموقع دائماً. استقبل الطلبات ووافق عليها أو ارفضها بضغطة زر من تيليجرام.',
            },
            {
              icon: BarChart3, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'hover:border-rose-500/50',
              title: 'لوحة تحكم شاملة',
              desc: 'لوحة تحكم خرافية تعرض لك كل مليم يدخل متجرك، مع تنبيهات فورية لنواقص المخزون.',
            },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className={`group relative bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 hover:-translate-y-2 transition-all duration-300 ${f.border} overflow-hidden`}>
                {/* Hover Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 transition-transform group-hover:scale-110 ${f.bg}`}>
                  <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${f.color}`} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-white">{f.title}</h3>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats - Premium Look */}
      <section className="relative z-10 py-16 sm:py-20 border-y border-slate-800/50 bg-slate-900/20 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 text-center divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-slate-800">
          {[
            { value: '99.9%', label: 'دقة كشف الاحتيال' },
            { value: '200', label: 'زمن استجابة المحرك' },
            { value: '∞', label: 'طلبات غير محدودة ومحمية' },
          ].map((s) => (
            <div key={s.value} className="pt-8 sm:pt-0 first:pt-0">
              <p className="text-4xl sm:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500 mb-2 sm:mb-3">{s.value}</p>
              <p className="text-slate-400 font-medium text-base sm:text-lg">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-32 text-center z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-transparent blur-3xl -z-10 rounded-full" />
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-6 leading-tight">مستعد لنقل متجرك للمستوى التالي؟</h2>
        <p className="text-slate-400 text-base sm:text-lg mb-8 sm:mb-10 max-w-2xl mx-auto">
          انضم لنخبة التجار الذين يعتمدون على Zameny لزيادة أرباحهم وتقليل خسائر الشحن. الإعداد يستغرق دقيقة واحدة.
        </p>
        <Link
          href="/register"
          className="group relative inline-flex items-center justify-center gap-2 bg-white text-slate-950 font-bold px-8 sm:px-10 py-4 sm:py-5 rounded-2xl text-base sm:text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] w-full sm:w-auto"
        >
          أنشئ متجرك مجاناً <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-950 py-6 sm:py-8 text-center relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-white">Zameny</span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            Zameny © {new Date().getFullYear()}  All rights reserved. | <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link> | <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}