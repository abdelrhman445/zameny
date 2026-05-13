'use strict';

const router = require('express').Router();

const {
  register,
  login,
  getMe,
  updateTelegramChatId,
  changePassword,
  forgotPassword,
  verifyOtp,      
  resetPassword,  
} = require('../../controllers/authController');

const { protect } = require('../../middlewares/auth');

const { 
  registerValidation, 
  loginValidation,
  forgotPasswordValidation,
  verifyOtpValidation,   // ✅ FIX: استيراد الفاليشن الجديد المنفصل
  resetPasswordValidation   
} = require('../../validations/auth.validation');

// ── Public Routes (مسارات لا تحتاج تسجيل دخول) ──
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);

// ✅ FIX: استخدام verifyOtpValidation المنفصل بدل forgotPasswordValidation
router.post('/verify-otp', verifyOtpValidation, verifyOtp); 
router.post('/reset-password', resetPasswordValidation, resetPassword);

// ── Protected Routes (مسارات محمية تحتاج توكن) ──
router.use(protect);
router.get('/me', getMe);
router.patch('/update-telegram', updateTelegramChatId);
router.patch('/change-password', changePassword);

module.exports = router;