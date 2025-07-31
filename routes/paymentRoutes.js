const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");

router.post("/lawyer-payout", paymentController.handleClientPayment);

module.exports = router;
