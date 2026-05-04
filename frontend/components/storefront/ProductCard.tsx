'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Package, Plus, Check } from 'lucide-react';
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
  const inCart = items.some((i) => i.productId === product._id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product.inStock) return;
    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
      stockCount: product.stockCount,
    });
    setAdded(true);
    toast.success(`تمت إضافة "${product.name}" للعربة`);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Link href={`/${storeSlug}/product/${product._id}`} className="group block">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-200 group-hover:-translate-y-0.5">
        {/* Product image placeholder */}
        <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center relative">
          <Package className="w-12 h-12 text-slate-300" />
          {!product.inStock && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">نفد المخزون</span>
            </div>
          )}
          {product.inStock && product.stockCount <= 5 && (
            <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              آخر {product.stockCount}!
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2 group-hover:text-slate-700 transition-colors">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-slate-900 text-lg">{formatCurrency(product.price)}</p>
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={cn(
                'h-8 text-xs transition-all',
                added ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'
              )}
            >
              {added ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <ShoppingCart className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
