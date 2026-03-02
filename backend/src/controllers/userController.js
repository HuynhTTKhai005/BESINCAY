const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Role = require('../models/role.model');
const Order = require('../models/order.model');
const StaffActivity = require('../models/staffActivity.model');

const USER_SELECT = 'name email phone avatar_url default_shipping_address is_active role_id created_at updated_at';

const buildSearchQuery = (search = '') => {
  const keyword = String(search || '').trim();
  if (!keyword) return {};
  return {
    $or: [{ name: { $regex: keyword, $options: 'i' } }, { email: { $regex: keyword, $options: 'i' } }, { phone: { $regex: keyword, $options: 'i' } }]
  };
};

exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('role_id', 'name');
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const { name, phone, avatar_url, default_shipping_address } = req.body || {};
    const payload = {};
    if (name !== undefined) payload.name = String(name).trim();
    if (phone !== undefined) payload.phone = phone ? String(phone).trim() : null;
    if (avatar_url !== undefined) payload.avatar_url = avatar_url ? String(avatar_url).trim() : '/default-avatar.png';
    if (default_shipping_address !== undefined) {
      payload.default_shipping_address = default_shipping_address ? String(default_shipping_address).trim() : null;
    }

    const user = await User.findByIdAndUpdate(req.user._id, payload, { new: true }).populate('role_id', 'name');
    return res.json({ success: true, message: 'Đã cập nhật hồ sơ', data: user });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getRoles = async (_req, res) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    return res.json({ success: true, data: roles });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', active = '' } = req.query;
    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 10));
    const skip = (parsedPage - 1) * parsedLimit;

    const adminStaffRoles = await Role.find({ name: { $in: ['admin', 'staff'] } }).select('_id name');
    const adminStaffRoleIds = adminStaffRoles.map((item) => item._id);
    if (adminStaffRoleIds.length === 0) {
      return res.json({
        success: true,
        data: { users: [], roles: [] },
        stats: { total: 0, active: 0, blocked: 0, staff: 0 },
        pagination: { page: parsedPage, limit: parsedLimit, total: 0, pages: 1 }
      });
    }

    const query = { ...buildSearchQuery(search), role_id: { $in: adminStaffRoleIds } };
    if (active === 'true') query.is_active = true;
    if (active === 'false') query.is_active = false;

    if (role) {
      if (!mongoose.Types.ObjectId.isValid(role)) {
        return res.status(400).json({ success: false, message: 'Role không hợp lệ' });
      }
      if (!adminStaffRoleIds.some((id) => String(id) === String(role))) {
        return res.status(400).json({ success: false, message: 'Chỉ được lọc theo quyền admin hoặc staff' });
      }
      query.role_id = role;
    }

    const [users, total, grouped] = await Promise.all([
      User.find(query).select(USER_SELECT).populate('role_id', 'name').sort({ created_at: -1 }).skip(skip).limit(parsedLimit),
      User.countDocuments(query),
      User.aggregate([
        { $match: { role_id: { $in: adminStaffRoleIds } } },
        {
          $lookup: {
            from: 'roles',
            localField: 'role_id',
            foreignField: '_id',
            as: 'role'
          }
        },
        { $unwind: '$role' },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$is_active', 1, 0] } },
            blocked: { $sum: { $cond: ['$is_active', 0, 1] } },
            staff: { $sum: { $cond: [{ $eq: ['$role.name', 'staff'] }, 1, 0] } }
          }
        }
      ])
    ]);

    return res.json({
      success: true,
      data: {
        users,
        roles: adminStaffRoles
      },
      stats: {
        total: grouped[0]?.total || 0,
        active: grouped[0]?.active || 0,
        blocked: grouped[0]?.blocked || 0,
        staff: grouped[0]?.staff || 0
      },
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
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role_id, phone, default_shipping_address } = req.body || {};
    if (!name || !email || !password || !role_id) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }
    if (!mongoose.Types.ObjectId.isValid(role_id)) {
      return res.status(400).json({ success: false, message: 'Role không hợp lệ' });
    }

    const role = await Role.findById(role_id);
    if (!role) return res.status(400).json({ success: false, message: 'Role không tồn tại' });

    if (!['staff', 'admin'].includes(role.name)) {
      return res.status(400).json({ success: false, message: 'Chỉ được tạo tài khoản admin hoặc staff' });
    }

    const existing = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (existing) return res.status(400).json({ success: false, message: 'Email đã tồn tại' });

    const hashed = await bcrypt.hash(String(password), 10);
    const created = await User.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      password: hashed,
      phone: phone ? String(phone).trim() : null,
      default_shipping_address: default_shipping_address ? String(default_shipping_address).trim() : null,
      role_id: role._id,
      is_active: true
    });

    const view = await User.findById(created._id).select(USER_SELECT).populate('role_id', 'name');
    return res.status(201).json({ success: true, message: 'Đã thêm người dùng', data: view });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const role = await Role.findById(roleId);
    if (!role) return res.status(400).json({ success: false, message: 'Role không tồn tại' });

    const updated = await User.findByIdAndUpdate(id, { role_id: role._id }, { new: true }).select(USER_SELECT).populate('role_id', 'name');
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    return res.json({ success: true, message: 'Đã cập nhật quyền', data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ' });
    }
    const updated = await User.findByIdAndUpdate(id, { is_active: !!isActive }, { new: true }).select(USER_SELECT).populate('role_id', 'name');
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    return res.json({ success: true, message: 'Đã cập nhật trạng thái', data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateUserInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, avatar_url, default_shipping_address } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ' });
    }
    const payload = {};
    if (name !== undefined) payload.name = String(name).trim();
    if (phone !== undefined) payload.phone = phone ? String(phone).trim() : null;
    if (avatar_url !== undefined) payload.avatar_url = avatar_url ? String(avatar_url).trim() : '/default-avatar.png';
    if (default_shipping_address !== undefined) {
      payload.default_shipping_address = default_shipping_address ? String(default_shipping_address).trim() : null;
    }

    const updated = await User.findByIdAndUpdate(id, payload, { new: true }).select(USER_SELECT).populate('role_id', 'name');
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    return res.json({ success: true, message: 'Đã cập nhật thông tin', data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, q = '', active = '' } = req.query;
    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 10));
    const skip = (parsedPage - 1) * parsedLimit;

    const customerRole = await Role.findOne({ name: 'customer' }).select('_id');
    if (!customerRole) return res.status(400).json({ success: false, message: 'Thiếu role customer' });

    const query = { role_id: customerRole._id, ...buildSearchQuery(q) };
    if (active === 'true') query.is_active = true;
    if (active === 'false') query.is_active = false;

    const [customers, total, grouped, newCount] = await Promise.all([
      User.find(query).select(USER_SELECT).sort({ created_at: -1 }).skip(skip).limit(parsedLimit),
      User.countDocuments(query),
      User.aggregate([
        { $match: { role_id: customerRole._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$is_active', 1, 0] } },
            blocked: { $sum: { $cond: ['$is_active', 0, 1] } }
          }
        }
      ]),
      User.countDocuments({
        role_id: customerRole._id,
        created_at: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      })
    ]);

    return res.json({
      success: true,
      data: customers,
      stats: {
        total: grouped[0]?.total || 0,
        active: grouped[0]?.active || 0,
        blocked: grouped[0]?.blocked || 0,
        new_customers: newCount
      },
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
};

exports.getCustomerDetail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID khách hàng không hợp lệ' });
    }

    const customer = await User.findById(id).select(USER_SELECT).populate('role_id', 'name');
    if (!customer) return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });

    const orders = await Order.find({ user_id: id }).sort({ created_at: -1 }).select('order_id total status created_at');
    const totalSpent = orders.reduce((sum, item) => sum + Number(item.total || 0), 0);

    return res.json({
      success: true,
      data: {
        customer,
        total_spent: totalSpent,
        orders
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStaffActivities = async (req, res) => {
  try {
    const { page = 1, limit = 10, q = '', staff_id = '' } = req.query;
    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 10));
    const skip = (parsedPage - 1) * parsedLimit;

    const query = {};
    if (staff_id && mongoose.Types.ObjectId.isValid(staff_id)) query.staff_id = staff_id;
    if (String(q).trim()) {
      const keyword = String(q).trim();
      query.$or = [{ action: { $regex: keyword, $options: 'i' } }, { description: { $regex: keyword, $options: 'i' } }];
    }

    const [items, total] = await Promise.all([
      StaffActivity.find(query).populate('staff_id', 'name email').sort({ created_at: -1 }).skip(skip).limit(parsedLimit),
      StaffActivity.countDocuments(query)
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
};

exports.getStaffActivityDetail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID lịch sử không hợp lệ' });
    }
    const item = await StaffActivity.findById(id).populate('staff_id', 'name email');
    if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch sử hoạt động' });
    return res.json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
