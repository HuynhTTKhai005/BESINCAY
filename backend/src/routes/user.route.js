const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware, adminOrStaffMiddleware } = require('../middleware/adminMiddleware');

// Current user profile
router.get('/profile', authMiddleware, userController.getMyProfile);
router.put('/profile', authMiddleware, userController.updateMyProfile);

// Roles
router.get('/roles', authMiddleware, userController.getRoles);

// Admin-only user management
router.get('/admin/all', authMiddleware, adminMiddleware, userController.getAllUsers);
router.post('/admin/create', authMiddleware, adminMiddleware, userController.createUser);
router.put('/admin/:id/role', authMiddleware, adminMiddleware, userController.updateUserRole);
router.put('/admin/:id/status', authMiddleware, adminMiddleware, userController.updateUserStatus);
router.put('/admin/:id', authMiddleware, adminMiddleware, userController.updateUserInfo);

// Customer management (admin/staff can view)
router.get('/admin/customers', authMiddleware, adminOrStaffMiddleware, userController.getCustomers);
router.get('/admin/customers/:id', authMiddleware, adminOrStaffMiddleware, userController.getCustomerDetail);

// Staff activities (admin-only)
router.get('/admin/staff-activities', authMiddleware, adminMiddleware, userController.getStaffActivities);
router.get('/admin/staff-activities/:id', authMiddleware, adminMiddleware, userController.getStaffActivityDetail);

module.exports = router;
