

const mongoose = require('mongoose');
const Role = require('../models/role.model.js');

const roles = [
    { name: 'customer', description: 'Khách hàng' },
    { name: 'admin', description: 'Quản trị viên' },
    { name: 'staff', description: 'Nhân viên' }
];

mongoose.connect('mongodb://localhost:27017/sincay')
    .then(async () => {
        console.log('Connected to MongoDB');

        for (const roleData of roles) {
            const existingRole = await Role.findOne({ name: roleData.name });
            if (!existingRole) {
                await Role.create(roleData);
                console.log(`Created role: ${roleData.name}`);
            }
        }

        console.log('Roles seeded successfully');
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });