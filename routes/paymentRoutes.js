const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");

router.post("/create-client-payment", paymentController.createClientPayment);

router.post("/lawyer-payout", paymentController.handleClientPayment);

module.exports = router;
