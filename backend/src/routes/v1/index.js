'use strict';

const router = require('express').Router();

const authRoutes     = require('./auth.routes');
const productRoutes  = require('./product.routes');
const orderRoutes    = require('./order.routes');
const billingRoutes  = require('./billing.routes');

router.use('/auth',     authRoutes);
router.use('/products', productRoutes);
router.use('/orders',   orderRoutes);
router.use('/billing',  billingRoutes);

module.exports = router;
