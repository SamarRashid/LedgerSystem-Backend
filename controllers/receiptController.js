const { supabase } = require("../config/db");

// =====================================================
// CREATE RECEIPT
// =====================================================
const createReceipt = async (req, res) => {
  try {
    const {
      receiptNo,
      date,
      customerId,
      amount,
      note,
      discount = 0,
      netAmount,
    } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    if (amount === undefined || amount === null || amount === "") {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    const receivedAmount = Number(amount);
    const discountAmount = Number(discount || 0);

    if (!Number.isFinite(receivedAmount) || receivedAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    if (!Number.isFinite(discountAmount) || discountAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount",
      });
    }

    const ledgerDate = date
      ? String(date).slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    // Find customer
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .maybeSingle();

    if (customerError) throw customerError;

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const customerCode =
      customer.customerCode || customer.accountNo || customer.code || "";

    const customerNameUrdu =
      customer.customerNameUrdu || customer.nameUrdu || "";

    const customerNameEnglish =
      customer.customerNameEnglish ||
      customer.nameEnglish ||
      customer.name ||
      "";

    // Find today's ledger
    const { data: todayLedger, error: todayLedgerError } = await supabase
      .from("customer_ledgers")
      .select("*")
      .eq("customerId", customerId)
      .eq("date", ledgerDate)
      .order("createdAt", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (todayLedgerError) throw todayLedgerError;

    let previousBalance = Number(customer.openingBalance || 0);

    if (todayLedger) {
      previousBalance = Number(todayLedger.remainingBalance || 0);
    } else {
      // Find latest ledger entry if today's entry doesn't exist
      const { data: lastLedger, error: lastLedgerError } = await supabase
        .from("customer_ledgers")
        .select("remainingBalance")
        .eq("customerId", customerId)
        .order("date", { ascending: false })
        .order("createdAt", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastLedgerError) throw lastLedgerError;

      if (lastLedger) {
        previousBalance = Number(lastLedger.remainingBalance || 0);
      }
    }

    const remainingBalance = previousBalance - receivedAmount;

    const generatedReceiptNo =
      receiptNo || `REC-${Date.now()}`;

    // Check duplicate receipt number
    const { data: existingReceipt, error: duplicateError } = await supabase
      .from("receipts")
      .select("id")
      .eq("receiptNo", generatedReceiptNo)
      .maybeSingle();

    if (duplicateError) throw duplicateError;

    if (existingReceipt) {
      return res.status(400).json({
        success: false,
        message: "Receipt number already exists",
      });
    }

    // Create receipt
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert([
        {
          receiptNo: generatedReceiptNo,
          date: ledgerDate,
          customer: customerId,
          customerCode,
          customerNameUrdu,
          customerNameEnglish,
          amount: receivedAmount,
          previousBalance,
          remainingBalance,
          discount: discountAmount,
          netAmount:
            netAmount !== undefined
              ? Number(netAmount)
              : receivedAmount,
          note: note || "",
        },
      ])
      .select("*")
      .single();

    if (receiptError) throw receiptError;

    // Update today's ledger or create a new one
    if (todayLedger) {
      const updatedReceivedAmount =
        Number(todayLedger.receivedAmount || 0) + receivedAmount;

      const description = todayLedger.description
        ? `${todayLedger.description} | Receipt #${generatedReceiptNo}`
        : note || `کیش وصولی - Receipt #${generatedReceiptNo}`;

      const { error: updateLedgerError } = await supabase
        .from("customer_ledgers")
        .update({
          customerCode,
          customerNameUrdu,
          customerNameEnglish,
          receivedAmount: updatedReceivedAmount,
          previousBalance,
          remainingBalance,
          receiptNo: generatedReceiptNo,
          type: todayLedger.type || "RECEIPT",
          description,
        })
        .eq("id", todayLedger.id);

      if (updateLedgerError) throw updateLedgerError;
    } else {
      const { error: createLedgerError } = await supabase
        .from("customer_ledgers")
        .insert([
          {
            customerId,
            customerCode,
            customerNameUrdu,
            customerNameEnglish,
            date: ledgerDate,
            type: "RECEIPT",
            receiptNo: generatedReceiptNo,
            description:
              note || `کیش وصولی - Receipt #${generatedReceiptNo}`,
            previousBalance,
            receivedAmount,
            remainingBalance,
          },
        ]);

      if (createLedgerError) throw createLedgerError;
    }

    return res.status(201).json({
      success: true,
      message: "Receipt created and customer ledger updated successfully",
      receipt: {
        id: receipt.id,
        receiptNo: receipt.receiptNo,
        date: receipt.date,
        customerId,
        customerCode,
        customerNameUrdu,
        customerNameEnglish,
        amount: receivedAmount,
        previousBalance,
        remainingBalance,
        note: note || "",
      },
    });
  } catch (error) {
    console.error("CREATE RECEIPT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create receipt",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL RECEIPTS
// =====================================================
const getAllReceipts = async (req, res) => {
  try {
    const { data: receipts, error } = await supabase
      .from("receipts")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      receipts: receipts || [],
    });
  } catch (error) {
    console.error("GET ALL RECEIPTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch receipts",
      error: error.message,
    });
  }
};

// =====================================================
// GET CUSTOMER LEDGER
// =====================================================
const getCustomerLedger = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    // Find customer
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .maybeSingle();

    if (customerError) throw customerError;

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Get customer's ledger
    const { data: ledger, error: ledgerError } = await supabase
      .from("customer_ledgers")
      .select("*")
      .eq("customerId", customerId)
      .order("date", { ascending: true })
      .order("createdAt", { ascending: true });

    if (ledgerError) throw ledgerError;

    const openingBalance = Number(customer.openingBalance || 0);
    const ledgerEntries = ledger || [];
    const lastLedger =
      ledgerEntries.length > 0
        ? ledgerEntries[ledgerEntries.length - 1]
        : null;

    const previousBalance = lastLedger
      ? Number(lastLedger.remainingBalance || 0)
      : openingBalance;

    return res.status(200).json({
      success: true,
      customer: {
        id: customer.id,
        customerCode:
          customer.customerCode || customer.accountNo || customer.code || "",
        customerNameUrdu:
          customer.customerNameUrdu || customer.nameUrdu || "",
        customerNameEnglish:
          customer.customerNameEnglish ||
          customer.nameEnglish ||
          customer.name ||
          "",
        openingBalance,
      },
      ledger: ledgerEntries,
      openingBalance,
      previousBalance,
      remainingBalance: previousBalance,
    });
  } catch (error) {
    console.error("GET CUSTOMER LEDGER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer ledger",
      error: error.message,
    });
  }
};

module.exports = {
  createReceipt,
  getAllReceipts,
  getCustomerLedger,
};