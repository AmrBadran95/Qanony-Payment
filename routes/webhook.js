const express = require("express");
const router = express.Router();
const stripe = require("../config/stripe");
const firestore = require("../config/firebase");
const firestoreService = require("../services/firestoreService");
const SubscriptionModel = require("../models/subscriptionModel");

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntent = event.data.object;
          await handlePaymentSuccess(paymentIntent);
          break;

        case "payment_intent.payment_failed":
          const failedIntent = event.data.object;
          await handlePaymentFailure(failedIntent);
          break;
      }

      res.status(200).send("Webhook received");
    } catch (err) {
      console.error("Webhook handling error:", err);
      res.status(500).send("Internal Server Error");
    }
  }
);

const handlePaymentSuccess = async (paymentIntent) => {
  const transactionId = paymentIntent.id;
  const amount = paymentIntent.amount;
  const paymentMethod = paymentIntent.payment_method;
  const status = paymentIntent.status;

  const paymentsRef = firestore.collection("payments");

  const snapshot = await paymentsRef
    .where("transactionId", "==", transactionId)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    await doc.ref.update({
      status,
      paymentMethod,
      updatedAt: new Date(),
    });

    const payment = doc.data();

    if (payment.role === "lawyer" && payment.paymentType === "subscription") {
      const now = new Date();
      const oneMonthLater = new Date(now);
      oneMonthLater.setMonth(now.getMonth() + 1);

      const subscription = new SubscriptionModel({
        lawyerId: payment.userId,
        subscriptionType: "monthly",
        subscriptionStartDate: now,
        subscriptionEndDate: oneMonthLater,
        moneyPaid: amount / 100,
        createdAt: now,
      });

      await firestoreService.saveSubscription(subscription);
      await firestoreService.updateLawyerSubscriptionInfo(payment.userId, {
        subscriptionType: "monthly",
        subscriptionStartDate: now,
        subscriptionEndDate: oneMonthLater,
      });

      console.log("Subscription saved and lawyer updated.");
    }
  } else {
    console.warn(
      "No matching payment document found for transactionId:",
      transactionId
    );
  }
};

const handlePaymentFailure = async (paymentIntent) => {
  const transactionId = paymentIntent.id;
  const status = paymentIntent.status;

  const paymentsRef = firestore.collection("payments");

  const snapshot = await paymentsRef
    .where("transactionId", "==", transactionId)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    await doc.ref.update({
      status,
      updatedAt: new Date(),
    });
  } else {
    console.warn(
      "No matching failed payment found for transactionId:",
      transactionId
    );
  }
};

module.exports = router;
