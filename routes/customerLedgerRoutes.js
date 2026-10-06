const express = require("express");
const { supabase } = require("../config/db");

const router = express.Router();

// GET CUSTOMER CURRENT BALANCE
// GET /api/customerledgers/customer/:customerId/balance
router.get("/customer/:customerId/balance", async (req, res) => {
try {
const { customerId } = req.params;

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

const { data: ledgers, error: ledgerError } = await supabase
  .from("customer_ledgers")
  .select("*")
  .eq("customerId", customerId)
  .order("date", { ascending: false })
  .order("createdAt", { ascending: false })
  .limit(1);

if (ledgerError) throw ledgerError;

const latestLedger = ledgers?.[0] || null;
const openingBalance = Number(customer.openingBalance || 0);
const remainingBalance = latestLedger
  ? Number(latestLedger.remainingBalance || 0)
  : openingBalance;

return res.status(200).json({
  success: true,
  data: {
    customerId: customer.id,
    customerCode: customer.code || "",
    customerNameUrdu: customer.nameUrdu || "",
    customerNameEnglish: customer.nameEnglish || "",
    openingBalance,
    previousBalance: latestLedger
      ? Number(latestLedger.previousBalance || 0)
      : openingBalance,
    remainingBalance,
    lastTransaction: latestLedger
      ? {
          id: latestLedger.id,
          date: latestLedger.date,
          type: latestLedger.type,
          billNo: latestLedger.billNo || "",
          receiptNo: latestLedger.receiptNo || "",
          billAmount: Number(latestLedger.billAmount || 0),
          receivedAmount: Number(latestLedger.receivedAmount || 0),
          previousBalance: Number(latestLedger.previousBalance || 0),
          remainingBalance: Number(latestLedger.remainingBalance || 0),
          description: latestLedger.description || "",
        }
      : null,
  },
});

} catch (error) {
console.error("GET CUSTOMER LEDGER BALANCE ERROR:", error);

return res.status(500).json({
  success: false,
  message: "Failed to fetch customer balance",
  error: error.message,
});

}
});

// GET COMPLETE CUSTOMER LEDGER
// GET /api/customerledgers/customer/:customerId
router.get("/customer/:customerId", async (req, res) => {
try {
const { customerId } = req.params;

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

const { data: ledger, error: ledgerError } = await supabase
  .from("customer_ledgers")
  .select("*")
  .eq("customerId", customerId)
  .order("date", { ascending: true })
  .order("createdAt", { ascending: true });

if (ledgerError) throw ledgerError;

const entries = ledger || [];
const openingBalance = Number(customer.openingBalance || 0);
const lastLedger = entries.length ? entries[entries.length - 1] : null;

const remainingBalance = lastLedger
  ? Number(lastLedger.remainingBalance || 0)
  : openingBalance;

return res.status(200).json({
  success: true,
  customer: {
    id: customer.id,
    customerCode: customer.code || "",
    customerNameUrdu: customer.nameUrdu || "",
    customerNameEnglish: customer.nameEnglish || "",
    openingBalance,
  },
  ledger: entries,
  openingBalance,
  previousBalance: remainingBalance,
  remainingBalance,
  totalTransactions: entries.length,
});


} catch (error) {
console.error("GET CUSTOMER LEDGER ERROR:", error);

return res.status(500).json({
  success: false,
  message: "Failed to fetch customer ledger",
  error: error.message,
});


}
});

// GET ALL CUSTOMER LEDGERS
// GET /api/customerledgers
router.get("/", async (req, res) => {
try {
const { data, error } = await supabase
.from("customer_ledgers")
.select("*")
.order("date", { ascending: false })
.order("createdAt", { ascending: false });

if (error) throw error;

return res.status(200).json({
  success: true,
  count: data.length,
  data,
});


} catch (error) {
console.error("GET ALL CUSTOMER LEDGERS ERROR:", error);


return res.status(500).json({
  success: false,
  message: "Failed to fetch customer ledgers",
  error: error.message,
});

}
});

// GET SINGLE LEDGER ENTRY
// GET /api/customerledgers/:id
router.get("/:id", async (req, res) => {
try {
const { id } = req.params;

const { data, error } = await supabase
  .from("customer_ledgers")
  .select("*")
  .eq("id", id)
  .maybeSingle();

if (error) throw error;

if (!data) {
  return res.status(404).json({
    success: false,
    message: "Ledger entry not found",
  });
}

return res.status(200).json({
  success: true,
  data,
});

} catch (error) {
console.error("GET SINGLE LEDGER ERROR:", error);

return res.status(500).json({
  success: false,
  message: "Failed to fetch ledger entry",
  error: error.message,
});

}
});

module.exports = router;