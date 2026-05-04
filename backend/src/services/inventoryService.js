'use strict';

const mongoose = require('mongoose');
const Product = require('../models/Product');
const CustomerHistory = require('../models/CustomerHistory');
const AppError = require('../utils/appError');
const logger = require('../config/logger');
const { normalizePhone } = require('../utils/helpers');

/**
 * Decrement stock for all items in an order (called on Confirmation).
 * Validates stock availability BEFORE decrementing.
 *
 * @param {Object[]} items - Array of order items { productId, quantity }
 * @param {string} merchantId
 * @param {mongoose.ClientSession} session
 */
const decrementStock = async (items, merchantId, session) => {
  for (const item of items) {
    const product = await Product.findOne({
      _id: item.productId,
      merchantId,
    }).session(session);

    if (!product) {
      throw new AppError(
        `Product "${item.name}" (ID: ${item.productId}) not found or does not belong to this merchant.`,
        404
      );
    }

    if (product.stockCount < item.quantity) {
      throw new AppError(
        `Insufficient stock for "${product.name}". Available: ${product.stockCount}, Requested: ${item.quantity}.`,
        409
      );
    }

    await Product.findByIdAndUpdate(
      item.productId,
      { $inc: { stockCount: -item.quantity } },
      { session, new: true }
    );

    logger.info(
      `[InventoryService] Decremented stock for Product ${item.productId}: -${item.quantity} units`
    );
  }
};

/**
 * Increment stock for all items in an order (called on Cancellation or RTO).
 *
 * @param {Object[]} items - Array of order items { productId, quantity }
 * @param {mongoose.ClientSession} session
 */
const incrementStock = async (items, session) => {
  for (const item of items) {
    await Product.findByIdAndUpdate(
      item.productId,
      { $inc: { stockCount: item.quantity } },
      { session }
    );

    logger.info(
      `[InventoryService] Restored stock for Product ${item.productId}: +${item.quantity} units`
    );
  }
};

/**
 * Handle RTO event:
 * - Restore stock
 * - Increment rtoOrders counter in CustomerHistory
 * - Permanently lower fraudScore by 15 points
 * - Auto-blacklist if score drops below 20
 *
 * @param {Object} order - The full order document
 * @param {mongoose.ClientSession} session
 */
const handleRtoEvent = async (order, session) => {
  const normalizedPhone = normalizePhone(order.customerPhone);

  // Restore inventory
  await incrementStock(order.items, session);

  // Update customer fraud profile
  const customerHistory = await CustomerHistory.findOne({
    phoneNumber: normalizedPhone,
  }).session(session);

  if (!customerHistory) {
    logger.warn(
      `[InventoryService] CustomerHistory not found for ${normalizedPhone} during RTO processing.`
    );
    return;
  }

  const newRtoCount = customerHistory.rtoOrders + 1;
  const newFraudScore = Math.max(0, customerHistory.fraudScore - 15);
  const shouldBlacklist = newFraudScore < 20;

  await CustomerHistory.findOneAndUpdate(
    { phoneNumber: normalizedPhone },
    {
      $inc: { rtoOrders: 1, totalOrders: 0 }, // totalOrders already incremented on creation
      $set: {
        fraudScore: newFraudScore,
        isBlacklisted: shouldBlacklist,
        lastOrderDate: new Date(),
      },
    },
    { session, new: true }
  );

  logger.warn(
    `[InventoryService] RTO processed for ${normalizedPhone}. ` +
    `New fraudScore: ${newFraudScore}. Blacklisted: ${shouldBlacklist}.`
  );

  if (shouldBlacklist) {
    logger.warn(
      `[InventoryService] ⚠️ Customer ${normalizedPhone} has been AUTO-BLACKLISTED due to critical fraud score.`
    );
  }
};

/**
 * Handle Cancellation event:
 * - Restore stock
 *
 * @param {Object} order - The full order document
 * @param {mongoose.ClientSession} session
 */
const handleCancellationEvent = async (order, session) => {
  await incrementStock(order.items, session);
  logger.info(
    `[InventoryService] Stock restored for cancelled order ${order.orderNumber}.`
  );
};

module.exports = {
  decrementStock,
  incrementStock,
  handleRtoEvent,
  handleCancellationEvent,
};
