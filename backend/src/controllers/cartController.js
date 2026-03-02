const Cart = require('../models/cart.model.js');
const Product = require('../models/product.model.js');
const Category = require('../models/category.model.js');

const cartController = {
    // Lấy giỏ hàng   
    getCart: async (req, res) => {
        try {
            let cart = await Cart.findOne({ user_id: req.user._id });

            if (!cart) {
                // Tạo giỏ mới  
                cart = new Cart({
                    user_id: req.user._id,
                    items: []
                });
                await cart.save();
            }

            res.json({
                success: true,
                data: cart
            });
        } catch (error) {
            console.error('Get cart error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi lấy giỏ hàng'
            });
        }
    },

    // Thêm sp
    addToCart: async (req, res) => {
        try {
            const { product, quantity = 1 } = req.body;

            if (!product || !product.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Thông tin sản phẩm không hợp lệ'
                });
            }

            const productDoc = await Product.findById(product.id).populate('category_id', 'is_active is_deleted');
            if (!productDoc || productDoc.is_deleted) {
                return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại hoặc đã bị xóa' });
            }
            const categoryActive = productDoc.category_id
                ? (productDoc.category_id.is_active !== false && !productDoc.category_id.is_deleted)
                : true;
            const isProductActive = productDoc.is_active !== false && productDoc.is_available !== false;
            const stock = Number(productDoc.stock_quantity || 0);
            if (!isProductActive || !categoryActive || stock <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Sản phẩm hiện không thể thêm vào giỏ hàng'
                });
            }

            let cart = await Cart.findOne({ user_id: req.user._id });

            if (!cart) {
                cart = new Cart({
                    user_id: req.user._id,
                    items: []
                });
            }

            // Kiểm tra có chưa
            const existingItemIndex = cart.items.findIndex(item =>
                item.product_id && item.product_id.toString() === product.id &&
                JSON.stringify(item.spicyInfo) === JSON.stringify(product.spicyInfo || {})
            );

            if (existingItemIndex >= 0) {
                //số lượng 
                cart.items[existingItemIndex].quantity += quantity;
            } else {
                // Thêm sản phẩm mới
                cart.items.push({
                    product_id: product.id,
                    name: product.name,
                    description: product.description,
                    base_price_cents: product.base_price_cents,
                    image_url: product.image_url,
                    slug: product.slug,
                    quantity,
                    spicyInfo: product.spicyInfo || null
                });
            }

            await cart.save();

            res.json({
                success: true,
                message: 'Đã thêm vào giỏ hàng',
                data: cart
            });
        } catch (error) {
            console.error('Add to cart error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi thêm vào giỏ hàng'
            });
        }
    },

    // Cập nhật số lượng sản phẩm
    updateQuantity: async (req, res) => {
        try {
            // Validate user authentication
            if (!req.user || !req.user._id) {
                return res.status(401).json({
                    success: false,
                    message: 'Vui lòng đăng nhập để tiếp tục'
                });
            }

            const { itemId, quantity } = req.body;

            const cart = await Cart.findOne({ user_id: req.user._id });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Giỏ hàng không tồn tại'
                });
            }

            const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
            if (itemIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Sản phẩm không tồn tại trong giỏ hàng'
                });
            }

            if (quantity <= 0) {
                // Xóa sản phẩm nếu số lượng <= 0
                cart.items.splice(itemIndex, 1);
            } else {
                cart.items[itemIndex].quantity = quantity;
            }

            await cart.save();

            res.json({
                success: true,
                message: 'Đã cập nhật giỏ hàng',
                data: cart
            });
        } catch (error) {
            console.error('Update cart error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi cập nhật giỏ hàng'
            });
        }
    },

    // Xóa sản phẩm khỏi giỏ hàng
    removeFromCart: async (req, res) => {
        try {
            
            if (!req.user || !req.user._id) {
                return res.status(401).json({
                    success: false,
                    message: 'Vui lòng đăng nhập để tiếp tục'
                });
            }

            const { itemId } = req.body;

            const cart = await Cart.findOne({ user_id: req.user._id });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Giỏ hàng không tồn tại'
                });
            }

            const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
            if (itemIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Sản phẩm không tồn tại trong giỏ hàng'
                });
            }

            cart.items.splice(itemIndex, 1);
            await cart.save();

            res.json({
                success: true,
                message: 'Đã xóa sản phẩm khỏi giỏ hàng',
                data: cart
            });
        } catch (error) {
            console.error('Remove from cart error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi xóa sản phẩm'
            });
        }
    },

    // Xóa toàn bộ giỏ hàng
    clearCart: async (req, res) => {
        try {
            // Validate user authentication
            if (!req.user || !req.user._id) {
                return res.status(401).json({
                    success: false,
                    message: 'Vui lòng đăng nhập để tiếp tục'
                });
            }

            const cart = await Cart.findOne({ user_id: req.user._id });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Giỏ hàng không tồn tại'
                });
            }

            cart.items = [];
            await cart.save();

            res.json({
                success: true,
                message: 'Đã xóa toàn bộ giỏ hàng',
                data: cart
            });
        } catch (error) {
            console.error('Clear cart error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi xóa giỏ hàng'
            });
        }
    }
};

module.exports = cartController;
