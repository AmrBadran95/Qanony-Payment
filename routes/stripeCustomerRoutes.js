const express = require("express");
const router = express.Router();
const {
  createStripeCustomer,
} = require("../controllers/stripeCustomerController");

router.post("/create-customer", createStripeCustomer);

module.exports = router;
