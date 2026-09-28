const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  date: { type: String, required: true },
  billNo: { type: String, required: true, unique: true },
  copyNo: { type: String },
  vehicleNo: { type: String },
  beopari: { type: Object, required: true },
  lineItems: { type: Array, required: true },
  deductions: { type: Object },
  totals: { type: Object, required: true },
  note: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);
