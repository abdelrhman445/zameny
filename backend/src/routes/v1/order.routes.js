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

// ✅ FIX: مسار عام للعميل لمتابعة طلبه بدون auth — لازم يكون قبل router.use(protect)
router.get('/:id/public', getOrderPublic);

// All order routes below are protected (require merchant JWT)
router.use(protect);

// Stats & analytics
router.get('/stats/summary', getOrderStats);

// Customer profile
router.get('/customer/:phone', getCustomerProfile);

// Core CRUD
router.route('/')
  .get(getOrders)
  .post(createOrderValidation, fraudAnalyzer, createOrder);

router.get('/:id', getOrder);
router.patch('/:id/status', updateStatusValidation, updateOrderStatus);

// OTP endpoints (COD payment verification)
router.post('/:id/verify-otp', verifyCodOtp);
router.post('/:id/resend-otp', resendOtp);

module.exports = router;
