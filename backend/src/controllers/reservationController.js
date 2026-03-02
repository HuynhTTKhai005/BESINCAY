const mongoose = require('mongoose');
const Reservation = require('../models/reservation.model');

const reservationController = {
  createReservation: async (req, res) => {
    try {
      const { name, email, phone, date, time, people, message } = req.body;

      if (!name || !email || !phone || !date || !time || !people) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ thông tin đặt bàn'
        });
      }

      const reservation = await Reservation.create({
        name: String(name).trim(),
        email: String(email).trim(),
        phone: String(phone).trim(),
        reservation_date: String(date).trim(),
        reservation_time: String(time).trim(),
        people: Number(people),
        note: message ? String(message).trim() : ''
      });

      return res.status(201).json({
        success: true,
        message: 'Yêu cầu đặt bàn đã được ghi nhận',
        data: reservation
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  getAdminReservations: async (req, res) => {
    try {
      const { page = 1, limit = 10, q = '', status = '', date = '' } = req.query;
      const parsedPage = Math.max(1, Number(page) || 1);
      const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 10));
      const skip = (parsedPage - 1) * parsedLimit;

      const query = {};
      if (status && ['pending', 'confirmed', 'cancelled'].includes(status)) query.status = status;
      if (date) query.reservation_date = String(date);
      if (String(q).trim()) {
        const keyword = String(q).trim();
        query.$or = [{ name: { $regex: keyword, $options: 'i' } }, { email: { $regex: keyword, $options: 'i' } }, { phone: { $regex: keyword, $options: 'i' } }];
      }

      const [items, total] = await Promise.all([
        Reservation.find(query).sort({ created_at: -1 }).skip(skip).limit(parsedLimit),
        Reservation.countDocuments(query)
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

  getAdminReservationDetail: async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'ID đặt bàn không hợp lệ' });
      }
      const item = await Reservation.findById(id);
      if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu đặt bàn' });
      return res.json({ success: true, data: item });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  updateAdminReservationStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body || {};
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'ID đặt bàn không hợp lệ' });
      }
      if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
      }

      const item = await Reservation.findByIdAndUpdate(id, { status }, { new: true });
      if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu đặt bàn' });
      return res.json({ success: true, message: 'Đã cập nhật trạng thái đặt bàn', data: item });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = reservationController;
