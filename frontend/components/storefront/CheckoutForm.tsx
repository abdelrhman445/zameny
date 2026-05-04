'use client';
import React from 'react';
import { Phone, MapPin, User, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="cf-name">الاسم الكامل *</Label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="cf-name"
              value={form.customerName}
              onChange={onChange('customerName')}
              placeholder="محمد علي"
              className="pr-9"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="cf-phone">رقم الهاتف *</Label>
          <div className="relative">
            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="cf-phone"
              value={form.customerPhone}
              onChange={onChange('customerPhone')}
              placeholder="01012345678"
              dir="ltr"
              className="pr-9"
              inputMode="tel"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <Label htmlFor="cf-address">العنوان *</Label>
        <div className="relative">
          <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="cf-address"
            value={form.customerAddress}
            onChange={onChange('customerAddress')}
            placeholder="123 شارع التحرير، القاهرة"
            className="pr-9"
          />
        </div>
      </div>

      {/* City */}
      <div className="space-y-1.5">
        <Label htmlFor="cf-city">المدينة</Label>
        <Input
          id="cf-city"
          value={form.customerCity}
          onChange={onChange('customerCity')}
          placeholder="القاهرة"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="cf-notes" className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          ملاحظات (اختياري)
        </Label>
        <Input
          id="cf-notes"
          value={form.notes}
          onChange={onChange('notes')}
          placeholder="أي تعليمات إضافية للتوصيل..."
        />
      </div>
    </div>
  );
}
