'use strict';

/**
 * OTP Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages generation, SMS delivery, and verification of 6-digit OTPs
 * for Cash-on-Delivery order confirmation.
 *
 * Storage strategy: In-memory Map with TTL (swap for Redis in production
 * via the Redis adapter at the bottom of this file).
 *
 * External SMS provider: Vonage (Nexmo) — replace with any provider
 * (Twilio, Infobip, etc.) by updating `sendSmsViaProvider()` only.
 */

const axios   = require('axios');
const crypto  = require('crypto');
const AppError = require('../utils/appError');
const logger  = require('../config/logger');

// ── Constants ────────────────────────────────────────────────────────────────
const OTP_LENGTH        = 6;
const OTP_TTL_MS        = 5 * 60 * 1000; // 5 minutes
const MAX_VERIFY_TRIES  = 5;              // lock after 5 wrong attempts
const OTP_COOLDOWN_MS   = 60 * 1000;     // 1 min between resend requests

/**
 * In-process OTP store.
 * Each entry:  { hash, expiresAt, attempts, phone, lastSentAt }
 *
 * For multi-instance deployments, replace with a Redis adapter:
 *   import { redisOtpStore } from './adapters/redisOtpStore';
 *   const store = redisOtpStore;
 */
const otpStore = new Map();

// ── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random N-digit OTP string.
 * @returns {string}
 */
const generateOtp = () => {
  // Use crypto.randomInt for unbiased uniform distribution
  const otp = crypto.randomInt(0, 10 ** OTP_LENGTH);
  return String(otp).padStart(OTP_LENGTH, '0');
};

/**
 * Hash the raw OTP before storing (so a memory dump can't leak OTPs).
 * @param {string} otp
 * @returns {string}  hex-encoded SHA-256 hash
 */
const hashOtp = (otp) =>
  crypto.createHmac('sha256', process.env.OTP_HMAC_SECRET || 'aee-otp-secret')
    .update(otp)
    .digest('hex');

/**
 * Send an SMS via Vonage Messages API.
 * Swap the body / URL for Twilio, Infobip, or your local gateway.
 *
 * @param {string} toPhone  - E.164 format, e.g. "+201001234567"
 * @param {string} otp
 */
const sendSmsViaProvider = async (toPhone, otp) => {
  const apiKey    = process.env.VONAGE_API_KEY;
  const apiSecret = process.env.VONAGE_API_SECRET;
  const from      = process.env.SMS_SENDER_ID || 'AEEStore';

  if (!apiKey || !apiSecret) {
    // ── Development / test mode: log OTP, skip real SMS ─────────────────
    if (process.env.NODE_ENV !== 'production') {
      logger.warn(`[OtpService] 🔑 DEV OTP for ${toPhone}: ${otp}`);
      return { messageId: 'DEV_MODE', status: 'delivered' };
    }
    throw new AppError('SMS provider credentials are not configured.', 500);
  }

  const response = await axios.post(
    'https://rest.nexmo.com/sms/json',
    {
      api_key:    apiKey,
      api_secret: apiSecret,
      to:         toPhone.replace(/^\+/, ''), // Vonage expects no leading '+'
      from,
      text: `Your A.E.E order verification code is: ${otp}. Valid for 5 minutes. Do not share it.`,
    },
    { timeout: 10_000 }
  );

  const msg = response.data?.messages?.[0];
  if (!msg || msg.status !== '0') {
    throw new AppError(
      `SMS delivery failed: ${msg?.['error-text'] || 'Unknown provider error'}`,
      502
    );
  }

  return { messageId: msg['message-id'], status: 'delivered' };
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a new OTP, store it (hashed), and fire the SMS.
 *
 * @param {string} phone  - Customer phone in E.164 or local format
 * @returns {Promise<{ expiresAt: Date }>}
 */
const sendOtp = async (phone) => {
  // ── Cooldown guard: prevent SMS flooding ────────────────────────────────
  const existing = otpStore.get(phone);
  if (existing) {
    const cooldownRemaining = existing.lastSentAt + OTP_COOLDOWN_MS - Date.now();
    if (cooldownRemaining > 0) {
      throw new AppError(
        `Please wait ${Math.ceil(cooldownRemaining / 1000)} seconds before requesting a new OTP.`,
        429
      );
    }
  }

  const otp       = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // Store hashed OTP
  otpStore.set(phone, {
    hash:       hashOtp(otp),
    expiresAt:  expiresAt.getTime(),
    attempts:   0,
    phone,
    lastSentAt: Date.now(),
  });

  // Schedule auto-cleanup
  setTimeout(() => {
    if (otpStore.has(phone) && otpStore.get(phone).expiresAt <= Date.now()) {
      otpStore.delete(phone);
    }
  }, OTP_TTL_MS + 5_000);

  try {
    const result = await sendSmsViaProvider(phone, otp);
    logger.info(`[OtpService] OTP sent to ${phone}. MsgId: ${result.messageId}`);
  } catch (err) {
    otpStore.delete(phone); // rollback store on send failure
    throw err;
  }

  return { expiresAt };
};

/**
 * Verify a submitted OTP against the stored hash.
 *
 * @param {string} phone
 * @param {string} submittedOtp  - Raw 6-digit code from the customer
 * @returns {Promise<true>}      - Resolves to true on success
 * @throws {AppError}            - On invalid / expired / locked OTP
 */
const verifyOtp = async (phone, submittedOtp) => {
  const entry = otpStore.get(phone);

  if (!entry) {
    throw new AppError(
      'No OTP was requested for this phone number, or it has already expired.',
      400
    );
  }

  // ── TTL check ─────────────────────────────────────────────────────────────
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    throw new AppError('The OTP has expired. Please request a new one.', 400);
  }

  // ── Attempt-limit check ───────────────────────────────────────────────────
  if (entry.attempts >= MAX_VERIFY_TRIES) {
    otpStore.delete(phone);
    throw new AppError(
      'Too many incorrect OTP attempts. Please request a new code.',
      429
    );
  }

  // ── Compare hashes (constant-time) ────────────────────────────────────────
  const expectedHash = hashOtp(String(submittedOtp));
  const isValid = crypto.timingSafeEqual(
    Buffer.from(entry.hash, 'hex'),
    Buffer.from(expectedHash, 'hex')
  );

  if (!isValid) {
    entry.attempts += 1;
    logger.warn(
      `[OtpService] Invalid OTP attempt ${entry.attempts}/${MAX_VERIFY_TRIES} for ${phone}`
    );
    throw new AppError(
      `Incorrect OTP. ${MAX_VERIFY_TRIES - entry.attempts} attempt(s) remaining.`,
      400
    );
  }

  // ── Success: consume OTP (one-time use) ───────────────────────────────────
  otpStore.delete(phone);
  logger.info(`[OtpService] OTP verified successfully for ${phone}`);
  return true;
};

/**
 * Check whether a valid (non-expired, non-exhausted) OTP exists for a phone.
 * Useful for pre-validation before attempting heavy order logic.
 *
 * @param {string} phone
 * @returns {boolean}
 */
const hasActiveOtp = (phone) => {
  const entry = otpStore.get(phone);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) { otpStore.delete(phone); return false; }
  return entry.attempts < MAX_VERIFY_TRIES;
};

module.exports = { sendOtp, verifyOtp, hasActiveOtp };
