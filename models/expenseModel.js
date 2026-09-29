const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  nameEnglish: { type: String, required: true },
  nameUrdu: { type: String, required: true },
  calculationType: { 
    type: String, 
    required: true, 
    enum: ['Total', 'Per Maund', 'Weight', 'Percentage'] 
  },
  rate: { type: Number, required: true, default: 0 },
  sellerApplicable: { type: Boolean, default: false },
  buyerApplicable: { type: Boolean, default: false },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
