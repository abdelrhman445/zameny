'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/button';
import { formatCurrency, cn } from '@/lib/utils';

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
  storeSlug: string;
}

export default function CartSheet({ open, onClose, storeSlug }: CartSheetProps) {
  // 1. إضافة حالة للتأكد من إن الكود بيشتغل على المتصفح (Client) مش السيرفر
  const [isMounted, setIsMounted] = useState(false);
  
  const { items, removeItem, updateQuantity, total, itemCount } = useCartStore();
  const count = itemCount();
  const cartTotal = total();

  // 2. تحديث الحالة بمجرد انتهاء أول ريندر
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 3. إيقاف الريندر تماماً لحد ما المتصفح يكون جاهز عشان نمنع الـ Hydration Error
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className={cn(
          'fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      
      {/* ── Sheet / Drawer ── */}
      <div
        className={cn(
          'fixed left-0 top-0 h-screen w-full sm:w-[420px] bg-[#f8fafc] shadow-[20px_0_50px_rgba(0,0,0,0.1)] z-[70] flex flex-col transition-transform duration-500 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-slate-200/60 z-10 relative shadow-sm">
          <h2 className="font-black text-slate-900 text-lg flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
            </div>
            سلة المشتريات
            {count > 0 && (
              <span className="bg-rose-500 text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm -mt-3 -mr-2 border-2 border-white">
                {count}
              </span>
            )}
          </h2>
          <button 
            onClick={onClose} 
            className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items Container */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-5 animate-fade-in">
              <div className="w-24 h-24 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 rounded-full flex items-center justify-center mb-2">
                <ShoppingBag className="w-10 h-10 text-slate-300" />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-xl font-black text-slate-800">سلتك فارغة تماماً</p>
                <p className="text-sm font-medium text-slate-500 max-w-[250px] leading-relaxed">تصفح منتجاتنا الرائعة وأضف ما يعجبك إلى السلة للبدء.</p>
              </div>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="mt-4 h-12 px-8 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
              >
                تصفح المنتجات
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex items-center gap-4 animate-fade-in-up">
                  
                  {/* Product icon */}
                  <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-6 h-6 text-slate-300" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <p className="text-sm font-bold text-slate-900 truncate pr-1">{item.name}</p>
                    <p className="text-sm font-black text-indigo-600 pr-1">{formatCurrency(item.price)}</p>
                  </div>

                  {/* Qty Controls & Remove */}
                  <div className="flex flex-col items-end gap-3">
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                      title="حذف المنتج"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl p-1 shadow-sm">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors shadow-sm border border-slate-100 active:scale-90"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-black text-slate-900 select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stockCount}
                        className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors shadow-sm border border-slate-100 active:scale-90 disabled:opacity-40 disabled:active:scale-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Checkout Section */}
        {items.length > 0 && (
          <div className="p-6 bg-white border-t border-slate-200/60 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10 relative space-y-5">
            <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
              <span className="text-sm font-bold text-slate-500">الإجمالي النهائي</span>
              <span className="text-2xl font-black text-slate-900 tracking-tighter">
                {formatCurrency(cartTotal)}
              </span>
            </div>
            
            <Button
              className="w-full h-14 text-lg font-black bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95 group"
              asChild
              onClick={onClose}
            >
              <Link href={`/${storeSlug}/checkout`}>
                <span>إتمام الشراء الآن</span>
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              </Link>
            </Button>
            
            <button
              onClick={onClose}
              className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors py-1"
            >
              الاستمرار في التسوق
            </button>
          </div>
        )}
      </div>
    </>
  );
}