const { supabase } = require("../config/db");

// @desc    Create a payment
// @route   POST /api/payments
// @access  Public
const createPayment = async (req, res) => {
  try {
    const {
      date,
      paymentNo,
      customer,
      amount,
      discount,
      netAmount,
      note,
    } = req.body;

    if (!customer || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Customer and a valid amount are required",
      });
    }

    if (!paymentNo) {
      return res.status(400).json({
        success: false,
        message: "Payment number is required",
      });
    }

    // Get customer ID from the customer object
    const customerId =
      customer.id || customer._id || customer.customerId;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    // Check duplicate payment number
    const { data: existingPayment, error: checkError } = await supabase
      .from("payments")
      .select("id")
      .eq("paymentNo", String(paymentNo))
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment already exists",
      });
    }

    // Verify customer exists
    const { data: customerRecord, error: customerError } = await supabase
      .from("customers")
      .select("id, openingBalance")
      .eq("id", customerId)
      .maybeSingle();

    if (customerError) throw customerError;

    if (!customerRecord) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const paymentAmount = Number(amount);

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert([
        {
          date: date || new Date().toISOString().slice(0, 10),
          paymentNo: String(paymentNo),
          customer,
          amount: paymentAmount,
          discount: Number(discount || 0),
          netAmount:
            netAmount !== undefined
              ? Number(netAmount)
              : paymentAmount - Number(discount || 0),
          note: note || "",
        },
      ])
      .select("*")
      .single();

    if (paymentError) throw paymentError;

    // Payment increases the amount owed to the customer
    const newBalance =
      Number(customerRecord.openingBalance || 0) + paymentAmount;

    const { error: balanceError } = await supabase
      .from("customers")
      .update({ openingBalance: newBalance })
      .eq("id", customerId);

    if (balanceError) {
      console.error(
        "Customer balance update error:",
        balanceError.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Payment was saved, but customer balance could not be updated",
        error: balanceError.message,
        data: payment,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Create payment error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Public
const getPayments = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get payments error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createPayment,
  getPayments,
};