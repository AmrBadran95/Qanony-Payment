const express = require("express");
const router = express.Router();
const stripe = require("../config/stripe");
const firestore = require("../config/firebase");

router.post("/create-payment-intent", async (req, res) => {
  try {
    let { amount, userId, role } = req.body;

    if (!amount || !userId || !role) {
      return res
        .status(400)
        .json({ error: "amount, userId, and role are required" });
    }

    amount = amount * 100;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "egp",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    const paymentData = {
      userId,
      role,
      amount,
      status: "created",
      paymentMethod: null,
      transactionId: paymentIntent.id,
      createdAt: new Date(),
    };

    await firestore.collection("payments").add(paymentData);

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
