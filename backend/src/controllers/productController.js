const mongoose = require('mongoose');
const Product = require('../models/product.model.js');
const Category = require('../models/category.model.js');
const StockHistory = require('../models/stockHistory.model.js');
const { logStaffActivity } = require('../utils/staffActivityLogger');
const NOT_DELETED_CONDITION = { $or: [{ is_deleted: false }, { is_deleted: { $exists: false } }] };
const ACTIVE_CATEGORY_CONDITION = { $or: [{ is_active: true }, { is_active: { $exists: false } }] };

const getStockValue = (product) => Number(product?.stock ?? product?.stock_quantity ?? 0);

const normalizeProduct = (productDoc) => {
  const product = productDoc.toObject ? productDoc.toObject() : productDoc;
  const stock = getStockValue(product);
  const threshold = Number(product.low_stock_threshold || 10);
  let stock_status = 'in_stock';
  if (stock <= 0) stock_status = 'out_of_stock';
  else if (stock < threshold) stock_status = 'low_stock';

  return { ...product, stock, stock_quantity: stock, stock_status };
};

exports.getAllProducts = async (req, res) => {
  try {
    const activeCategories = await Category.find({
      $and: [NOT_DELETED_CONDITION, ACTIVE_CATEGORY_CONDITION]
    }).select('_id');
    const categoryIds = activeCategories.map((c) => c._id);

    const products = await Product.find({
      $and: [
        NOT_DELETED_CONDITION,
        { category_id: { $in: categoryIds } }
      ]
    })
      .populate({ path: 'category_id', model: 'Category' })
      .sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      data: products.map(normalizeProduct)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.seedProducts = async (req, res) => {
  try {
    const menuData = req.body;
    await Product.deleteMany({});
    const products = await Product.insertMany(menuData);

    return res.status(201).json({
      success: true,
      message: 'Đã nạp dữ liệu menu thành công!',
      count: products.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAdminProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 6,
      q = '',
      category = '',
      stock_status = '',
      min_price = '',
      max_price = '',
      active = ''
    } = req.query;

    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 6));
    const skip = (parsedPage - 1) * parsedLimit;

    const conditions = [NOT_DELETED_CONDITION];
    if (category) conditions.push({ category_id: category });
    if (active === 'true') conditions.push({ is_active: true });
    if (active === 'false') conditions.push({ is_active: false });
    if (q && String(q).trim()) {
      const keyword = String(q).trim();
      conditions.push({
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { slug: { $regex: keyword, $options: 'i' } }
        ]
      });
    }

    if (min_price || max_price) {
      const priceQuery = {};
      if (min_price) priceQuery.$gte = Number(min_price);
      if (max_price) priceQuery.$lte = Number(max_price);
      conditions.push({ base_price_cents: priceQuery });
    }

    if (stock_status === 'out') {
      conditions.push({ $expr: { $lte: [{ $ifNull: ['$stock', '$stock_quantity'] }, 0] } });
    }
    if (stock_status === 'low') {
      conditions.push({
        $expr: {
          $and: [
            { $gt: [{ $ifNull: ['$stock', '$stock_quantity'] }, 0] },
            { $lt: [{ $ifNull: ['$stock', '$stock_quantity'] }, 10] }
          ]
        }
      });
    }
    if (stock_status === 'in') {
      conditions.push({ $expr: { $gte: [{ $ifNull: ['$stock', '$stock_quantity'] }, 10] } });
    }
    const query = { $and: conditions };

    const [products, total, grouped] = await Promise.all([
      Product.find(query)
        .populate('category_id', 'name slug')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parsedLimit),
      Product.countDocuments(query),
      Product.aggregate([
        { $match: NOT_DELETED_CONDITION },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$is_active', true] }, 1, 0] } },
            hidden: { $sum: { $cond: [{ $eq: ['$is_active', false] }, 1, 0] } },
            out_or_low: {
              $sum: {
                $cond: [{ $lte: [{ $ifNull: ['$stock', '$stock_quantity'] }, 10] }, 1, 0]
              }
            }
          }
        }
      ])
    ]);

    return res.json({
      success: true,
      data: products.map(normalizeProduct),
      stats: {
        total: grouped[0]?.total || 0,
        active: grouped[0]?.active || 0,
        hidden: grouped[0]?.hidden || 0,
        low_or_out: grouped[0]?.out_or_low || 0
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

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      base_price_cents,
      image_url,
      category_id,
      is_spicy = false,
      is_available = true,
      is_active = true,
      stock,
      stock_quantity,
      low_stock_threshold = 10
    } = req.body;

    if (!name || !slug || !base_price_cents || !category_id) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc của sản phẩm' });
    }

    const category = await Category.findById(category_id);
    if (!category) {
      return res.status(400).json({ success: false, message: 'Danh mục không tồn tại' });
    }

    const normalizedStock = Math.max(0, Number(stock ?? stock_quantity ?? Math.floor(Math.random() * 101)));
    const product = await Product.create({
      name: String(name).trim(),
      slug: String(slug).trim().toLowerCase(),
      description: description ? String(description).trim() : '',
      base_price_cents: Number(base_price_cents),
      image_url: image_url ? String(image_url).trim() : '',
      category_id,
      is_spicy: !!is_spicy,
      is_available: !!is_available,
      is_active: !!is_active,
      stock: normalizedStock,
      stock_quantity: normalizedStock,
      low_stock_threshold: Number(low_stock_threshold ?? 10)
    });

    await logStaffActivity({
      staffId: req.user?._id,
      action: 'create_product',
      entityType: 'product',
      entityId: product._id,
      description: `Tạo sản phẩm ${product.name}`
    });
    return res.status(201).json({
      success: true,
      message: 'Đã tạo sản phẩm thành công',
      data: normalizeProduct(product)
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    const payload = { ...req.body };
    if (payload.base_price_cents !== undefined) payload.base_price_cents = Number(payload.base_price_cents);
    if (payload.stock !== undefined) payload.stock = Number(payload.stock);
    if (payload.stock_quantity !== undefined) payload.stock_quantity = Number(payload.stock_quantity);
    if (payload.low_stock_threshold !== undefined) payload.low_stock_threshold = Number(payload.low_stock_threshold);
    if (payload.stock !== undefined && payload.stock_quantity === undefined) payload.stock_quantity = payload.stock;
    if (payload.stock_quantity !== undefined && payload.stock === undefined) payload.stock = payload.stock_quantity;

    const product = await Product.findOneAndUpdate(
      { $and: [{ _id: id }, NOT_DELETED_CONDITION] },
      payload,
      { new: true }
    ).populate('category_id', 'name slug');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    await logStaffActivity({
      staffId: req.user?._id,
      action: 'update_product',
      entityType: 'product',
      entityId: product._id,
      description: `Cập nhật sản phẩm ${product.name}`,
      payload
    });
    return res.json({
      success: true,
      message: 'Đã cập nhật sản phẩm',
      data: normalizeProduct(product)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleProductActive = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ $and: [{ _id: id }, NOT_DELETED_CONDITION] });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    product.is_active = !product.is_active;
    await product.save();

    await logStaffActivity({
      staffId: req.user?._id,
      action: 'toggle_product_active',
      entityType: 'product',
      entityId: product._id,
      description: `${product.is_active ? 'Bật' : 'Tắt'} sản phẩm ${product.name}`
    });
    return res.json({
      success: true,
      message: product.is_active ? 'Đã bật sản phẩm' : 'Đã tắt sản phẩm',
      data: normalizeProduct(product)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ $and: [{ _id: id }, NOT_DELETED_CONDITION] });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    product.is_deleted = true;
    product.deleted_at = new Date();
    product.is_active = false;
    await product.save();

    await logStaffActivity({
      staffId: req.user?._id,
      action: 'soft_delete_product',
      entityType: 'product',
      entityId: product._id,
      description: `Xóa mềm sản phẩm ${product.name}`
    });
    return res.json({
      success: true,
      message: 'Đã xóa mềm sản phẩm'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.stockInProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, source, note = '' } = req.body;

    if (!quantity || Number(quantity) <= 0 || !source) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin nhập kho' });
    }

    const product = await Product.findOne({ $and: [{ _id: id }, NOT_DELETED_CONDITION] });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    const qty = Number(quantity);
    const currentStock = getStockValue(product);
    product.stock = currentStock + qty;
    product.stock_quantity = currentStock + qty;
    await product.save();

    const stockLog = await StockHistory.create({
      product_id: product._id,
      product_name: product.name,
      quantity_in: qty,
      source: String(source).trim(),
      note: String(note || '').trim(),
      created_by: req.user?._id || null
    });

    await logStaffActivity({
      staffId: req.user?._id,
      action: 'stock_in_product',
      entityType: 'product',
      entityId: product._id,
      description: `Nhập kho sản phẩm ${product.name}: +${qty}`,
      payload: { quantity: qty, source }
    });
    return res.json({
      success: true,
      message: 'Nhập hàng thành công',
      data: {
        product: normalizeProduct(product),
        stock_history: stockLog
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStockQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity, reason = 'Điều chỉnh tồn kho', note = '' } = req.body || {};
    if (stock_quantity === undefined || stock_quantity === null || Number.isNaN(Number(stock_quantity))) {
      return res.status(400).json({ success: false, message: 'Giá trị tồn kho không hợp lệ' });
    }

    const product = await Product.findOne({ $and: [{ _id: id }, NOT_DELETED_CONDITION] });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    const prevStock = getStockValue(product);
    const nextStock = Number(stock_quantity);
    product.stock = nextStock;
    product.stock_quantity = nextStock;
    await product.save();

    await StockHistory.create({
      product_id: product._id,
      product_name: product.name,
      quantity_in: nextStock - prevStock,
      source: String(reason || 'Điều chỉnh tồn kho').trim(),
      note: String(note || '').trim(),
      created_by: req.user?._id || null
    });

    await logStaffActivity({
      staffId: req.user?._id,
      action: 'update_stock_quantity',
      entityType: 'product',
      entityId: product._id,
      description: `Cập nhật tồn kho ${product.name}: ${prevStock} -> ${nextStock}`,
      payload: { previous: prevStock, current: nextStock, reason, note }
    });

    return res.json({
      success: true,
      message: 'Đã cập nhật tồn kho',
      data: normalizeProduct(product)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStockHistory = async (req, res) => {
  try {
    const { page = 1, limit = 6, q = '', startDate = '', endDate = '' } = req.query;
    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 6));
    const skip = (parsedPage - 1) * parsedLimit;

    const query = {};
    if (q && String(q).trim()) {
      const keyword = String(q).trim();
      query.$or = [
        { product_name: { $regex: keyword, $options: 'i' } },
        { source: { $regex: keyword, $options: 'i' } }
      ];
    }
    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) query.created_at.$gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) query.created_at.$lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    const [items, total] = await Promise.all([
      StockHistory.find(query)
        .populate('created_by', 'name email')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parsedLimit),
      StockHistory.countDocuments(query)
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
