const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, wishlistController.getWishlist);
router.get('/ids', authMiddleware, wishlistController.getWishlistIds);
router.post('/toggle/:productId', authMiddleware, wishlistController.toggleWishlist);

module.exports = router;

