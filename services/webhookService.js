const db = require("../config/firebase");
const LawyerPaymentModel = require("../models/lawyerPaymentModel");

exports.handleCheckoutCompleted = async (session) => {
  const sessionId = session.id;
  const paymentStatus = session.payment_status;
  const customerEmail = session.customer_email;

  const paymentsRef = db.collection("payments");
  const snapshot = await paymentsRef
    .where("stripeSessionId", "==", sessionId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.warn("No payment found for session:", sessionId);
    return;
  }

  const paymentDoc = snapshot.docs[0];
  const paymentData = paymentDoc.data();

  const updateData = {
    status: paymentStatus,
    customerEmail: customerEmail || null,
    updatedAt: new Date(),
  };

  await paymentDoc.ref.update(updateData);

  const payout = new LawyerPaymentModel({
    userId: paymentData.userId,
    lawyerId: paymentData.lawyerId,
    amount: paymentData.amount / 100,
    fee: paymentData.fee / 100,
    transferredAmount: paymentData.amountTransferred / 100,
    stripeSessionId: sessionId,
    paymentStatus: paymentStatus,
    createdAt: new Date(),
  });

  await db.collection("lawyer_payouts").add(payout.toFirestore());

  console.log("Lawyer payout recorded for session:", sessionId);
};
