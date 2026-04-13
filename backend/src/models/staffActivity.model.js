const mongoose = require('mongoose');

const staffActivitySchema = new mongoose.Schema(
  {
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, trim: true },
    entity_type: { type: String, required: true, trim: true },
    entity_id: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

staffActivitySchema.index({ staff_id: 1, created_at: -1 });
staffActivitySchema.index({ action: 1, created_at: -1 });
staffActivitySchema.index({ created_at: -1 });

module.exports = mongoose.model('StaffActivity', staffActivitySchema);
