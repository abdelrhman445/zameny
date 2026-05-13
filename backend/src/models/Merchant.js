'use strict';

/**
 * Merchant Model
 * ─────────────────────────────────────────────────────────────────────────────
 * Updated to include SaaS subscription billing fields:
 *   • plan               — Free | Pro | Enterprise
 *   • subscriptionStatus — Active | Past_Due | Canceled
 *   • stripeCustomerId   — Stripe customer reference
 *   • productLimit       — virtual: max products allowed per plan
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Plan limits (drives feature gating) ─────────────────────────────────────
const PLAN_PRODUCT_LIMITS = {
  Free:       50,
  Pro:        500,
  Enterprise: Infinity,
};

const merchantSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Merchant name is required.'],
      trim:      true,
      maxlength: [100, 'Name cannot exceed 100 characters.'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required.'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please provide a valid email address.'],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required.'],
      minlength: [8, 'Password must be at least 8 characters.'],
      select:    false,
    },
    passwordResetOtp: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
    storeName: {
      type:      String,
      required:  [true, 'Store name is required.'],
      unique:    true, // ✅ FIX: أضفنا unique لمنع تكرار أسماء المتاجر
      trim:      true,
      maxlength: [150, 'Store name cannot exceed 150 characters.'],
    },
    // ✅ FIX: أضفنا slug للاستخدام في URLs — مشتق من storeName
    slug: {
      type:      String,
      unique:    true,
      sparse:    true, // يسمح بـ null لو لم يُعيَّن بعد
      lowercase: true,
      trim:      true,
    },
    telegramChatId: {
      type:    String,
      default: null,
      trim:    true,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
    passwordChangedAt: {
      type:   Date,
      select: false,
    },

    // ── SaaS Subscription Billing ──────────────────────────────────────────
    plan: {
      type:    String,
      enum:    { values: ['Free', 'Pro', 'Enterprise'], message: 'Plan must be Free, Pro, or Enterprise.' },
      default: 'Free',
      index:   true,
    },
    subscriptionStatus: {
      type:    String,
      enum:    { values: ['Active', 'Past_Due', 'Canceled'], message: 'Invalid subscriptionStatus.' },
      default: 'Active',
    },
    stripeCustomerId: {
      type:    String,
      default: null,
      select:  false,
      trim:    true,
    },
    stripeSubscriptionId: {
      type:    String,
      default: null,
      select:  false,
      trim:    true,
    },
    // ✅ FIX: أضفنا nextBillingDate — بيتحدث من Stripe webhook
    nextBillingDate: {
      type:    Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ── Virtual: product limit per plan ──────────────────────────────────────────
merchantSchema.virtual('productLimit').get(function () {
  return PLAN_PRODUCT_LIMITS[this.plan] ?? 50;
});

merchantSchema.virtual('isPaidPlan').get(function () {
  return this.plan !== 'Free';
});

// ── Pre-save: Hash password ───────────────────────────────────────────────────
merchantSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ✅ FIX: Pre-save — توليد slug من storeName أوتوماتيك عند الإنشاء أو التحديث
merchantSchema.pre('save', function (next) {
  if (this.isModified('storeName') || !this.slug) {
    this.slug = this.storeName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')           // مسافات → شرطة
      .replace(/[^\u0600-\u06FFa-z0-9\-]/g, '') // يحتفظ بعربي + لاتيني + أرقام + شرطة
      .replace(/-+/g, '-')            // شرطات متعددة → شرطة واحدة
      .replace(/^-|-$/g, '');         // يشيل الشرطة من البداية والنهاية
  }
  next();
});

merchantSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

merchantSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

merchantSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

merchantSchema.methods.canAddProduct = function (currentProductCount) {
  const limit = PLAN_PRODUCT_LIMITS[this.plan] ?? 50;
  return currentProductCount < limit;
};

merchantSchema.index({ plan: 1, subscriptionStatus: 1 });

const Merchant = mongoose.model('Merchant', merchantSchema);
module.exports = Merchant;
