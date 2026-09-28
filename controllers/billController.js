const Bill = require('../models/billModel');

// @desc    Create new bill/invoice
// @route   POST /api/bills
// @access  Public (should be protected in prod)
const createBill = async (req, res) => {
  try {
    const { date, billNo, copyNo, vehicleNo, beopari, lineItems, deductions, totals, note } = req.body;

    if (!beopari || !lineItems || lineItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Beopari and line items are required' });
    }

    // Check if bill exists
    const billExists = await Bill.findOne({ billNo });
    if (billExists) {
      return res.status(400).json({ success: false, message: `Bill No ${billNo} already exists` });
    }

    const bill = await Bill.create({
      date,
      billNo,
      copyNo,
      vehicleNo,
      beopari,
      lineItems,
      deductions,
      totals,
      note
    });

    // NOTE: Ledger logic (updating customer/supplier balances) should be added here later 
    // according to your specific Ledger Schema design. 

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: bill
    });
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all bills
// @route   GET /api/bills
// @access  Public
const getBills = async (req, res) => {
  try {
    const bills = await Bill.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: bills.length, data: bills });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  createBill,
  getBills
};
