'use strict';

const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number.'),
  body('storeName').trim().notEmpty().withMessage('Store name is required.'),
  body('telegramChatId').optional().trim(),
  handleValidationErrors,
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
  handleValidationErrors,
];

// ✅ الفاليشن الخاص بطلب كود استعادة كلمة المرور
const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  handleValidationErrors,
];

// ✅ الفاليشن الخاص بتعيين كلمة المرور الجديدة
const resetPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits.'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain uppercase, lowercase, and a number.'),
  handleValidationErrors,
];

module.exports = { 
  registerValidation, 
  loginValidation, 
  forgotPasswordValidation,
  resetPasswordValidation,
  handleValidationErrors 
};