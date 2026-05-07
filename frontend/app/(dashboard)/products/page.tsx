'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Package, RefreshCw, TrendingDown, TrendingUp, Search, Box, AlertCircle } from 'lucide-react';
import { Product, ProductsResponse } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      setError('تعذر تحميل المنتجات، يرجى المحاولة لاحقاً');
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
      toast.error('يرجى ملء جميع الحقول الإجبارية');
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
        toast.success('تم تحديث بيانات المنتج بنجاح');
      } else {
        await api.post('/products', payload);
        toast.success('تمت إضافة المنتج بنجاح');
      }

      setDialogOpen(false);
      fetchProducts();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'حدث خطأ أثناء الحفظ';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`هل أنت متأكد من حذف "${product.name}" نهائياً؟`)) return;
    try {
      await api.delete(`/products/${product._id}`);
      toast.success('تم حذف المنتج بنجاح');
      fetchProducts();
    } catch {
      toast.error('تعذر حذف المنتج');
    }
  };

  const handleStockAdjust = async () => {
    if (!stockProduct || !adjustment) return;
    const adj = parseInt(adjustment);
    if (isNaN(adj) || adj === 0) { toast.error('يرجى إدخال رقم صحيح للتعديل'); return; }
    try {
      await api.patch(`/products/${stockProduct._id}/stock`, { adjustment: adj });
      toast.success(`تم تعديل المخزون بنجاح (${adj > 0 ? '+' : ''}${adj})`);
      setStockDialogOpen(false);
      setAdjustment('');
      fetchProducts();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'حدث خطأ أثناء تعديل المخزون';
      toast.error(msg);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10" dir="rtl">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة المنتجات</h1>
          <p className="text-sm font-medium text-slate-500 mt-1.5">
            أضف منتجاتك، تتبع المخزون، وحدد الأسعار (إجمالي <strong className="text-slate-700">{products.length}</strong> منتج)
          </p>
        </div>
        <Button 
          onClick={openCreate} 
          className="h-11 px-6 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.1)] transition-all flex items-center gap-2 font-bold"
        >
          <Plus className="w-5 h-5" /> إضافة منتج جديد
        </Button>
      </div>

      {/* ── Search Bar ── */}
      <div className="bg-white border border-slate-200/60 p-3 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col md:flex-row gap-3 items-center justify-between transition-all">
        <div className="relative w-full md:max-w-md group">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <Input
            placeholder="ابحث باسم المنتج أو رمز الـ SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            className="pr-10 h-11 bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 rounded-xl text-sm font-bold text-slate-900 transition-all"
          />
        </div>
      </div>

      {/* ── Content Grid ── */}
      {loading ? (
        <PageLoading label="جاري تحميل المنتجات..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchProducts} />
      ) : filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white/50 border border-dashed border-slate-300 rounded-[2rem]">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-5 border border-slate-100">
            <Box className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-800">لا توجد منتجات بعد</h3>
          <p className="text-slate-500 text-sm mt-2 max-w-sm text-center font-medium leading-relaxed">
            متجرك فارغ حالياً! أضف أول منتج لك وابدأ في استقبال الطلبات فوراً.
          </p>
          <Button onClick={openCreate} className="mt-6 h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/20">
            إضافة أول منتج <Plus className="w-5 h-5 ml-2" />
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((product) => {
            const isOutOfStock = !product.inStock || product.stockCount <= 0;
            return (
              <div 
                key={product._id} 
                className={cn(
                  'group relative bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all flex flex-col justify-between h-full',
                  !product.isActive && 'opacity-60 grayscale-[0.5]'
                )}
              >
                {isOutOfStock && (
                  <div className="absolute -top-3 -right-3 w-6 h-6 bg-rose-500 rounded-full border-4 border-slate-50 shadow-sm flex items-center justify-center z-10" title="نفد من المخزون">
                    <AlertCircle className="w-3 h-3 text-white" />
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-base truncate" title={product.name}>{product.name}</h3>
                      {product.sku ? (
                        <p className="text-[11px] font-mono font-medium text-slate-400 mt-1 bg-slate-50 border border-slate-100 inline-block px-1.5 py-0.5 rounded-md" dir="ltr">{product.sku}</p>
                      ) : (
                        <p className="text-[11px] font-medium text-slate-400 mt-1">بدون SKU</p>
                      )}
                    </div>
                    <span className={cn(
                      'text-[10px] px-2 py-1 rounded-md font-bold flex-shrink-0 border',
                      !isOutOfStock ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                    )}>
                      {!isOutOfStock ? 'متوفر' : 'نفد'}
                    </span>
                  </div>

                  {product.description ? (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium min-h-[36px]">{product.description}</p>
                  ) : (
                    <p className="text-xs text-slate-300 italic min-h-[36px]">لا يوجد وصف للمنتج</p>
                  )}
                </div>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between bg-slate-50/80 border border-slate-100 rounded-xl p-2.5">
                    <span className="text-xl font-black text-slate-900">{formatCurrency(product.price)}</span>
                    
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden h-8">
                      <button
                        onClick={() => { setStockProduct(product); setAdjustment('-1'); setStockDialogOpen(true); }}
                        className="w-8 h-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors border-l border-slate-100 text-slate-400"
                        title="خصم من المخزون"
                      >
                        <TrendingDown className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-slate-700 w-10 text-center select-none" title="المخزون الحالي">
                        {product.stockCount}
                      </span>
                      <button
                        onClick={() => { setStockProduct(product); setAdjustment('1'); setStockDialogOpen(true); }}
                        className="w-8 h-full flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 transition-colors border-r border-slate-100 text-slate-400"
                        title="إضافة للمخزون"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-10 rounded-xl border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-xs font-bold text-slate-600 shadow-sm" 
                      onClick={() => openEdit(product)}
                    >
                      <Edit2 className="w-3.5 h-3.5 ml-1.5" /> تعديل
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 w-10 p-0 rounded-xl border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 shadow-sm transition-colors shrink-0"
                      onClick={() => handleDelete(product)}
                      title="حذف المنتج"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create/Edit Dialog (Modal) ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-[2rem] p-6 sm:p-8 border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.1)]" dir="rtl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-slate-900">{editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500">
              {editingProduct ? 'قم بتعديل تفاصيل المنتج واحفظ التغييرات.' : 'أدخل البيانات الأساسية لمنتجك ليظهر في المتجر.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-bold text-slate-700">اسم المنتج <span className="text-rose-500">*</span></Label>
              <Input 
                id="name" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                placeholder="مثال: سماعة لاسلكية AirPods" 
                autoComplete="off" 
                className="h-12 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500 text-slate-900 font-bold" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-bold text-slate-700">السعر (جنيه) <span className="text-rose-500">*</span></Label>
                <Input 
                  id="price" 
                  type="number" 
                  value={form.price} 
                  onChange={(e) => setForm({ ...form, price: e.target.value })} 
                  placeholder="0" 
                  autoComplete="off"
                  className="h-12 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500 text-slate-900 font-bold" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-sm font-bold text-slate-700">الكمية المتاحة <span className="text-rose-500">*</span></Label>
                <Input 
                  id="stock" 
                  type="number" 
                  value={form.stockCount} 
                  onChange={(e) => setForm({ ...form, stockCount: e.target.value })} 
                  placeholder="0" 
                  autoComplete="off"
                  className="h-12 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500 text-slate-900 font-bold" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku" className="text-sm font-bold text-slate-700">رمز المنتج (SKU) <span className="text-slate-400 font-normal text-xs">(اختياري)</span></Label>
              <Input 
                id="sku" 
                value={form.sku} 
                onChange={(e) => setForm({ ...form, sku: e.target.value })} 
                placeholder="WH-1000XM4" 
                dir="ltr" 
                autoComplete="off"
                className="h-12 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500 font-mono text-sm text-slate-900 font-bold" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc" className="text-sm font-bold text-slate-700">الوصف <span className="text-slate-400 font-normal text-xs">(اختياري)</span></Label>
              <Input 
                id="desc" 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                placeholder="وصف مختصر يظهر للعملاء..." 
                autoComplete="off"
                className="h-12 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500 text-slate-900 font-medium" 
              />
            </div>
          </div>

          {/* ✅ تم ضبط المسافات هنا لإصلاح مشكلة التداخل */}
          <DialogFooter className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:space-x-0 mt-8 border-t border-slate-100 pt-5">
            <Button variant="outline" className="h-12 px-8 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50 w-full sm:w-auto" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold w-full sm:w-auto shadow-md" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'جاري الحفظ...' : editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Stock Adjust Dialog (Modal) ── */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent className="sm:max-w-sm rounded-[2rem] p-6 sm:p-8 border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.1)]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">تعديل سريع للمخزون</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 mt-1">
              تحديث كميات <strong className="text-slate-700">{stockProduct?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-sm font-bold text-slate-600">المخزون الحالي:</span>
              <span className="text-xl font-black text-slate-900">{stockProduct?.stockCount} قطعة</span>
            </div>
            
            <div className="space-y-2.5">
              <Label className="text-sm font-bold text-slate-700">مقدار التعديل</Label>
              <Input
                type="number"
                value={adjustment}
                onChange={(e) => setAdjustment(e.target.value)}
                placeholder="مثال: 10 أو -5"
                dir="ltr"
                autoComplete="off"
                className="h-14 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500 text-2xl font-black text-center text-slate-900"
                autoFocus
              />
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2 text-center bg-amber-50 p-2 rounded-lg border border-amber-100">
                استخدم علامة السالب (-) لخصم كمية تالفة أو مباعة خارجياً.
              </p>
            </div>
          </div>

          {/* ✅ تم ضبط المسافات هنا لإصلاح مشكلة التداخل */}
          <DialogFooter className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:space-x-0 mt-6 border-t border-slate-100 pt-5">
            <Button variant="outline" className="h-12 px-6 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50 w-full sm:w-auto" onClick={() => setStockDialogOpen(false)}>
              إلغاء
            </Button>
            <Button className="h-12 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold w-full sm:w-auto shadow-md" onClick={handleStockAdjust}>
              تطبيق التعديل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}