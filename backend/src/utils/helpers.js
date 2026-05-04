'use strict';

/**
 * Normalize a phone number to digits only (for consistent DB lookups).
 * @param {string} phone
 * @returns {string}
 */
const normalizePhone = (phone) => {
  return String(phone).replace(/\D/g, '');
};

/**
 * Wrap an async route handler to automatically forward errors to next().
 * @param {Function} fn - Async route handler
 * @returns {Function}
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Extract real client IP from request (respects trust proxy).
 * @param {import('express').Request} req
 * @returns {string}
 */
const getClientIp = (req) => {
  return (
    req.ip ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    'unknown'
  );
};

/**
 * Build a paginated query response object.
 * @param {Object[]} data
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 * @returns {Object}
 */
const paginate = (data, total, page, limit) => ({
  data,
  pagination: {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  },
});

/**
 * Sanitize an object by removing undefined/null keys.
 * @param {Object} obj
 * @returns {Object}
 */
const sanitizeObject = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)
  );

/**
 * Generate a random alphanumeric string.
 * @param {number} length
 * @returns {string}
 */
const generateToken = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
};

module.exports = {
  normalizePhone,
  catchAsync,
  getClientIp,
  paginate,
  sanitizeObject,
  generateToken,
};
