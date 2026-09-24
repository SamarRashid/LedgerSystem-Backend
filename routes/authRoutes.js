const express = require("express");

const {
  changePassword,
} = require("../controllers/authController");

const router = express.Router();

router.put("/change-password", changePassword);

module.exports = router;