const Product = require('../models/product.model');
const Wishlist = require('../models/wishlist.model');

const wishlistController = {
    getWishlist: async (req, res) => {
        try {
            const wishlistItems = await Wishlist.find({ user_id: req.user._id })
                .populate({
                    path: 'product_id',
                    populate: {
                        path: 'category_id',
                        model: 'Category'
                    }
                })
                .sort({ created_at: -1 });

            const normalizedItems = wishlistItems
                .filter((item) => item.product_id)
                .map((item) => ({
                    _id: item._id,
                    created_at: item.created_at,
                    product: item.product_id
                }));

            return res.json({
                success: true,
                data: normalizedItems
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getWishlistIds: async (req, res) => {
        try {
            const wishlistItems = await Wishlist.find({ user_id: req.user._id }).select('product_id');
            const productIds = wishlistItems.map((item) => item.product_id.toString());

            return res.json({
                success: true,
                data: productIds
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    toggleWishlist: async (req, res) => {
        try {
            const { productId } = req.params;
            const product = await Product.findById(productId);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy sản phẩm'
                });
            }

            const existingItem = await Wishlist.findOne({
                user_id: req.user._id,
                product_id: productId
            });

            if (existingItem) {
                await Wishlist.findByIdAndDelete(existingItem._id);
                return res.json({
                    success: true,
                    message: 'Đã xóa sản phẩm khỏi danh sách yêu thích',
                    data: { isFavorite: false }
                });
            }

            await Wishlist.create({
                user_id: req.user._id,
                product_id: productId
            });

            return res.status(201).json({
                success: true,
                message: 'Đã thêm sản phẩm vào danh sách yêu thích',
                data: { isFavorite: true }
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = wishlistController;

