require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const userRoutes = require("./routes/userRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();

const PORT = 5000;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.send("Ledger Backend Server is running 🚀");
});

// User & Roles API
app.use("/api/users", userRoutes);

// Settings API
app.use("/api/settings", settingsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});