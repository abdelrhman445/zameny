'use strict';

const router = require('express').Router();
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
} = require('../../controllers/productController');
const { protect } = require('../../middlewares/auth');
const {
  createProductValidation,
  updateProductValidation,
  adjustStockValidation,
} = require('../../validations/product.validation');

// All product routes are protected
router.use(protect);

router.route('/').get(getProducts).post(createProductValidation, createProduct);

router
  .route('/:id')
  .get(getProduct)
  .patch(updateProductValidation, updateProduct)
  .delete(deleteProduct);

router.patch('/:id/stock', adjustStockValidation, adjustStock);

module.exports = router;
