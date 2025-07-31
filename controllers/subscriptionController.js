const stripe = require("../config/stripe");
const subscriptionService = require("../services/subscriptionService");

const createLawyerSubscription = async (req, res) => {
  try {
    const { lawyerId, email, subscriptionType } = req.body;

    if (!lawyerId || !email || !subscriptionType) {
      return res.status(400).json({
        success: false,
        message: "lawyerId, email, and subscriptionType are required",
      });
    }

    if (subscriptionType === "fixed") {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 500000,
        currency: "egp",
        receipt_email: email,
        metadata: {
          lawyerId,
          subscriptionType,
          paymentType: "subscription",
        },
      });

      return res.status(200).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        message: "PaymentIntent created for fixed subscription",
      });
    }

    if (subscriptionType === "percentage") {
      await subscriptionService.createOrUpdateSubscription(
        lawyerId,
        "percentage",
        0
      );

      return res.status(200).json({
        success: true,
        message: "Percentage-based subscription activated",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid subscriptionType",
    });
  } catch (err) {
    console.error("Subscription error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create subscription",
      error: err.message,
    });
  }
};

module.exports = {
  createLawyerSubscription,
};
