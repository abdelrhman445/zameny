'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Package, RefreshCw, TrendingDown, TrendingUp, Search } from 'lucide-react';
import { Product, ProductsResponse } from '@/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import api from '@/lib/api';
import { toast } from 'sonner';

interface ProductForm {
  name: string;
  price: string;
  stockCount: string;
  description: string;
  sku: string;
}

const emptyForm: ProductForm = { name: '', price: '', stockCount: '', description: '', sku: '' };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Stock adjust
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [adjustment, setAdjustment] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ProductsResponse>('/products', { params: { limit: 100 } });
      setProducts(res.data.data);
    } catch {
      setError('فشل تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      price: product.price.toString(),
      stockCount: product.stockCount.toString(),
      description: product.description || '',
      sku: product.sku || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.stockCount) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        price: parseFloat(form.price),
        stockCount: parseInt(form.stockCount),
        description: form.description || undefined,
        sku: form.sku || undefined,
      };

      if (editingProduct) {
        await api.patch(`/products/${editingProduct._id}`, payload);
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        await api.post('/products', payload);
        toast.success('تم إضافة المنتج بنجاح');
      }

      setDialogOpen(false);
      fetchProducts();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'حدث خطأ';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`هل تريد حذف "${product.name}"؟`)) return;
    try {
      await api.delete(`/products/${product._id}`);
      toast.success('تم حذف المنتج');
      fetchProducts();
    } catch {
      toast.error('فشل حذف المنتج');
    }
  };

  const handleStockAdjust = async () => {
    if (!stockProduct || !adjustment) return;
    const adj = parseInt(adjustment);
    if (isNaN(adj) || adj === 0) { toast.error('أدخل رقماً صحيحاً'); return; }
    try {
      await api.patch(`/products/${stockProduct._id}/stock`, { adjustment: adj });
      toast.success(`تم تعديل المخزون بـ ${adj > 0 ? '+' : ''}${adj}`);
      setStockDialogOpen(false);
      setAdjustment('');
      fetchProducts();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'حدث خطأ';
      toast.error(msg);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة المنتجات</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{products.length} منتج في متجرك</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 ml-1.5" /> إضافة منتج
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="ابحث بالاسم أو SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9 text-sm" />
      </div>

      {/* Content */}
      {loading ? (
        <PageLoading label="جاري تحميل المنتجات..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchProducts} />
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-muted-foreground text-sm">لا توجد منتجات</p>
          <Button className="mt-4" onClick={openCreate}>
            <Plus className="w-4 h-4 ml-1.5" /> أضف أول منتج
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <Card key={product._id} className={cn('hover:shadow-md transition-shadow', !product.isActive && 'opacity-60')}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{product.name}</p>
                    {product.sku && <p className="text-[10px] text-muted-foreground font-mono">{product.sku}</p>}
                  </div>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0', product.inStock ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600')}>
                    {product.inStock ? 'متوفر' : 'نفد'}
                  </span>
                </div>

                {product.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-900">{formatCurrency(product.price)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setStockProduct(product); setAdjustment('-1'); setStockDialogOpen(true); }}
                      className="w-6 h-6 rounded flex items-center justify-center bg-slate-100 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <TrendingDown className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-semibold text-slate-700 w-10 text-center">{product.stockCount}</span>
                    <button
                      onClick={() => { setStockProduct(product); setAdjustment('1'); setStockDialogOpen(true); }}
                      className="w-6 h-6 rounded flex items-center justify-center bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                      <TrendingUp className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-1 border-t border-slate-100">
                  <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => openEdit(product)}>
                    <Edit2 className="w-3 h-3 ml-1" /> تعديل
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(product)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'قم بتعديل بيانات المنتج' : 'أدخل بيانات المنتج الجديد'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">اسم المنتج *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: آيفون 15 برو" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price">السعر (جنيه) *</Label>
                <Input id="price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stock">الكمية *</Label>
                <Input id="stock" type="number" value={form.stockCount} onChange={(e) => setForm({ ...form, stockCount: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sku">رمز SKU</Label>
              <Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="APPL-IP15P-128" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">الوصف</Label>
              <Input id="desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="وصف مختصر للمنتج" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'جاري الحفظ...' : editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Adjust Dialog */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل المخزون</DialogTitle>
            <DialogDescription>{stockProduct?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">المخزون الحالي: <strong>{stockProduct?.stockCount}</strong></p>
            <div className="space-y-1.5">
              <Label>التعديل (موجب للإضافة، سالب للخصم)</Label>
              <Input
                type="number"
                value={adjustment}
                onChange={(e) => setAdjustment(e.target.value)}
                placeholder="مثال: 10 أو -5"
                dir="ltr"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setStockDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleStockAdjust}>تطبيق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
