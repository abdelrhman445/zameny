'use strict';

const router          = require('express').Router();
const mongoose        = require('mongoose');
const stripe          = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { handleTelegramWebhook } = require('../../controllers/botController');
// 👇 استيراد الدوال المحددة اللي محتاجها بس (أخف وأسرع)
const { confirmOrderInternal } = require('../../controllers/orderController');

// باقي الخدمات والملفات
const billingService  = require('../../services/billingService');
const paymentService  = require('../../services/paymentService');
const logger          = require('../../config/logger');
const Order           = require('../../models/Order');

// ── Telegram secret verification ─────────────────────────────────────────────
const verifyTelegramSecret = (req, res, next) => {
  const secret         = req.headers['x-telegram-bot-api-secret-token'];
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expectedSecret) { logger.warn('[Webhook] TELEGRAM_WEBHOOK_SECRET not set'); return next(); }
  if (!secret || secret !== expectedSecret) {
    logger.warn(`[Webhook] Invalid Telegram secret from ${req.ip}`);
    return res.status(403).json({ status: 'fail', message: 'Forbidden.' });
  }
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔥 دالة الربط مع الطيار الآلي
// ─────────────────────────────────────────────────────────────────────────────
const fulfillEcommerceOrder = async (orderIdOrDoc, io) => {
  try {
    const orderId = typeof orderIdOrDoc === 'string' ? orderIdOrDoc : orderIdOrDoc._id;
    
    await confirmOrderInternal(orderId);

    const updatedOrder = await Order.findById(orderId);
    if (io && updatedOrder) {
      io.to(orderId.toString()).emit('orderUpdated', updatedOrder);
    }
    
  } catch (error) {
    logger.error(`[Webhook] Auto-Fulfillment failed:`, { message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/webhooks/stripe
// ─────────────────────────────────────────────────────────────────────────────
router.post('/stripe', async (req, res) => {
  console.log("🚀 الإشارة وصلت للباك إند!");
  try {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      logger.warn('[Webhook/Stripe] Missing stripe-signature header');
      return res.status(400).json({ error: 'Missing signature' });
    }

    let event;
    try {
      // التأكد من أن الإشارة جاية فعلاً من سترايب باستخدام السيكرت whsec_...
      event = stripe.webhooks.constructEvent(
        req.body, 
        signature, 
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.error('[Webhook/Stripe] Signature verification failed:', { message: err.message });
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 🔥 حالة نجاح الدفع (Checkout Completed)
    // ─────────────────────────────────────────────────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.client_reference_id;

      logger.info(`[Webhook/Stripe] Checkout completed event received. OrderID: ${orderId}`);

      if (orderId) {
        try {
          // 1. تشغيل الطيار الآلي (تحديث DB + مخزون + شحن)
          await confirmOrderInternal(orderId);

          // 2. بلّغ السوكيت فوراً
          const io = req.app.get('socketio');
          const updatedOrder = await Order.findById(orderId);
          
          if (io && updatedOrder) {
            io.to(orderId).emit('orderUpdated', updatedOrder);
            logger.info(`[Socket] Order ${orderId} UI update signal sent!`);
          }
        } catch (error) {
          logger.error(`[Webhook/Stripe] Error processing order ${orderId}:`, { message: error.message });
        }
      } else {
        logger.warn(`[Webhook/Stripe] Missing client_reference_id in session ${session.id}`);
      }

      return res.status(200).json({ status: 'success', received: true });
    }

    // للمدفوعات الأخرى (مثل اشتراكات التجار SaaS)
    if (event.type.startsWith('invoice.') || event.type.startsWith('customer.')) {
      logger.info(`[Webhook/Stripe] Billing event received: ${event.type}`);
      try {
        // ✅ FIX: نمرر الـ event مباشرة بعد ما تم التحقق منه فوق — مش rawBody مرة تانية
        const result = await billingService.handleStripeWebhookEvent(event);
        return res.status(200).json(result);
      } catch (error) {
        logger.error(`[Webhook/Stripe] Billing service error:`, { message: error.message });
        return res.status(200).json({ status: 'acknowledged' });
      }
    }

    // جميع الأحداث الأخرى
    logger.info(`[Webhook/Stripe] Unhandled event type: ${event.type}`);
    res.status(200).json({ status: 'acknowledged' });

  } catch (err) {
    logger.error('[Webhook/Stripe] Critical Error:', { message: err.message });
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET|POST /api/v1/webhooks/paymob
// ─────────────────────────────────────────────────────────────────────────────
const handlePaymobCallback = async (req, res) => {
  try {
    const data = { ...req.query, ...req.body };
    const hmac = data.hmac;

    // ✅ FIX: التحقق من وجود verifyPaymobHmac قبل استدعائها
    if (process.env.PAYMOB_HMAC_SECRET && hmac) {
      const isValid = paymentService.verifyPaymobHmac(data, hmac);
      if (!isValid) {
        logger.warn('[Webhook/Paymob] HMAC verification failed');
        return res.status(400).json({ error: 'Invalid HMAC' });
      }
    }

    const success       = data.success === 'true';
    const orderRef      = data.merchant_order_id; 
    const transactionId = data.id;

    if (orderRef) {
      if (success) {
        const order = await Order.findOne({ orderNumber: orderRef });
        if (order) {
          // 🔥 تشغيل الطيار الآلي
          await fulfillEcommerceOrder(order._id, req.app.get('socketio'));
        }
      } else {
        await Order.findOneAndUpdate({ orderNumber: orderRef }, { paymentStatus: 'Failed' });
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error('[Webhook/Paymob] Error:', { message: err.message });
    res.status(200).json({ received: true });
  }
};

router.post('/telegram', verifyTelegramSecret, handleTelegramWebhook);
router.get('/paymob',  handlePaymobCallback);
router.post('/paymob', handlePaymobCallback);
// حطه قبل الـ POST عشان نقدر نتست بيه بالمتصفح
router.get('/stripe', (req, res) => {
  res.send("✅ Webhook Path is Active! Send a POST request to test it properly.");
});

module.exports = router;
