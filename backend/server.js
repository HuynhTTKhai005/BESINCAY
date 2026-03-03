require('dotenv').config();
const express = require('express');

const cors = require("cors")
const connectDB = require("./src/config/db.js");
const cookieParser = require('cookie-parser');

const productRoute = require("./src/routes/product.route.js");
const categoryRoute = require("./src/routes/category.route.js");
const app = express(); const path = require('path');
const authRoute = require('./src/routes/auth.route.js');
const cartRoute = require('./src/routes/cart.route.js');
const orderRoute = require('./src/routes/order.route.js');
const userRoute = require('./src/routes/user.route.js');
const wishlistRoute = require('./src/routes/wishlist.route.js');
const couponRoute = require('./src/routes/coupon.route.js');
const reservationRoute = require('./src/routes/reservation.route.js');
const contactMessageRoute = require('./src/routes/contactMessage.route.js');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true
}));
app.use(cookieParser());


// Connect MongoDB
connectDB();


//Route
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/products', productRoute);
app.use('/api/auth', authRoute);
app.use('/api/cart', cartRoute);
app.use('/api/categories', categoryRoute);
app.use('/api/orders', orderRoute);
app.use('/api/users', userRoute);
app.use('/api/wishlist', wishlistRoute);
app.use('/api/coupons', couponRoute);
app.use('/api/reservations', reservationRoute);
app.use('/api/contact-messages', contactMessageRoute);


// role
const Role = require('./src/models/role.model.js');
const initializeRoles = async () => {
    const roles = ['customer', 'admin', 'staff'];
    for (const roleName of roles) {
        const existingRole = await Role.findOne({ name: roleName });
        if (!existingRole) {
            await Role.create({ name: roleName });
            console.log(`Created role: ${roleName}`);
        }
    }
};

initializeRoles().catch((error) => {
    console.error('Role initialization error:', error);
});


 app.get("/api/health", (req, res) => {
    res.json({ status: "OK" })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`)
})
