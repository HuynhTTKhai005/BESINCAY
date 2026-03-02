const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController.js');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware, adminOrStaffMiddleware } = require('../middleware/adminMiddleware');

// Public routes
router.get('/', productController.getAllProducts);
router.post('/seed', productController.seedProducts);

// Admin/Staff routes
router.get('/admin/list', authMiddleware, adminOrStaffMiddleware, productController.getAdminProducts);
router.get('/admin/stock-history', authMiddleware, adminOrStaffMiddleware, productController.getStockHistory);
router.put('/admin/:id/toggle-active', authMiddleware, adminOrStaffMiddleware, productController.toggleProductActive);

// Admin only routes
router.post('/admin', authMiddleware, adminMiddleware, productController.createProduct);
router.post('/admin/:id/stock-in', authMiddleware, adminMiddleware, productController.stockInProduct);
router.put('/admin/:id/stock', authMiddleware, adminMiddleware, productController.updateStockQuantity);
router.put('/admin/:id', authMiddleware, adminMiddleware, productController.updateProduct);
router.delete('/admin/:id', authMiddleware, adminMiddleware, productController.deleteProduct);

module.exports = router;
