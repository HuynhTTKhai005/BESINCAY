const { recommendFood } = require('../services/aiRecommendation.service');

exports.recommend = async (req, res) => {
  try {
    const message = String(req.body?.message || '').trim();

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'message is required'
      });
    }

    const result = await recommendFood(message);

    return res.json({
      suggestions: result.suggestions.slice(0, 3)
    });
  } catch (error) {
    console.error('AI recommend error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations'
    });
  }
};
