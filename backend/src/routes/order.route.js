const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/auth');
const { adminOrStaffMiddleware } = require('../middleware/adminMiddleware');

// Tạo đơn hàng mới
router.post('/', authMiddleware, orderController.createOrder);

// Lấy danh sách đơn hàng của user
router.get('/', authMiddleware, orderController.getUserOrders);

// Admin/Staff routes
router.get('/admin/stats/dashboard', authMiddleware, adminOrStaffMiddleware, orderController.getDashboardStats);
router.get('/admin/all', authMiddleware, adminOrStaffMiddleware, orderController.getAllOrders);
router.get('/admin/:orderId', authMiddleware, adminOrStaffMiddleware, orderController.getAdminOrderDetail);

// Lấy chi tiết đơn hàng
router.get('/:orderId', authMiddleware, orderController.getOrderDetail);

// Cập nhật trạng thái đơn hàng
router.put('/:orderId/status', authMiddleware, adminOrStaffMiddleware, orderController.updateOrderStatus);

// Hủy đơn hàng
router.put('/:orderId/cancel', authMiddleware, orderController.cancelOrder);

module.exports = router;
