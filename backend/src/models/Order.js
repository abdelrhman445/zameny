'use strict';

const mongoose = require('mongoose');

// ── Order Item Sub-Schema ──────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name:      { type: String, required: true, trim: true },
    quantity:  { type: Number, required: true, min: [1, 'Quantity must be at least 1.'] },
    unitPrice: { type: Number, required: true, min: [0, 'Unit price cannot be negative.'] },
    subtotal:  { type: Number, required: true },
  },
  { _id: false }
);

// ── Fraud Analysis Sub-Schema ──────────────────────────────────────────────
const fraudAnalysisSchema = new mongoose.Schema(
  {
    score:         { type: Number, required: true, min: 0, max: 100 },
    riskLevel:     { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    reason:        { type: String, trim: true },
    rtoRate:       { type: Number, default: 0 },
    isNewCustomer: { type: Boolean, default: false },
    ipMismatch:    { type: Boolean, default: false },
  },
  { _id: false }
);

// ── Status History Sub-Schema ──────────────────────────────────────────────
const statusHistorySchema = new mongoose.Schema(
  {
    status:    { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: String, default: 'system' },
    reason:    { type: String, trim: true },
  },
  { _id: false }
);

// ── Main Order Schema ──────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    merchantId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Merchant',
      required: [true, 'Order must belong to a merchant.'],
      index:    true,
    },
    // ✅ تم الإبقاء على unique هنا فقط لضمان عدم تكرار رقم الطلب ومنع الـ Crash
    orderNumber: { type: String, unique: true },
    
    customerPhone:   { type: String, required: [true, 'Customer phone number is required.'], trim: true, index: true },
    customerName:    { type: String, required: [true, 'Customer name is required.'], trim: true, maxlength: 150 },
    customerAddress: { type: String, trim: true },
    customerCity:    { type: String, trim: true, default: 'Cairo' },
    customerEmail:   { type: String, trim: true, lowercase: true },
    customerIp:      { type: String, required: true },
    items:           {
      type:     [orderItemSchema],
      validate: { validator: (v) => Array.isArray(v) && v.length > 0, message: 'Order must contain at least one item.' },
    },
    
    // ── الحسابات المالية التفصيلية ──
    subtotal:    { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    discount:    { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency:    { type: String, default: 'EGP', uppercase: true },

    status: {
      type:    String,
      enum:    { values: ['Pending', 'Flagged', 'Confirmed', 'Shipped', 'Delivered', 'RTO', 'Cancelled'], message: 'Invalid order status: {VALUE}.' },
      default: 'Pending',
      index:   true,
    },
    fraudAnalysis:     { type: fraudAnalysisSchema, required: true },
    statusHistory:     { type: [statusHistorySchema], default: [] },
    telegramMessageId: { type: Number, default: null },
    notes:             { type: String, trim: true, maxlength: 500 },

    // ── Payment (Stripe & Paymob Support) ──
    paymentMethod: {
      type:    String,
      enum:    { values: ['COD', 'Online'], message: 'paymentMethod must be COD or Online.' },
      default: 'COD',
    },
    paymentStatus: {
      type:    String,
      enum:    ['Pending', 'Awaiting_OTP', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    paymentDetails: {
      gateway:         { type: String, enum: ['STRIPE', 'PAYMOB', 'NONE'], default: 'NONE' },
      transactionId:   { type: String, default: null }, 
      stripeSessionId: { type: String, default: null },
      paymobOrderId:   { type: Number, default: null },
      receiptUrl:      { type: String, default: null },
    },
    paidAt: { type: Date, default: null },

    // ── Shipping ──
    trackingNumber:    { type: String, default: null, trim: true },
    trackingUrl:       { type: String, default: null, trim: true },
    shippingCarrier:   { type: String, default: 'BOSTA', trim: true },
    estimatedDelivery: { type: Date, default: null },
    shippedAt:         { type: Date, default: null },
    deliveredAt:       { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ── Compound Indexes ─────────────────────────────────────────────────────────
orderSchema.index({ merchantId: 1, status: 1, createdAt: -1 });
orderSchema.index({ merchantId: 1, customerPhone: 1 });

// ── Pre-save: Generate order number & init status history ─────────────────────
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const timestamp  = Date.now().toString(36).toUpperCase();
    const random     = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `AEE-${timestamp}-${random}`;
    
    if (this.statusHistory.length === 0) {
      this.statusHistory.push({ status: this.status, changedBy: 'system' });
    }
  }
  next();
});

// ── Pre-save: Track status changes ───────────────────────────────────────────
orderSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified('status')) {
    this.statusHistory.push({ 
      status: this.status, 
      changedAt: new Date(), 
      changedBy: 'system' 
    });
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;