'use strict';

const Merchant = require('../models/Merchant');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/helpers');
const { signToken, sendTokenResponse } = require('../middlewares/auth');

/**
 * POST /api/v1/auth/register
 * Register a new merchant account.
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
 * Authenticate a merchant and return JWT.
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
 * Get current authenticated merchant profile.
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
 * Update the merchant's Telegram Chat ID.
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
 * Change current merchant's password.
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

module.exports = { register, login, getMe, updateTelegramChatId, changePassword };
