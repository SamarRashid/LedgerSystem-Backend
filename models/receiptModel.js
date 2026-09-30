const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  date: { type: String, required: true },
  receiptNo: { type: String, required: true, unique: true },
  customer: { type: Object, required: true },
  amount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  netAmount: { type: Number, required: true },
  note: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Receipt', receiptSchema);
