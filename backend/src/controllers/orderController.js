'use strict';

/**
 * Order Controller  —  A.E.E v2
 * New in v2: Automated Fulfillment, COD/OTP flow, Online payment (Paymob), Bosta shipping automation, Firebase Zero-Trust.
 */

const mongoose         = require('mongoose');
const Order            = require('../models/Order');
const Product          = require('../models/Product');
const Merchant         = require('../models/Merchant');
const CustomerHistory  = require('../models/CustomerHistory');
const AppError         = require('../utils/appError');
const { catchAsync, paginate, normalizePhone } = require('../utils/helpers');
const { sendOrderNotification } = require('../services/telegramService');
const inventoryService = require('../services/inventoryService');
const otpService       = require('../services/otpService');
const paymentService   = require('../services/paymentService');
const shippingService  = require('../services/shippingService');
const logger           = require('../config/logger');

// 👉 إضافة مكتبة فايربيز
const admin = require('../config/firebase'); 

const ALLOWED_TRANSITIONS = {
  Pending:   ['Confirmed', 'Flagged', 'Cancelled'],
  Flagged:   ['Confirmed', 'Cancelled'],
  Confirmed: ['Shipped', 'Cancelled'],
  Shipped:   ['Delivered', 'RTO'],
  Delivered: [],
  RTO:       [],
  Cancelled: [],
};

