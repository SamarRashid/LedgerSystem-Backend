const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const CustomerLedger = require("../models/CustomerLedger");
const Customer = require("../models/Customer");

// ============================================================
// GET CUSTOMER CURRENT BALANCE
// GET /api/customerledgers/customer/:customerId/balance
// ============================================================

router.get(
  "/customer/:customerId/balance",
  async (req, res) => {
    try {
      const { customerId } = req.params;

      // --------------------------------------------------------
      // VALIDATE CUSTOMER ID
      // --------------------------------------------------------

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: "Customer ID is required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Customer ID",
        });
      }

      // --------------------------------------------------------
      // FIND CUSTOMER
      // --------------------------------------------------------

      const customer = await Customer.findById(customerId);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      // --------------------------------------------------------
      // FIND LATEST LEDGER
      // --------------------------------------------------------

      const latestLedger = await CustomerLedger.findOne({
        customerId: customer._id,
      }).sort({
        date: -1,
        createdAt: -1,
      });

      // --------------------------------------------------------
      // CUSTOMER INFORMATION
      // --------------------------------------------------------

      const customerCode =
        customer.customerCode ||
        customer.accountNo ||
        customer.code ||
        "";

      const customerNameUrdu =
        customer.customerNameUrdu ||
        customer.nameUrdu ||
        "";

      const customerNameEnglish =
        customer.customerNameEnglish ||
        customer.nameEnglish ||
        customer.name ||
        "";

      const openingBalance = Number(
        customer.openingBalance || 0
      );

      // --------------------------------------------------------
      // NO LEDGER
      // --------------------------------------------------------

      if (!latestLedger) {
        return res.status(200).json({
          success: true,

          data: {
            customerId: customer._id,

            customerCode,

            customerNameUrdu,

            customerNameEnglish,

            openingBalance,

            previousBalance: openingBalance,

            remainingBalance: openingBalance,

            lastTransaction: null,
          },
        });
      }

      // --------------------------------------------------------
      // LATEST BALANCE
      // --------------------------------------------------------

      const remainingBalance = Number(
        latestLedger.remainingBalance || 0
      );

      const previousBalance = Number(
        latestLedger.previousBalance || 0
      );

      // --------------------------------------------------------
      // RESPONSE
      // --------------------------------------------------------

      return res.status(200).json({
        success: true,

        data: {
          customerId: customer._id,

          customerCode:
            latestLedger.customerCode ||
            customerCode,

          customerNameUrdu:
            latestLedger.customerNameUrdu ||
            customerNameUrdu,

          customerNameEnglish:
            latestLedger.customerNameEnglish ||
            customerNameEnglish,

          openingBalance,

          previousBalance,

          remainingBalance,

          lastTransaction: {
            id: latestLedger._id,

            date: latestLedger.date,

            type: latestLedger.type,

            billNo:
              latestLedger.billNo || "",

            receiptNo:
              latestLedger.receiptNo || "",

            billAmount: Number(
              latestLedger.billAmount || 0
            ),

            receivedAmount: Number(
              latestLedger.receivedAmount || 0
            ),

            previousBalance: Number(
              latestLedger.previousBalance || 0
            ),

            remainingBalance: Number(
              latestLedger.remainingBalance || 0
            ),

            description:
              latestLedger.description || "",
          },
        },
      });
    } catch (error) {
      console.error(
        "GET CUSTOMER LEDGER BALANCE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to fetch customer balance",

        error: error.message,
      });
    }
  }
);

// ============================================================
// GET COMPLETE CUSTOMER LEDGER
// GET /api/customerledgers/customer/:customerId
// ============================================================

router.get(
  "/customer/:customerId",
  async (req, res) => {
    try {
      const { customerId } = req.params;

      // --------------------------------------------------------
      // VALIDATE CUSTOMER ID
      // --------------------------------------------------------

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: "Customer ID is required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer ID",
        });
      }

      // --------------------------------------------------------
      // FIND CUSTOMER
      // --------------------------------------------------------

      const customer = await Customer.findById(customerId);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      // --------------------------------------------------------
      // FIND ALL LEDGER ENTRIES
      // --------------------------------------------------------

      const ledger = await CustomerLedger.find({
        customerId: customer._id,
      }).sort({
        date: 1,
        createdAt: 1,
      });

      // --------------------------------------------------------
      // CUSTOMER INFORMATION
      // --------------------------------------------------------

      const customerCode =
        customer.customerCode ||
        customer.accountNo ||
        customer.code ||
        "";

      const customerNameUrdu =
        customer.customerNameUrdu ||
        customer.nameUrdu ||
        "";

      const customerNameEnglish =
        customer.customerNameEnglish ||
        customer.nameEnglish ||
        customer.name ||
        "";

      const openingBalance = Number(
        customer.openingBalance || 0
      );

      // --------------------------------------------------------
      // CURRENT BALANCE
      // --------------------------------------------------------

      const lastLedger =
        ledger.length > 0
          ? ledger[ledger.length - 1]
          : null;

      const remainingBalance = lastLedger
        ? Number(
            lastLedger.remainingBalance || 0
          )
        : openingBalance;

      // --------------------------------------------------------
      // RESPONSE
      // --------------------------------------------------------

      return res.status(200).json({
        success: true,

        customer: {
          id: customer._id,

          customerCode,

          customerNameUrdu,

          customerNameEnglish,

          openingBalance,
        },

        ledger,

        openingBalance,

        previousBalance: remainingBalance,

        remainingBalance,

        totalTransactions: ledger.length,
      });
    } catch (error) {
      console.error(
        "GET CUSTOMER LEDGER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to fetch customer ledger",

        error: error.message,
      });
    }
  }
);

// ============================================================
// GET ALL CUSTOMER LEDGERS
// GET /api/customerledgers
// ============================================================

router.get("/", async (req, res) => {
  try {
    const ledgers = await CustomerLedger.find()
      .sort({
        date: -1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,

      count: ledgers.length,

      data: ledgers,
    });
  } catch (error) {
    console.error(
      "GET ALL CUSTOMER LEDGERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch customer ledgers",

      error: error.message,
    });
  }
});

// ============================================================
// GET SINGLE LEDGER ENTRY
// GET /api/customerledgers/:id
// ============================================================

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ledger ID",
      });
    }

    const ledger =
      await CustomerLedger.findById(id);

    if (!ledger) {
      return res.status(404).json({
        success: false,
        message: "Ledger entry not found",
      });
    }

    return res.status(200).json({
      success: true,

      data: ledger,
    });
  } catch (error) {
    console.error(
      "GET SINGLE LEDGER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch ledger entry",

      error: error.message,
    });
  }
});

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;