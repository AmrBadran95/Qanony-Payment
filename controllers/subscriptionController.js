const createLawyerSubscription = async (req, res) => {
  try {
    const { lawyerId, priceId, subscriptionType } = req.body;

    const customer = await getOrCreateCustomer(lawyerId);

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    const invoiceId = subscription.latest_invoice;

    res.status(200).json({
      success: true,
      subscriptionId: subscription.id,
      invoiceId,
      status: "pending",
    });
  } catch (err) {
    console.error("Subscription error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to create subscription" });
  }
};

module.exports = {
  createLawyerSubscription,
};
