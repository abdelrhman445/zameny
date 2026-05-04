import React from 'react';
import Link from 'next/link';
import { Zap, ShieldCheck, Truck, BarChart3, Bot, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white" dir="rtl">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">A.E.E</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
              تسجيل الدخول
            </Link>
            <Link
              href="/register"
              className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              ابدأ مجاناً
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-rose-600/10 border border-rose-600/20 text-rose-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <ShieldCheck className="w-3.5 h-3.5" />
          محرك كشف الاحتيال #1 في مصر
        </div>
        <h1 className="text-5xl lg:text-7xl font-black leading-tight mb-6">
          بيع أكثر.<br />
          <span className="text-rose-500">احمِ متجرك.</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
          A.E.E هي منصة التجارة الإلكترونية الوحيدة في مصر المدمج فيها محرك ذكاء اصطناعي
          لكشف طلبات الإرجاع المزيفة (RTO) قبل الشحن.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors flex items-center gap-2 justify-center"
          >
            ابدأ مجاناً الآن <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
          >
            لديك حساب؟ ادخل
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: ShieldCheck, color: 'text-emerald-400 bg-emerald-400/10',
              title: 'كشف الاحتيال الفوري',
              desc: 'كل طلب يمر بمحرك تحليل يحسب درجة الأمان بناءً على سجل العميل، نسبة الإرجاع، والـ IP.',
            },
            {
              icon: Bot, color: 'text-blue-400 bg-blue-400/10',
              title: 'إشعارات تيليجرام',
              desc: 'استقبل كل طلب جديد على تيليجرام مع أزرار تأكيد وإلغاء فورية.',
            },
            {
              icon: BarChart3, color: 'text-rose-400 bg-rose-400/10',
              title: 'لوحة تحكم ذكية',
              desc: 'إحصائيات شاملة، جدول طلبات مع شارات الأمان، وإدارة كاملة للمخزون.',
            },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-slate-800 py-16">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {[
            { value: '98%', label: 'نسبة التسليم الناجح' },
            { value: '< 1s', label: 'زمن تحليل الطلب' },
            { value: '∞', label: 'طلبات يمكن معالجتها' },
          ].map((s) => (
            <div key={s.value}>
              <p className="text-4xl font-black text-white">{s.value}</p>
              <p className="text-slate-500 text-sm mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-black mb-4">جاهز تبدأ؟</h2>
        <p className="text-slate-400 mb-8">أنشئ متجرك في أقل من دقيقة. مجاناً تماماً.</p>
        <Link
          href="/register"
          className="bg-white text-slate-900 font-bold px-10 py-4 rounded-xl text-lg hover:bg-slate-100 transition-colors inline-flex items-center gap-2"
        >
          ابدأ الآن <ArrowLeft className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center">
        <p className="text-slate-600 text-sm flex items-center justify-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-rose-600" />
          A.E.E — Advanced E-commerce Engine © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
