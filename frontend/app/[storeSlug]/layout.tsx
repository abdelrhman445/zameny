'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingCart, Store, Zap } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import CartSheet from '@/components/storefront/CartSheet';
import { Merchant } from '@/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // ✅ فك تشفير الرابط عشان الحروف العربية تظهر صح بدل الرموز 
    const decodedSlug = decodeURIComponent(storeSlug);
    
    setStoreSlug(decodedSlug);

    // تجميل اسم المتجر ليظهر كعنوان رئيسي بدون الشُرط
    const formatted = decodedSlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
      
    setStoreInfo({ storeName: formatted });
  }, [storeSlug, setStoreSlug]);

  // تجهيز الاسم للعرض المباشر
  const displayStoreName = storeInfo?.storeName || decodeURIComponent(storeSlug);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-indigo-500/30" dir="rtl">
      
      {/* ── Glassmorphic Header ── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_-15px_rgba(0,0,0,0.05)] transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          
          {/* Store Info */}
          <div className="flex items-center gap-3">
            {/* التعديل هنا: دائرة بيضاء نظيفة بحدود خفيفة */}
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-200 overflow-hidden">
              <Image 
                src="/icon.svg" 
                alt="شعار الموقع" 
                width={44} // كبرناها شوية عشان تملى الدائرة
                height={44} 
                className="object-cover w-full h-full"
                priority
              />
            </div>
            
            <div className="flex flex-col">
              <p className="font-black text-slate-900 text-base sm:text-lg leading-none tracking-tight truncate max-w-[150px] sm:max-w-xs" title={displayStoreName}>
                {displayStoreName}
              </p>
            </div>
          </div>

          {/* Cart Button */}
          <button
            onClick={() => setCartOpen(true)}
            suppressHydrationWarning
            className="relative flex items-center gap-2.5 bg-slate-900 text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">سلة المشتريات</span>
            
            {/* Cart Badge */}
            <span 
              suppressHydrationWarning
              className={cn(
                "absolute -top-1.5 -right-1.5 sm:-left-1.5 sm:right-auto bg-rose-500 text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center transition-all duration-300 shadow-sm border-2 border-white",
                (isMounted && count > 0) ? "opacity-100 scale-100" : "opacity-0 scale-0 invisible"
              )}
            >
              {isMounted && count > 0 ? (count > 9 ? '9+' : count) : '0'}
            </span>
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {children}
      </main>

      {/* ── Minimalist Footer ── */}
      <footer className="border-t border-slate-200/60 bg-white/50 py-8 text-center mt-auto">
        <p className="text-sm text-slate-600">
          Zameny
        </p>
      </footer>

      {/* ── Cart Drawer ── */}
      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        storeSlug={storeSlug}
      />
    </div>
  );
}