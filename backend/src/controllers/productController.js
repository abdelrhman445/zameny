'use strict';

const Product = require('../models/Product');
const AppError = require('../utils/appError');
const { catchAsync, paginate } = require('../utils/helpers');

/**
 * POST /api/v1/products
 * Create a new product for the authenticated merchant.
 */
const createProduct = catchAsync(async (req, res, next) => {
  const { name, price, stockCount, description, sku } = req.body;

  const product = await Product.create({
    merchantId: req.merchant._id,
    name,
    price,
    stockCount: stockCount || 0,
    description,
    sku,
  });

  res.status(201).json({
    status: 'success',
    data: { product },
  });
});

/**
 * GET /api/v1/products
 * Get all products for the authenticated merchant with pagination.
 */
const getProducts = catchAsync(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = { merchantId: req.merchant._id };
  if (req.query.inStock === 'true') filter.stockCount = { $gt: 0 };
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

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
 * Get a single product by ID (must belong to authenticated merchant).
 */
const getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({
    _id: req.params.id,
    merchantId: req.merchant._id,
  });

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
  const allowedFields = ['name', 'price', 'stockCount', 'description', 'sku', 'isActive'];
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
