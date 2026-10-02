const mongoose = require("mongoose");

const Receipt = require("../models/receiptModel");
const CustomerLedger = require("../models/CustomerLedger");
const Customer = require("../models/Customer");

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

    // =================================================
    // VALIDATION
    // =================================================

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    if (amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    const receivedAmount = Number(amount);

    if (
      Number.isNaN(receivedAmount) ||
      receivedAmount < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    // =================================================
    // CHECK OBJECT ID
    // =================================================

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    // =================================================
    // FIND CUSTOMER
    // =================================================

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // =================================================
    // LEDGER DATE
    // =================================================

    const ledgerDate =
      date ||
      new Date().toISOString().split("T")[0];

    // =================================================
    // FIND TODAY'S CUSTOMER LEDGER
    // =================================================

    const todayLedger = await CustomerLedger.findOne({
      customerId: customer._id,
      date: ledgerDate,
    });

    // =================================================
    // FIND PREVIOUS BALANCE
    // =================================================

    let previousBalance = Number(
      customer.openingBalance || 0
    );

    // If today's ledger exists,
    // use its current remaining balance
    if (todayLedger) {
      previousBalance = Number(
        todayLedger.remainingBalance || 0
      );
    } else {
      // Otherwise find last previous ledger
      const lastLedger = await CustomerLedger.findOne({
        customerId: customer._id,
      }).sort({
        createdAt: -1,
      });

      if (lastLedger) {
        previousBalance = Number(
          lastLedger.remainingBalance || 0
        );
      }
    }

    // =================================================
    // NEW REMAINING BALANCE
    // =================================================

    const remainingBalance =
      previousBalance - receivedAmount;

    // =================================================
    // CREATE RECEIPT
    // =================================================

    const receipt = await Receipt.create({
      receiptNo:
        receiptNo ||
        `REC-${Date.now()}`,

      date: ledgerDate,

      customer: customer._id,

      customerCode:
        customer.customerCode ||
        customer.accountNo ||
        "",

      customerNameUrdu:
        customer.customerNameUrdu ||
        customer.nameUrdu ||
        "",

      customerNameEnglish:
        customer.customerNameEnglish ||
        customer.name ||
        "",

      amount: receivedAmount,

      previousBalance,

      remainingBalance,

      discount: Number(discount || 0),

      netAmount:
        netAmount !== undefined
          ? Number(netAmount)
          : receivedAmount,

      note: note || "",
    });

    // =================================================
    // UPDATE EXISTING TODAY LEDGER
    // =================================================

    if (todayLedger) {

      // Keep customer information updated
      todayLedger.customerCode =
        customer.customerCode ||
        customer.accountNo ||
        "";

      todayLedger.customerNameUrdu =
        customer.customerNameUrdu ||
        customer.nameUrdu ||
        "";

      todayLedger.customerNameEnglish =
        customer.customerNameEnglish ||
        customer.name ||
        "";

      // -------------------------------------------------
      // Add receipt amount to today's received amount
      // -------------------------------------------------

      todayLedger.receivedAmount =
        Number(todayLedger.receivedAmount || 0) +
        receivedAmount;

      // -------------------------------------------------
      // Update balance
      // -------------------------------------------------

      todayLedger.previousBalance =
        previousBalance;

      todayLedger.remainingBalance =
        remainingBalance;

      // -------------------------------------------------
      // Receipt information
      // -------------------------------------------------

      todayLedger.receiptNo =
        receipt.receiptNo;

      // -------------------------------------------------
      // If today's ledger was already SALE,
      // don't change its type unnecessarily.
      // Otherwise set RECEIPT.
      // -------------------------------------------------

      if (!todayLedger.type) {
        todayLedger.type = "RECEIPT";
      }

      // -------------------------------------------------
      // Description
      // -------------------------------------------------

      if (todayLedger.description) {

        todayLedger.description =
          `${todayLedger.description} | Receipt #${receipt.receiptNo}`;

      } else {

        todayLedger.description =
          note ||
          `کیش وصولی - Receipt #${receipt.receiptNo}`;
      }

      await todayLedger.save();

    }

    // =================================================
    // CREATE NEW TODAY LEDGER
    // =================================================

    else {

      await CustomerLedger.create({

        customerId: customer._id,

        customerCode:
          customer.customerCode ||
          customer.accountNo ||
          "",

        customerNameUrdu:
          customer.customerNameUrdu ||
          customer.nameUrdu ||
          "",

        customerNameEnglish:
          customer.customerNameEnglish ||
          customer.name ||
          "",

        date: ledgerDate,

        type: "RECEIPT",

        receiptNo:
          receipt.receiptNo,

        description:
          note ||
          `کیش وصولی - Receipt #${receipt.receiptNo}`,

        previousBalance,

        receivedAmount,

        remainingBalance,
      });
    }

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(201).json({

      success: true,

      message:
        "Receipt created and customer ledger updated successfully",

      receipt: {

        id: receipt._id,

        receiptNo: receipt.receiptNo,

        date: receipt.date,

        customerId: customer._id,

        customerCode:
          customer.customerCode ||
          customer.accountNo ||
          "",

        customerNameUrdu:
          customer.customerNameUrdu ||
          customer.nameUrdu ||
          "",

        customerNameEnglish:
          customer.customerNameEnglish ||
          customer.name ||
          "",

        amount: receivedAmount,

        previousBalance,

        remainingBalance,

        note: note || "",
      },
    });

  } catch (error) {

    console.error(
      "CREATE RECEIPT ERROR:",
      error
    );

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

    const receipts = await Receipt.find()
      .populate("customer")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      receipts,
    });

  } catch (error) {

    console.error(
      "GET ALL RECEIPTS ERROR:",
      error
    );

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

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    // -------------------------------------------------
    // FIND CUSTOMER
    // -------------------------------------------------

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // -------------------------------------------------
    // GET LEDGER
    // -------------------------------------------------

    const ledger = await CustomerLedger.find({
      customerId: customer._id,
    }).sort({
      date: 1,
      createdAt: 1,
    });

    // -------------------------------------------------
    // OPENING BALANCE
    // -------------------------------------------------

    const openingBalance = Number(
      customer.openingBalance || 0
    );

    // -------------------------------------------------
    // LAST LEDGER
    // -------------------------------------------------

    const lastLedger =
      ledger.length > 0
        ? ledger[ledger.length - 1]
        : null;

    const previousBalance = lastLedger
      ? Number(lastLedger.remainingBalance || 0)
      : openingBalance;

    const remainingBalance =
      previousBalance;

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({

      success: true,

      customer: {

        id: customer._id,

        customerCode:
          customer.customerCode ||
          customer.accountNo ||
          "",

        customerNameUrdu:
          customer.customerNameUrdu ||
          customer.nameUrdu ||
          "",

        customerNameEnglish:
          customer.customerNameEnglish ||
          customer.name ||
          "",

        openingBalance,
      },

      ledger,

      openingBalance,

      previousBalance,

      remainingBalance,
    });

  } catch (error) {

    console.error(
      "GET CUSTOMER LEDGER ERROR:",
      error
    );

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
