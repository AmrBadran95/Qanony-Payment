const { getOrCreateCustomer } = require("../services/stripeService");
const stripe = require("../config/stripe");

const createLawyerSubscription = async (req, res) => {
  try {
    const { lawyerId, email, subscriptionType } = req.body;

    if (!lawyerId || !email || !subscriptionType) {
      return res.status(400).json({
        success: false,
        message: "lawyerId, email, and subscriptionType are required",
      });
    }

    const customerId = await getOrCreateCustomer(lawyerId, email);

    const paymentIntent = await stripe.paymentIntents.create({
      customer: customerId,
      amount: 500000,
      currency: "egp",
      metadata: {
        lawyerId,
        subscriptionType,
      },
      receipt_email: email,
    });

    res.status(200).json({
      success: true,
      subscriptionId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: "pending",
    });
  } catch (err) {
    console.error("Subscription error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create subscription",
    });
  }
};

module.exports = {
  createLawyerSubscription,
};
