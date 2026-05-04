'use client';
import React, { useEffect, useState } from 'react';
import { ShoppingCart, Store, Zap } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import CartSheet from '@/components/storefront/CartSheet';
import { Merchant } from '@/types';
import { cn } from '@/lib/utils';

interface StorefrontLayoutProps {
  children: React.ReactNode;
  params: { storeSlug: string };
}

export default function StorefrontLayout({ children, params }: StorefrontLayoutProps) {
  const { storeSlug } = params;
  const [storeInfo, setStoreInfo] = useState<Partial<Merchant> | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const { itemCount, setStoreSlug } = useCartStore();
  const count = itemCount();

  // ✅ حل مشكلة الـ Hydration
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setStoreSlug(storeSlug);

    const formatted = storeSlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    setStoreInfo({ storeName: formatted });
  }, [storeSlug, setStoreSlug]);

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm leading-none">
                {storeInfo?.storeName || storeSlug}
              </p>
              <p className="text-[10px] text-muted-foreground">متجر إلكتروني</p>
            </div>
          </div>

          <button
            onClick={() => setCartOpen(true)}
            suppressHydrationWarning
            className="relative flex items-center gap-2 bg-slate-900 text-white rounded-xl px-3 py-2 text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">العربة</span>
            
            {/* ✅ التحكم في الظهور لتجنب الإيرور الأحمر */}
            <span 
              suppressHydrationWarning
              className={cn(
                "absolute -top-1.5 -left-1.5 bg-rose-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center transition-all duration-300",
                (isMounted && count > 0) ? "opacity-100 scale-100" : "opacity-0 scale-0 invisible"
              )}
            >
              {isMounted && count > 0 ? (count > 9 ? '9+' : count) : '0'}
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12 py-6 text-center">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          مدعوم بـ
          <span className="inline-flex items-center gap-1 font-bold text-slate-700">
            <Zap className="w-3 h-3 text-rose-600" />
            A.E.E
          </span>
        </p>
      </footer>

      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        storeSlug={storeSlug}
      />
    </div>
  );
}