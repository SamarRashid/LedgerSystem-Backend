const mongoose = require("mongoose");

const customerLedgerSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    customerCode: {
      type: String,
      default: "",
      trim: true,
    },

    customerNameUrdu: {
      type: String,
      default: "",
    },

    customerNameEnglish: {
      type: String,
      default: "",
    },

    date: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["RECEIPT", "SALE", "OPENING"],
      default: "RECEIPT",
    },

    receiptNo: {
      type: String,
      default: "",
    },

    // Bill information
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      default: null,
    },

    billNo: {
      type: String,
      default: "",
    },

    copyNo: {
      type: String,
      default: "",
    },

    vehicleNo: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    // Complete bill data
    lineItems: {
      type: Array,
      default: [],
    },

    deductions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    totals: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    billAmount: {
      type: Number,
      default: 0,
    },

    previousBalance: {
      type: Number,
      required: true,
      default: 0,
    },

    receivedAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    remainingBalance: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "CustomerLedger",
  customerLedgerSchema
);