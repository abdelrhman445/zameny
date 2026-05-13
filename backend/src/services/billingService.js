'use strict';

/**
 * Billing Service — A.E.E Multi-Purpose Stripe Integration
 * ─────────────────────────────────────────────────────────────────────────────
 * يتعامل مع:
 *   1. اشتراكات التجار (SaaS Subscriptions - Pro/Enterprise)
 *   2. أوردرات الزبائن (Direct Product Orders - Checkout Sessions)
 *   3. الـ Webhooks المركزية لكل العمليات.
 */

const AppError = require('../utils/appError');
const logger   = require('../config/logger');
const Merchant = require('../models/Merchant');
const Order    = require('../models/Order'); // أضفنا موديل الأوردرات

// ── Lazy-load Stripe ────────────────────────────────────────────────────────
let _stripe = null;
const getStripe = () => {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('[BillingService] STRIPE_SECRET_KEY not set — billing calls will be mocked.');
      return null;
    }
    throw new AppError('STRIPE_SECRET_KEY is not configured.', 500);
  }
  _stripe = require('stripe')(key);
  return _stripe;
};

const PLAN_PRICE_IDS = {
  Pro:        process.env.STRIPE_PRICE_ID_PRO,
  Enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE,
};

// ── Internal helpers ─────────────────────────────────────────────────────────

const getOrCreateStripeCustomer = async (merchant) => {
  const stripe = getStripe();
  if (!stripe) return `cus_mock_${merchant._id}`;
  if (merchant.stripeCustomerId) return merchant.stripeCustomerId;

  const customer = await stripe.customers.create({
    email:    merchant.email,
    name:     merchant.storeName,
    metadata: { merchantId: String(merchant._id) },
  });

  await Merchant.findByIdAndUpdate(merchant._id, { stripeCustomerId: customer.id });
  logger.info(`[BillingService] Stripe customer created: ${customer.id} for merchant ${merchant._id}`);
  return customer.id;
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * إنشاء اشتراك للتاجر (SaaS Billing)
 */
const createSubscription = async (merchantId, plan, paymentMethodId) => {
  const stripe   = getStripe();
  const merchant = await Merchant.findById(merchantId);
  if (!merchant) throw new AppError('Merchant not found.', 404);

  const priceId = PLAN_PRICE_IDS[plan];
  if (!priceId && stripe) {
    throw new AppError(`Stripe price ID for plan "${plan}" is not configured.`, 500);
  }

  if (!stripe) {
    await Merchant.findByIdAndUpdate(merchantId, { plan, subscriptionStatus: 'Active' });
    return { subscriptionId: 'sub_mock', clientSecret: null, status: 'active' };
  }

  try {
    const customerId = await getOrCreateStripeCustomer(merchant);

    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const subscription = await stripe.subscriptions.create({
      customer:         customerId,
      items:            [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand:           ['latest_invoice.payment_intent'],
      metadata:         { merchantId: String(merchantId), plan, type: 'SAAS_SUB' }, // أضفنا النوع للتمييز
    });

    await Merchant.findByIdAndUpdate(merchantId, {
      plan,
      subscriptionStatus: 'Active',
      stripeCustomerId:   customerId,
    });

    return {
      subscriptionId: subscription.id,
      clientSecret:   subscription.latest_invoice?.payment_intent?.client_secret || null,
      status:         subscription.status,
    };
  } catch (err) {
    if (err.isOperational) throw err;
    logger.error('[BillingService] Stripe createSubscription error:', { message: err.message });
    throw new AppError(`Billing error: ${err.message}`, 502);
  }
};

/**
 * إلغاء اشتراك التاجر
 */
const cancelSubscription = async (merchantId, immediately = false) => {
  const stripe   = getStripe();
  const merchant = await Merchant.findById(merchantId);
  if (!merchant) throw new AppError('Merchant not found.', 404);

  if (!stripe) {
    await Merchant.findByIdAndUpdate(merchantId, { plan: 'Free', subscriptionStatus: 'Canceled' });
    return;
  }

  try {
    const subs = await stripe.subscriptions.list({
      customer: merchant.stripeCustomerId,
      status:   'active',
      limit:    1,
    });

    if (!subs.data.length) throw new AppError('No active subscription found.', 404);

    const sub = subs.data[0];
    if (immediately) {
      await stripe.subscriptions.cancel(sub.id);
      await Merchant.findByIdAndUpdate(merchantId, { plan: 'Free', subscriptionStatus: 'Canceled' });
    } else {
      await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
    }

    logger.info(`[BillingService] Subscription ${sub.id} cancelled for ${merchantId}`);
  } catch (err) {
    if (err.isOperational) throw err;
    throw new AppError(`Billing error: ${err.message}`, 502);
  }
};

/**
 * الـ Webhook المركزي — القلب النابض للـ A.E.E
 * يقبل الـ raw body + signature ويتحقق بنفسه (للاستخدام المستقل)
 */
const handleStripeWebhook = async (rawBody, signatureHeader) => {
  const stripe        = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    logger.warn('[BillingService] Stripe webhook received in mock mode — ignored.');
    return { received: true };
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signatureHeader, webhookSecret);
  } catch (err) {
    throw new AppError(`Stripe webhook signature verification failed: ${err.message}`, 400);
  }

  return handleStripeWebhookEvent(event);
};

