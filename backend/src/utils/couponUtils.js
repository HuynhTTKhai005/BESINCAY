const Coupon = require('../models/coupon.model');

const computeDiscountAmount = (coupon, subtotal) => {
    if (!coupon || subtotal <= 0) return 0;

    let discount = 0;
    if (coupon.discount_type === 'percent') {
        discount = (subtotal * coupon.discount_value) / 100;
    } else {
        discount = coupon.discount_value;
    }

    if (coupon.max_discount_value && discount > coupon.max_discount_value) {
        discount = coupon.max_discount_value;
    }

    if (discount > subtotal) {
        discount = subtotal;
    }

    return Math.round(discount);
};

const validateCoupon = async (code, subtotal) => {
    const normalizedCode = String(code || '').trim().toUpperCase();
    if (!normalizedCode) {
        return { valid: false, message: 'Vui lòng nhập mã giảm giá' };
    }

    const coupon = await Coupon.findOne({ code: normalizedCode });
    if (!coupon) {
        return { valid: false, message: 'Mã giảm giá không tồn tại' };
    }

    if (!coupon.is_active) {
        return { valid: false, message: 'Mã giảm giá đã ngừng hoạt động' };
    }

    if (coupon.start_date && new Date() < coupon.start_date) {
        return { valid: false, message: 'Mã giảm giá chưa đến thời gian sử dụng' };
    }

    if (coupon.end_date && new Date() > coupon.end_date) {
        return { valid: false, message: 'Mã giảm giá đã hết hạn' };
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        return { valid: false, message: 'Mã giảm giá đã hết lượt sử dụng' };
    }

    if (subtotal < coupon.min_order_value) {
        return {
            valid: false,
            message: `Đơn tối thiểu ${coupon.min_order_value.toLocaleString('vi-VN')} VNĐ để dùng mã này`
        };
    }

    const discount_amount = computeDiscountAmount(coupon, subtotal);
    return {
        valid: true,
        coupon,
        discount_amount
    };
};

module.exports = {
    validateCoupon,
    computeDiscountAmount
};

