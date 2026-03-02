const mongoose = require('mongoose');
const Order = require('../models/order.model.js');
const Coupon = require('../models/coupon.model.js');
const User = require('../models/user.model.js');
const Product = require('../models/product.model.js');
const { validateCoupon } = require('../utils/couponUtils');
const { logStaffActivity } = require('../utils/staffActivityLogger');

const VALID_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'shipping', 'completed', 'cancel_requested', 'cancelled'];
const PROCESSING_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'shipping', 'cancel_requested'];
const STATUS_LABELS = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị',
  ready: 'Sẵn sàng giao',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancel_requested: 'Chờ xác nhận hủy',
  cancelled: 'Đã hủy'
};

const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${timestamp}-${random}`;
};

const normalizeOrderForAdmin = (orderDoc) => {
  const order = orderDoc.toObject ? orderDoc.toObject() : orderDoc;
  return {
    ...order,
    status_label: STATUS_LABELS[order.status] || order.status
  };
};

const orderController = {
  createOrder: async (req, res) => {
    try {
      const { customer, items, note, paymentMethod, coupon_code } = req.body;

      if (!customer || !customer.name || !customer.phone || !customer.address) {
        return res.status(400).json({ success: false, message: 'Thông tin khách hàng không đầy đủ' });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Đơn hàng phải có ít nhất 1 sản phẩm' });
      }

      if (!paymentMethod) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn phương thức thanh toán' });
      }

      const subtotal = items.reduce((sum, item) => {
        const price = Number(item.base_price_cents || 0);
        const qty = Number(item.quantity || 0);
        return sum + price * qty;
      }, 0);

      const shippingFee = subtotal >= 100000 ? 0 : 20000;

      let discountAmount = 0;
      let normalizedCouponCode = null;
      if (coupon_code) {
        const couponResult = await validateCoupon(coupon_code, subtotal);
        if (!couponResult.valid) {
          return res.status(400).json({ success: false, message: couponResult.message });
        }
        discountAmount = couponResult.discount_amount;
        normalizedCouponCode = couponResult.coupon.code;
      }

      const total = Math.max(0, subtotal + shippingFee - discountAmount);

      const order = new Order({
        order_id: generateOrderId(),
        user_id: req.user ? req.user._id : null,
        customer,
        items,
        subtotal,
        shippingFee,
        coupon_code: normalizedCouponCode,
        discountAmount,
        total,
        note,
        paymentMethod,
        status: 'pending',
        timeline: [{ status: 'pending', message: 'Đơn hàng đã được tạo', timestamp: new Date() }]
      });

      await order.save();

      if (normalizedCouponCode) {
        await Coupon.findOneAndUpdate({ code: normalizedCouponCode }, { $inc: { used_count: 1 } });
      }

      return res.json({
        success: true,
        message: 'Đơn hàng đã được tạo thành công',
        data: {
          order_id: order.order_id,
          order_db_id: order._id,
          status: order.status,
          status_label: STATUS_LABELS[order.status],
          discountAmount: order.discountAmount,
          total: order.total
        }
      });
    } catch (error) {
      console.error('Create order error:', error);
      return res.status(500).json({ success: false, message: 'Lỗi tạo đơn hàng', error: error.message });
    }
  },

  getUserOrders: async (req, res) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
      }

      const orders = await Order.find({ user_id: req.user._id }).sort({ created_at: -1 });
      return res.json({
        success: true,
        data: orders.map((order) => ({
          ...order.toObject(),
          status_label: STATUS_LABELS[order.status] || order.status
        }))
      });
    } catch (error) {
      console.error('Get user orders error:', error);
      return res.status(500).json({ success: false, message: 'Lỗi lấy danh sách đơn hàng' });
    }
  },

  getOrderDetail: async (req, res) => {
    try {
      const { orderId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ success: false, message: 'Mã đơn hàng không hợp lệ' });
      }

      const order = await Order.findOne({ _id: orderId, user_id: req.user._id });
      if (!order) {
        return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
      }

      return res.json({ success: true, data: normalizeOrderForAdmin(order) });
    } catch (error) {
      console.error('Get order detail error:', error);
      return res.status(500).json({ success: false, message: 'Lỗi lấy chi tiết đơn hàng' });
    }
  },

  updateOrderStatus: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status, result_note } = req.body;

      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
      }

      const prevStatus = order.status;
      order.status = status;

      if (order.cancel_request?.result === 'pending') {
        if (status === 'cancelled') {
          order.cancel_request.result = 'approved';
          order.cancel_request.result_note = result_note || 'Yêu cầu hủy đơn đã được chấp nhận';
          order.cancel_request.reviewed_at = new Date();
        } else if (status !== 'cancel_requested') {
          order.cancel_request.result = 'rejected';
          order.cancel_request.result_note = result_note || 'Yêu cầu hủy đơn bị từ chối';
          order.cancel_request.reviewed_at = new Date();
        }
      }

      if (prevStatus !== status) {
        order.timeline.push({
          status,
          message: `Trạng thái đơn hàng chuyển sang "${STATUS_LABELS[status] || status}"`,
          timestamp: new Date()
        });
      }

      await order.save();
      await logStaffActivity({
        staffId: req.user?._id,
        action: 'update_order_status',
        entityType: 'order',
        entityId: order._id,
        description: `Cap nhat trang thai don ${order.order_id || order._id} tu ${prevStatus} sang ${status}`,
        payload: { from: prevStatus, to: status, result_note: result_note || null }
      });

      return res.json({
        success: true,
        message: 'Cập nhật trạng thái đơn hàng thành công',
        data: normalizeOrderForAdmin(order)
      });
    } catch (error) {
      console.error('Update order status error:', error);
      return res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái đơn hàng' });
    }
  },

  cancelOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { reason, note } = req.body || {};

      const order = await Order.findOne({ _id: orderId, user_id: req.user._id });
      if (!order) {
        return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
      }

      if (!reason) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn lý do hủy đơn' });
      }

      if (!['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({ success: false, message: 'Không thể hủy đơn hàng này' });
      }

      order.status = 'cancel_requested';
      order.cancel_request = {
        reason,
        note: note || null,
        requested_at: new Date(),
        result: 'pending',
        result_note: null,
        reviewed_at: null
      };
      order.timeline.push({
        status: 'cancel_requested',
        message: `Khách hàng yêu cầu hủy đơn: ${reason}`,
        timestamp: new Date()
      });

      await order.save();

      return res.json({
        success: true,
        message: 'Đã gửi yêu cầu hủy đơn, vui lòng chờ xác nhận',
        data: normalizeOrderForAdmin(order)
      });
    } catch (error) {
      console.error('Cancel order error:', error);
      return res.status(500).json({ success: false, message: 'Lỗi hủy đơn hàng' });
    }
  },

  getOrderStats: async (_req, res) => {
    try {
      const grouped = await Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$total' } } }
      ]);

      const mapped = grouped.map((item) => ({
        status: item._id,
        status_label: STATUS_LABELS[item._id] || item._id,
        count: item.count,
        revenue: item.revenue
      }));

      return res.json({ success: true, data: mapped });
    } catch (error) {
      console.error('Get order stats error:', error);
      return res.status(500).json({ success: false, message: 'Lỗi lấy thống kê đơn hàng' });
    }
  },

  getAllOrders: async (req, res) => {
    try {
      const {
        status,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        q = ''
      } = req.query;

      const parsedPage = Math.max(1, Number(page) || 1);
      const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 10));
      const skip = (parsedPage - 1) * parsedLimit;

      const query = {};
      if (status && VALID_STATUSES.includes(status)) {
        query.status = status;
      }

      if (startDate || endDate) {
        query.created_at = {};
        if (startDate) query.created_at.$gte = new Date(`${startDate}T00:00:00.000Z`);
        if (endDate) query.created_at.$lte = new Date(`${endDate}T23:59:59.999Z`);
      }

      if (q && String(q).trim()) {
        const keyword = String(q).trim();
        query.$or = [
          { order_id: { $regex: keyword, $options: 'i' } },
          { 'customer.name': { $regex: keyword, $options: 'i' } },
          { 'customer.phone': { $regex: keyword, $options: 'i' } }
        ];
      }

      const [orders, total, grouped] = await Promise.all([
        Order.find(query)
          .populate('user_id', 'name email')
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(parsedLimit),
        Order.countDocuments(query),
        Order.aggregate([
          { $match: query },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ])
      ]);

      const byStatus = grouped.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});
      const processingCount = PROCESSING_STATUSES.reduce((sum, s) => sum + (byStatus[s] || 0), 0);

      return res.json({
        success: true,
        data: orders.map(normalizeOrderForAdmin),
        stats: {
          total,
          completed: byStatus.completed || 0,
          processing: processingCount,
          cancelled: byStatus.cancelled || 0
        },
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          pages: Math.max(1, Math.ceil(total / parsedLimit))
        }
      });
    } catch (error) {
      console.error('Get all orders error:', error);
      return res.status(500).json({ success: false, message: 'Lỗi lấy danh sách đơn hàng' });
    }
  },

  getAdminOrderDetail: async (req, res) => {
    try {
      const { orderId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ success: false, message: 'Mã đơn hàng không hợp lệ' });
      }

      const order = await Order.findById(orderId).populate('user_id', 'name email phone');
      if (!order) {
        return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
      }

      return res.json({ success: true, data: normalizeOrderForAdmin(order) });
    } catch (error) {
      console.error('Get admin order detail error:', error);
      return res.status(500).json({ success: false, message: 'Lỗi lấy chi tiết đơn hàng' });
    }
  },

  getDashboardStats: async (_req, res) => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [totalOrders, todayOrders, todayRevenueAgg, monthRevenueAgg, activeProducts, activeCustomers, recentOrders, newCustomers, newestProducts] = await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ created_at: { $gte: todayStart, $lt: tomorrowStart } }),
        Order.aggregate([{ $match: { created_at: { $gte: todayStart, $lt: tomorrowStart }, status: 'completed' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
        Order.aggregate([{ $match: { created_at: { $gte: monthStart }, status: 'completed' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
        Product.countDocuments({ is_active: true, is_available: true }),
        User.countDocuments({ is_active: true, role_id: { $exists: true } }),
        Order.find().sort({ created_at: -1 }).limit(20).select('order_id customer total status created_at'),
        User.find({ is_active: true }).sort({ created_at: -1 }).limit(20).select('name email created_at'),
        Product.find().sort({ created_at: -1 }).limit(20).select('name slug base_price_cents stock stock_quantity is_active created_at')
      ]);

      return res.json({
        success: true,
        data: {
          kpis: {
            total_orders: totalOrders,
            today_orders: todayOrders,
            today_revenue: todayRevenueAgg[0]?.total || 0,
            month_revenue: monthRevenueAgg[0]?.total || 0,
            active_products: activeProducts,
            active_customers: activeCustomers
          },
          recent_orders: recentOrders.map((o) => ({ ...o.toObject(), status_label: STATUS_LABELS[o.status] || o.status })),
          new_customers: newCustomers,
          newest_products: newestProducts
        }
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return res.status(500).json({ success: false, message: 'Lỗi lấy thống kê dashboard' });
    }
  }
};

module.exports = orderController;
