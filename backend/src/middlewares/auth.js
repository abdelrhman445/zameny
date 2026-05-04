'use strict';

const jwt = require('jsonwebtoken');
const Merchant = require('../models/Merchant');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/helpers');

/**
 * Protect routes — verify JWT and attach merchant to req.
 */
const protect = catchAsync(async (req, res, next) => {
  // 1. Extract token from Authorization header or cookie
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Authentication required. Please log in.', 401));
  }

  // 2. Verify token signature
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid authentication token.', 401));
  }

  // 3. Check if merchant still exists
  const merchant = await Merchant.findById(decoded.id).select('+passwordChangedAt');
  if (!merchant) {
    return next(new AppError('The account associated with this token no longer exists.', 401));
  }

  // 4. Check if account is active
  if (!merchant.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact support.', 403));
  }

  // 5. Check if password was changed after token was issued
  if (merchant.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Password was recently changed. Please log in again.', 401));
  }

  // 6. Attach merchant to request for downstream use
  req.merchant = merchant;
  next();
});

/**
 * Generate a signed JWT for a merchant.
 * @param {string} merchantId
 * @returns {string}
 */
const signToken = (merchantId) => {
  return jwt.sign({ id: merchantId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Send JWT response helper.
 * @param {Object} merchant
 * @param {number} statusCode
 * @param {import('express').Response} res
 */
const sendTokenResponse = (merchant, statusCode, res) => {
  const token = signToken(merchant._id);

  // Strip sensitive fields
  const merchantData = merchant.toObject();
  delete merchantData.password;
  delete merchantData.passwordChangedAt;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { merchant: merchantData },
  });
};

module.exports = { protect, signToken, sendTokenResponse };
