'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, ShoppingCart, Package, Check, Minus, Plus, ShieldCheck, Truck, BadgeCheck } from 'lucide-react';
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
    setTimeout(() => setAdded(false), 2500);
  };

  if (loading) return <div className="py-20"><PageLoading label="جاري عرض تفاصيل المنتج..." /></div>;

  if (!product) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-center animate-fade-in" dir="rtl">
        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 border border-slate-100 shadow-sm text-slate-300">
          <Package className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">المنتج غير متوفر</h2>
        <p className="text-slate-500 mt-2 max-w-xs">ربما تم حذفه أو الرابط الذي تتبعه غير صحيح.</p>
        <Button variant="link" asChild className="mt-6 text-indigo-600 font-bold">
          <Link href={`/${storeSlug}`} className="flex items-center gap-2">
             <ArrowRight className="w-4 h-4 ml-1" /> العودة للمتجر
          </Link>
        </Button>
      </div>
    );
  }

  const isOutOfStock = !product.inStock || product.stockCount <= 0;

  return (
    <div dir="rtl" className="max-w-6xl mx-auto animate-fade-in-up">
      
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-8 bg-white/50 w-max px-4 py-2 rounded-full border border-slate-100 shadow-sm">
        <Link href={`/${storeSlug}`} className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
          <ArrowRight className="w-4 h-4" /> المتجر
        </Link>
        <span className="text-slate-200">/</span>
        <span className="text-slate-600 truncate max-w-[150px] sm:max-w-[300px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        
        {/* ── Product Showcase (Image Area) ── */}
        <div className="relative group">
          <div className="aspect-square bg-gradient-to-tr from-slate-100 via-indigo-50/30 to-white rounded-[2.5rem] border border-slate-200/60 shadow-inner flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:shadow-2xl">
            <Package className="w-32 h-32 text-slate-200 group-hover:scale-110 transition-transform duration-700" />
            
            {/* Out of stock overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
                <span className="bg-rose-600 text-white font-black px-6 py-3 rounded-2xl shadow-xl shadow-rose-500/30 -rotate-3 text-lg">
                  نفد من المخزون
                </span>
              </div>
            )}
            
            {/* Safe Purchase Badge */}
            <div className="absolute bottom-6 right-6 bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white shadow-sm flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-indigo-500" />
              <span className="text-xs font-black text-slate-700">منتج أصلي 100%</span>
            </div>
          </div>
        </div>

        {/* ── Product Details ── */}
        <div className="flex flex-col space-y-8">
          <div className="space-y-4">
            {product.sku && (
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[11px] font-bold font-mono tracking-wider border border-slate-200/50 uppercase">
                SKU: {product.sku}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-3">
               <span className="text-4xl font-black text-indigo-600 tracking-tighter">
                {formatCurrency(product.price)}
              </span>
              <span className="bg-emerald-50 text-emerald-600 text-xs font-black px-2.5 py-1 rounded-lg border border-emerald-100">
                أفضل سعر
              </span>
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {product.description ? (
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-900">وصف المنتج:</h3>
              <p className="text-slate-600 leading-relaxed text-lg font-medium">
                {product.description}
              </p>
            </div>
          ) : (
            <p className="text-slate-400 italic">لا يوجد وصف إضافي لهذا المنتج.</p>
          )}

          {/* Stock Availability UI */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl w-max">
            <div className={cn(
              'w-3 h-3 rounded-full shadow-sm', 
              product.inStock ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            )} />
            <span className={cn(
              'text-sm font-bold', 
              product.inStock ? 'text-emerald-700' : 'text-rose-700'
            )}>
              {product.inStock ? `متوفر الآن (متبقي ${product.stockCount} قطعة)` : 'غير متوفر حالياً'}
            </span>
          </div>

          {/* ── Actions ── */}
          {!isOutOfStock && (
            <div className="space-y-6 pt-2">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Custom Quantity Stepper */}
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">الكمية</label>
                  <div className="flex items-center gap-4 bg-white border border-slate-200 p-1.5 rounded-[1.25rem] shadow-sm">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 hover:text-rose-600 transition-all active:scale-90"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="w-8 text-center font-black text-slate-900 text-xl select-none">{qty}</span>
                    <button
                      onClick={() => setQty((q) => Math.min(product.stockCount, q + 1))}
                      className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 hover:text-emerald-600 transition-all active:scale-90"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Add to cart button */}
                <div className="flex-1 w-full pt-6 sm:pt-0">
                  <Button
                    onClick={handleAddToCart}
                    disabled={added}
                    className={cn(
                      'w-full h-[60px] text-lg font-black rounded-2xl shadow-xl transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-3',
                      added 
                        ? 'bg-emerald-500 hover:bg-emerald-500 text-white shadow-emerald-200' 
                        : 'bg-slate-900 hover:bg-indigo-600 text-white shadow-slate-200'
                    )}
                  >
                    {added ? (
                      <>
                        <Check className="w-6 h-6 stroke-[3px]" />
                        تمت الإضافة بنجاح
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-6 h-6" />
                        أضف إلى السلة
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* ── Secondary Info Badges ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl shadow-sm">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm shrink-0">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-indigo-900 leading-none mb-1">دفع آمن</span>
                    <span className="text-[10px] font-bold text-indigo-600">عند الاستلام أو بالبطاقة</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl shadow-sm">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm shrink-0">
                    <Truck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-emerald-900 leading-none mb-1">شحن سريع</span>
                    <span className="text-[10px] font-bold text-emerald-600">خلال 24-48 ساعة</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}