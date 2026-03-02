const mongoose = require('mongoose');
const Category = require('../models/category.model');
const NOT_DELETED_CONDITION = { $or: [{ is_deleted: false }, { is_deleted: { $exists: false } }] };
const ACTIVE_CONDITION = { $or: [{ is_active: true }, { is_active: { $exists: false } }] };

const toSlug = (name = '') =>
  String(name)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

exports.getAllCategories = async (_req, res) => {
  try {
    const categories = await Category.find({ $and: [NOT_DELETED_CONDITION, ACTIVE_CONDITION] })
      .populate('parent_id', 'name slug')
      .sort({ name: 1 });
    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAdminCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, q = '', active = '' } = req.query;
    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 10));
    const skip = (parsedPage - 1) * parsedLimit;

    const conditions = [NOT_DELETED_CONDITION];
    if (active === 'true') conditions.push({ is_active: true });
    if (active === 'false') conditions.push({ is_active: false });
    if (String(q).trim()) {
      const keyword = String(q).trim();
      conditions.push({ $or: [{ name: { $regex: keyword, $options: 'i' } }, { slug: { $regex: keyword, $options: 'i' } }] });
    }
    const query = { $and: conditions };

    const [items, total] = await Promise.all([
      Category.find(query).populate('parent_id', 'name slug').sort({ created_at: -1 }).skip(skip).limit(parsedLimit),
      Category.countDocuments(query)
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

exports.createCategory = async (req, res) => {
  try {
    const { name, slug, image_url = null, parent_id = null, is_active = true } = req.body;
    if (!String(name || '').trim()) {
      return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc' });
    }

    const normalizedSlug = String(slug || '').trim() || toSlug(name);
    const existing = await Category.findOne({
      $and: [
        NOT_DELETED_CONDITION,
        { $or: [{ name: String(name).trim() }, { slug: normalizedSlug }] }
      ]
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Tên hoặc slug danh mục đã tồn tại' });
    }

    if (parent_id && !mongoose.Types.ObjectId.isValid(parent_id)) {
      return res.status(400).json({ success: false, message: 'Danh mục cha không hợp lệ' });
    }

    const created = await Category.create({
      name: String(name).trim(),
      slug: normalizedSlug,
      image_url: image_url ? String(image_url).trim() : null,
      parent_id: parent_id || null,
      is_active: !!is_active
    });

    return res.status(201).json({ success: true, data: created, message: 'Đã thêm danh mục' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID danh mục không hợp lệ' });
    }

    const payload = { ...req.body };
    if (payload.name) payload.name = String(payload.name).trim();
    if (payload.slug) payload.slug = String(payload.slug).trim().toLowerCase();
    if (payload.image_url !== undefined) payload.image_url = payload.image_url ? String(payload.image_url).trim() : null;
    if (payload.is_active !== undefined) payload.is_active = !!payload.is_active;

    const category = await Category.findOneAndUpdate({ $and: [{ _id: id }, NOT_DELETED_CONDITION] }, payload, { new: true });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }
    return res.json({ success: true, data: category, message: 'Đã cập nhật danh mục' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID danh mục không hợp lệ' });
    }
    const category = await Category.findOneAndUpdate(
      { $and: [{ _id: id }, NOT_DELETED_CONDITION] },
      { is_deleted: true, deleted_at: new Date(), is_active: false },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }
    return res.json({ success: true, message: 'Đã xóa mềm danh mục' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