/**
 * ✅ FIX: دالة جديدة تقبل event تم التحقق منه مسبقاً
 * للاستخدام من webhook.routes.js بعد ما يعمل constructEvent هناك
 */
const handleStripeWebhookEvent = async (event) => {
  const stripe = getStripe();
  logger.info(`[BillingService] Stripe event received: ${event.type}`);

  const dataObject = event.data.object;

  switch (event.type) {
    // 1. أوردر زبون نجح (Direct Order)
    case 'checkout.session.completed': {
      const orderId = dataObject.client_reference_id;
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: 'Paid',
          status: 'Confirmed',
          paidAt: new Date(),
          'paymentDetails.stripeSessionId': dataObject.id
        });
        logger.info(`[BillingService] Checkout Success → Order ${orderId} marked as PAID`);
      }
      break;
    }

    // 2. اشتراك تاجر اتدفع (Recurring SaaS)
    case 'invoice.payment_succeeded': {
      const merchantId = dataObject.subscription
        ? (await stripe.subscriptions.retrieve(dataObject.subscription)).metadata.merchantId
        : dataObject.metadata?.merchantId;
      if (merchantId) {
        // ✅ FIX: إزلنا isPaidPlan لأنه virtual بيتحسب أوتوماتيك من الـ plan
        // ✅ FIX: أضفنا nextBillingDate من بيانات الفاتورة
        const nextBillingDate = dataObject.lines?.data?.[0]?.period?.end
          ? new Date(dataObject.lines.data[0].period.end * 1000)
          : null;
        await Merchant.findByIdAndUpdate(merchantId, {
          subscriptionStatus: 'Active',
          ...(nextBillingDate && { nextBillingDate }),
        });
        logger.info(`[BillingService] SaaS Payment Succeeded → Merchant ${merchantId} set to Active`);
      }
      break;
    }

    // 3. فشل دفع اشتراك تاجر
    case 'invoice.payment_failed': {
      const sub = await stripe.subscriptions.retrieve(dataObject.subscription);
      const merchantId = sub.metadata?.merchantId;
      if (merchantId) {
        await Merchant.findByIdAndUpdate(merchantId, { subscriptionStatus: 'Past_Due' });
        logger.warn(`[BillingService] SaaS Payment Failed → Merchant ${merchantId} is Past_Due`);
      }
      break;
    }

    // 4. اشتراك تاجر اتلغى تماماً
    case 'customer.subscription.deleted': {
      const merchantId = dataObject.metadata?.merchantId;
      if (merchantId) {
        // ✅ FIX: إزلنا isPaidPlan لأنه virtual — بيتحسب تلقائياً من plan
        await Merchant.findByIdAndUpdate(merchantId, { plan: 'Free', subscriptionStatus: 'Canceled' });
        logger.info(`[BillingService] SaaS Sub Deleted → Merchant ${merchantId} downgraded to Free`);
      }
      break;
    }

    // 5. تحديث الخطة
    case 'customer.subscription.updated': {
      const merchantId = dataObject.metadata?.merchantId;
      const plan = dataObject.metadata?.plan;
      if (merchantId && plan) {
        await Merchant.findByIdAndUpdate(merchantId, { plan });
        logger.info(`[BillingService] SaaS Sub Updated → Merchant ${merchantId} plan: ${plan}`);
      }
      break;
    }

    default:
      logger.debug(`[BillingService] Unhandled Stripe event: ${event.type}`);
  }

  return { received: true };
};

module.exports = {
  createSubscription,
  cancelSubscription,
  handleStripeWebhook,
  handleStripeWebhookEvent,
  getOrCreateStripeCustomer,
};