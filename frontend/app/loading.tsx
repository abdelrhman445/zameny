import { Zap } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center overflow-hidden" dir="rtl">
      {/* إضاءة خلفية خافتة (Glow Effect) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-rose-600/20 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="relative flex flex-col items-center gap-6 z-10">
        {/* الحلقة الدوارة مع الأيقونة */}
        <div className="relative flex items-center justify-center">
          {/* الدائرة الخارجية المضيئة */}
          <div className="w-16 h-16 border-2 border-slate-800 border-t-rose-500 rounded-full animate-spin shadow-[0_0_15px_rgba(225,29,72,0.4)]" />
          
          {/* أيقونة المحرك في المنتصف تنبض */}
          <div className="absolute inset-0 flex items-center justify-center animate-pulse">
            <Zap className="w-6 h-6 text-rose-500 drop-shadow-[0_0_8px_rgba(225,29,72,0.8)]" />
          </div>
        </div>
        
        {/* النصوص */}
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 animate-pulse">
            A.E.E
          </p>
          <p className="text-sm font-medium text-slate-500">
            جاري تهيئة المحرك...
          </p>
        </div>
      </div>
    </div>
  );
}