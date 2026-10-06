require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { connectDB } = require("./config/db");

// Routes
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

const app = express();

// Middleware
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

// Test route
app.get("/", (req, res) => {
res.json({
success: true,
message: "Ledger System API is running",
});
});

// API routes
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
app.use("/api/customer-ledger", customerLedgerRoutes);
app.use("/api/commissions", commissionRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/auth", authRoutes);

// 404 handler
app.use((req, res) => {
res.status(404).json({
success: false,
message: `Route not found: ${req.method} ${req.originalUrl}`,
});
});

// Error handler
app.use((err, req, res, next) => {
console.error("Server error:", err);

if (res.headersSent) {
return next(err);
}

res.status(err.status || 500).json({
success: false,
message:
process.env.NODE_ENV === "production"
? "Internal server error"
: err.message,
});
});

// Start server after database check
const PORT = process.env.PORT || 5000;

async function startServer() {
try {
await connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

} catch (error) {
console.error("Failed to start server:", error.message);
process.exit(1);
}
}

startServer();