const express = require("express");
const router = express.Router();
const stripe = require("../config/stripe");
const firestoreService = require("../services/firestoreService");
const SubscriptionModel = require("../models/subscriptionModel");

router.post("/", async (req, res) => {
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
    const eventType = event.type;
    const data = event.data.object;

    if (eventType === "payment_intent.succeeded") {
      await handlePaymentSuccess(data);
    } else if (eventType === "payment_intent.payment_failed") {
      await handlePaymentFailure(data);
    } else if (eventType === "invoice.paid") {
      const paymentIntentId = data.payment_intent;
      if (paymentIntentId) {
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
        console.log(
          "Handling invoice.paid via paymentIntent:",
          paymentIntentId
        );
        await handlePaymentSuccess(intent);
      } else {
        console.warn("invoice.paid received but no payment_intent found.");
      }
    }

    res.status(200).send("Webhook received");
  } catch (err) {
    console.error("Webhook handling error:", err);
    res.status(500).send("Internal Server Error");
  }
});

const handlePaymentSuccess = async (paymentIntent) => {
  const transactionId = paymentIntent.id;
  const amount = paymentIntent.amount;
  const paymentMethod = paymentIntent.payment_method;
  const status = paymentIntent.status;

  console.log("handlePaymentSuccess:", transactionId, status);

  const paymentDoc = await firestoreService.findPaymentByTransactionId(
    transactionId
  );

  if (!paymentDoc) {
    console.warn("No matching payment document found:", transactionId);
    return;
  }

  await firestoreService.updatePayment(paymentDoc.id, {
    status,
    paymentMethod,
    updatedAt: new Date(),
  });

  const payment = paymentDoc.data;

  console.log("Payment Success - Type:", payment.role, payment.paymentType);

  switch (`${payment.role}-${payment.paymentType}`) {
    case "lawyer-subscription":
      await handleLawyerSubscription(payment, amount);
      break;

    case "user-consultation":
      await handleConsultationPayment(payment, amount, transactionId, status);
      break;

    default:
      console.log("Unhandled payment type:", payment.role, payment.paymentType);
  }
};

const handleLawyerSubscription = async (payment, amount) => {
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

  await firestoreService.saveSubscription(subscription.toFirestore());
  await firestoreService.updateLawyerSubscriptionInfo(payment.userId, {
    subscriptionType: "monthly",
    subscriptionStartDate: now,
    subscriptionEndDate: oneMonthLater,
  });

  console.log("Subscription saved and lawyer updated.");
};

const handleConsultationPayment = async (
  payment,
  amount,
  transactionId,
  status
) => {
  const fullAmount = amount / 100;
  const fee = fullAmount * 0.2;
  const transferredAmount = fullAmount - fee;

  const payoutData = {
    userId: payment.userId,
    lawyerId: payment.lawyerId,
    amount: fullAmount,
    fee,
    transferredAmount,
    stripeSessionId: transactionId,
    paymentStatus: status,
    createdAt: new Date(),
  };

  await firestoreService.saveLawyerPayout(payoutData);
  console.log("Consultation payout saved for lawyer:", payment.lawyerId);
};

const handlePaymentFailure = async (paymentIntent) => {
  const transactionId = paymentIntent.id;
  const status = paymentIntent.status;

  console.log("handlePaymentFailure:", transactionId, status);

  const paymentDoc = await firestoreService.findPaymentByTransactionId(
    transactionId
  );
  if (!paymentDoc) {
    console.warn("No matching failed payment found:", transactionId);
    return;
  }

  await firestoreService.updatePayment(paymentDoc.id, {
    status,
    updatedAt: new Date(),
  });

  console.log("Payment failed. Status updated.");
};

module.exports = router;
