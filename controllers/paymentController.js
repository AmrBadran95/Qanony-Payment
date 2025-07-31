const paymentService = require("../services/paymentService");

const handleClientPayment = async (req, res) => {
  try {
    const { orderId, lawyerId } = req.body;

    if (!orderId || !lawyerId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing orderId or lawyerId" });
    }

    const result = await paymentService.processLawyerPayment({
      orderId,
      lawyerId,
    });

    return res
      .status(200)
      .json({ success: true, message: "Payment processed", result });
  } catch (err) {
    console.error("Error processing payment:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createPaymentIntentForClient = async ({ orderId, lawyerId }) => {
  const lawyerDoc = await db.collection("lawyers").doc(lawyerId).get();

  if (!lawyerDoc.exists) throw new Error("Lawyer not found");

  const orderDoc = await db.collection("orders").doc(orderId).get();

  if (!orderDoc.exists) throw new Error("Order not found");

  const orderData = orderDoc.data();
  const { amount, currency = "egp" } = orderData;

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
  handleClientPayment,
  createClientPaymentIntent,
};
