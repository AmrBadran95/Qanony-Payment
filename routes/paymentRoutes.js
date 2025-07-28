const express = require("express");
const router = express.Router();
const stripe = require("../config/stripe");
const firestore = require("../config/firebase");

router.post("/subscribe", async (req, res) => {
  try {
    const { amount, userId, role, subscriptionType = "monthly" } = req.body;

    if (!amount || !userId || !role) {
      return res.status(400).json({
        error: "amount, userId, and role are required",
      });
    }

    const amountInPiasters = amount * 100;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPiasters,
      currency: "egp",
      automatic_payment_methods: { enabled: true },
    });

    const paymentData = {
      userId,
      role,
      amount: amountInPiasters,
      paymentType: "subscription",
      subscriptionType,
      status: "created",
      paymentMethod: null,
      transactionId: paymentIntent.id,
      createdAt: new Date(),
    };

    await firestore.collection("payments").add(paymentData);

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error("Stripe Subscription Error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/pay-lawyer", async (req, res) => {
  try {
    const { amount, userId, lawyerId, lawyerStripeAccountId } = req.body;

    if (!amount || !userId || !lawyerId || !lawyerStripeAccountId) {
      return res.status(400).json({
        error:
          "amount, userId, lawyerId, and lawyerStripeAccountId are required",
      });
    }

    const amountInPiasters = amount * 100;
    const platformFee = Math.floor(amountInPiasters * 0.2); // 20%
    const amountTransferred = amountInPiasters - platformFee;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "egp",
            unit_amount: amountInPiasters,
            product_data: {
              name: "Lawyer Booking",
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: lawyerStripeAccountId,
        },
      },
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    const paymentData = {
      userId,
      lawyerId,
      amount: amountInPiasters,
      fee: platformFee,
      amountTransferred,
      paymentType: "user_to_lawyer",
      status: "pending",
      stripeSessionId: session.id,
      createdAt: new Date(),
    };

    await firestore.collection("payments").add(paymentData);

    res.status(200).json({
      sessionUrl: session.url,
    });
  } catch (err) {
    console.error("Stripe Pay Lawyer Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
