const mongoose = require('mongoose');
const User = require('../models/user.model');
require('dotenv').config();

const addressByEmail = {
    'admin@sincay.com': '12 Trịnh Đình Thảo, Phường Hòa Thạnh, Quận Tân Phú, TP. Hồ Chí Minh',
    'customer@gmail.com': '58 Lũy Bán Bích, Phường Tân Thới Hòa, Quận Tân Phú, TP. Hồ Chí Minh'
};

const fallbackAddress = 'TP. Hồ Chí Minh';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sincay');
        console.log('Connected to MongoDB');

        const users = await User.find({});
        let updatedCount = 0;

        for (const user of users) {
            if (user.default_shipping_address) continue;
            user.default_shipping_address = addressByEmail[user.email] || fallbackAddress;
            await user.save();
            updatedCount += 1;
        }

        console.log(`Updated ${updatedCount} users with default shipping address.`);
        process.exit(0);
    } catch (error) {
        console.error('Update user address failed:', error);
        process.exit(1);
    }
};

run();

