const jwt = require('jsonwebtoken');
const User = require('../models/user.model.js');

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token || req.query?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để tiếp tục'
      });
    }

    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Thiếu cấu hình JWT_SECRET trên server'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).populate('role_id');

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại hoặc đã bị vô hiệu hóa'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực'
    });
  }
};

module.exports = { authMiddleware };
