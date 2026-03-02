const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        phone: { type: String, required: true, trim: true },
        reservation_date: { type: String, required: true, trim: true },
        reservation_time: { type: String, required: true, trim: true },
        people: { type: Number, required: true, min: 1, max: 50 },
        note: { type: String, default: '', trim: true },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled'],
            default: 'pending'
        }
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

reservationSchema.index({ created_at: -1 });

module.exports = mongoose.model('Reservation', reservationSchema);

