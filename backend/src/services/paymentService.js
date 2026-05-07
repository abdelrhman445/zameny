'use strict';

/**
 * Payment Service — Multi-Gateway Integration (Stripe & Paymob)
 * ─────────────────────────────────────────────────────────────────────────────
 * نظام دفع مرن يدعم التبديل التلقائي بين Stripe و Paymob بناءً على الإعدادات.
 */

const axios = require('axios');
const crypto = require('crypto');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const AppError = require('../utils/appError');
const logger = require('../config/logger');
const Merchant = require('../models/Merchant'); 

// إعدادات Paymob
const PAYMOB_BASE_URL = 'https://accept.paymob.com/api';
const PAYMOB_IFRAME_BASE = 'https://accept.paymob.com/api/acceptance/iframes';

// ── [STRIPE LOGIC] ──────────────────────────────────────────────────────────

const _generateStripeLink = async (aeeOrder) => {
  // جلب بيانات التاجر لجلب الـ Slug الصحيح للمسار
  const merchant = await Merchant.findById(aeeOrder.merchantId);
  const storeSlug = merchant?.slug || 'store'; 

  // تحويل المنتجات لتنسيق سترايب
  const lineItems = aeeOrder.items.map((item) => ({
    price_data: {
      currency: process.env.PAYMENT_CURRENCY?.toLowerCase() || 'egp',
      product_data: { 
        name: item.name,
        // إضافة صورة المنتج لو متاحة بتخلي شكل صفحة الدفع احترافي أكتر
        images: item.image ? [item.image] : [], 
      },
      // السعر بالقرش (سترايب بيتعامل بالعملة الصغرى)
      unit_amount: Math.round(item.unitPrice * 100), 
    },
    quantity: item.quantity,
  }));

  // إنشاء جلسة الدفع
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    
    // 🔥 حجر الزاوية: الربط بين سترايب والداتابيز عندك
    client_reference_id: aeeOrder._id.toString(), 
    
    line_items: lineItems,
    mode: 'payment',
    
    // الروابط مطابقة لهيكل صفحات الفرونت إند (Success Page)
    success_url: `${process.env.APP_BASE_URL}/${storeSlug}/success/${aeeOrder._id}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_BASE_URL}/${storeSlug}/checkout`,
    
    // إضافة إيميل العميل لو متاح عشان يظهر أوتوماتيك في صفحة سترايب
    customer_email: aeeOrder.customerEmail || undefined,
    
    // إضافة بيانات إضافية (Metadata) للبحث السريع في داشبورد سترايب
    metadata: {
      orderNumber: aeeOrder.orderNumber,
      storeName: merchant?.storeName || 'A.E.E Store'
    }
  });

  return { 
    paymentUrl: session.url, 
    // ✅ FIX: تم توحيد اسم المفتاح — stripeSessionId بدل gatewayOrderId
    stripeSessionId: session.id,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000) 
  };
};

// ── [PAYMOB LOGIC] ──────────────────────────────────────────────────────────

const _getPaymobToken = async () => {
  const { data } = await axios.post(`${PAYMOB_BASE_URL}/auth/tokens`, { 
    api_key: process.env.PAYMOB_API_KEY 
  });
  return data.token;
};

const _generatePaymobLink = async (aeeOrder) => {
  const token = await _getPaymobToken();
  
  // 1. إنشاء أوردر على نظام بايموب
  const { data: pmOrder } = await axios.post(`${PAYMOB_BASE_URL}/ecommerce/orders`, {
    auth_token: token,
    amount_cents: Math.round(aeeOrder.totalAmount * 100),
    currency: process.env.PAYMENT_CURRENCY || 'EGP',
    items: aeeOrder.items.map(i => ({ name: i.name, amount_cents: Math.round(i.unitPrice * 100), quantity: i.quantity }))
  });

  // 2. طلب مفتاح الدفع (Payment Key)
  const { data: pmKey } = await axios.post(`${PAYMOB_BASE_URL}/acceptance/payment_keys`, {
    auth_token: token,
    amount_cents: Math.round(aeeOrder.totalAmount * 100),
    order_id: pmOrder.id,
    integration_id: Number(process.env.PAYMOB_INTEGRATION_ID),
    billing_data: {
      first_name: (aeeOrder.customerName || 'Customer').split(' ')[0],
      last_name: (aeeOrder.customerName || 'Customer').split(' ')[1] || 'Store',
      email: aeeOrder.customerEmail || 'customer@aee.store',
      phone_number: aeeOrder.customerPhone,
      apartment: 'NA', floor: 'NA', street: 'NA', building: 'NA', shipping_method: 'NA', postal_code: 'NA', city: 'NA', country: 'EG', state: 'NA'
    }
  });

  return {
    paymentUrl: `${PAYMOB_IFRAME_BASE}/${process.env.PAYMOB_IFRAME_ID}?payment_token=${pmKey.token}`,
    // ✅ FIX: تم توحيد اسم المفتاح — paymobOrderId
    paymobOrderId: pmOrder.id,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000)
  };
};

// ── [MAIN ORCHESTRATOR] ──────────────────────────────────────────────────────

const generatePaymentLink = async (aeeOrder) => {
  // التبديل بين البوابات بناءً على إعدادات البيئة
  const gateway = process.env.ACTIVE_PAYMENT_GATEWAY || 'STRIPE'; 
  
  try {
    logger.info(`[PaymentService] Initiating ${gateway} for Order ${aeeOrder.orderNumber}`);

    if (gateway === 'STRIPE') {
      return await _generateStripeLink(aeeOrder);
    } 
    
    if (gateway === 'PAYMOB') {
      return await _generatePaymobLink(aeeOrder);
    }

    throw new AppError('Unsupported payment gateway configured.', 500);
  } catch (err) {
    logger.error(`[PaymentService] ${gateway} Creation Failed:`, { message: err.message });
    throw new AppError(`Payment setup failed via ${gateway}: ${err.message}`, 502);
  }
};

// ── [PAYMOB HMAC VERIFICATION] ──────────────────────────────────────────────
// ✅ FIX: إضافة دالة التحقق من HMAC الناقصة وتصديرها

/**
 * يتحقق من صحة HMAC الواصل من Paymob
 * @param {Object} data - بيانات الـ Callback
 * @param {string} receivedHmac - الـ HMAC المرسل من Paymob
 * @returns {boolean}
 */
const verifyPaymobHmac = (data, receivedHmac) => {
  const secret = process.env.PAYMOB_HMAC_SECRET;
  if (!secret) return false;

  // الـ Fields اللي Paymob بيستخدمها في حساب الـ HMAC بالترتيب
  const hmacFields = [
    'amount_cents', 'created_at', 'currency', 'error_occured',
    'has_parent_transaction', 'id', 'integration_id', 'is_3d_secure',
    'is_auth', 'is_capture', 'is_refunded', 'is_standalone_payment',
    'is_voided', 'order', 'owner', 'pending', 'source_data.pan',
    'source_data.sub_type', 'source_data.type', 'success'
  ];

  const concatenated = hmacFields
    .map((field) => {
      // Handle nested fields like 'source_data.pan'
      const keys = field.split('.');
      let value = data;
      for (const key of keys) {
        value = value?.[key];
      }
      return value ?? '';
    })
    .join('');

  const computedHmac = crypto
    .createHmac('sha512', secret)
    .update(concatenated)
    .digest('hex');

  return computedHmac === receivedHmac;
};

module.exports = { generatePaymentLink, verifyPaymobHmac };
