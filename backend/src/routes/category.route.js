const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/adminMiddleware');

router.get('/', categoryController.getAllCategories);

router.get('/admin/list', authMiddleware, adminMiddleware, categoryController.getAdminCategories);
router.post('/', authMiddleware, adminMiddleware, categoryController.createCategory);
router.put('/:id', authMiddleware, adminMiddleware, categoryController.updateCategory);
router.delete('/:id', authMiddleware, adminMiddleware, categoryController.deleteCategory);

module.exports = router;
