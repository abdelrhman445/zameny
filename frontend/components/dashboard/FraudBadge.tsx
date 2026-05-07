import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { RiskLevel, FraudAnalysis } from '@/types';
import { cn } from '@/lib/utils';

interface FraudBadgeProps {
  fraudAnalysis: FraudAnalysis;
  showScore?: boolean;
  showReason?: boolean;
}

// 🎨 تحديث النصوص والألوان لتعكس الاحترافية والوضوح
const config: Record<RiskLevel, {
  label: string;
  icon: React.ElementType;
  className: string;
  dotClass: string;
}> = {
  Low: {
    label: 'آمن',
    icon: ShieldCheck,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    dotClass: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
  },
  Medium: {
    label: 'خطر متوسط',
    icon: AlertTriangle,
    className: 'bg-amber-50 text-amber-700 border-amber-200/60',
    dotClass: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
  },
  High: {
    label: 'عالي الخطر',
    icon: ShieldAlert,
    className: 'bg-rose-50 text-rose-700 border-rose-200/60',
    dotClass: 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]',
  },
};

export default function FraudBadge({ fraudAnalysis, showScore = false, showReason = false }: FraudBadgeProps) {
  const { riskLevel, score, reason } = fraudAnalysis;
  const { label, icon: Icon, className, dotClass } = config[riskLevel];

  return (
    <div className="flex flex-col gap-1.5 w-max">
      <span className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider border shadow-sm', 
        className
      )}>
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotClass)} />
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{label}</span>
        
        {showScore && (
          <span className="opacity-80 border-r border-current pr-1.5 ml-0.5">
            {score}/100
          </span>
        )}
      </span>
      
      {showReason && reason && (
        <p className="text-[10px] font-medium text-slate-500 max-w-[220px] leading-relaxed bg-slate-50 p-2 rounded-md border border-slate-100">
          {reason}
        </p>
      )}
    </div>
  );
}