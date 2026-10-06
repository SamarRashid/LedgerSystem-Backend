const { supabase } = require("../config/db");

// CREATE BILL
const createBill = async (req, res) => {
  try {
    const {
      date,
      billNo,
      copyNo,
      vehicleNo,
      beopari,
      lineItems,
      deductions,
      totals,
      note,
    } = req.body;

    if (!beopari || !billNo || !Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({
        message: "Beopari, bill number and line items are required",
      });
    }

    const ledgerDate = date
      ? String(date).slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    // Check duplicate bill number
    const { data: existingBill, error: duplicateError } = await supabase
      .from("bills")
      .select("id")
      .eq("billNo", String(billNo))
      .maybeSingle();

    if (duplicateError) {
      throw duplicateError;
    }

    if (existingBill) {
      return res.status(409).json({
        message: "Bill number already exists",
      });
    }

    // Calculate each customer's bill amount
    const customerAmounts = {};

    for (const item of lineItems) {
      const customerId =
        item.customer?.id ||
        item.customer?._id ||
        item.customerId ||
        item.customer;

      const amount = Number(item.amount || 0);

      if (customerId && amount > 0) {
        customerAmounts[String(customerId)] =
          (customerAmounts[String(customerId)] || 0) + amount;
      }
    }

    // Save bill
    const { data: bill, error: billError } = await supabase
      .from("bills")
      .insert([
        {
          date: ledgerDate,
          billNo: String(billNo),
          copyNo: copyNo || "",
          vehicleNo: vehicleNo || "",
          beopari,
          lineItems,
          deductions: deductions || {},
          totals: totals || {},
          note: note || "",
        },
      ])
      .select()
      .single();

    if (billError) {
      throw billError;
    }

    const ledgers = [];

    // Create SALE ledger entry for each customer
    for (const [customerId, billAmount] of Object.entries(customerAmounts)) {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .maybeSingle();

      if (customerError) {
        throw customerError;
      }

      if (!customer) {
        throw new Error(`Customer not found: ${customerId}`);
      }

      const { data: previousLedgers, error: ledgerFetchError } = await supabase
        .from("customer_ledgers")
        .select("remainingBalance,date,createdAt")
        .eq("customerId", customerId)
        .order("date", { ascending: false })
        .order("createdAt", { ascending: false })
        .limit(1);

      if (ledgerFetchError) {
        throw ledgerFetchError;
      }

      const lastLedger = previousLedgers?.[0];

      const previousBalance = Number(
        lastLedger?.remainingBalance ?? customer.openingBalance ?? 0
      );

      const remainingBalance = previousBalance + billAmount;

      const ledgerEntry = {
        customerId,
        customerCode:
          customer.customerCode || customer.accountNo || customer.code || "",
        customerNameUrdu:
          customer.customerNameUrdu || customer.nameUrdu || "",
        customerNameEnglish:
          customer.customerNameEnglish ||
          customer.nameEnglish ||
          customer.name ||
          "",
        date: ledgerDate,
        type: "SALE",
        receiptNo: "",
        billId: bill.id,
        billNo: String(billNo),
        copyNo: copyNo || "",
        vehicleNo: vehicleNo || "",
        description: `Sale Bill #${billNo}`,
        lineItems,
        deductions: deductions || {},
        totals: totals || {},
        billAmount,
        previousBalance,
        receivedAmount: 0,
        remainingBalance,
      };

      const { data: ledger, error: ledgerError } = await supabase
        .from("customer_ledgers")
        .insert([ledgerEntry])
        .select()
        .single();

      if (ledgerError) {
        throw ledgerError;
      }

      ledgers.push(ledger);
    }

    return res.status(201).json({
      message: "Bill created successfully",
      bill,
      ledgerDate,
      customerAmounts,
      ledgers,
    });
  } catch (error) {
    console.error("Create bill error:", error.message);

    return res.status(500).json({
      message: "Failed to create bill",
      error: error.message,
    });
  }
};

// GET ALL BILLS
const getBills = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get bills error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch bills",
      error: error.message,
    });
  }
};

// GET BILL BY ID
const getBillById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        message: "Bill not found",
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Get bill error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch bill",
      error: error.message,
    });
  }
};

// GET CUSTOMER LEDGER
const getCustomerLedger = async (req, res) => {
  try {
    const { customerId } = req.params;

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .maybeSingle();

    if (customerError) {
      throw customerError;
    }

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const { data: ledger, error: ledgerError } = await supabase
      .from("customer_ledgers")
      .select("*")
      .eq("customerId", customerId)
      .order("date", { ascending: true })
      .order("createdAt", { ascending: true });

    if (ledgerError) {
      throw ledgerError;
    }

    const openingBalance = Number(customer.openingBalance || 0);
    const lastLedger = ledger?.[ledger.length - 1];

    return res.status(200).json({
      customer,
      ledger: ledger || [],
      openingBalance,
      previousBalance: Number(
        lastLedger?.previousBalance ?? openingBalance
      ),
      remainingBalance: Number(
        lastLedger?.remainingBalance ?? openingBalance
      ),
    });
  } catch (error) {
    console.error("Get customer ledger error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch customer ledger",
      error: error.message,
    });
  }
};

// DELETE BILL
const deleteBill = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: bill, error: findError } = await supabase
      .from("bills")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      });
    }

    // Delete associated ledger entries first
    const { error: ledgerError } = await supabase
      .from("customer_ledgers")
      .delete()
      .eq("billId", id);

    if (ledgerError) {
      throw ledgerError;
    }

    const { error: deleteError } = await supabase
      .from("bills")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    return res.status(200).json({
      message: "Bill and associated ledger entries deleted successfully",
    });
  } catch (error) {
    console.error("Delete bill error:", error.message);

    return res.status(500).json({
      message: "Failed to delete bill",
      error: error.message,
    });
  }
};

module.exports = {
  createBill,
  getBills,
  getBillById,
  getCustomerLedger,
  deleteBill,
};