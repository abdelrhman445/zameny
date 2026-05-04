'use strict';

const CustomerHistory = require('../models/CustomerHistory');
const { normalizePhone, getClientIp } = require('../utils/helpers');
const logger = require('../config/logger');

/**
 * ============================================================
 *  A.E.E Fraud Detection Engine
 * ============================================================
 *
 *  Formula:
 *    FraudScore = 100 - (RTO_Rate × 60) - IP_Penalty
 *
 *  Penalties:
 *    - RTO Rate > 30%  → heavy reduction from RTO × 60
 *    - New IP           → -10 points
 *    - Blacklisted      → score forced to 0
 *
 *  Risk Levels:
 *    - High   : score < 50
 *    - Medium : score < 80
 *    - Low    : score >= 80
 * ============================================================
 */
const fraudAnalyzer = async (req, res, next) => {
  try {
    const { customerPhone } = req.body;
    const clientIp = getClientIp(req);

    if (!customerPhone) {
      return res.status(400).json({
        status: 'fail',
        message: 'customerPhone is required for fraud analysis.',
      });
    }

    const normalizedPhone = normalizePhone(customerPhone);

    // ── Fetch or create customer history ────────────────────────────────
    let customerHistory = await CustomerHistory.findOrCreate(normalizedPhone);

    const reasons = [];
    let isNewCustomer = false;
    let ipMismatch = false;

    // ── New customer baseline ────────────────────────────────────────────
    if (customerHistory.totalOrders === 0) {
      isNewCustomer = true;
      reasons.push('New customer — no history on file.');
    }

    // ── Hard blacklist check ─────────────────────────────────────────────
    if (customerHistory.isBlacklisted) {
      const fraudAnalysis = {
        score: 0,
        riskLevel: 'High',
        reason: 'Customer is permanently blacklisted.',
        rtoRate: customerHistory.rtoRate,
        isNewCustomer,
        ipMismatch: false,
      };

      req.fraudAnalysis = fraudAnalysis;
      req.customerHistory = customerHistory;
      req.clientIp = clientIp;
      req.normalizedPhone = normalizedPhone;

      logger.warn(
        `[FraudAnalyzer] BLACKLISTED customer ${normalizedPhone} attempted order from IP ${clientIp}`
      );
      return next();
    }

    // ── Calculate RTO Rate ───────────────────────────────────────────────
    const rtoRate = customerHistory.totalOrders > 0
      ? customerHistory.rtoOrders / customerHistory.totalOrders
      : 0;

    let fraudScore = 100;

    // ── Apply RTO Penalty ─────────────────────────────────────────────────
    if (rtoRate > 0) {
      const rtoPenalty = rtoRate * 60;
      fraudScore -= rtoPenalty;
      reasons.push(
        `RTO Rate: ${(rtoRate * 100).toFixed(1)}% (penalty: -${rtoPenalty.toFixed(1)} pts)`
      );

      if (rtoRate > 0.3) {
        reasons.push('HIGH RTO RATE — exceeds 30% threshold.');
      }
    }

    // ── Apply IP Mismatch Penalty ─────────────────────────────────────────
    const knownIps = customerHistory.knownIps || [];

    if (knownIps.length > 0 && !knownIps.includes(clientIp)) {
      fraudScore -= 10;
      ipMismatch = true;
      reasons.push(`New/unknown IP detected: ${clientIp} (penalty: -10 pts)`);
    }

    // ── Clamp score to valid range [0, 100] ───────────────────────────────
    fraudScore = Math.max(0, Math.min(100, Math.round(fraudScore)));

    // ── Determine Risk Level ──────────────────────────────────────────────
    let riskLevel;
    if (fraudScore < 50) {
      riskLevel = 'High';
    } else if (fraudScore < 80) {
      riskLevel = 'Medium';
    } else {
      riskLevel = 'Low';
    }

    // ── Update knownIps (add current IP if not present) ───────────────────
    if (!knownIps.includes(clientIp)) {
      await CustomerHistory.findOneAndUpdate(
        { phoneNumber: normalizedPhone },
        { $addToSet: { knownIps: clientIp } }
      );
    }

    // ── Build fraudAnalysis object ────────────────────────────────────────
    const fraudAnalysis = {
      score: fraudScore,
      riskLevel,
      reason: reasons.length > 0 ? reasons.join(' | ') : 'No risk factors detected.',
      rtoRate: parseFloat(rtoRate.toFixed(4)),
      isNewCustomer,
      ipMismatch,
    };

    // ── Attach to request for downstream controller ────────────────────────
    req.fraudAnalysis = fraudAnalysis;
    req.customerHistory = customerHistory;
    req.clientIp = clientIp;
    req.normalizedPhone = normalizedPhone;

    logger.info(
      `[FraudAnalyzer] Phone: ${normalizedPhone} | Score: ${fraudScore} | Risk: ${riskLevel} | IP: ${clientIp}`
    );

    next();
  } catch (error) {
    logger.error('[FraudAnalyzer] Error during fraud analysis:', { error: error.message });
    next(error);
  }
};

module.exports = fraudAnalyzer;
