'use strict';

const crypto = require('crypto');
const { Resend } = require('resend');
const Merchant = require('../models/Merchant');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/helpers');
const { signToken, sendTokenResponse } = require('../middlewares/auth');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/v1/auth/register
 */
const register = catchAsync(async (req, res, next) => {
  const { name, email, password, storeName, telegramChatId } = req.body;

  const existingMerchant = await Merchant.findOne({ email: email.toLowerCase() });
  if (existingMerchant) {
    return next(new AppError('An account with this email already exists.', 409));
  }

  const merchant = await Merchant.create({
    name,
    email,
    password,
    storeName,
    telegramChatId: telegramChatId || null,
  });

  sendTokenResponse(merchant, 201, res);
});

/**
 * POST /api/v1/auth/login
 */
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required.', 400));
  }

  const merchant = await Merchant.findOne({ email: email.toLowerCase() }).select('+password');

  if (!merchant || !(await merchant.comparePassword(password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  if (!merchant.isActive) {
    return next(new AppError('Your account has been deactivated.', 403));
  }

  sendTokenResponse(merchant, 200, res);
});

/**
 * GET /api/v1/auth/me
 */
const getMe = catchAsync(async (req, res, next) => {
  const merchant = await Merchant.findById(req.merchant._id);

  res.status(200).json({
    status: 'success',
    data: { merchant },
  });
});

/**
 * PATCH /api/v1/auth/update-telegram
 */
const updateTelegramChatId = catchAsync(async (req, res, next) => {
  const { telegramChatId } = req.body;

  if (!telegramChatId) {
    return next(new AppError('telegramChatId is required.', 400));
  }

  const merchant = await Merchant.findByIdAndUpdate(
    req.merchant._id,
    { telegramChatId },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'Telegram Chat ID updated successfully.',
    data: { merchant },
  });
});

/**
 * PATCH /api/v1/auth/change-password
 */
const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('currentPassword and newPassword are required.', 400));
  }

  const merchant = await Merchant.findById(req.merchant._id).select('+password');

  if (!(await merchant.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect.', 401));
  }

  merchant.password = newPassword;
  await merchant.save();

  sendTokenResponse(merchant, 200, res);
});

/**
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('البريد الإلكتروني مطلوب.', 400));
  }

  const merchant = await Merchant.findOne({ email: email.toLowerCase() });
  if (!merchant) {
    return next(new AppError('لا يوجد حساب مسجل بهذا البريد الإلكتروني', 404));
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  merchant.passwordResetOtp = crypto.createHash('sha256').update(otp).digest('hex');
  merchant.passwordResetExpires = Date.now() + 10 * 60 * 1000; 
  
  await merchant.save({ validateBeforeSave: false });

  try {
    await resend.emails.send({
      from: 'Zameny Security <support@zameny.tech>',
      to: merchant.email,
      subject: 'كود إعادة تعيين كلمة المرور - Zameny',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
          <h2>مرحباً ${merchant.name}،</h2>
          <p>لقد طلبت إعادة تعيين كلمة المرور الخاصة بحسابك في منصة Zameny.</p>
          <p>كود التحقق الخاص بك هو:</p>
          <h1 style="letter-spacing: 5px; color: #e11d48; background: #f1f5f9; padding: 10px; display: inline-block; border-radius: 8px;">${otp}</h1>
          <p>هذا الكود صالح لمدة 10 دقائق فقط.</p>
          <p>إذا لم تطلب هذا الكود، يرجى تجاهل هذه الرسالة.</p>
        </div>
      `,
    });

    res.status(200).json({
      status: 'success',
      message: 'تم إرسال كود التحقق إلى بريدك الإلكتروني',
    });
  } catch (error) {
    return next(new AppError('حدث خطأ في إرسال البريد الإلكتروني، يرجى المحاولة لاحقاً', 500));
  } // ✅ تم إضافة القوس الناقص هنا
});

/**
 * POST /api/v1/auth/verify-otp
 */
const verifyOtp = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new AppError('البريد الإلكتروني وكود التحقق مطلوبان.', 400));
  }

  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  const merchant = await Merchant.findOne({
    email: email.toLowerCase(),
    passwordResetOtp: hashedOtp,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!merchant) {
    return next(new AppError('كود التحقق غير صحيح أو منتهي الصلاحية', 400));
  }

  res.status(200).json({
    status: 'success',
    message: 'كود التحقق صحيح، يمكنك الآن تغيير كلمة المرور.',
  });
});

/**
 * POST /api/v1/auth/reset-password
 */
const resetPassword = catchAsync(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return next(new AppError('البيانات غير مكتملة. يرجى توفير البريد والكود وكلمة المرور الجديدة.', 400));
  }

  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  const merchant = await Merchant.findOne({
    email: email.toLowerCase(),
    passwordResetOtp: hashedOtp,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!merchant) {
    return next(new AppError('كود التحقق غير صحيح أو منتهي الصلاحية', 400));
  }

  merchant.password = newPassword;
  merchant.passwordResetOtp = undefined;
  merchant.passwordResetExpires = undefined;
  
  await merchant.save();

  res.status(200).json({
    status: 'success',
    message: 'تم تغيير كلمة المرور بنجاح',
  });
});

module.exports = { 
  register, 
  login, 
  getMe, 
  updateTelegramChatId, 
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword 
};