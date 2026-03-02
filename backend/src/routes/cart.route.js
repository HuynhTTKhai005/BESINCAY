const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authMiddleware } = require('../middleware/auth');


// Lấy giỏ hàng
router.get('/', authMiddleware, cartController.getCart);

// Thêm vào giỏ hàng
router.post('/add', authMiddleware, cartController.addToCart);

// Cập nhật số lượng
router.put('/update', authMiddleware, cartController.updateQuantity);

// Xóa sản phẩm
router.delete('/remove', authMiddleware, cartController.removeFromCart);

// Xóa toàn bộ giỏ hàng
router.delete('/clear', authMiddleware, cartController.clearCart);

module.exports = router;