// =========================================================
// ENVIRONMENT VARIABLES
// =========================================================

require("dotenv").config();


// =========================================================
// IMPORTS
// =========================================================

const express = require("express");
const cors = require("cors");

const { connectDB } = require("./config/db");


// =========================================================
// ROUTES
// =========================================================

const userRoutes = require("./routes/userRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const productRoutes = require("./routes/productRoutes");
const areaRoutes = require("./routes/areaRoutes");
const billRoutes = require("./routes/billRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const customerLedgerRoutes = require("./routes/customerLedgerRoutes");
const commissionRoutes = require("./routes/commissionRoutes");


// =========================================================
// APP
// =========================================================

const app = express();


// =========================================================
// DATABASE
// =========================================================

connectDB();


// =========================================================
// MIDDLEWARE
// =========================================================

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://ledger-system-beige.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));


// =========================================================
// TEST ROUTE
// =========================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Ledger System API is running",
  });
});


// =========================================================
// API ROUTES
// =========================================================

app.use("/api/users", userRoutes);

app.use("/api/customers", customerRoutes);

app.use("/api/suppliers", supplierRoutes);

app.use("/api/products", productRoutes);

app.use("/api/areas", areaRoutes);

app.use("/api/bills", billRoutes);

app.use("/api/expenses", expenseRoutes);

app.use("/api/receipts", receiptRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/customerledgers", customerLedgerRoutes);

app.use("/api/commissions", commissionRoutes);

app.use("/api/settings", settingsRoutes);

app.use("/api/auth", authRoutes);


// =========================================================
// 404 HANDLER
// =========================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});


// =========================================================
// ERROR HANDLER
// =========================================================

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message,
  });
});


// =========================================================
// SERVER
// =========================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});