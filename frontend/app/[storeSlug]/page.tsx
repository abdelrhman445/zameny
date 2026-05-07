'use client';

import React, { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, Package, XCircle } from 'lucide-react';
import { Product, ProductsResponse } from '@/types';
import ProductCard from '@/components/storefront/ProductCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface PageProps {
  params: { storeSlug: string };
}

export default function StorefrontPage({ params }: PageProps) {
  const { storeSlug } = params;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get<ProductsResponse>('/products', {
          params: { limit: 100, isActive: true },
        });
        setProducts(res.data.data);
      } catch {
        // Silently fail for storefront, show empty state
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [storeSlug]);

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesStock = inStockOnly ? p.inStock : true;
    return matchesSearch && matchesStock;
  });

  if (loading) return <div className="py-20"><PageLoading label="جاري تجهيز المنتجات..." /></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-16" dir="rtl">
      
      {/* ── Search & Filters Bar ── */}
      <div className="bg-slate-50/80 border border-slate-200/60 p-3 sm:p-4 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col md:flex-row gap-3 items-center justify-between transition-all">
        
        {/* Search Input */}
        <div className="relative w-full group">
          <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <Input
            placeholder="ابحث عن منتج، اسم، أو وصف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            className="pr-12 h-14 rounded-2xl bg-white border-slate-200/80 focus-visible:ring-indigo-500 shadow-sm text-slate-900 font-bold transition-all text-base"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 hover:text-slate-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="w-full md:w-auto shrink-0">
          <Button
            variant="outline"
            onClick={() => setInStockOnly(!inStockOnly)}
            className={cn(
              "w-full md:w-auto h-14 px-6 rounded-2xl font-bold transition-all flex items-center justify-center gap-2.5 text-base border-0",
              inStockOnly
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
                : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
            )}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span>{inStockOnly ? 'المتوفر فقط' : 'إظهار الكل'}</span>
          </Button>
        </div>
      </div>

      {/* ── Section Title & Count ── */}
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-black text-slate-900">أحدث المنتجات</h2>
        <div className="bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-sm font-bold text-slate-700">{filtered.length} منتج</span>
        </div>
      </div>

      {/* ── Products Grid ── */}
      {filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white/50 border border-dashed border-slate-300 rounded-[2.5rem]">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-5 border border-slate-100">
            <Package className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-800">لا توجد منتجات مطابقة</h3>
          <p className="text-slate-500 text-sm mt-2 max-w-sm text-center font-medium leading-relaxed">
            {search 
              ? 'لم نعثر على أي منتجات تطابق بحثك الحالي. جرب استخدام كلمات مختلفة أو الغي الفلاتر.' 
              : 'هذا المتجر لا يحتوي على منتجات متاحة للبيع في الوقت الحالي.'}
          </p>
          {search && (
            <Button 
              variant="outline" 
              className="mt-6 h-12 px-8 rounded-xl font-bold border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm" 
              onClick={() => { setSearch(''); setInStockOnly(false); }}
            >
              مسح البحث والفلاتر
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map((product) => (
            <ProductCard key={product._id} product={product} storeSlug={storeSlug} />
          ))}
        </div>
      )}
    </div>
  );
}