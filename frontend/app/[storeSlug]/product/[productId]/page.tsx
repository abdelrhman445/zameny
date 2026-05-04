'use client';
import React, { useEffect, useState } from 'react';
import { ArrowRight, ShoppingCart, Package, Check, Minus, Plus, Shield } from 'lucide-react';
import Link from 'next/link';
import { Product, SingleProductResponse } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import api from '@/lib/api';
import { toast } from 'sonner';

interface PageProps {
  params: { storeSlug: string; productId: string };
}

export default function ProductDetailPage({ params }: PageProps) {
  const { storeSlug, productId } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const { addItem } = useCartStore();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get<SingleProductResponse>(`/products/${productId}`);
        setProduct(res.data.data.product);
      } catch {
        // 404
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [productId]);

  const handleAddToCart = () => {
    if (!product || !product.inStock) return;
    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: qty,
      stockCount: product.stockCount,
    });
    setAdded(true);
    toast.success(`تمت إضافة ${qty} × "${product.name}" للعربة`);
    setTimeout(() => setAdded(false), 2500);
  };

  if (loading) return <PageLoading />;

  if (!product) {
    return (
      <div className="py-24 text-center" dir="rtl">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">المنتج غير موجود</p>
        <Link href={`/${storeSlug}`} className="text-sm text-slate-700 underline mt-2 inline-block">
          العودة للمتجر
        </Link>
      </div>
    );
  }

  return (
    <div dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href={`/${storeSlug}`} className="hover:text-slate-900 flex items-center gap-1">
          <ArrowRight className="w-3.5 h-3.5" /> المتجر
        </Link>
        <span>/</span>
        <span className="text-slate-900 truncate max-w-[200px]">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image */}
        <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center relative overflow-hidden">
          <Package className="w-24 h-24 text-slate-300" />
          {!product.inStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="bg-red-600 text-white font-bold px-4 py-2 rounded-full">نفد المخزون</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-5">
          <div>
            {product.sku && (
              <p className="text-xs text-muted-foreground font-mono mb-1">SKU: {product.sku}</p>
            )}
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{product.name}</h1>
            <p className="text-3xl font-bold text-slate-900 mt-3">{formatCurrency(product.price)}</p>
          </div>

          {product.description && (
            <p className="text-slate-600 leading-relaxed">{product.description}</p>
          )}

          {/* Stock status */}
          <div className="flex items-center gap-2">
            <div className={cn('w-2.5 h-2.5 rounded-full', product.inStock ? 'bg-emerald-500' : 'bg-red-500')} />
            <span className={cn('text-sm font-medium', product.inStock ? 'text-emerald-700' : 'text-red-700')}>
              {product.inStock ? `متوفر (${product.stockCount} قطعة)` : 'نفد المخزون'}
            </span>
          </div>

          {/* Quantity Selector */}
          {product.inStock && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">الكمية</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-slate-900 text-lg">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stockCount, q + 1))}
                  className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Add to cart */}
          <Button
            onClick={handleAddToCart}
            disabled={!product.inStock || added}
            className={cn(
              'w-full h-12 text-base font-semibold transition-all',
              added ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-slate-900 hover:bg-slate-800'
            )}
          >
            {added ? (
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                تمت الإضافة للعربة!
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                {product.inStock ? 'أضف إلى العربة' : 'نفد المخزون'}
              </div>
            )}
          </Button>

          {/* Trust badge */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-slate-50 rounded-xl">
            <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>دفع آمن عند الاستلام مع التحقق عبر OTP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
