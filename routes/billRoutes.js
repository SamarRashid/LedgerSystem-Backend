const express = require("express");

const router = express.Router();

const {
  createBill,
  getBills,
} = require("../controllers/billController");

// Create Bill
router.post("/", createBill);

// Get All Bills
router.get("/", getBills);

module.exports = router;