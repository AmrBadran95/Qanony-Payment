const stripe = require("../config/stripe");
const db = require("../config/firebase");

const processLawyerPayment = async ({ orderId, lawyerId }) => {
  const lawyerDoc = await db.collection("lawyers").doc(lawyerId).get();

  if (!lawyerDoc.exists) throw new Error("Lawyer not found");

  const lawyerData = lawyerDoc.data();

  const { subscriptionType, stripeConnectAccountId } = lawyerData;

  if (!stripeConnectAccountId)
    throw new Error("Lawyer has no Stripe Connect account");

  const orderDoc = await db.collection("orders").doc(orderId).get();

  if (!orderDoc.exists) throw new Error("Order not found");

  const orderData = orderDoc.data();
  const { amount, currency = "egp" } = orderData;

  if (!amount) throw new Error("Order has no amount");

  const percentage = subscriptionType === "fixed" ? 1 : 0.8;
  const payoutAmount = Math.round(amount * percentage);

  const transfer = await stripe.transfers.create({
    amount: payoutAmount,
    currency,
    destination: stripeConnectAccountId,
    metadata: {
      lawyerId,
      orderId,
      subscriptionType,
    },
  });

  await db.collection("payments").add({
    lawyerId,
    orderId,
    subscriptionType,
    amount,
    payoutAmount,
    stripeTransferId: transfer.id,
    createdAt: new Date(),
    paymentType: "lawyer-service",
  });

  return { payoutAmount, transferId: transfer.id };
};

const createPaymentIntentForClient = async ({ orderId, lawyerId }) => {
  const lawyerDoc = await db.collection("lawyers").doc(lawyerId).get();
  if (!lawyerDoc.exists) throw new Error("Lawyer not found");

  const orderDoc = await db.collection("orders").doc(orderId).get();
  if (!orderDoc.exists) throw new Error("Order not found");

  const orderData = orderDoc.data();
  const { price: amount, currency = "egp" } = orderData;

  if (!amount) throw new Error("Order has no amount");

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    metadata: {
      paymentType: "client-service",
      orderId,
      lawyerId,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
  };
};

module.exports = {
  processLawyerPayment,
  createPaymentIntentForClient,
};
