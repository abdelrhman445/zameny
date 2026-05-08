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
  resetPasswordValidation   
} = require('../../validations/auth.validation');

// ── Public Routes (مسارات لا تحتاج تسجيل دخول) ──
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);

// ✅ 2. تم نقل مسار التحقق هنا (يجب أن يكون قبل الـ protect)
router.post('/verify-otp', forgotPasswordValidation, verifyOtp); 
router.post('/reset-password', resetPasswordValidation, resetPassword);

// ── Protected Routes (مسارات محمية تحتاج توكن) ──
router.use(protect);
router.get('/me', getMe);
router.patch('/update-telegram', updateTelegramChatId);
router.patch('/change-password', changePassword);

module.exports = router;