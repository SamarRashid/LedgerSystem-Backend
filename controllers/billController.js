const mongoose = require("mongoose");

const Bill = require("../models/billModel");
const CustomerLedger = require("../models/CustomerLedger");
const Customer = require("../models/Customer");

// ============================================================
// CREATE BILL
// ============================================================

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

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!beopari) {
      return res.status(400).json({
        success: false,
        message: "Beopari is required",
      });
    }

    if (!billNo) {
      return res.status(400).json({
        success: false,
        message: "Bill number is required",
      });
    }

    if (
      !Array.isArray(lineItems) ||
      lineItems.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Line items are required",
      });
    }

    // ========================================================
    // DATE
    // ========================================================

    const ledgerDate =
      date ||
      new Date().toISOString().split("T")[0];

    // ========================================================
    // DUPLICATE BILL
    // ========================================================

    const existingBill = await Bill.findOne({
      billNo: String(billNo),
    });

    if (existingBill) {
      return res.status(400).json({
        success: false,
        message: `Bill No ${billNo} already exists`,
      });
    }

    // ========================================================
    // CUSTOMER-WISE AMOUNT
    // ========================================================

    const customerAmounts = {};

    for (const item of lineItems) {
      // Support multiple possible frontend structures
      const customerId =
        item?.customer?.id ||
        item?.customer?._id ||
        item?.customerId ||
        item?.customer;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: `Customer ID missing for item: ${
            item?.item || "Unknown item"
          }`,
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          customerId
        )
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid customer ID for item: ${
            item?.item || "Unknown item"
          }`,
        });
      }

      const amount = Number(item?.amount || 0);

      if (amount <= 0) {
        continue;
      }

      if (!customerAmounts[customerId]) {
        customerAmounts[customerId] = 0;
      }

      customerAmounts[customerId] += amount;
    }

    console.log(
      "========================================"
    );

    console.log(
      "CUSTOMER WISE BILL AMOUNTS:"
    );

    console.log(customerAmounts);

    console.log(
      "========================================"
    );

    // ========================================================
    // CREATE BILL
    // ========================================================

    const bill = await Bill.create({
      date: ledgerDate,

      billNo: String(billNo),

      copyNo: copyNo || "",

      vehicleNo: vehicleNo || "",

      beopari,

      lineItems,

      deductions: deductions || [],

      totals: totals || {},

      note: note || "",
    });

    console.log(
      "BILL CREATED:",
      bill._id
    );

    // ========================================================
    // LEDGER RESULTS
    // ========================================================

    const ledgerResults = [];

    // ========================================================
    // CREATE SALE LEDGER FOR EACH CUSTOMER
    // ========================================================

    for (const customerId of Object.keys(
      customerAmounts
    )) {
      try {
        const billAmount = Number(
          customerAmounts[customerId] || 0
        );

        // ----------------------------------------------------
        // FIND CUSTOMER
        // ----------------------------------------------------

        const customer =
          await Customer.findById(customerId);

        if (!customer) {
          throw new Error(
            `Customer not found: ${customerId}`
          );
        }

        // ----------------------------------------------------
        // CUSTOMER INFORMATION
        // ----------------------------------------------------

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

        // ----------------------------------------------------
        // GET LATEST LEDGER
        // ----------------------------------------------------

        const lastLedger =
          await CustomerLedger.findOne({
            customerId: customer._id,
          }).sort({
            date: -1,
            createdAt: -1,
          });

        // ----------------------------------------------------
        // PREVIOUS BALANCE
        // ----------------------------------------------------

        const previousBalance = lastLedger
          ? Number(
              lastLedger.remainingBalance || 0
            )
          : Number(
              customer.openingBalance || 0
            );

        // ----------------------------------------------------
        // NEW BALANCE
        // ----------------------------------------------------

        const remainingBalance =
          previousBalance + billAmount;

        // ----------------------------------------------------
        // CREATE NEW SALE LEDGER
        // IMPORTANT:
        // Never update today's receipt.
        // Always create a NEW ledger entry.
        // ----------------------------------------------------

        const newLedger =
          await CustomerLedger.create({
            customerId: customer._id,

            customerCode,

            customerNameUrdu,

            customerNameEnglish,

            date: ledgerDate,

            type: "SALE",

            receiptNo: "",

            billId: bill._id,

            billNo: String(
              bill.billNo
            ),

            copyNo:
              bill.copyNo || "",

            vehicleNo:
              bill.vehicleNo || "",

            description:
              `Sale Bill #${bill.billNo}`,

            lineItems:
              bill.lineItems || [],

            deductions:
              bill.deductions || [],

            totals:
              bill.totals || {},

            billAmount,

            previousBalance,

            receivedAmount: 0,

            remainingBalance,
          });

        console.log(
          "CUSTOMER LEDGER CREATED:",
          {
            customerId:
              customer._id,

            billNo:
              bill.billNo,

            billAmount,

            previousBalance,

            remainingBalance,

            ledgerId:
              newLedger._id,
          }
        );

        // ----------------------------------------------------
        // RESULT
        // ----------------------------------------------------

        ledgerResults.push({
          customerId:
            customer._id,

          customerCode,

          customerName:
            customerNameEnglish,

          billAmount,

          previousBalance,

          remainingBalance,

          ledgerId:
            newLedger._id,

          action: "created",
        });
      } catch (ledgerError) {
        console.error(
          "CUSTOMER LEDGER ERROR:",
          ledgerError
        );

        // Delete bill because ledger failed
        await Bill.findByIdAndDelete(
          bill._id
        );

        return res.status(500).json({
          success: false,
          message:
            "Bill was not saved because customer ledger could not be created",
          error:
            ledgerError.message,
        });
      }
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(201).json({
      success: true,

      message:
        "Bill created and customer ledger updated successfully",

      data: {
        bill,

        ledgerDate,

        customerAmounts,

        ledgers:
          ledgerResults,
      },
    });
  } catch (error) {
    console.error(
      "CREATE BILL ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to create bill",

      error:
        error.message,
    });
  }
};

