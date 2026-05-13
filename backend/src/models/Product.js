'use strict';

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: [true, 'Product must belong to a merchant.'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required.'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters.'],
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters.'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required.'],
      min: [0, 'Price cannot be negative.'],
    },
    stockCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock count cannot be negative.'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // ✅ FIX: أضفنا imageUrl للمنتج — يُخزَّن رابط Cloudinary أو S3
    imageUrl: {
      type:    String,
      default: null,
      trim:    true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Compound index: merchant + product name uniqueness ────────────────────
productSchema.index({ merchantId: 1, name: 1 }, { unique: true });

// ── Virtual: Is in stock ───────────────────────────────────────────────────
productSchema.virtual('inStock').get(function () {
  return this.stockCount > 0;
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
