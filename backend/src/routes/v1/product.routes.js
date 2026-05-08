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

// ─────────────────────────────────────────────────────────────────
// 🌐 1. مسارات عامة (Public Routes) - الزبائن يقدروا يشوفوا المنتجات
// ─────────────────────────────────────────────────────────────────
router.get('/', getProducts);
router.get('/:id', getProduct);

// ─────────────────────────────────────────────────────────────────
// 🔒 2. ميدل وير الحماية - أي مسار بعد السطر ده هيحتاج تسجيل دخول (للتاجر فقط)
// ─────────────────────────────────────────────────────────────────
router.use(protect);

// 🛠️ 3. مسارات خاصة بالتاجر (إضافة، تعديل، حذف)
router.post('/', createProductValidation, createProduct);

router
  .route('/:id')
  .patch(updateProductValidation, updateProduct)
  .delete(deleteProduct);

router.patch('/:id/stock', adjustStockValidation, adjustStock);

module.exports = router;
