'use strict';

/**
 * Shipping Service  —  Bosta Logistics Integration
 * ─────────────────────────────────────────────────────────────────────────────
 * Wraps Bosta's delivery API to:
 *   • Create a shipment → get AWB + tracking number
 *   • Cancel a shipment
 *   • Poll tracking status (for webhooks / cron)
 *
 * Switch to Aramex by replacing `createBostaShipment` with
 * `createAramexShipment` — the public `createShippingOrder` API stays identical.
 *
 * Docs: https://developer.bosta.co/
 */

const axios    = require('axios');
const AppError = require('../utils/appError');
const logger   = require('../config/logger');

// ── Config ────────────────────────────────────────────────────────────────────
const BOSTA_BASE_URL = process.env.BOSTA_BASE_URL || 'https://app.bosta.co/api/v2';
const BOSTA_API_KEY  = process.env.BOSTA_API_KEY;

/** Bosta city codes mapping (extend as needed) */
const CITY_CODES = {
  cairo:        'EG-01',
  giza:         'EG-02',
  alexandria:   'EG-03',
  // … add more
};

// ── Axios instance with auth ──────────────────────────────────────────────────
const bostaClient = axios.create({
  baseURL: BOSTA_BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject API key before every request
bostaClient.interceptors.request.use((config) => {
  if (!BOSTA_API_KEY && process.env.NODE_ENV === 'production') {
    throw new AppError('BOSTA_API_KEY is not configured.', 500);
  }
  config.headers['Authorization'] = BOSTA_API_KEY || 'MOCK_KEY';
  return config;
});

// ── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Map a free-text city string to a Bosta city code.
 * Falls back gracefully to Cairo.
 */
const resolveCityCode = (cityString = '') => {
  const key = cityString.toLowerCase().trim();
  return CITY_CODES[key] || CITY_CODES['cairo'];
};

/**
 * Build the Bosta delivery request payload from our Order document.
 *
 * @param {Object} orderData
 * @returns {Object}  Bosta-shaped request body
 */
const buildBostaPayload = (orderData) => ({
  type:       10,  // 10 = Cash Collection + Delivery (COD) | 20 = Exchange | 30 = Return
  specs: {
    packageDetails: {
      itemsCount: orderData.items.reduce((acc, i) => acc + i.quantity, 0),
      description: orderData.items.map((i) => `${i.name} x${i.quantity}`).join(', '),
      weight:     orderData.weightKg || 1,
    },
  },
  cod:        orderData.paymentMethod === 'COD' ? orderData.totalAmount : 0,
  notes:      orderData.notes || '',
  receiver: {
    firstName:   (orderData.customerName || 'Customer').split(' ')[0],
    lastName:    (orderData.customerName || 'Customer').split(' ').slice(1).join(' ') || '.',
    phone:       orderData.customerPhone,
    address: {
      city:       resolveCityCode(orderData.customerCity),
      firstLine:  orderData.customerAddress || 'N/A',
    },
  },
  returnAddress: {
    // Merchant return address from env
    city:      resolveCityCode(process.env.MERCHANT_CITY || 'cairo'),
    firstLine: process.env.MERCHANT_ADDRESS || 'Merchant Warehouse',
  },
  businessReference: orderData.orderNumber,
});

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Create a shipping order (AWB) for a confirmed Order.
 *
 * In DEV mode (no BOSTA_API_KEY), returns a mock response so the rest
 * of the system can be tested without a live account.
 *
 * @param {Object} orderData  - Mongoose Order doc or plain object
 * @returns {Promise<{
 *   trackingNumber: string,
 *   awbUrl: string,
 *   carrierId: string,
 *   estimatedDelivery: Date | null,
 *   raw: Object
 * }>}
 */
const createShippingOrder = async (orderData) => {
  // ── Production: real API call ─────────────────────────────────────────────
  try {
    logger.info(`[ShippingService] Creating Bosta shipment for order ${orderData.orderNumber}`);

    const payload       = buildBostaPayload(orderData);
    const { data }      = await bostaClient.post('/deliveries', payload);

    if (!data?.success || !data?.delivery?._id) {
      throw new AppError(
        `Bosta API rejected shipment: ${data?.message || 'Unknown error'}`,
        502
      );
    }

    const delivery        = data.delivery;
    const trackingNumber  = delivery.trackingNumber || delivery._id;
    const awbUrl          = `https://app.bosta.co/tracking/${trackingNumber}`;

    logger.info(
      `[ShippingService] AWB created. Tracking: ${trackingNumber} for order ${orderData.orderNumber}`
    );

    return {
      trackingNumber,
      awbUrl,
      carrierId:         'BOSTA',
      estimatedDelivery: delivery.estimatedDeliveryDate
        ? new Date(delivery.estimatedDeliveryDate)
        : null,
      raw: delivery,
    };
  } catch (err) {
    if (err.isOperational) throw err;
    
    // 🔥 هنا حيظهر الإيرور لو المفتاح غلط
    logger.error('[ShippingService] Bosta API error:', { 
      message: err.message, 
      status: err.response?.status, // عشان نعرف هو 401 ولا حاجة تانية
      order: orderData.orderNumber 
    });

    throw new AppError(
      `Shipping provider error: ${err.response?.data?.message || err.message}`,
      502
    );
  }
};
/**
 * Cancel a Bosta shipment by tracking number.
 * Called when an order transitions to Cancelled after it was Shipped.
 *
 * @param {string} trackingNumber
 * @returns {Promise<boolean>}
 */
const cancelShippingOrder = async (trackingNumber) => {
  if (!BOSTA_API_KEY || process.env.NODE_ENV === 'test') {
    logger.warn(`[ShippingService] DEV MODE — skipping cancellation for ${trackingNumber}`);
    return true;
  }

  try {
    const { data } = await bostaClient.put(`/deliveries/${trackingNumber}/terminate`);
    if (!data?.success) {
      throw new AppError(`Bosta cancellation failed: ${data?.message || 'Unknown error'}`, 502);
    }
    logger.info(`[ShippingService] Shipment ${trackingNumber} cancelled.`);
    return true;
  } catch (err) {
    if (err.isOperational) throw err;
    throw new AppError(
      `Shipping cancellation error: ${err.response?.data?.message || err.message}`,
      502
    );
  }
};

/**
 * Fetch live tracking status for a shipment.
 *
 * @param {string} trackingNumber
 * @returns {Promise<Object>}  Bosta tracking payload
 */
const getTrackingStatus = async (trackingNumber) => {
  if (!BOSTA_API_KEY || process.env.NODE_ENV === 'test') {
    return { status: 'MOCK_IN_TRANSIT', trackingNumber };
  }

  try {
    const { data } = await bostaClient.get(`/deliveries/${trackingNumber}`);
    return data?.delivery || data;
  } catch (err) {
    throw new AppError(
      `Failed to fetch tracking status: ${err.response?.data?.message || err.message}`,
      502
    );
  }
};

module.exports = { createShippingOrder, cancelShippingOrder, getTrackingStatus };
