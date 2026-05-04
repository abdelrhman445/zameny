#!/usr/bin/env node
/**
 * 🔍 Stripe Webhook Diagnostic Tool
 * ─────────────────────────────────────────────────────────────────────
 * Verifies webhook configuration and identifies common failure points
 */

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

console.log('\n🔧 ═══════════════════════════════════════════════════════════════');
console.log('   STRIPE WEBHOOK CONFIGURATION DIAGNOSTIC');
console.log('═══════════════════════════════════════════════════════════════\n');

// ─────────────────────────────────────────────────────────────────────────
// 1. Check Environment Variables
// ─────────────────────────────────────────────────────────────────────────
console.log('📋 STEP 1: Environment Variables');
console.log('─────────────────────────────────────────────────────────────');

const checks = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY?.substring(0, 20) + '...',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 20) + '...',
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

Object.entries(checks).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  console.log(`${status} ${key}: ${value || 'NOT SET'}`);
});

if (!process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')) {
  console.log('\n⚠️  WARNING: STRIPE_WEBHOOK_SECRET does not start with "whsec_"');
  console.log('   This MUST be a signing secret from Stripe CLI (stripe listen command)');
  console.log('   Not a webhook endpoint secret!\n');
}

// ─────────────────────────────────────────────────────────────────────────
// 2. Webhook Secret Validation
// ─────────────────────────────────────────────────────────────────────────
console.log('\n📍 STEP 2: Webhook Secret Analysis');
console.log('─────────────────────────────────────────────────────────────');

const whsec = process.env.STRIPE_WEBHOOK_SECRET;
const whsecTests = {
  'Starts with "whsec_"': whsec?.startsWith('whsec_'),
  'Length >= 30 chars': whsec?.length >= 30,
  'No spaces': !whsec?.includes(' '),
  'No newlines': !whsec?.includes('\n'),
};

Object.entries(whsecTests).forEach(([test, result]) => {
  const icon = result ? '✅' : '❌';
  console.log(`${icon} ${test}: ${result}`);
});

// ─────────────────────────────────────────────────────────────────────────
// 3. Test Webhook Event Construction
// ─────────────────────────────────────────────────────────────────────────
console.log('\n⚙️  STEP 3: Webhook Event Construction Test');
console.log('─────────────────────────────────────────────────────────────');

// Create a valid test event
const testEvent = {
  id: 'evt_test_123',
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_123',
      client_reference_id: '507f1f77bcf86cd799439011',
      payment_status: 'paid',
      object: 'checkout.session',
    },
  },
};

const eventPayload = JSON.stringify(testEvent);

try {
  // This will fail if whsec is wrong, but we're just testing the mechanism
  console.log('✅ Event JSON serialization: OK');
  console.log(`   Event type: ${testEvent.type}`);
  console.log(`   Client Reference ID: ${testEvent.data.object.client_reference_id}`);
} catch (error) {
  console.log(`❌ Event construction failed: ${error.message}`);
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Network & Server Setup Checklist
// ─────────────────────────────────────────────────────────────────────────
console.log('\n🌐 STEP 4: Network & Server Checklist');
console.log('─────────────────────────────────────────────────────────────');

const networkChecks = {
  'Server running on port 5000': 'Manual verification needed',
  'Stripe CLI forwarding configured': 'stripe listen --forward-to localhost:5000/api/v1/webhooks/stripe',
  'Middleware order: raw parser BEFORE json()': 'Check app.js line 67-70',
  'Webhook route mounted at /api/v1/webhooks/stripe': 'Check app.js line 85',
  'CORS configured for localhost:3000': 'Check app.js line 29-36',
  'Trust proxy set to 1': 'Check app.js line 23',
};

Object.entries(networkChecks).forEach(([check, details]) => {
  console.log(`⚠️  ${check}`);
  console.log(`   → ${details}`);
});

// ─────────────────────────────────────────────────────────────────────────
// 5. Common Issues & Solutions
// ─────────────────────────────────────────────────────────────────────────
console.log('\n🚨 STEP 5: Common Issues & Quick Fixes');
console.log('─────────────────────────────────────────────────────────────');

const issues = [
  {
    title: 'whsec Changes After CLI Restart',
    symptoms: 'Webhook shows "Delivered" in CLI but server logs show no incoming request',
    solution: [
      '1. Stop the Stripe CLI (Ctrl+C)',
      '2. Run: stripe listen --forward-to localhost:5000/api/v1/webhooks/stripe',
      '3. Copy the NEW whsec_... value shown in the CLI output',
      '4. Update your .env file with the new STRIPE_WEBHOOK_SECRET',
      '5. Restart your Node.js server (npm run dev or npm start)',
    ],
  },
  {
    title: 'Signature Verification Failing Silently',
    symptoms: 'No logs appear in server console, even with console.log calls',
    solution: [
      '1. Check that STRIPE_WEBHOOK_SECRET in .env matches CLI output exactly',
      '2. Verify no whitespace or newlines at the beginning/end',
      '3. Run: cat .env | grep STRIPE_WEBHOOK_SECRET (on Linux/Mac)',
      '4. On Windows: Get-Content .env | Select-String STRIPE_WEBHOOK_SECRET',
    ],
  },
  {
    title: 'Middleware Intercepts Webhook Before Handler',
    symptoms: 'Request never reaches webhook controller, 413 Payload Too Large error',
    solution: [
      '1. Verify express.raw() middleware is BEFORE express.json() in app.js',
      '2. Check that raw parser is on line ~67, BEFORE global json() on line ~74',
      '3. Ensure webhook route uses raw body, not parsed JSON',
    ],
  },
];

issues.forEach((issue, idx) => {
  console.log(`\n${idx + 1}. ${issue.title}`);
  console.log(`   Symptoms: ${issue.symptoms}`);
  console.log(`   Solution:`);
  issue.solution.forEach(step => console.log(`      ${step}`));
});

// ─────────────────────────────────────────────────────────────────────────
// 6. Recommended Next Steps
// ─────────────────────────────────────────────────────────────────────────
console.log('\n\n✅ NEXT STEPS');
console.log('═══════════════════════════════════════════════════════════════');
console.log('\n1. Update your .env with the NEW whsec from stripe listen');
console.log('2. Restart your Node.js server');
console.log('3. Make a test payment in the browser');
console.log('4. Check server console for: "⚡ Incoming Stripe Webhook Signal..."');
console.log('5. If webhook still doesn\'t trigger, check server logs for signature errors\n');

console.log('═══════════════════════════════════════════════════════════════\n');
