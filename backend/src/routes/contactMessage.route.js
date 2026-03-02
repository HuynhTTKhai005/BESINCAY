const express = require('express');
const router = express.Router();
const contactMessageController = require('../controllers/contactMessageController');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware, adminOrStaffMiddleware } = require('../middleware/adminMiddleware');

router.post('/', contactMessageController.createMessage);
router.get('/admin/list', authMiddleware, adminOrStaffMiddleware, contactMessageController.getAdminMessages);
router.get('/admin/:id', authMiddleware, adminOrStaffMiddleware, contactMessageController.getAdminMessageDetail);
router.put('/admin/:id/status', authMiddleware, adminMiddleware, contactMessageController.updateAdminMessageStatus);

module.exports = router;
