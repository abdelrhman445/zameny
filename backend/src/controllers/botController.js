'use strict';

const mongoose = require('mongoose');
const Order = require('../models/Order');
const Merchant = require('../models/Merchant');
const {
  answerCallbackQuery,
  editMessage,
  buildStatusUpdateMessage,
  sendSimpleMessage,
} = require('../services/telegramService');
const inventoryService = require('../services/inventoryService');
const logger = require('../config/logger');

/**
 * Map callback action strings → Order status transitions.
 */
const ACTION_TO_STATUS = {
  confirm_order: 'Confirmed',
  cancel_order: 'Cancelled',
  ship_order: 'Shipped',
};

const ACTION_LABELS = {
  confirm_order: '✅ Confirmed',
  cancel_order: '❌ Cancelled',
  ship_order: '🚢 Shipped',
};

/**
 * POST /api/v1/webhooks/telegram
 * Handle incoming Telegram updates (callback queries from inline keyboard).
 *
 * Security: Verified via X-Telegram-Bot-Api-Secret-Token header.
 */
const handleTelegramWebhook = async (req, res) => {
  // Acknowledge Telegram immediately (prevents retries)
  res.status(200).json({ ok: true });

  try {
    // Parse raw body (middleware sends raw buffer for this route)
    const body = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body instanceof Buffer
        ? JSON.parse(req.body.toString('utf8'))
        : req.body;

    // ── Only handle callback_query events ──────────────────────────────
    if (!body?.callback_query) {
      logger.debug('[BotController] Non-callback update received — ignoring.');
      return;
    }

    const callbackQuery = body.callback_query;
    const callbackQueryId = callbackQuery.id;
    const callbackData = callbackQuery.data; // e.g., "confirm_order:64abc..."
    const telegramChatId = String(callbackQuery.message?.chat?.id);
    const messageId = callbackQuery.message?.message_id;
    const callerUsername = callbackQuery.from?.username || 'Unknown';

    if (!callbackData || !telegramChatId || !messageId) {
      logger.warn('[BotController] Incomplete callback query data received.');
      return;
    }

    // ── Parse action and orderId ────────────────────────────────────────
    const [action, orderId] = callbackData.split(':');

    if (!ACTION_TO_STATUS[action] || !orderId) {
      logger.warn(`[BotController] Unknown action received: ${callbackData}`);
      await answerCallbackQuery(callbackQueryId, '⚠️ Unknown action.', true);
      return;
    }

    // ── Validate orderId ────────────────────────────────────────────────
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      await answerCallbackQuery(callbackQueryId, '❌ Invalid order reference.', true);
      return;
    }

    const newStatus = ACTION_TO_STATUS[action];
    const actionLabel = ACTION_LABELS[action];

    // ── Find the merchant by their telegramChatId ───────────────────────
    const merchant = await Merchant.findOne({ telegramChatId });
    if (!merchant) {
      logger.warn(
        `[BotController] No merchant found for Telegram chatId: ${telegramChatId}`
      );
      await answerCallbackQuery(
        callbackQueryId,
        '❌ Unauthorized: No merchant linked to this chat.',
        true
      );
      return;
    }

    // ── Find the order (must belong to this merchant) ────────────────────
    const order = await Order.findOne({
      _id: orderId,
      merchantId: merchant._id,
    });

    if (!order) {
      await answerCallbackQuery(callbackQueryId, '❌ Order not found.', true);
      return;
    }

    // ── Prevent double-actions on terminal statuses ───────────────────────
    const terminalStatuses = ['Delivered', 'RTO', 'Cancelled'];
    if (terminalStatuses.includes(order.status)) {
      await answerCallbackQuery(
        callbackQueryId,
        `ℹ️ Order is already ${order.status}. No changes made.`,
        true
      );
      return;
    }

    // ── Validate transition ───────────────────────────────────────────────
    const ALLOWED_TRANSITIONS = {
      Pending:   ['Confirmed', 'Cancelled'],
      Flagged:   ['Confirmed', 'Cancelled'],
      Confirmed: ['Shipped', 'Cancelled'],
      Shipped:   ['Delivered', 'RTO'],
    };

    const allowed = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowed.includes(newStatus)) {
      await answerCallbackQuery(
        callbackQueryId,
        `⚠️ Cannot move order from ${order.status} to ${newStatus}.`,
        true
      );
      return;
    }

    // ── Start transaction for inventory-critical operations ───────────────
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const previousStatus = order.status;
      order.status = newStatus;
      order.statusHistory.push({
        status: newStatus,
        changedAt: new Date(),
        changedBy: `telegram:${callerUsername}`,
      });

      // Inventory sync
      if (newStatus === 'Confirmed' && ['Pending', 'Flagged'].includes(previousStatus)) {
        await inventoryService.decrementStock(order.items, merchant._id, session);

      } else if (newStatus === 'RTO') {
        await inventoryService.handleRtoEvent(order, session);

      } else if (newStatus === 'Cancelled' && previousStatus === 'Confirmed') {
        await inventoryService.handleCancellationEvent(order, session);
      }

      await order.save({ session });
      await session.commitTransaction();
      session.endSession();

      logger.info(
        `[BotController] Order ${order.orderNumber}: ${previousStatus} → ${newStatus} (by @${callerUsername})`
      );

      // ── Answer callback to remove loading spinner ─────────────────────
      await answerCallbackQuery(
        callbackQueryId,
        `${actionLabel} — Order #${order.orderNumber}`,
        false
      );

      // ── Edit the original Telegram message to remove buttons ──────────
      const updatedMessage = buildStatusUpdateMessage(order, `@${callerUsername} via Telegram`);
      await editMessage(telegramChatId, messageId, updatedMessage, null);

    } catch (txError) {
      await session.abortTransaction();
      session.endSession();

      logger.error('[BotController] Transaction failed during bot action:', {
        error: txError.message,
        orderId,
        action,
      });

      await answerCallbackQuery(
        callbackQueryId,
        `❌ Error: ${txError.message}`,
        true
      );

      // Notify merchant of failure
      await sendSimpleMessage(
        telegramChatId,
        `⚠️ <b>A.E.E System Error</b>\n\nFailed to process action for Order #${order.orderNumber}.\n<code>${txError.message}</code>`
      );
    }
  } catch (error) {
    logger.error('[BotController] Unhandled webhook processing error:', {
      error: error.message,
      stack: error.stack,
    });
  }
};

module.exports = { handleTelegramWebhook };
