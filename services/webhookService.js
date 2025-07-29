const db = require("../config/firebase");
const SubscriptionModel = require("../models/subscriptionModel");

exports.routeInvoicePaid = async (invoice) => {
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;
  const paymentIntentId = invoice.payment_intent;
  const amountPaid = invoice.amount_paid;

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
    subscriptionType: paymentDoc.data().subscriptionType,
    subscriptionStartDate: now,
    subscriptionEndDate: endDate,
    moneyPaid: amountPaid / 100,
    createdAt: now,
  });

  await db.collection("subscriptions").add(subscriptionData.toFirestore());

  await lawyerDoc.ref.update({
    subscriptionType: paymentDoc.data().subscriptionType,
    subscriptionStartDate: now,
    subscriptionEndDate: endDate,
  });

  console.log("Subscription marked as paid and lawyer updated.");
};
