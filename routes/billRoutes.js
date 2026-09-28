const express = require('express');
const router = express.Router();
const { createBill, getBills } = require('../controllers/billController');

router.route('/').post(createBill).get(getBills);

module.exports = router;
