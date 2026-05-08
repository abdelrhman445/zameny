'use strict';

const router = require('express').Router();
const jwt = require('jsonwebtoken'); 
const Merchant = require('../../models/Merchant'); 

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
// 🛡️ ميدل وير اختياري: بيقرأ التوكن لو موجود (للداشبورد) وبيعدي الطلب لو مش موجود (للزبون)
// ─────────────────────────────────────────────────────────────────
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // لو فيه توكن، بنقرأه ونرفق بيانات التاجر في الطلب
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.merchant = await Merchant.findById(decoded.id || decoded._id);
    }
  } catch (error) {
    // نتجاهل الخطأ في حالة عدم وجود توكن لضمان مرور طلب الزبون بسلام
  }
  next();
};

// ─────────────────────────────────────────────────────────────────
// 🌐 1. مسارات عامة (Public Routes) - تعمل بمرونة للزبون والتاجر
// ─────────────────────────────────────────────────────────────────
router.get('/', optionalAuth, getProducts);
router.get('/:id', optionalAuth, getProduct);

// ─────────────────────────────────────────────────────────────────
// 🔒 2. ميدل وير الحماية الإجبارية - أي مسار بعد هذا السطر يتطلب تسجيل دخول
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
