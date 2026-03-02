const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const Role = require('../models/role.model');
require('dotenv').config();

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sincay');
        console.log('Connected to MongoDB for seeding...');

        await Role.deleteMany({});
        await User.deleteMany({});

        const adminRole = await Role.create({ name: 'admin', description: 'Quản trị viên hệ thống' });
        const customerRole = await Role.create({ name: 'customer', description: 'Khách hàng mua hàng' });

        const hashedPassword = await bcrypt.hash('123456', 10);

        const users = [
            {
                email: 'admin@sincay.com',
                password: hashedPassword,
                name: 'Sincay Admin',
                phone: '0901000001',
                default_shipping_address: '12 Trịnh Đình Thảo, Phường Hòa Thạnh, Quận Tân Phú, TP. Hồ Chí Minh',
                role_id: adminRole._id,
                is_active: true,
                avatar_url: 'http://localhost:4000/menu/admin-avatar.webp'
            },
            {
                email: 'customer@gmail.com',
                password: hashedPassword,
                name: 'Nguyễn Văn A',
                phone: '0902000002',
                default_shipping_address: '58 Lũy Bán Bích, Phường Tân Thới Hòa, Quận Tân Phú, TP. Hồ Chí Minh',
                role_id: customerRole._id,
                is_active: true,
                avatar_url: 'http://localhost:4000/menu/user-avatar.webp'
            }
        ];

        await User.insertMany(users);
        console.log('✅ Seed dữ liệu Users thành công!');
        process.exit();
    } catch (error) {
        console.error('❌ Lỗi khi seed dữ liệu:', error);
        process.exit(1);
    }
};

seedDB();
