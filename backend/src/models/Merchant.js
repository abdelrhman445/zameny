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
      trim:      true,
      maxlength: [150, 'Store name cannot exceed 150 characters.'],
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
