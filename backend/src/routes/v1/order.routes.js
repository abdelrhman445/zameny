'use strict';

const router = require('express').Router();
const {
  createOrder,
  verifyCodOtp,
  resendOtp,
  getOrders,
  getOrder,
  getOrderPublic,
  updateOrderStatus,
  getCustomerProfile,
  getOrderStats,
} = require('../../controllers/orderController');
const { protect }    = require('../../middlewares/auth');
const fraudAnalyzer  = require('../../middlewares/fraudAnalyzer');
const {
  createOrderValidation,
  updateStatusValidation,
} = require('../../validations/order.validation');

// ─────────────────────────────────────────────────────────────────
// 🌐 1. مسارات عامة (Public Routes) - الزبون يقدر يتعامل معاها بدون Token
// ─────────────────────────────────────────────────────────────────

// إنشاء أوردر جديد (الزبون مش محتاج يسجل دخول)
router.post('/', createOrderValidation, fraudAnalyzer, createOrder);

// مسار عام للعميل لمتابعة طلبه
router.get('/:id/public', getOrderPublic);

// تأكيد الـ OTP وإعادة الإرسال (العميل بيستخدمهم لتأكيد الدفع عند الاستلام)
router.post('/:id/verify-otp', verifyCodOtp);
router.post('/:id/resend-otp', resendOtp);

// ─────────────────────────────────────────────────────────────────
// 🔒 2. ميدل وير الحماية - أي مسار بعد السطر ده للتاجر فقط (لازم توكن)
// ─────────────────────────────────────────────────────────────────
router.use(protect);

// 🛠️ 3. مسارات خاصة بالتاجر (لوحة التحكم)

// عرض كل الطلبات للتاجر
router.get('/', getOrders);

// عرض تفاصيل طلب معين للتاجر
router.get('/:id', getOrder);

// تحديث حالة الطلب
router.patch('/:id/status', updateStatusValidation, updateOrderStatus);

// إحصائيات الطلبات (Stats & analytics)
router.get('/stats/summary', getOrderStats);

// بروفايل العميل (Customer profile)
router.get('/customer/:phone', getCustomerProfile);

module.exports = router;
