const { getOrCreateCustomer } = require("../services/stripeService");
const stripe = require("../config/stripe");

const createLawyerSubscription = async (req, res) => {
  try {
    const { lawyerId, priceId, subscriptionType, email, name } = req.body;

    if (!lawyerId || !priceId || !email || !name) {
      return res.status(400).json({
        success: false,
        message: "lawyerId, priceId, name, and email are required",
      });
    }

    const customerId = await getOrCreateCustomer(lawyerId, email, name);

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    const clientSecret =
      subscription.latest_invoice.payment_intent.client_secret;

    res.status(200).json({
      success: true,
      subscriptionId: subscription.id,
      clientSecret,
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
