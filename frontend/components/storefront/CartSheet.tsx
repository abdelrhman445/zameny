'use client';
import React from 'react';
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
  const { items, removeItem, updateQuantity, total, itemCount } = useCartStore();
  const count = itemCount();
  const cartTotal = total();

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn('fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity', open ? 'opacity-100' : 'opacity-0 pointer-events-none')}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={cn(
          'fixed left-0 top-0 h-screen w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            عربة التسوق
            {count > 0 && (
              <span className="bg-slate-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            )}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-medium text-slate-700">العربة فارغة</p>
                <p className="text-sm text-muted-foreground mt-1">أضف منتجات لتبدأ التسوق</p>
              </div>
              <Button variant="outline" onClick={onClose}>
                متابعة التسوق
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 px-5 py-4">
                  {/* Product icon */}
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-5 h-5 text-slate-400" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                    <p className="text-sm text-slate-600 font-semibold">{formatCurrency(item.price)}</p>
                  </div>

                  {/* Qty + Remove */}
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stockCount}
                        className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors disabled:opacity-40"
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

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t space-y-3 bg-white">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">الإجمالي</span>
              <span className="text-xl font-bold text-slate-900">{formatCurrency(cartTotal)}</span>
            </div>
            <Button
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white"
              asChild
              onClick={onClose}
            >
              <Link href={`/${storeSlug}/checkout`}>
                إتمام الشراء
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Link>
            </Button>
            <button
              onClick={onClose}
              className="w-full text-center text-sm text-muted-foreground hover:text-slate-900 transition-colors py-1"
            >
              متابعة التسوق
            </button>
          </div>
        )}
      </div>
    </>
  );
}
