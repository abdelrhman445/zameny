'use strict';

const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./auth.validation');

const createProductValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required.').isLength({ max: 200 }),
  body('price')
    .notEmpty()
    .withMessage('Price is required.')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number.'),
  body('stockCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock count must be a non-negative integer.'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('sku').optional().trim(),
  handleValidationErrors,
];

const updateProductValidation = [
  param('id').isMongoId().withMessage('Invalid product ID.'),
  body('name').optional().trim().isLength({ max: 200 }),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be non-negative.'),
  body('stockCount').optional().isInt({ min: 0 }).withMessage('Stock must be non-negative.'),
  handleValidationErrors,
];

const adjustStockValidation = [
  param('id').isMongoId().withMessage('Invalid product ID.'),
  body('adjustment')
    .notEmpty()
    .withMessage('adjustment is required.')
    .isNumeric()
    .withMessage('adjustment must be a number.'),
  handleValidationErrors,
];

module.exports = { createProductValidation, updateProductValidation, adjustStockValidation };
