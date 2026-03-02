const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },  
    description: { type: String },
    base_price_cents: { type: Number, required: true },  
    image_url: { type: String },  
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    is_spicy: { type: Boolean, default: false },
    is_available: { type: Boolean, default: true },
    is_active: { type: Boolean, default: true },
    stock: { type: Number, default: () => Math.floor(Math.random() * 101), min: 0 },
    stock_quantity: { type: Number, default: 100, min: 0 },
    low_stock_threshold: { type: Number, default: 10, min: 0 },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Product', productSchema);
