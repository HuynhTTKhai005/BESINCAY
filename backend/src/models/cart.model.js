const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: { type: String, required: true },
    description: { type: String },
    base_price_cents: { type: Number, required: true },
    image_url: { type: String },
    slug: { type: String },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    spicyInfo: {
        level: { type: Number, min: 1, max: 5 },
        note: { type: String }
    }
}, { _id: true });

const cartSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Middleware để cập nhật updated_at
cartSchema.pre('save', function () {
    this.updated_at = Date.now();
 });

module.exports = mongoose.model('Cart', cartSchema);