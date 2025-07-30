const { getOrCreateCustomer } = require("../services/stripeService");
const stripe = require("../config/stripe");

const createLawyerSubscription = async (req, res) => {
  try {
    const { lawyerId, priceId, subscriptionType, email } = req.body;

    if (!lawyerId || !priceId || !email || !subscriptionType) {
      return res.status(400).json({
        success: false,
        message: "lawyerId, priceId, email, and subscriptionType are required",
      });
    }

    const customerId = await getOrCreateCustomer(lawyerId, email);

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      collection_method: "send_invoice",
      days_until_due: 7,
    });

    const invoice = await stripe.invoices.retrieve(subscription.latest_invoice);

    res.status(200).json({
      success: true,
      subscriptionId: subscription.id,
      invoiceUrl: invoice.hosted_invoice_url,
      status: subscription.status,
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
