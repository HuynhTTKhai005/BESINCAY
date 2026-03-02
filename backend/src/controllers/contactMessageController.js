const mongoose = require('mongoose');
const ContactMessage = require('../models/contactMessage.model');

const contactMessageController = {
  createMessage: async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;

      if (!name || !email || !subject || !message) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ thông tin liên hệ'
        });
      }

      const created = await ContactMessage.create({
        name: String(name).trim(),
        email: String(email).trim(),
        subject: String(subject).trim(),
        message: String(message).trim()
      });

      return res.status(201).json({
        success: true,
        message: 'Tin nhắn của bạn đã được gửi thành công',
        data: created
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  getAdminMessages: async (req, res) => {
    try {
      const { page = 1, limit = 10, q = '', status = '' } = req.query;
      const parsedPage = Math.max(1, Number(page) || 1);
      const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 10));
      const skip = (parsedPage - 1) * parsedLimit;

      const query = {};
      if (status && ['new', 'read', 'resolved'].includes(status)) query.status = status;
      if (String(q).trim()) {
        const keyword = String(q).trim();
        query.$or = [{ name: { $regex: keyword, $options: 'i' } }, { email: { $regex: keyword, $options: 'i' } }, { subject: { $regex: keyword, $options: 'i' } }];
      }

      const [items, total] = await Promise.all([
        ContactMessage.find(query).sort({ created_at: -1 }).skip(skip).limit(parsedLimit),
        ContactMessage.countDocuments(query)
      ]);

      return res.json({
        success: true,
        data: items,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          pages: Math.max(1, Math.ceil(total / parsedLimit))
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  getAdminMessageDetail: async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'ID thư liên hệ không hợp lệ' });
      }
      const item = await ContactMessage.findById(id);
      if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy thư liên hệ' });
      return res.json({ success: true, data: item });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  updateAdminMessageStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body || {};
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'ID thư liên hệ không hợp lệ' });
      }
      if (!['new', 'read', 'resolved'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
      }

      const item = await ContactMessage.findByIdAndUpdate(id, { status }, { new: true });
      if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy thư liên hệ' });
      return res.json({ success: true, message: 'Đã cập nhật trạng thái thư', data: item });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = contactMessageController;
