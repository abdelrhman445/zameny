'use strict';

const axios = require('axios');
const logger = require('../config/logger');

const TELEGRAM_API_BASE = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

// ── Risk level visual badges ────────────────────────────────────────────────
const RISK_BADGE = {
  Low: '🟢 Low',
  Medium: '🟡 Medium',
  High: '🔴 HIGH',
};

/**
 * Build the professional order notification message for Telegram.
 * @param {Object} order - The saved order document
 * @returns {string} Formatted Telegram HTML message
 */
const buildOrderMessage = (order) => {
  const { fraudAnalysis } = order;
  const riskBadge = RISK_BADGE[fraudAnalysis.riskLevel] || '⚪ Unknown';
  const statusEmoji = order.status === 'Flagged' ? '🚨' : '🕐';

  return (
    `<b>━━━━━━━━━━━━━━━━━━━━━━━━</b>\n` +
    `<b>🛒  Zameny — New Order Alert</b>\n` +
    `<b>━━━━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
    `${statusEmoji} <b>Status:</b> <code>${order.status}</code>\n` +
    `🔢 <b>Order #:</b> <code>${order.orderNumber}</code>\n` +
    `💰 <b>Total:</b> <code>${order.totalAmount.toFixed(2)} EGP</code>\n\n` +
    `<b>👤 Customer Details</b>\n` +
    `├ Name: <b>${order.customerName}</b>\n` +
    `├ Phone: <code>${order.customerPhone}</code>\n` +
    `└ IP: <code>${order.customerIp}</code>\n\n` +
    `<b>📦 Items (${order.items.length})</b>\n` +
    order.items.map(
      (item, i) =>
        `${i === order.items.length - 1 ? '└' : '├'} ${item.name} × ${item.quantity} — <code>${item.subtotal.toFixed(2)} EGP</code>`
    ).join('\n') +
    `\n\n` +
    `<b>🛡️ Fraud Analysis</b>\n` +
    `├ Risk Level: <b>${riskBadge}</b>\n` +
    `├ Score: <code>${fraudAnalysis.score}/100</code>\n` +
    `└ Reason: <i>${fraudAnalysis.reason}</i>\n\n` +
    `<i>⏱ ${new Date().toLocaleString('en-EG', { timeZone: 'Africa/Cairo' })}</i>`
  );
};

/**
 * Build inline keyboard for order action buttons.
 * @param {string} orderId - MongoDB Order ObjectId
 * @returns {Object} Telegram InlineKeyboardMarkup
 */
const buildOrderKeyboard = (orderId) => ({
  inline_keyboard: [
    [
      {
        text: '✅ Confirm Order',
        callback_data: `confirm_order:${orderId}`,
      },
      {
        text: '❌ Cancel Order',
        callback_data: `cancel_order:${orderId}`,
      },
    ],
    [
      {
        text: '🚢 Mark as Shipped',
        callback_data: `ship_order:${orderId}`,
      },
    ],
  ],
});

/**
 * Send a new order notification to the merchant's Telegram chat.
 * @param {string} telegramChatId - The merchant's Telegram chat ID
 * @param {Object} order - The saved order document
 * @returns {Promise<number|null>} Telegram message_id (for later editing)
 */
const sendOrderNotification = async (telegramChatId, order) => {
  if (!telegramChatId) {
    logger.warn(`[TelegramService] Merchant has no telegramChatId — notification skipped.`);
    return null;
  }

  try {
    const response = await axios.post(`${TELEGRAM_API_BASE}/sendMessage`, {
      chat_id: telegramChatId,
      text: buildOrderMessage(order),
      parse_mode: 'HTML',
      reply_markup: buildOrderKeyboard(order._id.toString()),
    });

    const messageId = response.data?.result?.message_id;
    logger.info(
      `[TelegramService] Notification sent for order ${order.orderNumber}. MessageID: ${messageId}`
    );
    return messageId;
  } catch (error) {
    logger.error('[TelegramService] Failed to send order notification:', {
      chatId: telegramChatId,
      orderId: order._id,
      error: error.response?.data || error.message,
    });
    return null; // Non-fatal: order is saved even if notification fails
  }
};

/**
 * Edit an existing Telegram message (e.g., remove buttons after action).
 * @param {string} chatId
 * @param {number} messageId
 * @param {string} newText - Updated message text
 * @param {Object|null} [replyMarkup=null] - Pass null to remove keyboard
 */
const editMessage = async (chatId, messageId, newText, replyMarkup = null) => {
  try {
    await axios.post(`${TELEGRAM_API_BASE}/editMessageText`, {
      chat_id: chatId,
      message_id: messageId,
      text: newText,
      parse_mode: 'HTML',
      reply_markup: replyMarkup || { inline_keyboard: [] },
    });
    logger.info(`[TelegramService] Message ${messageId} edited for chat ${chatId}`);
  } catch (error) {
    logger.error('[TelegramService] Failed to edit message:', {
      chatId,
      messageId,
      error: error.response?.data || error.message,
    });
  }
};

/**
 * Answer a callback query (remove the loading spinner on button press).
 * @param {string} callbackQueryId
 * @param {string} [text] - Optional toast notification text
 * @param {boolean} [showAlert=false]
 */
const answerCallbackQuery = async (callbackQueryId, text = '', showAlert = false) => {
  try {
    await axios.post(`${TELEGRAM_API_BASE}/answerCallbackQuery`, {
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert,
    });
  } catch (error) {
    logger.error('[TelegramService] Failed to answer callback query:', {
      callbackQueryId,
      error: error.response?.data || error.message,
    });
  }
};

/**
 * Send a simple text notification to a chat.
 * @param {string} chatId
 * @param {string} message
 */
const sendSimpleMessage = async (chatId, message) => {
  if (!chatId) return;
  try {
    await axios.post(`${TELEGRAM_API_BASE}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    });
  } catch (error) {
    logger.error('[TelegramService] Failed to send simple message:', {
      error: error.response?.data || error.message,
    });
  }
};

/**
 * Build a status update message (used when editing after action).
 * @param {Object} order
 * @param {string} actionBy - Who triggered the action
 * @returns {string}
 */
const buildStatusUpdateMessage = (order, actionBy = 'Merchant') => {
  const statusEmoji = {
    Confirmed: '✅',
    Cancelled: '❌',
    Shipped: '🚢',
    Delivered: '📦',
    RTO: '↩️',
    Flagged: '🚨',
  };

  const emoji = statusEmoji[order.status] || '🔄';

  return (
    `<b>━━━━━━━━━━━━━━━━━━━━━━━━</b>\n` +
    `<b>🛒  Zameny — Order Updated</b>\n` +
    `<b>━━━━━━━━━━━━━━━━━━━━━━━━</b>\n\n` +
    `${emoji} <b>Order #${order.orderNumber}</b> is now <b>${order.status}</b>\n\n` +
    `👤 Customer: <b>${order.customerName}</b> (<code>${order.customerPhone}</code>)\n` +
    `💰 Total: <code>${order.totalAmount.toFixed(2)} EGP</code>\n` +
    `🛡️ Risk: <b>${order.fraudAnalysis.riskLevel}</b> (Score: ${order.fraudAnalysis.score})\n\n` +
    `<i>Action by: ${actionBy} | ${new Date().toLocaleString('en-EG', { timeZone: 'Africa/Cairo' })}</i>`
  );
};

module.exports = {
  sendOrderNotification,
  editMessage,
  answerCallbackQuery,
  sendSimpleMessage,
  buildStatusUpdateMessage,
  buildOrderKeyboard,
};
