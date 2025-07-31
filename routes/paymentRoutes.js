const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");

router.post("/lawyer-payout", paymentController.handleClientPayment);

router.post(
  "/create-client-payment-intent",
  paymentController.createClientPayment
);

module.exports = router;
