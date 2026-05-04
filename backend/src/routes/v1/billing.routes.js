'use strict';

const router = require('express').Router();
const { subscribe, cancelSubscription, getBillingInfo } = require('../../controllers/billingController');
const { protect } = require('../../middlewares/auth');

router.use(protect);

router.get('/me',        getBillingInfo);
router.post('/subscribe',   subscribe);
router.delete('/subscribe', cancelSubscription);

module.exports = router;
