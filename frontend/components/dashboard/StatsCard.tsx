import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'slate' | 'indigo';
  loading?: boolean;
}

// 🎨 تحديث الألوان لتطابق Zameny Premium
const colorMap = {
  blue: { bg: 'bg-blue-50/80', icon: 'text-blue-600', border: 'border-blue-100' },
  indigo: { bg: 'bg-indigo-50/80', icon: 'text-indigo-600', border: 'border-indigo-100' },
  emerald: { bg: 'bg-emerald-50/80', icon: 'text-emerald-600', border: 'border-emerald-100' },
  amber: { bg: 'bg-amber-50/80', icon: 'text-amber-600', border: 'border-amber-100' },
  red: { bg: 'bg-rose-50/80', icon: 'text-rose-600', border: 'border-rose-100' },
  slate: { bg: 'bg-slate-50', icon: 'text-slate-600', border: 'border-slate-200' },
};

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, color = 'indigo', loading }: StatsCardProps) {
  const colors = colorMap[color] || colorMap.indigo;

  if (loading) {
    return (
      <Card className="border border-slate-200/50 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="h-4 w-24 rounded-md bg-slate-200/60 animate-pulse" />
              <div className="h-8 w-32 rounded-lg bg-slate-200/80 animate-pulse" />
              <div className="h-3 w-20 rounded-md bg-slate-100 animate-pulse" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
      
  }

  return (
    <Card className="relative overflow-hidden bg-white border border-slate-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1.5 flex-1 min-w-0 pr-2">
            <p className="text-xs font-bold text-slate-500 truncate">{title}</p>
            <p className="text-3xl font-black text-slate-900 truncate tracking-tight">{value}</p>
            
            {subtitle && (
              <p className="text-xs font-medium text-slate-400 truncate mt-1">{subtitle}</p>
            )}
            
            {trend && (
              <p className={cn(
                'text-xs font-bold mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md', 
                trend.value >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              )}>
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
              </p>
            )}
          </div>
          
          <div className={cn(
            'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm transition-colors duration-300', 
            colors.bg, colors.border
          )}>
            <Icon className={cn('w-6 h-6', colors.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}