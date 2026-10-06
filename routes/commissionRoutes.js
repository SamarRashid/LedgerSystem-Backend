const express = require("express");

const router = express.Router();

const { getCommissions } = require("../controllers/commissionController");

router.get("/", getCommissions);

module.exports = router;
