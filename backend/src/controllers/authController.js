const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/user.model.js');
const Role = require('../models/role.model.js');
const Cart = require('../models/cart.model.js');

const JWT_SECRET = process.env.JWT_SECRET;
const RESET_SECRET = process.env.RESET_PASSWORD_SECRET || process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const APP_MAIL_USER = process.env.APP_MAIL_USER;
const APP_MAIL_PASS = String(process.env.APP_MAIL_PASS || '').replace(/\s+/g, '');
const SYSTEM_MAIL_NAME = process.env.SYSTEM_MAIL_NAME || 'Sincay System';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';

const hasJwtConfig = () => Boolean(JWT_SECRET);
const hasMailConfig = () => Boolean(APP_MAIL_USER && APP_MAIL_PASS && RESET_SECRET);

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createMailTransport = (override = {}) =>
  nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    requireTLS: !SMTP_SECURE,
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 20000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 15000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 30000),
    auth: {
      user: APP_MAIL_USER,
      pass: APP_MAIL_PASS
    },
    ...override
  });

const sendMailWithFallback = async (mailOptions) => {
  try {
    const transporter = createMailTransport();
    await transporter.sendMail(mailOptions);
  } catch (error) {
    const shouldRetryWith465 =
      error?.code === 'ETIMEDOUT' &&
      String(SMTP_HOST).toLowerCase() === 'smtp.gmail.com' &&
      Number(SMTP_PORT) === 587;

    if (!shouldRetryWith465) throw error;

    const fallbackTransport = createMailTransport({
      port: 465,
      secure: true,
      requireTLS: false
    });
    await fallbackTransport.sendMail(mailOptions);
  }
};

const findUserByEmail = (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return User.findOne({
    email: { $regex: `^${escapeRegex(normalized)}$`, $options: 'i' }
  });
};

const authController = {
  register: async (req, res) => {
    try {
      if (!hasJwtConfig()) {
        return res.status(500).json({ success: false, message: 'Thiếu cấu hình JWT_SECRET trên server' });
      }

      const email = normalizeEmail(req.body.email);
      const password = String(req.body.password || '');
      const name = String(req.body.name || '').trim();
      const phone = String(req.body.phone || '').trim();

      if (!email || !password || !name) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin đăng ký bắt buộc' });
      }

      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email đã được sử dụng' });
      }

      const customerRole = await Role.findOne({ name: 'customer' });
      if (!customerRole) {
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống: chưa có role customer' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        email,
        password: hashedPassword,
        name,
        phone: phone || null,
        role_id: customerRole._id
      });

      await Cart.updateOne(
        { user_id: user._id },
        { $setOnInsert: { user_id: user._id, items: [] } },
        { upsert: true }
      );

      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      const userResponse = user.toObject();
      delete userResponse.password;

      return res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        data: { user: userResponse, token }
      });
    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  login: async (req, res) => {
    try {
      const email = normalizeEmail(req.body.email);
      const password = String(req.body.password || '');

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
      }

      const user = await findUserByEmail(email).populate('role_id');
      if (!user) {
        return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
      }

      if (!user.is_active) {
        return res.status(400).json({ success: false, message: 'Tài khoản đã bị vô hiệu hóa' });
      }

      let isMatch = false;
      if (typeof user.password === 'string' && user.password.startsWith('$2')) {
        isMatch = await bcrypt.compare(password, user.password);
      } else {
        // Hỗ trợ dữ liệu cũ lưu plain-text, sau khi login thành công sẽ tự chuyển sang hash.
        isMatch = user.password === password;
        if (isMatch) {
          user.password = await bcrypt.hash(password, 10);
        }
      }

      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
      }

      if (!hasJwtConfig()) {
        return res.status(500).json({ success: false, message: 'Thiếu cấu hình JWT_SECRET trên server' });
      }

      user.last_login_at = new Date();
      await user.save();

      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      const userResponse = user.toObject();
      delete userResponse.password;

      return res.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: { user: userResponse, token }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Lỗi server' : `Lỗi server: ${error.message}`
      });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      if (!hasMailConfig()) {
        return res.status(500).json({
          success: false,
          message: 'Thiếu cấu hình email hoặc token reset trên server'
        });
      }

      const email = normalizeEmail(req.body.email);
      if (!email) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập email' });
      }

      const user = await findUserByEmail(email);
      const safeResponse = {
        success: true,
        message: 'Nếu email tồn tại, hệ thống đã gửi thư đặt lại mật khẩu.'
      };

      if (!user) {
        return res.json(safeResponse);
      }

      const resetToken = jwt.sign(
        { userId: user._id, email: user.email, type: 'reset_password' },
        RESET_SECRET,
        { expiresIn: '15m' }
      );

      const resetLink = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;

      await sendMailWithFallback({
        from: `"${SYSTEM_MAIL_NAME}" <${APP_MAIL_USER}>`,
        to: user.email,
        subject: 'Đặt lại mật khẩu tài khoản Sincay',
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6">
            <h2>Yêu cầu đặt lại mật khẩu</h2>
            <p>Xin chào ${user.name || 'bạn'},</p>
            <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản Sincay.</p>
            <p>Nhấn nút bên dưới để đặt lại mật khẩu (liên kết có hiệu lực trong 15 phút):</p>
            <p>
              <a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#d84800;color:#fff;text-decoration:none;border-radius:6px">
                Đặt lại mật khẩu
              </a>
            </p>
            <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
            <p>Trân trọng,<br/>Sincay System</p>
          </div>
        `
      });

      return res.json(safeResponse);
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Không thể gửi email đặt lại mật khẩu. Kiểm tra APP_MAIL_USER/APP_MAIL_PASS.'
      });
    }
  },

  resetPassword: async (req, res) => {
    try {
      if (!RESET_SECRET) {
        return res.status(500).json({
          success: false,
          message: 'Thiếu cấu hình RESET_PASSWORD_SECRET trên server'
        });
      }

      const token = String(req.body.token || '');
      const newPassword = String(req.body.newPassword || '');

      if (!token || !newPassword) {
        return res.status(400).json({ success: false, message: 'Thiếu dữ liệu đặt lại mật khẩu' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      }

      let payload;
      try {
        payload = jwt.verify(token, RESET_SECRET);
      } catch {
        return res.status(400).json({
          success: false,
          message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'
        });
      }

      if (payload.type !== 'reset_password' || !payload.userId) {
        return res.status(400).json({ success: false, message: 'Token đặt lại mật khẩu không hợp lệ' });
      }

      const user = await User.findById(payload.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      return res.json({
        success: true,
        message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({ success: false, message: 'Lỗi đặt lại mật khẩu' });
    }
  },

  getProfile: async (req, res) => {
    try {
      const user = req.user.toObject();
      delete user.password;

      return res.json({
        success: true,
        data: {
          user,
          token: req.token || null
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  logout: async (_req, res) => {
    try {
      res.clearCookie('token');
      return res.json({ success: true, message: 'Đăng xuất thành công' });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
};

module.exports = authController;