// ============================================================
// GET ALL BILLS
// ============================================================

const getBills = async (req, res) => {
  try {
    const bills =
      await Bill.find()
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: bills.length,
      data: bills,
    });
  } catch (error) {
    console.error(
      "GET BILLS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch bills",
      error:
        error.message,
    });
  }
};

// ============================================================
// GET SINGLE BILL
// ============================================================

const getBillById = async (req, res) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid bill ID",
      });
    }

    const bill =
      await Bill.findById(id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message:
          "Bill not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: bill,
    });
  } catch (error) {
    console.error(
      "GET BILL ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch bill",
      error:
        error.message,
    });
  }
};

// ============================================================
// GET CUSTOMER LEDGER
// ============================================================

const getCustomerLedger = async (
  req,
  res
) => {
  try {
    const { customerId } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        customerId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid customer ID",
      });
    }

    const customer =
      await Customer.findById(
        customerId
      );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message:
          "Customer not found",
      });
    }

    const ledger =
      await CustomerLedger.find({
        customerId:
          customer._id,
      }).sort({
        date: 1,
        createdAt: 1,
      });

    const openingBalance =
      Number(
        customer.openingBalance || 0
      );

    const lastLedger =
      ledger.length > 0
        ? ledger[
            ledger.length - 1
          ]
        : null;

    const remainingBalance =
      lastLedger
        ? Number(
            lastLedger.remainingBalance ||
              0
          )
        : openingBalance;

    return res.status(200).json({
      success: true,

      customer: {
        id:
          customer._id,

        customerCode:
          customer.customerCode ||
          customer.accountNo ||
          customer.code ||
          "",

        customerNameUrdu:
          customer.customerNameUrdu ||
          customer.nameUrdu ||
          "",

        customerNameEnglish:
          customer.customerNameEnglish ||
          customer.nameEnglish ||
          customer.name ||
          "",

        openingBalance,
      },

      ledger,

      openingBalance,

      previousBalance:
        remainingBalance,

      remainingBalance,
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

      error:
        error.message,
    });
  }
};

// ============================================================
// DELETE BILL
// ============================================================

const deleteBill = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid bill ID",
      });
    }

    const bill =
      await Bill.findById(id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message:
          "Bill not found",
      });
    }

    // Delete all SALE ledger
    // entries belonging to this bill
    await CustomerLedger.deleteMany({
      billId:
        bill._id,
    });

    await Bill.findByIdAndDelete(
      id
    );

    return res.status(200).json({
      success: true,
      message:
        "Bill and related customer ledger deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE BILL ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to delete bill",

      error:
        error.message,
    });
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  createBill,
  getBills,
  getBillById,
  getCustomerLedger,
  deleteBill,
};