const express = require('express');
const router = express.Router();

// استدعاء الدوال من الكنترولر (بناءً على مسار ملفاتك في الصورة)
const { sendOtpEmail, verifyOtpEmail } = require('../../controllers/otpController');

router.post('/send-email', sendOtpEmail);
router.post('/verify-email', verifyOtpEmail);

module.exports = router;