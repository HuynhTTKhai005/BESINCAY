const mongoose = require('mongoose');
const Coupon = require('../models/coupon.model');
require('dotenv').config();

const coupons = [
    {
        code: 'WELCOME10',
        description: 'Giảm 10% cho đơn đầu tiên',
        discount_type: 'percent',
        discount_value: 10,
        min_order_value: 100000,
        max_discount_value: 50000,
        is_active: true
    },
    {
        code: 'SHIPFREE20',
        description: 'Giảm 20.000đ',
        discount_type: 'fixed',
        discount_value: 20000,
        min_order_value: 80000,
        is_active: true
    }
];

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sincay');
        console.log('Connected to MongoDB');

        for (const item of coupons) {
            await Coupon.updateOne(
                { code: item.code },
                { $set: item },
                { upsert: true }
            );
        }

        console.log('Seed coupon thành công');
        process.exit(0);
    } catch (error) {
        console.error('Seed coupon thất bại:', error);
        process.exit(1);
    }
};

run();

