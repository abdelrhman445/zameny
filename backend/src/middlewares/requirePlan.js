'use strict';

/**
 * requirePlan  —  SaaS Feature Gating Middleware
 * ─────────────────────────────────────────────────────────────────────────────
 * Usage:
 *
 *   // Only Pro and Enterprise merchants may access this endpoint
 *   router.post('/bulk-import', protect, requirePlan(['Pro', 'Enterprise']), handler);
 *
 *   // Any paid plan
 *   router.get('/analytics', protect, requirePlan(['Pro', 'Enterprise']), handler);
 *
 * Plan hierarchy (low → high):  Free  <  Pro  <  Enterprise
 *
 * Checks:
 *   1. Merchant's current plan is in the `allowedPlans` array.
 *   2. Merchant's subscriptionStatus is 'Active' (not Past_Due / Canceled).
 *      Past_Due gets a grace-period override (configurable via env).
 */

const AppError = require('../utils/appError');

// ── Plan definitions ─────────────────────────────────────────────────────────
const PLAN_HIERARCHY = {
  Free:       0,
  Pro:        1,
  Enterprise: 2,
};

/**
 * Whether Past_Due merchants still get access during a grace period.
 * Set BILLING_PAST_DUE_GRACE_ACCESS=false in prod to enforce strict gating.
 */
const PAST_DUE_GRACE_ACCESS =
  process.env.BILLING_PAST_DUE_GRACE_ACCESS !== 'false';

// ── Middleware factory ────────────────────────────────────────────────────────

/**
 * @param {string[]} allowedPlans  - e.g. ['Pro', 'Enterprise']
 * @returns {import('express').RequestHandler}
 */
const requirePlan = (allowedPlans) => {
  // Validate configuration at boot time (fail fast)
  if (!Array.isArray(allowedPlans) || allowedPlans.length === 0) {
    throw new Error('[requirePlan] allowedPlans must be a non-empty array.');
  }

  const invalidPlans = allowedPlans.filter((p) => !(p in PLAN_HIERARCHY));
  if (invalidPlans.length) {
    throw new Error(
      `[requirePlan] Unknown plan(s): ${invalidPlans.join(', ')}. ` +
      `Valid plans: ${Object.keys(PLAN_HIERARCHY).join(', ')}`
    );
  }

  return (req, res, next) => {
    // ── Guard: protect middleware must run first ───────────────────────────
    if (!req.merchant) {
      return next(
        new AppError('Authentication required. Please log in first.', 401)
      );
    }

    const { plan = 'Free', subscriptionStatus = 'Active' } = req.merchant;

    // ── Subscription status check ─────────────────────────────────────────
    if (subscriptionStatus === 'Canceled') {
      return next(
        new AppError(
          'Your subscription has been cancelled. Please renew your plan to access this feature.',
          403,
          { code: 'SUBSCRIPTION_CANCELED', requiredPlans: allowedPlans }
        )
      );
    }

    if (subscriptionStatus === 'Past_Due' && !PAST_DUE_GRACE_ACCESS) {
      return next(
        new AppError(
          'Your payment is past due. Please update your billing information to continue.',
          403,
          { code: 'PAYMENT_PAST_DUE', requiredPlans: allowedPlans }
        )
      );
    }

    // ── Plan check ────────────────────────────────────────────────────────
    if (!allowedPlans.includes(plan)) {
      const highestRequired = allowedPlans.reduce((best, p) =>
        PLAN_HIERARCHY[p] > PLAN_HIERARCHY[best] ? p : best
      );

      return next(
        new AppError(
          `Your current plan (${plan}) does not include access to this feature. ` +
          `Please upgrade to ${allowedPlans.join(' or ')} to continue.`,
          403,
          {
            code:          'PLAN_UPGRADE_REQUIRED',
            currentPlan:   plan,
            requiredPlans: allowedPlans,
            upgradeUrl:    `${process.env.APP_BASE_URL || ''}/dashboard/billing`,
          }
        )
      );
    }

    next();
  };
};

/**
 * Convenience: gate on minimum plan level (inclusive).
 * e.g.  requireMinPlan('Pro')  allows Pro + Enterprise
 *
 * @param {'Free'|'Pro'|'Enterprise'} minPlan
 * @returns {import('express').RequestHandler}
 */
const requireMinPlan = (minPlan) => {
  const minLevel   = PLAN_HIERARCHY[minPlan];
  if (minLevel === undefined) {
    throw new Error(`[requireMinPlan] Unknown plan: ${minPlan}`);
  }
  const allowed = Object.keys(PLAN_HIERARCHY).filter(
    (p) => PLAN_HIERARCHY[p] >= minLevel
  );
  return requirePlan(allowed);
};

module.exports = { requirePlan, requireMinPlan };
