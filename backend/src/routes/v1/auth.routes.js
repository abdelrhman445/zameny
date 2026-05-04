'use strict';

const router = require('express').Router();
const {
  register,
  login,
  getMe,
  updateTelegramChatId,
  changePassword,
} = require('../../controllers/authController');
const { protect } = require('../../middlewares/auth');
const { registerValidation, loginValidation } = require('../../validations/auth.validation');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes
router.use(protect);
router.get('/me', getMe);
router.patch('/update-telegram', updateTelegramChatId);
router.patch('/change-password', changePassword);

module.exports = router;
