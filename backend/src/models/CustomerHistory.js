'use strict';

const mongoose = require('mongoose');

const customerHistorySchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required.'],
      unique: true,
      trim: true,
      // Normalize: store digits only for consistent lookup
      index: true,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    rtoOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    knownIps: {
      type: [String],
      default: [],
    },
    fraudScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    // Persistent flag — once a customer is blacklisted, it persists
    isBlacklisted: {
      type: Boolean,
      default: false,
    },
    lastOrderDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters.'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: RTO Rate ──────────────────────────────────────────────────────
customerHistorySchema.virtual('rtoRate').get(function () {
  if (this.totalOrders === 0) return 0;
  return parseFloat((this.rtoOrders / this.totalOrders).toFixed(4));
});

// ── Virtual: Risk Level (derived from fraudScore) ─────────────────────────
customerHistorySchema.virtual('riskLevel').get(function () {
  if (this.fraudScore < 50) return 'High';
  if (this.fraudScore < 80) return 'Medium';
  return 'Low';
});

// ── Static: Find or create customer history ────────────────────────────────
customerHistorySchema.statics.findOrCreate = async function (phoneNumber) {
  let customer = await this.findOne({ phoneNumber });
  if (!customer) {
    customer = await this.create({ phoneNumber });
  }
  return customer;
};

const CustomerHistory = mongoose.model('CustomerHistory', customerHistorySchema);
module.exports = CustomerHistory;
