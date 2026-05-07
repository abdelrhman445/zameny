import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  // 🎨 تظبيط المقاسات وسُمك الخطوط لتكون فخمة ومقروءة
  const sizes = { 
    sm: 'w-5 h-5 border-[3px]', 
    md: 'w-10 h-10 border-[3px]', 
    lg: 'w-14 h-14 border-4' 
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div 
        className={cn(
          'animate-spin rounded-full border-indigo-600/20 border-t-indigo-600', 
          sizes[size]
        )} 
      />
      {label && (
        <p className="text-sm font-bold text-slate-500 animate-pulse tracking-wide">
          {label}
        </p>
      )}
    </div>
  );
}

interface PageLoadingProps {
  label?: string;
  className?: string;
}

export function PageLoading({ label = 'جاري التجهيز...', className }: PageLoadingProps) {
  return (
    <div 
      className={cn(
        "min-h-[40vh] w-full flex items-center justify-center animate-fade-in",
        className
      )}
    >
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}