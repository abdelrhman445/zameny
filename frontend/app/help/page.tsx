'use client';

import React, { useState } from 'react';
import { 
  Search, Package, Truck, RefreshCcw, CreditCard, 
  Mail, MessageCircle, ChevronDown, LifeBuoy
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const HELP_CATEGORIES = [
  { title: 'تتبع الطلبات', icon: Package, desc: 'حالة طلبك وتفاصيل الشحنة' },
  { title: 'الشحن والتوصيل', icon: Truck, desc: 'أوقات ومناطق ومصاريف الشحن' },
  { title: 'المرتجعات', icon: RefreshCcw, desc: 'سياسة الاسترجاع والاستبدال' },
  { title: 'المدفوعات', icon: CreditCard, desc: 'طرق الدفع والتقسيط' },
];

const FAQS = [
  {
    q: 'كم يستغرق توصيل الطلب؟',
    a: 'يستغرق التوصيل عادةً من 2 إلى 4 أيام عمل داخل القاهرة والجيزة، ومن 3 إلى 6 أيام عمل لباقي المحافظات، وذلك حسب شركة الشحن وحالة الطقس.'
  },
  {
    q: 'كيف يمكنني تتبع حالة طلبي؟',
    a: 'بمجرد شحن طلبك، ستتلقى رسالة نصية أو بريد إلكتروني يحتوي على رقم التتبع (AWB) ورابط لشركة الشحن لمتابعة خط سير الشحنة لحظة بلحظة.'
  },
  {
    q: 'ما هي سياسة الاسترجاع والاستبدال؟',
    a: 'يمكنك استرجاع أو استبدال المنتجات خلال 14 يوماً من تاريخ الاستلام، بشرط أن يكون المنتج بحالته الأصلية ومرفق معه فاتورة الشراء.'
  },
  {
    q: 'هل يتوفر خيار الدفع عند الاستلام؟',
    a: 'نعم، نوفر خيار الدفع نقداً للمندوب عند استلام الشحنة (COD) في جميع المحافظات، وقد يتطلب الأمر تأكيد طلبك عبر رمز OTP.'
  },
  {
    q: 'استلمت منتجاً تالفاً، ماذا أفعل؟',
    a: 'نعتذر عن ذلك! يرجى التواصل مع خدمة العملاء فوراً وإرفاق صور للمنتج التالف، وسنقوم باستبداله لك مجاناً في أسرع وقت.'
  }
];

export default function HelpCenterPage() {
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const filteredFaqs = FAQS.filter(faq => 
    faq.q.includes(search) || faq.a.includes(search)
  );

  return (
    // السر هنا: إعطاء الصفحة بالكامل خلفية موحدة (bg-slate-50)
    <div className="min-h-screen bg-slate-50 pb-24" dir="rtl">
      
      {/* ── Hero & Search Section ── */}
      <div className="py-12 md:py-20 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm mb-4">
            <LifeBuoy className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">كيف يمكننا مساعدتك اليوم؟</h1>
          <p className="text-slate-500 text-sm md:text-base font-medium max-w-xl mx-auto">
            ابحث عن إجابات لأسئلتك أو تصفح الموضوعات الشائعة لحل أي مشكلة تواجهك بسرعة.
          </p>

          <div className="relative max-w-2xl mx-auto mt-8">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن سؤالك هنا..."
              className="h-14 pr-12 rounded-xl bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-sm text-base"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* ── Help Categories ── */}
        {!search && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6">موضوعات المساعدة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {HELP_CATEGORIES.map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <button key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 text-right hover:border-indigo-600 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-50 transition-colors">
                      <Icon className="w-6 h-6 text-slate-600 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">{cat.title}</h3>
                    <p className="text-xs text-slate-500">{cat.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── FAQ Section ── */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            {search ? 'نتائج البحث' : 'الأسئلة الشائعة'}
          </h2>
          
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 font-medium">لم نجد نتائج مطابقة لبحثك. جرب كلمات أخرى.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-sm hover:border-slate-300">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-5 text-right hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-bold text-slate-900 text-sm md:text-base">{faq.q}</span>
                      <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0", isOpen && "rotate-180")} />
                    </button>
                    <div 
                      className={cn(
                        "px-5 text-slate-600 text-sm font-medium leading-relaxed transition-all duration-300 ease-in-out",
                        isOpen ? "max-h-40 pb-5 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                      )}
                    >
                      {faq.a}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Contact Support ── */}
        <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-center mt-12 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <h2 className="text-2xl font-bold text-white mb-3 relative z-10">لم تجد إجابة لسؤالك؟</h2>
          <p className="text-slate-400 text-sm mb-8 relative z-10">فريق الدعم الفني لدينا متاح دائمًا لمساعدتك في أي وقت.</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            {/* زر الواتساب شغال */}
            <a 
              href="https://wa.me/201016654858" 
              target="_blank"
              rel="noopener noreferrer"
              className="h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <MessageCircle className="w-5 h-5" /> تواصل عبر واتساب
            </a>
            
            {/* زر الإيميل شغال */}
            <a 
              href="mailto:support@zameny.tech?subject=طلب مساعدة من متجر زامني" 
              className="h-14 px-8 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Mail className="w-5 h-5" /> إرسال بريد إلكتروني
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}