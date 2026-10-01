
const Bill = require('../models/billModel');

// @desc    Get commission report from bills
// @route   GET /api/commissions
// @access  Public
const getCommissions = async (req, res) => {
  try {
    const bills = await Bill.find({ 'totals.totalCommission': { $gt: 0 } }).sort({ date: -1 });
    
    // Map to a simpler structure for the commission frontend
    const commissionData = bills.map(bill => ({
      _id: bill._id,
      date: bill.date,
      billNo: bill.billNo,
      beopari: bill.beopari,
      netTotal: bill.totals.netTotal,
      totalCommission: bill.totals.totalCommission
    }));

    res.status(200).json({ success: true, data: commissionData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCommissions
};
