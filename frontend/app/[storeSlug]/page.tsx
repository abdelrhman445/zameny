'use client';

import React, { useEffect, useState } from 'react';
import { Search, Package, X } from 'lucide-react';
import { Product, ProductsResponse } from '@/types';
import ProductCard from '@/components/storefront/ProductCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import api from '@/lib/api';

interface PageProps {
  params: { storeSlug: string };
}

export default function StorefrontPage({ params }: PageProps) {
  const { storeSlug } = params;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get<ProductsResponse>('/products', {
          params: { limit: 100, isActive: true, storeName: storeSlug },
        });
        setProducts(res.data.data);
      } catch {
        // لو حصل خطأ بنسيب المصفوفة فاضية
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [storeSlug]);

  // منطق البحث في اسم ووصف المنتج
  const filtered = products.filter((p) => {
    const term = search.toLowerCase();
    return p.name.toLowerCase().includes(term) || (p.description || '').toLowerCase().includes(term);
  });

  if (loading) return <div className="py-32 flex justify-center"><PageLoading label="جاري تحميل المنتجات..." /></div>;

  return (
    <div className="space-y-10 pb-20" dir="rtl">
      
      {/* ── Search Bar Section ── */}
      <div className="max-w-2xl mx-auto w-full px-2">
        <div className="relative group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
          <Input
            placeholder="ابحث عن منتج بالاسم أو الوصف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-14 pr-12 pl-12 rounded-xl bg-white border-slate-200 shadow-sm focus-visible:ring-slate-900 focus-visible:border-slate-900 transition-all text-base font-medium"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Content Header ── */}
      <div className="flex items-end justify-between border-b border-slate-100 pb-4 px-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">المنتجات</h2>
          <p className="text-sm text-slate-500 mt-1">كل منتجاتنا الان بين يديك </p>
        </div>
        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          {filtered.length} منتج
        </span>
      </div>

      {/* ── Products Grid ── */}
      {filtered.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-2xl border border-slate-100">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <Package className="w-8 h-8 text-slate-200" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {search ? 'لم نجد نتائج لبحثك' : 'المتجر فارغ حالياً'}
          </h3>
          <p className="text-slate-500 text-sm mt-1 max-w-[250px]">
            {search ? 'جرب البحث بكلمات أخرى أو امسح شريط البحث.' : 'لم يتم إضافة أي منتجات لهذا المتجر بعد.'}
          </p>
          {search && (
            <Button 
              variant="link" 
              className="mt-4 text-indigo-600 font-bold" 
              onClick={() => setSearch('')}
            >
              عرض كل المنتجات
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {filtered.map((product) => (
            <ProductCard key={product._id} product={product} storeSlug={storeSlug} />
          ))}
        </div>
      )}
    </div>
  );
}