// 🚀 INTERNAL: دالة التأكيد الشاملة (تستخدم يدوي أو أوتوماتيك عبر الـ Webhook)
// ─────────────────────────────────────────────────────────────────────────────
const confirmOrderInternal = async (orderId, session = null) => {
  const order = await Order.findById(orderId).session(session);
  if (!order) throw new AppError('Order not found.', 404);
  if (order.status === 'Confirmed') return order;

  // تحديث الحالة الأساسية
  order.status = 'Confirmed';
  if (order.paymentMethod === 'Online') {
    order.paymentStatus = 'Paid';
    order.paidAt = new Date();
  }

  // 1. خصم المخزون
  await inventoryService.decrementStock(order.items, order.merchantId, session);

  // 2. حفظ التغييرات
  await order.save({ session });

  // 3. طلب بوليصة الشحن (AWB) أوتوماتيك
  _triggerShipping(order).catch((err) =>
    logger.error(`[Autopilot] Shipping trigger failed for ${order.orderNumber}:`, { message: err.message })
  );

  logger.info(`[Autopilot] Order ${order.orderNumber} confirmed and stock deducted.`);
  return order;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/orders   — Create order + trigger OTP or payment link
// ─────────────────────────────────────────────────────────────────────────────
const createOrder = catchAsync(async (req, res, next) => {
  const {
    customerPhone, customerName, customerAddress, customerCity,
    customerEmail, items, notes, paymentMethod = 'COD',
  } = req.body;

  const { fraudAnalysis, clientIp, normalizedPhone } = req;

  if (!items || !Array.isArray(items) || items.length === 0)
    return next(new AppError('Order must contain at least one item.', 400));

  if (!['COD', 'Online'].includes(paymentMethod))
    return next(new AppError('paymentMethod must be COD or Online.', 400));

  // ==========================================
  // 🛡️ إضافة فايربيز (Zero-Trust Validation)
  // ==========================================
  let isFirebaseVerified = false;
  if (paymentMethod === 'COD') {
    const idToken = req.headers['x-firebase-idtoken'];
    
    // لو الفرونت إند باعت توكن فايربيز، هنتأكد منه
    if (idToken) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const verifiedPhoneNumber = decodedToken.phone_number; 
        const expectedPhone = customerPhone.startsWith('+2') ? customerPhone : `+2${customerPhone}`;

        if (verifiedPhoneNumber !== expectedPhone) {
          return res.status(403).json({ 
            status: 'fail',
            message: "عملية احتيال محتملة: رقم الهاتف المؤكد لا يتطابق مع رقم الشحن!" 
          });
        }
        isFirebaseVerified = true; // تم التأكيد بنجاح
      } catch (error) {
        console.error("Firebase Token Verification Error:", error.message);
        return res.status(401).json({ 
          status: 'fail',
          message: "رمز التأكيد غير صالح أو انتهت صلاحيته، يرجى المحاولة مرة أخرى." 
        });
      }
    } else {
      // إجبار الفرونت إند يبعت التوكن
      return res.status(401).json({ 
        status: 'fail',
        message: "رمز التأكيد مفقود! يرجى تأكيد رقم الهاتف عبر رسالة SMS أولاً." 
      });
    }
  }
  // ==========================================

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const resolvedItems = [];
    let calculatedSubtotal = 0;

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1)
        throw new AppError('Each item must have a valid productId and quantity >= 1.', 400);

      const product = await Product.findOne({
        _id: item.productId, merchantId: req.merchant._id, isActive: true,
      }).session(session);

      if (!product)
        throw new AppError(`Product "${item.productId}" not found or does not belong to your store.`, 404);

      const itemSubtotal = product.price * item.quantity;
      calculatedSubtotal += itemSubtotal;
      
      resolvedItems.push({ 
        productId: product._id, 
        name: product.name, 
        quantity: item.quantity, 
        unitPrice: product.price, 
        subtotal: itemSubtotal 
      });
    }

    const shippingFee = 0;
    const totalAmount = calculatedSubtotal + shippingFee;

    const initialStatus   = fraudAnalysis.riskLevel === 'High' ? 'Flagged' : 'Pending';
    
    // لو متأكد بفايربيز بيتعمل Paid فوراً، لو لأ بيمشي على النظام القديم Awaiting_OTP
    const initialPayStatus = paymentMethod === 'COD' ? (isFirebaseVerified ? 'Paid' : 'Awaiting_OTP') : 'Pending';

    const [order] = await Order.create([{
      merchantId: req.merchant._id, 
      customerPhone: normalizedPhone,
      customerName, 
      customerAddress, 
      customerCity, 
      customerEmail,
      customerIp: clientIp, 
      items: resolvedItems, 
      subtotal: calculatedSubtotal,
      shippingFee: shippingFee,
      totalAmount: totalAmount,
      status: initialStatus, 
      fraudAnalysis, 
      notes, 
      paymentMethod,
      paymentStatus: initialPayStatus,
    }], { session });

    await CustomerHistory.findOneAndUpdate(
      { phoneNumber: normalizedPhone },
      { $inc: { totalOrders: 1 }, $set: { lastOrderDate: new Date() } },
      { session, upsert: true }
    );

    await session.commitTransaction();
    session.endSession();

    logger.info(`[OrderController] Order ${order.orderNumber} created. Method: ${paymentMethod}. Risk: ${fraudAnalysis.riskLevel}`);

    // Telegram notification (non-fatal)
    const merchant = await Merchant.findById(req.merchant._id);
    if (merchant?.telegramChatId) {
      const messageId = await sendOrderNotification(merchant.telegramChatId, order).catch(() => null);
      if (messageId) Order.findByIdAndUpdate(order._id, { telegramMessageId: messageId }).exec();
    }

    // COD → send OTP
    if (paymentMethod === 'COD') {
      
      // رد فايربيز الناجح (بيتخطى الكود القديم لو الرقم متأكد)
      if (isFirebaseVerified) {
        return res.status(201).json({
          status: 'success',
          message: "Order created successfully. Phone number verified via Firebase.",
          data: { order },
        });
      }

      // الكود القديم شغال زي ما هو كـ Fallback
      let otpMeta = {};
      try {
        const { expiresAt } = await otpService.sendOtp(normalizedPhone);
        otpMeta = { otpExpiresAt: expiresAt };
      } catch (e) {
        logger.error('[OrderController] OTP send failed:', { message: e.message });
      }

      return res.status(201).json({
        status: 'success',
        message: "Order created. An OTP has been sent to the customer's phone for verification.",
        data: { order, nextStep: `POST /api/v1/orders/${order._id}/verify-otp`, ...otpMeta },
      });
    }

    // Online → generate payment link
    let paymentData = {};
    try {
      const gateway = process.env.ACTIVE_PAYMENT_GATEWAY || 'STRIPE';
      const paymentResult = await paymentService.generatePaymentLink({ ...order.toObject(), customerEmail });
      
      // ✅ FIX: حفظ بيانات بوابة الدفع في المسارات الصحيحة بالـ Schema
      const updateFields = {
        paymentLink: paymentResult.paymentUrl, // ✅ محفوظ في paymentDetails
        'paymentDetails.gateway': gateway,
      };

      if (gateway === 'STRIPE' && paymentResult.stripeSessionId) {
        updateFields['paymentDetails.stripeSessionId'] = paymentResult.stripeSessionId;
      } else if (gateway === 'PAYMOB' && paymentResult.paymobOrderId) {
        updateFields['paymentDetails.paymobOrderId'] = paymentResult.paymobOrderId;
      }

      Order.findByIdAndUpdate(order._id, updateFields).exec();

      paymentData = { 
        paymentUrl: paymentResult.paymentUrl, 
        paymentLinkExpiresAt: paymentResult.expiresAt 
      };
    } catch (e) {
      logger.error('[OrderController] Payment link failed:', { message: e.message });
    }

    return res.status(201).json({
      status: 'success',
      message: 'Order created. Redirect the customer to the payment URL.',
      data: { order, ...paymentData },
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error('[OrderController] Transaction aborted:', { error: error.message });
    return next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/orders/:id/verify-otp   — COD OTP verification
// ─────────────────────────────────────────────────────────────────────────────
const verifyCodOtp = catchAsync(async (req, res, next) => {
  const { otp } = req.body;
  if (!otp) return next(new AppError('OTP code is required.', 400));

  const order = await Order.findOne({ _id: req.params.id, merchantId: req.merchant._id });
  if (!order) return next(new AppError('Order not found.', 404));
  if (order.paymentMethod !== 'COD') return next(new AppError('OTP verification is only for COD orders.', 400));
  if (order.paymentStatus === 'Paid') return next(new AppError('Order has already been verified.', 400));

  await otpService.verifyOtp(order.customerPhone, String(otp));

  order.paymentStatus = 'Paid';
  await order.save();

  logger.info(`[OrderController] OTP verified for order ${order.orderNumber}`);

  res.status(200).json({ status: 'success', message: 'OTP verified. Order confirmed by customer.', data: { order } });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/orders/:id/resend-otp
// ─────────────────────────────────────────────────────────────────────────────
const resendOtp = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.id, merchantId: req.merchant._id });
  if (!order) return next(new AppError('Order not found.', 404));
  if (order.paymentMethod !== 'COD') return next(new AppError('OTP is only for COD orders.', 400));
  if (order.paymentStatus === 'Paid') return next(new AppError('Order is already verified.', 400));

  const { expiresAt } = await otpService.sendOtp(order.customerPhone);
  res.status(200).json({ status: 'success', message: 'A new OTP has been sent.', data: { otpExpiresAt: expiresAt } });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/orders
// ─────────────────────────────────────────────────────────────────────────────
const getOrders = catchAsync(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip  = (page - 1) * limit;

  const filter = { merchantId: req.merchant._id };
  if (req.query.status)     filter.status                    = req.query.status;
  if (req.query.phone)      filter.customerPhone             = normalizePhone(req.query.phone);
  if (req.query.riskLevel) filter['fraudAnalysis.riskLevel'] = req.query.riskLevel;
  if (req.query.payment)   filter.paymentMethod             = req.query.payment;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({ status: 'success', ...paginate(orders, total, page, limit) });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/orders/:id
// ─────────────────────────────────────────────────────────────────────────────
const getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.id, merchantId: req.merchant._id });
  if (!order) return next(new AppError('Order not found.', 404));
  res.status(200).json({ status: 'success', data: { order } });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/orders/:id/public  — للعميل (بدون auth) لمتابعة حالة طلبه
// ─────────────────────────────────────────────────────────────────────────────
const getOrderPublic = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id).select(
    'orderNumber status paymentStatus paymentMethod totalAmount items customerName customerCity trackingNumber trackingUrl estimatedDelivery createdAt'
  );
  if (!order) return next(new AppError('Order not found.', 404));
  res.status(200).json({ status: 'success', data: { order } });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/orders/:id/status
