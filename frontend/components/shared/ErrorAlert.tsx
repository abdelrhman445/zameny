import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorAlertProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorAlert({ 
  message = 'عذراً، حدث خطأ غير متوقع أثناء جلب البيانات. يرجى المحاولة مرة أخرى.', 
  onRetry,
  className 
}: ErrorAlertProps) {
  return (
    <div 
      className={cn(
        "min-h-[250px] w-full flex flex-col items-center justify-center gap-5 text-center p-8",
        "bg-rose-50/30 border border-rose-100/60 rounded-[2rem] shadow-sm animate-fade-in",
        className
      )}
      dir="rtl"
    >
      <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-rose-100/80">
        <AlertOctagon className="w-8 h-8 text-rose-500" />
      </div>
      
      <div className="space-y-1.5">
        <h3 className="text-xl font-black text-slate-900">تعذر إكمال العملية</h3>
        <p className="text-sm font-medium text-slate-500 max-w-md leading-relaxed mx-auto">
          {message}
        </p>
      </div>
      
      {onRetry && (
        <Button 
          variant="outline" 
          onClick={onRetry}
          className="mt-2 h-12 px-8 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 shadow-sm transition-all flex items-center gap-2.5 active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          <span>تحديث وإعادة المحاولة</span>
        </Button>
      )}
    </div>
  );
}