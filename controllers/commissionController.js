const { supabase } = require("../config/db");

// @desc    Get commission report from bills
// @route   GET /api/commissions
// @access  Public
const getCommissions = async (req, res) => {
  try {
    const { data: bills, error } = await supabase
      .from("bills")
      .select("id, date, billNo, beopari, totals")
      .order("date", { ascending: false });

    if (error) {
      throw error;
    }

    // Keep bills that have commission greater than zero
    const commissionData = (bills || [])
      .filter((bill) => {
        const totalCommission = Number(
          bill.totals?.totalCommission || 0
        );

        return totalCommission > 0;
      })
      .map((bill) => ({
        _id: bill.id,
        date: bill.date,
        billNo: bill.billNo,
        beopari: bill.beopari,
        netTotal: bill.totals?.netTotal ?? 0,
        totalCommission: bill.totals?.totalCommission ?? 0,
      }));

    return res.status(200).json({
      success: true,
      data: commissionData,
    });
  } catch (error) {
    console.error("Get commissions error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getCommissions,
};