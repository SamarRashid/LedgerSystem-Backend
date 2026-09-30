const Receipt = require('../models/receiptModel');
const Customer = require('../models/Customer');

const createReceipt = async (req, res) => {
  try {
    const { date, receiptNo, customer, amount, discount, netAmount, note } = req.body;
    if (!customer || !amount) return res.status(400).json({ success: false, message: 'Customer and amount are required' });

    const exists = await Receipt.findOne({ receiptNo });
    if (exists) return res.status(400).json({ success: false, message: "Receipt already exists" });

    // Create receipt
    const receipt = await Receipt.create({ date, receiptNo, customer, amount, discount, netAmount, note });
    
    // Update customer balance (Receipt means customer paid us, so their balance decreases)
    if (customer.id) {
      await Customer.findByIdAndUpdate(customer.id, { $inc: { openingBalance: -amount } });
    }

    res.status(201).json({ success: true, message: 'Receipt created', data: receipt });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getReceipts = async (req, res) => {
  try {
    const receipts = await Receipt.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: receipts.length, data: receipts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { createReceipt, getReceipts };