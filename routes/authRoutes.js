const express = require("express");
const router = express.Router();

const {
  changePassword,
} = require("../controllers/authController");

router.put("/change-password", changePassword);

module.exports = router;