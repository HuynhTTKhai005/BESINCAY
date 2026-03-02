const { validateCoupon } = require('../utils/couponUtils');

const couponController = {
    validateCouponCode: async (req, res) => {
        try {
            const { code, subtotal } = req.body;
            const subtotalValue = Number(subtotal || 0);

            if (Number.isNaN(subtotalValue) || subtotalValue < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Giá trị đơn hàng không hợp lệ'
                });
            }

            const result = await validateCoupon(code, subtotalValue);
            if (!result.valid) {
                return res.status(400).json({
                    success: false,
                    message: result.message
                });
            }

            return res.json({
                success: true,
                message: 'Áp mã giảm giá thành công',
                data: {
                    code: result.coupon.code,
                    description: result.coupon.description,
                    discount_type: result.coupon.discount_type,
                    discount_value: result.coupon.discount_value,
                    discount_amount: result.discount_amount
                }
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = couponController;

