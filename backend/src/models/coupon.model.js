const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        description: { type: String, default: '' },
        discount_type: { type: String, enum: ['percent', 'fixed'], required: true },
        discount_value: { type: Number, required: true, min: 0 },
        min_order_value: { type: Number, default: 0, min: 0 },
        max_discount_value: { type: Number, default: null, min: 0 },
        usage_limit: { type: Number, default: null, min: 1 },
        used_count: { type: Number, default: 0, min: 0 },
        start_date: { type: Date, default: null },
        end_date: { type: Date, default: null },
        is_active: { type: Boolean, default: true }
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

module.exports = mongoose.model('Coupon', couponSchema);
