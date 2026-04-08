const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const aiRecommendController = require('../controllers/aiRecommendController');
const { aiRateLimit } = require('../middleware/aiRateLimit');

router.post('/chat', aiRateLimit, aiController.chat);
router.post('/recommend', aiRateLimit, aiRecommendController.recommend);

module.exports = router;
