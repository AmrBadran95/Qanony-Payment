const express = require("express");
const router = express.Router();
const { getPaymentIntentSecret } = require("../controllers/paymentController");

router.get("/", getPaymentIntentSecret);

module.exports = router;
