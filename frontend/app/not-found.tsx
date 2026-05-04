import Link from 'next/link';
import { Zap, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white" dir="rtl">
      <div className="text-center space-y-6 px-6">
        <div className="w-16 h-16 mx-auto bg-rose-600/10 rounded-2xl flex items-center justify-center">
          <Zap className="w-8 h-8 text-rose-500" />
        </div>
        <div>
          <h1 className="text-6xl font-black text-white mb-2">404</h1>
          <p className="text-slate-400 text-lg">الصفحة التي تبحث عنها غير موجودة</p>
        </div>
        <Link
          href="/home"
          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
