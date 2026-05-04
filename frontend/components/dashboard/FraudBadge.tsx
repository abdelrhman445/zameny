import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { RiskLevel, FraudAnalysis } from '@/types';
import { cn } from '@/lib/utils';

interface FraudBadgeProps {
  fraudAnalysis: FraudAnalysis;
  showScore?: boolean;
  showReason?: boolean;
}

const config: Record<RiskLevel, {
  label: string;
  icon: React.ElementType;
  className: string;
  dotClass: string;
}> = {
  Low: {
    label: 'آمن',
    icon: ShieldCheck,
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  Medium: {
    label: 'متوسط',
    icon: AlertTriangle,
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
    dotClass: 'bg-amber-500',
  },
  High: {
    label: 'خطر',
    icon: ShieldAlert,
    className: 'bg-red-50 text-red-700 border border-red-200',
    dotClass: 'bg-red-500',
  },
};

export default function FraudBadge({ fraudAnalysis, showScore = false, showReason = false }: FraudBadgeProps) {
  const { riskLevel, score, reason } = fraudAnalysis;
  const { label, icon: Icon, className, dotClass } = config[riskLevel];

  return (
    <div className="space-y-1">
      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', className)}>
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotClass)} />
        <Icon className="w-3 h-3 flex-shrink-0" />
        <span>{label}</span>
        {showScore && (
          <span className="font-bold">({score})</span>
        )}
      </span>
      {showReason && reason && (
        <p className="text-[10px] text-muted-foreground max-w-[200px] leading-relaxed">{reason}</p>
      )}
    </div>
  );
}
