const db = require("../config/firebase");
const SubscriptionModel = require("../models/subscriptionModel");

exports.routeInvoicePaid = async (invoice) => {
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;
  const paymentIntentId = invoice.payment_intent;
  const amountPaid = invoice.amount_paid;

  try {
    const lawyersSnapshot = await db
      .collection("lawyers")
      .where("stripeCustomerId", "==", customerId)
      .limit(1)
      .get();

    if (lawyersSnapshot.empty) {
      console.warn("No lawyer found with this customerId:", customerId);
      return;
    }

    const lawyerDoc = lawyersSnapshot.docs[0];
    const lawyerId = lawyerDoc.id;

    const paymentsSnapshot = await db
      .collection("payments")
      .where("subscriptionId", "==", subscriptionId)
      .limit(1)
      .get();

    if (paymentsSnapshot.empty) {
      console.warn("No payment record found for subscription:", subscriptionId);
      return;
    }

    const paymentDoc = paymentsSnapshot.docs[0];
    const paymentData = paymentDoc.data();

    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    await paymentDoc.ref.update({
      status: "paid",
      paymentIntentId,
      moneyPaid: amountPaid / 100,
      updatedAt: now,
    });

    const subscriptionData = new SubscriptionModel({
      lawyerId,
      subscriptionType: paymentData.subscriptionType,
      subscriptionStartDate: now,
      subscriptionEndDate: endDate,
      moneyPaid: amountPaid / 100,
      createdAt: now,
    });

    await db.collection("subscriptions").add(subscriptionData.toFirestore());

    await lawyerDoc.ref.update({
      subscriptionType: paymentData.subscriptionType,
      subscriptionStartDate: now,
      subscriptionEndDate: endDate,
    });

    console.log(`invoice.paid handled successfully for lawyer (${lawyerId})`);
  } catch (error) {
    console.error("Error handling invoice.paid:", error);
    throw error;
  }
};

exports.routeCheckoutCompleted = async (session) => {
  try {
    const { payment_intent: paymentIntentId, amount_total, metadata } = session;

    const { lawyerId, userId, orderId } = metadata || {};

    if (!lawyerId || !userId || !orderId) {
      console.warn("Missing metadata in checkout.session.completed");
      return;
    }

    const paymentData = {
      lawyerId,
      userId,
      orderId,
      paymentIntentId,
      moneyPaid: amount_total / 100,
      paymentType: "one_time",
      status: "paid",
      createdAt: new Date(),
    };

    await db.collection("payments").add(paymentData);

    console.log("One-time payment recorded successfully.");
  } catch (error) {
    console.error("Error handling checkout.session.completed:", error);
    throw error;
  }
};
