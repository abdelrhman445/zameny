'use strict';

const Product = require('../models/Product');
const Merchant = require('../models/Merchant'); // ✅ استدعاء التاجر ضروري للبحث باسم المتجر
const AppError = require('../utils/appError');
const { catchAsync, paginate } = require('../utils/helpers');

/**
 * POST /api/v1/products
 * Create a new product for the authenticated merchant.
 */
const createProduct = catchAsync(async (req, res, next) => {
  const { name, price, stockCount, description, sku, imageUrl } = req.body;

  // ✅ FIX: فعّلنا فحص حدود الخطة — canAddProduct() موجودة في Merchant model
  const currentCount = await Product.countDocuments({ merchantId: req.merchant._id, isActive: true });
  if (!req.merchant.canAddProduct(currentCount)) {
    return next(
      new AppError(
        `لقد وصلت للحد الأقصى لعدد المنتجات في خطة ${req.merchant.plan} (${req.merchant.productLimit} منتج). يرجى الترقية لإضافة المزيد.`,
        403,
        { code: 'PRODUCT_LIMIT_REACHED', currentPlan: req.merchant.plan, limit: req.merchant.productLimit }
      )
    );
  }

  const product = await Product.create({
    merchantId: req.merchant._id,
    name,
    price,
    stockCount: stockCount || 0,
    description,
    sku,
    imageUrl: imageUrl || null, // ✅ FIX: دعم رابط الصورة
  });

  res.status(201).json({
    status: 'success',
    data: { product },
  });
});

/**
 * GET /api/v1/products
 * Get products (Public for customers using ?storeName=XYZ OR Private for authenticated merchants)
 */
const getProducts = catchAsync(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = {};

  // ✅ 1. لو الطلب جاي من زبون (Public) بيبحث باسم المتجر
  if (req.query.storeName) {
    // 🚀 التعديل هنا: استخدام Regex للبحث بتجاهل حالة الأحرف (Case-Insensitive)
    const searchRegex = new RegExp(`^${req.query.storeName}$`, 'i');

const merchant = await Merchant.findOne({
  $or: [
    { storeName: searchRegex },
    { slug: searchRegex }
  ]
});
    
    if (!merchant) {
      return next(new AppError('المتجر غير موجود', 404));
    }
    filter.merchantId = merchant._id;
    filter.isActive = true; // الزبون يشوف المنتجات النشطة بس
  } 
  // ✅ 2. لو الطلب جاي من التاجر نفسه (Protected) من داخل لوحة التحكم
  else if (req.merchant && req.merchant._id) {
    filter.merchantId = req.merchant._id;
    // التاجر يقدر يفلتر النشط وغير النشط
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  } 
  // ✅ 3. لو مفيش اسم متجر ومفيش توكن تاجر، نرفض الطلب
  else {
    return next(new AppError('يجب تحديد اسم المتجر (storeName)', 400));
  }

  // فلترة إضافية للمخزون
  if (req.query.inStock === 'true') filter.stockCount = { $gt: 0 };

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    ...paginate(products, total, page, limit),
  });
});

/**
 * GET /api/v1/products/:id
 * Get a single product by ID (Public for customers OR Private for merchants).
 */
const getProduct = catchAsync(async (req, res, next) => {
  const filter = { _id: req.params.id };

  // ✅ نتاكد لو الطلب محمي بـ توكن، نقصر البحث على منتجات التاجر ده بس
  if (req.merchant && req.merchant._id) {
    filter.merchantId = req.merchant._id;
  } else {
    // لو زبون، نتأكد إنه يشوف المنتجات النشطة بس
    filter.isActive = true;
  }

  const product = await Product.findOne(filter);

  if (!product) {
    return next(new AppError('Product not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { product },
  });
});

/**
 * PATCH /api/v1/products/:id
 * Update a product.
 */
const updateProduct = catchAsync(async (req, res, next) => {
  const allowedFields = ['name', 'price', 'stockCount', 'description', 'sku', 'isActive', 'imageUrl']; // ✅ FIX: أضفنا imageUrl
  const updateData = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updateData[field] = req.body[field];
  });

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, merchantId: req.merchant._id },
    updateData,
    { new: true, runValidators: true }
  );

  if (!product) {
    return next(new AppError('Product not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { product },
  });
});

/**
 * DELETE /api/v1/products/:id
 * Soft-delete a product (sets isActive = false).
 */
const deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, merchantId: req.merchant._id },
    { isActive: false },
    { new: true }
  );

  if (!product) {
    return next(new AppError('Product not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Product deactivated successfully.',
  });
});

/**
 * PATCH /api/v1/products/:id/stock
 * Adjust stock count manually (add or remove units).
 */
const adjustStock = catchAsync(async (req, res, next) => {
  const { adjustment } = req.body;

  if (adjustment === undefined || typeof adjustment !== 'number') {
    return next(new AppError('adjustment (number) is required.', 400));
  }

  const product = await Product.findOne({
    _id: req.params.id,
    merchantId: req.merchant._id,
  });

  if (!product) {
    return next(new AppError('Product not found.', 404));
  }

  const newStock = product.stockCount + adjustment;
  if (newStock < 0) {
    return next(
      new AppError(
        `Cannot reduce stock below 0. Current stock: ${product.stockCount}, Adjustment: ${adjustment}.`,
        400
      )
    );
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    { $inc: { stockCount: adjustment } },
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    message: `Stock adjusted by ${adjustment > 0 ? '+' : ''}${adjustment}.`,
    data: { product: updatedProduct },
  });
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
};
