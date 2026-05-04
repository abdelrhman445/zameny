'use strict';

/**
 * Billing Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * مسؤول عن استقبال طلبات التجار لإدارة اشتراكاتهم في منصة A.E.E.
 */

const billingService = require('../services/billingService');
const AppError       = require('../utils/appError');
const { catchAsync } = require('../utils/helpers');

/**
 * POST /api/v1/billing/subscribe
 * ترقية التاجر لخطة Pro أو Enterprise
 */
const subscribe = catchAsync(async (req, res, next) => {
  const { plan, paymentMethodId } = req.body;

  if (!plan || !['Pro', 'Enterprise'].includes(plan)) {
    return next(new AppError('يرجى اختيار خطة صحيحة (Pro أو Enterprise).', 400));
  }

  // في Stripe Subscription، بنحتاج نربط الـ Payment Method بالعميل أولاً
  const result = await billingService.createSubscription(
    req.merchant, // نمرر كائن التاجر بالكامل
    plan,
    paymentMethodId
  );

  res.status(200).json({
    status:  'success',
    message: `تم الاشتراك بنجاح في خطة ${plan}.`,
    data:    result,
  });
});

/**
 * DELETE /api/v1/billing/subscribe
 * إلغاء الاشتراك (مع إتاحة فترة سماح لنهاية الشهر أو إلغاء فوري)
 */
const cancelSubscription = catchAsync(async (req, res) => {
  const immediately = req.query.immediately === 'true';
  
  await billingService.cancelSubscription(req.merchant._id, immediately);

  res.status(200).json({
    status:  'success',
    message: immediately
      ? 'تم إلغاء الاشتراك فوراً والعودة للخطة المجانية.'
      : 'سيتم إلغاء الاشتراك بنهاية فترة الفوترة الحالية.',
  });
});

/**
 * GET /api/v1/billing/me
 * جلب بيانات الفوترة الحالية للتاجر
 */
const getBillingInfo = catchAsync(async (req, res) => {
  // البيانات دي بتيجي من الـ Protect middleware اللي بيجيب التاجر من الداتابيز
  const { plan, subscriptionStatus, isPaidPlan, productLimit, nextBillingDate } = req.merchant;

  res.status(200).json({
    status: 'success',
    data:   { plan, subscriptionStatus, isPaidPlan, productLimit, nextBillingDate },
  });
});

module.exports = { subscribe, cancelSubscription, getBillingInfo };