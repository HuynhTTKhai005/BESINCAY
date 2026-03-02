const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware, adminOrStaffMiddleware } = require('../middleware/adminMiddleware');

router.post('/', reservationController.createReservation);
router.get('/admin/list', authMiddleware, adminOrStaffMiddleware, reservationController.getAdminReservations);
router.get('/admin/:id', authMiddleware, adminOrStaffMiddleware, reservationController.getAdminReservationDetail);
router.put('/admin/:id/status', authMiddleware, adminMiddleware, reservationController.updateAdminReservationStatus);

module.exports = router;
