'use strict';

const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./auth.validation');

const createOrderValidation = [
  body('customerPhone')
    .notEmpty()
    .withMessage('Customer phone number is required.')
    .matches(/^[0-9+\-\s()]{7,20}$/)
    .withMessage('Invalid phone number format.'),
  body('customerName')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required.')
    .isLength({ max: 150 }),
  body('customerAddress').optional().trim(),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item.'),
  body('items.*.productId')
    .notEmpty()
    .withMessage('Each item must have a productId.')
    .isMongoId()
    .withMessage('Invalid productId format.'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Each item must have a quantity of at least 1.'),
  body('notes').optional().trim().isLength({ max: 500 }),
  handleValidationErrors,
];

const updateStatusValidation = [
  param('id').isMongoId().withMessage('Invalid order ID.'),
  body('status')
    .notEmpty()
    .withMessage('Status is required.')
    .isIn(['Pending', 'Flagged', 'Confirmed', 'Shipped', 'Delivered', 'RTO', 'Cancelled'])
    .withMessage('Invalid status value.'),
  handleValidationErrors,
];

module.exports = { createOrderValidation, updateStatusValidation };
