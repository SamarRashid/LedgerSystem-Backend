require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

const PORT = 5000;

app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
res.send("Ledger Backend Server is running 🚀");
});

app.listen(PORT, () => {
console.log(`Server running on http://localhost:${PORT}`);
});
