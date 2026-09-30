const express = require('express');
const router = express.Router();
const { createReceipt, getReceipts } = require('../controllers/receiptController');

router.route('/').post(createReceipt).get(getReceipts);

module.exports = router;
