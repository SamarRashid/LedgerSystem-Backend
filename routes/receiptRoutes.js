const express = require("express");

const router = express.Router();

const {
  createReceipt,
  getAllReceipts,
  getCustomerLedger,
} = require("../controllers/receiptController");

// GET all receipts
router.get("/", getAllReceipts);

// CREATE receipt
router.post("/", createReceipt);

// GET customer ledger
router.get("/customer/:customerId", getCustomerLedger);

module.exports = router;