const stripe = require("../config/stripe");
const firestore = require("../config/firebase");

exports.createLawyerSubscription = async (req, res) => {
  const { lawyerId, email, priceId, subscriptionType } = req.body;

  try {
    if (!lawyerId || !email || !priceId || !subscriptionType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const customers = await stripe.customers.list({ email, limit: 1 });
    let customer;

    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: { lawyerId },
      });
    }

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
      metadata: { lawyerId, subscriptionType },
    });

    const paymentIntent = subscription.latest_invoice?.payment_intent;
    if (!paymentIntent) {
      console.error("Missing payment intent in subscription:", subscription);
      return res.status(500).json({ error: "Payment intent not available" });
    }

    await firestore.collection("payments").add({
      lawyerId,
      stripeCustomerId: customer.id,
      subscriptionId: subscription.id,
      subscriptionType,
      paymentIntentId: paymentIntent.id,
      moneyPaid: null,
      status: "pending",
      createdAt: new Date(),
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ error: "Failed to create subscription" });
  }
};
