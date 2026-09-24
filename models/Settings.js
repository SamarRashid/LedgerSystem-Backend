const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Admin",
    },

    businessName: {
      type: String,
      default: "Ledger System",
    },

    phone: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Settings", settingsSchema);