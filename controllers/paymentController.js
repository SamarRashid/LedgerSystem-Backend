const Payment = require('../models/paymentModel');
const Customer = require('../models/Customer');

const createPayment = async (req, res) => {
  try {
    const { date, paymentNo, customer, amount, discount, netAmount, note } = req.body;
    if (!customer || !amount) return res.status(400).json({ success: false, message: 'Customer and amount are required' });

    const exists = await Payment.findOne({ paymentNo });
    if (exists) return res.status(400).json({ success: false, message: "Payment already exists" });

    // Create payment
    const payment = await Payment.create({ date, paymentNo, customer, amount, discount, netAmount, note });
    
    // Update customer balance (Payment means we paid customer, so their balance increases)
    if (customer.id) {
      await Customer.findByIdAndUpdate(customer.id, { $inc: { openingBalance: amount } });
    }

    res.status(201).json({ success: true, message: 'Payment created', data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { createPayment, getPayments };