'use client';
import React, { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, Package } from 'lucide-react';
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
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get<ProductsResponse>('/products', {
          params: { limit: 100, isActive: true },
        });
        setProducts(res.data.data);
      } catch {
        // Silently fail for storefront
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

  if (loading) return <PageLoading label="جاري تحميل المنتجات..." />;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن منتج..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 bg-white"
          />
        </div>
        <Button
          variant={inStockOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInStockOnly(!inStockOnly)}
          className="whitespace-nowrap"
        >
          <SlidersHorizontal className="w-4 h-4 ml-1.5" />
          {inStockOnly ? 'المتوفر فقط ✓' : 'كل المنتجات'}
        </Button>
      </div>

      {/* Products count */}
      {!loading && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} منتج متاح
        </p>
      )}

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">لا توجد منتجات متاحة حالياً</p>
          {search && (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setSearch('')}>
              مسح البحث
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <ProductCard key={product._id} product={product} storeSlug={storeSlug} />
          ))}
        </div>
      )}
    </div>
  );
}
