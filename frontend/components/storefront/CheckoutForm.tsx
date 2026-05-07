'use client';
import React from 'react';
import { Phone, MapPin, User, MessageSquare, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CheckoutFormProps {
  form: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerCity: string;
    notes: string;
  };
  onChange: (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function CheckoutForm({ form, onChange }: CheckoutFormProps) {
  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* ── Name Field ── */}
        <div className="space-y-2.5">
          <Label htmlFor="cf-name" className="text-sm font-bold text-slate-700 pr-1">الاسم الكامل للمستلم *</Label>
          <div className="relative group">
            <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              id="cf-name"
              value={form.customerName}
              onChange={onChange('customerName')}
              placeholder="مثال: أحمد محمد"
              autoComplete="name"
              className="h-14 pr-12 rounded-xl bg-slate-50/50 hover:bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-indigo-500 focus-visible:border-indigo-500 font-bold text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-medium"
            />
          </div>
        </div>

        {/* ── Phone Field ── */}
        <div className="space-y-2.5">
          <Label htmlFor="cf-phone" className="text-sm font-bold text-slate-700 pr-1">رقم الهاتف النشط *</Label>
          <div className="relative group" dir="ltr">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              id="cf-phone"
              value={form.customerPhone}
              onChange={onChange('customerPhone')}
              placeholder="01xxxxxxxxx"
              inputMode="tel"
              autoComplete="tel"
              className="h-14 pl-12 rounded-xl bg-slate-50/50 hover:bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-indigo-500 focus-visible:border-indigo-500 font-bold text-slate-900 tracking-wider transition-all placeholder:text-slate-400 placeholder:font-medium"
            />
          </div>
        </div>
      </div>

      {/* ── Address Field ── */}
      <div className="space-y-2.5">
        <Label htmlFor="cf-address" className="text-sm font-bold text-slate-700 pr-1">العنوان بالتفصيل *</Label>
        <div className="relative group">
          <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <Input
            id="cf-address"
            value={form.customerAddress}
            onChange={onChange('customerAddress')}
            placeholder="اسم المنطقة، الشارع، رقم العمارة والدور..."
            autoComplete="street-address"
            className="h-14 pr-12 rounded-xl bg-slate-50/50 hover:bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-indigo-500 focus-visible:border-indigo-500 font-bold text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* ── City Field ── */}
        <div className="space-y-2.5">
          <Label htmlFor="cf-city" className="text-sm font-bold text-slate-700 pr-1">المحافظة / المدينة</Label>
          <div className="relative group">
            <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              id="cf-city"
              value={form.customerCity}
              onChange={onChange('customerCity')}
              placeholder="مثال: القاهرة"
              autoComplete="address-level2"
              className="h-14 pr-12 rounded-xl bg-slate-50/50 hover:bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-indigo-500 focus-visible:border-indigo-500 font-bold text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-medium"
            />
          </div>
        </div>

        {/* ── Notes Field ── */}
        <div className="space-y-2.5">
          <Label htmlFor="cf-notes" className="text-sm font-bold text-slate-700 pr-1 flex items-center gap-1.5">
            ملاحظات إضافية <span className="text-xs font-medium text-slate-400">(اختياري)</span>
          </Label>
          <div className="relative group">
            <MessageSquare className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              id="cf-notes"
              value={form.notes}
              onChange={onChange('notes')}
              placeholder="مثال: الاتصال قبل الوصول بـ 30 دقيقة"
              autoComplete="off"
              className="h-14 pr-12 rounded-xl bg-slate-50/50 hover:bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-indigo-500 focus-visible:border-indigo-500 font-bold text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-medium"
            />
          </div>
        </div>
      </div>
      
    </div>
  );
}