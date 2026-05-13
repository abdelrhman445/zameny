'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, ShoppingCart, Package, Check, Minus, Plus, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
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
        // 404 handled by the null state
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
    toast.success(`تمت إضافة ${qty} قطعة من "${product.name}" إلى عربتك`);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <div className="py-32 flex justify-center"><PageLoading label="جاري تحميل المنتج..." /></div>;

  if (!product) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-center px-4" dir="rtl">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
          <Package className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">المنتج غير متوفر</h2>
        <p className="text-slate-500 mt-2 max-w-sm">عذراً، هذا المنتج غير موجود أو تم حذفه من قبل التاجر.</p>
        <Button asChild className="mt-8 bg-slate-900 hover:bg-slate-800 text-white px-8 rounded-xl h-12">
          <Link href={`/${storeSlug}`} className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4" /> العودة للمتجر
          </Link>
        </Button>
      </div>
    );
  }

  const isOutOfStock = !product.inStock || product.stockCount <= 0;

  return (
    <div dir="rtl" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8 md:mb-12">
        <Link href={`/${storeSlug}`} className="hover:text-slate-900 transition-colors flex items-center gap-1.5 font-medium">
          <ArrowRight className="w-4 h-4" /> المتجر
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-medium truncate max-w-[200px] sm:max-w-[400px]">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start">
        
        {/* ── Product Image ── */}
        <div className="relative w-full aspect-square bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100 overflow-hidden flex items-center justify-center group">
          
          {product.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <Package className="w-24 h-24 text-slate-300" />
          )}
          
          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
              <span className="bg-slate-900 text-white font-semibold px-6 py-2.5 rounded-full shadow-lg text-sm tracking-wide">
                نفد من المخزون
              </span>
            </div>
          )}
        </div>

        {/* ── Product Details ── */}
        <div className="flex flex-col">
          
          {/* Title & SKU */}
          <div className="mb-6">
            {product.sku && (
              <span className="inline-block mb-3 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                SKU: {product.sku}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight mb-4">
              {product.name}
            </h1>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-slate-900">
                {formatCurrency(product.price)}
              </span>
            </div>
          </div>

          <hr className="border-slate-100 mb-6" />

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">وصف المنتج</h3>
            {product.description ? (
              <p className="text-slate-600 leading-relaxed text-base">
                {product.description}
              </p>
            ) : (
              <p className="text-slate-400 italic text-sm">لا يوجد وصف إضافي لهذا المنتج.</p>
            )}
          </div>

          {/* Availability */}
          <div className="mb-8">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-2 h-2 rounded-full', 
                product.inStock ? 'bg-emerald-500' : 'bg-rose-500'
              )} />
              <span className={cn(
                'text-sm font-medium', 
                product.inStock ? 'text-emerald-700' : 'text-rose-700'
              )}>
                {product.inStock ? `متوفر في المخزون (${product.stockCount} قطعة)` : 'غير متوفر حالياً'}
              </span>
            </div>
          </div>

          {/* ── Actions (Add to Cart) ── */}
          {!isOutOfStock && (
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              {/* Quantity Selector */}
              <div className="flex items-center justify-between border border-slate-200 rounded-xl h-14 px-2 w-full sm:w-36 bg-white shrink-0">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-semibold text-slate-900 text-lg w-8 text-center">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stockCount, q + 1))}
                  className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add Button */}
              <Button
                onClick={handleAddToCart}
                disabled={added}
                className={cn(
                  'flex-1 h-14 text-base font-semibold rounded-xl shadow-none transition-all duration-200',
                  added 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                )}
              >
                {added ? (
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5" /> تمت الإضافة
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" /> أضف إلى السلة
                  </div>
                )}
              </Button>
            </div>
          )}

          {/* ── Trust Features ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">تسوق آمن</p>
                <p className="text-xs text-slate-500">دفع محمي 100%</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">شحن سريع</p>
                <p className="text-xs text-slate-500">توصيل لباب البيت</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:col-span-2">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">استرجاع سهل</p>
                <p className="text-xs text-slate-500">خلال 14 يوم من الاستلام</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}