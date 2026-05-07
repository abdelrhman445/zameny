'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Package, Check, Zap } from 'lucide-react';
import { Product } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  storeSlug: string;
}

export default function ProductCard({ product, storeSlug }: ProductCardProps) {
  const { addItem, items } = useCartStore();
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // ✅ مهم جداً: لمنع فتح صفحة المنتج عند الضغط على زرار السلة
    
    if (!product.inStock) return;
    
    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
      stockCount: product.stockCount,
    });
    
    setAdded(true);
    toast.success(`تمت إضافة "${product.name}" إلى عربتك بنجاح`);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Link href={`/${storeSlug}/product/${product._id}`} className="group block h-full">
      <div className="bg-white h-full flex flex-col rounded-[1.5rem] border border-slate-200/60 overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
        
        {/* ── Product Image Area ── */}
        <div className="aspect-[4/3] sm:aspect-square bg-gradient-to-br from-slate-100/80 via-slate-50 to-slate-100/50 flex items-center justify-center relative overflow-hidden">
          <Package className="w-14 h-14 text-slate-300 transition-transform duration-700 group-hover:scale-110" />
          
          {/* Out of Stock Overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
              <span className="bg-rose-500 text-white text-[11px] font-black px-4 py-2 rounded-xl shadow-lg shadow-rose-500/30 tracking-wider">
                نفد المخزون
              </span>
            </div>
          )}
          
          {/* Low Stock Badge */}
          {product.inStock && product.stockCount <= 5 && (
            <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-md border border-amber-100 text-amber-600 text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-sm z-10 flex items-center gap-1.5">
              <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
              متبقي {product.stockCount} فقط
            </span>
          )}
        </div>

        {/* ── Product Info Area ── */}
        <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3">
          <div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-xs font-medium text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-auto pt-2">
            <p className="font-black text-indigo-600 text-lg tracking-tighter">
              {formatCurrency(product.price)}
            </p>
            
            <Button
              size="icon"
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={cn(
                'w-10 h-10 rounded-xl shadow-sm transition-all duration-300 active:scale-95 flex-shrink-0 border-0',
                added 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200' 
                  : 'bg-slate-900 hover:bg-indigo-600 text-white shadow-slate-200'
              )}
            >
              {added ? (
                <Check className="w-4.5 h-4.5 stroke-[3px]" />
              ) : (
                <ShoppingCart className="w-4.5 h-4.5" />
              )}
            </Button>
          </div>
        </div>
        
      </div>
    </Link>
  );
}