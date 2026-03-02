const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
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
    quantity: { type: Number, required: true, min: 1 },
    spicyInfo: {
        level: { type: Number, min: 1, max: 5 },
        note: { type: String }
    }
}, { _id: true });

const orderTimelineSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'ready', 'shipping', 'completed', 'cancel_requested', 'cancelled'],
        required: true
    },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
}, { _id: true });

const orderSchema = new mongoose.Schema({
    order_id: {
        type: String,
        required: true,
        unique: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    customer: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String },
        address: { type: String, required: true }
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 20000 },
    coupon_code: { type: String, default: null },
    discountAmount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'ready', 'shipping', 'completed', 'cancel_requested', 'cancelled'],
        default: 'pending'
    },
    cancel_request: {
        reason: { type: String, default: null },
        note: { type: String, default: null },
        requested_at: { type: Date, default: null },
        result: {
            type: String,
            enum: ['pending', 'approved', 'rejected', null],
            default: null
        },
        result_note: { type: String, default: null },
        reviewed_at: { type: Date, default: null }
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'banking'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    note: { type: String },
    timeline: [orderTimelineSchema],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Indexes for better performance
orderSchema.index({ user_id: 1, created_at: -1 });
orderSchema.index({ status: 1 });

// Middleware để cập nhật updated_at
orderSchema.pre('save', function () {
    this.updated_at = Date.now();
});

// Virtual for formatted order ID
orderSchema.virtual('formattedOrderId').get(function () {
    return `ORD-${this.created_at.getTime()}-${this._id.toString().slice(-5).toUpperCase()}`;
});

// Method to add timeline event
orderSchema.methods.addTimelineEvent = function (status, message) {
    this.timeline.push({
        status,
        message,
        timestamp: new Date()
    });
    this.status = status;
    return this.save();
};

module.exports = mongoose.model('Order', orderSchema);