// ─────────────────────────────────────────────────────────────────────────────
const updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status, notes } = req.body;
  if (!status) return next(new AppError('New status is required.', 400));

  const order = await Order.findOne({ _id: req.params.id, merchantId: req.merchant._id });
  if (!order) return next(new AppError('Order not found.', 404));

  const allowed = ALLOWED_TRANSITIONS[order.status] || [];
  if (!allowed.includes(status)) {
    return next(new AppError(
      `Cannot transition order from "${order.status}" to "${status}". Allowed: [${allowed.join(', ') || 'none'}].`, 422
    ));
  }

  // استخدام الدالة الداخلية عند اختيار حالة Confirmed لتطبيق الأتمتة (مخزون + شحن)
  if (status === 'Confirmed') {
    const updatedOrder = await confirmOrderInternal(order._id);
    return res.status(200).json({
      status: 'success',
      message: 'Order confirmed. Shipping label is being generated.',
      data: { order: updatedOrder },
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const previousStatus = order.status;
    order.status = status;
    if (notes) order.notes = notes;

    if (status === 'Shipped') order.shippedAt = new Date();
    if (status === 'RTO')     await inventoryService.handleRtoEvent(order, session);

    if (status === 'Cancelled' && previousStatus === 'Confirmed') {
      await inventoryService.handleCancellationEvent(order, session);
      if (order.trackingNumber) {
        shippingService.cancelShippingOrder(order.trackingNumber).catch((e) =>
          logger.warn(`[OrderController] Shipping cancel failed ${order.trackingNumber}:`, { message: e.message })
        );
      }
    }

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    logger.info(`[OrderController] ${order.orderNumber}: ${previousStatus} → ${status}`);
    res.status(200).json({ status: 'success', message: `Order status updated to "${status}".`, data: { order } });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
});

// Private: trigger Bosta AWB and persist tracking info
async function _triggerShipping(order) {
  const shipment = await shippingService.createShippingOrder(order);
  await Order.findByIdAndUpdate(order._id, {
    trackingNumber: shipment.trackingNumber,
    trackingUrl:     shipment.awbUrl,
    shippingCarrier: shipment.carrierId,
    estimatedDelivery: shipment.estimatedDelivery,
  });
  logger.info(`[OrderController] AWB ${shipment.trackingNumber} stored for ${order.orderNumber}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/orders/customer/:phone
// ─────────────────────────────────────────────────────────────────────────────
const getCustomerProfile = catchAsync(async (req, res, next) => {
  const normalizedPhone = normalizePhone(req.params.phone);

  const [customerHistory, recentOrders] = await Promise.all([
    CustomerHistory.findOne({ phoneNumber: normalizedPhone }),
    Order.find({ merchantId: req.merchant._id, customerPhone: normalizedPhone })
      .sort({ createdAt: -1 }).limit(10)
      .select('orderNumber status totalAmount fraudAnalysis paymentMethod trackingNumber createdAt'),
  ]);

  if (!customerHistory && recentOrders.length === 0)
    return next(new AppError('No history found for this customer phone number.', 404));

  res.status(200).json({ status: 'success', data: { customerHistory, recentOrders } });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/orders/stats/summary
// ─────────────────────────────────────────────────────────────────────────────
const getOrderStats = catchAsync(async (req, res) => {
  const merchantId = req.merchant._id;

  const [stats, fraudStats, paymentStats] = await Promise.all([
    Order.aggregate([{ $match: { merchantId } }, { $group: { _id: '$status', count: { $sum: 1 }, totalRevenue: { $sum: '$totalAmount' } } }]),
    Order.aggregate([{ $match: { merchantId } }, { $group: { _id: '$fraudAnalysis.riskLevel', count: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { merchantId } }, { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }]),
  ]);

  res.status(200).json({ status: 'success', data: { orderStats: stats, fraudStats, paymentStats } });
});

module.exports = {
  createOrder, verifyCodOtp, resendOtp,
  getOrders, getOrder, getOrderPublic, updateOrderStatus,
  confirmOrderInternal, 
  getCustomerProfile, getOrderStats,
};
