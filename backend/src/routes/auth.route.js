const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Đăng ký
router.post('/register', authController.register);

// Đăng nhập
router.post('/login', authController.login);

// Quên mật khẩu
router.post('/forgot-password', authController.forgotPassword);

// Đặt lại mật khẩu
router.post('/reset-password', authController.resetPassword);

// Lấy thông tin user (cần đăng nhập)
router.get('/profile', authMiddleware, authController.getProfile);

// Đăng xuất
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
