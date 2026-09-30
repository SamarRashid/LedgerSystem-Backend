const express = require('express');
const router = express.Router();
const { createPayment, getPayments } = require('../controllers/paymentController');

router.route('/').post(createPayment).get(getPayments);

module.exports = router;