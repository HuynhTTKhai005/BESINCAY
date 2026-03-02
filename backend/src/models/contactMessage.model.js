const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        subject: { type: String, required: true, trim: true },
        message: { type: String, required: true, trim: true },
        status: {
            type: String,
            enum: ['new', 'read', 'resolved'],
            default: 'new'
        }
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

contactMessageSchema.index({ created_at: -1 });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);

