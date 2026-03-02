const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    google_id: { type: String, default: null },  
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, default: null },
    default_shipping_address: { type: String, default: null, trim: true },
    password: { type: String, required: function () { return !this.google_id; } },  
    name: { type: String, required: true },
    avatar_url: { type: String, default: '/default-avatar.png' },
    last_login_at: { type: Date, default: null },
    role_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',  
        required: true
    },
    is_active: { type: Boolean, default: true }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }  
});

module.exports = mongoose.model('User', userSchema);
