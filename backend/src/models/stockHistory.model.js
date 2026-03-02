const mongoose = require('mongoose');

const stockHistorySchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    product_name: { type: String, required: true, trim: true },
    quantity_in: { type: Number, required: true, min: 1 },
    source: { type: String, required: true, trim: true },
    note: { type: String, default: '', trim: true },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

stockHistorySchema.index({ created_at: -1 });
stockHistorySchema.index({ product_id: 1, created_at: -1 });

module.exports = mongoose.model('StockHistory', stockHistorySchema);
