const stripe = require("../config/stripe");
const firestore = require("../config/firebase");

exports.createLawyerSubscription = async (req, res) => {
  const { lawyerId, email, priceId, subscriptionType } = req.body;

  try {
    if (!lawyerId || !email || !priceId || !subscriptionType) {
      console.error("Missing fields:", {
        lawyerId,
        email,
        priceId,
        subscriptionType,
      });
      return res.status(400).json({ error: "Missing required fields" });
    }

    let customer;
    const customers = await stripe.customers
      .list({ email, limit: 1 })
      .catch((err) => {
        console.error("Failed to list customers:", err.message);
        throw new Error("Stripe customer lookup failed");
      });

    if (customers.data.length > 0) {
      customer = customers.data[0];
      console.log("Found existing customer:", customer.id);
    } else {
      customer = await stripe.customers
        .create({
          email,
          metadata: { lawyerId },
        })
        .catch((err) => {
          console.error("Failed to create Stripe customer:", err.message);
          throw new Error("Stripe customer creation failed");
        });
      console.log("Created new customer:", customer.id);
    }

    const subscription = await stripe.subscriptions
      .create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice", "latest_invoice.payment_intent"],
        metadata: { lawyerId, subscriptionType },
      })
      .catch((err) => {
        console.error("Failed to create Stripe subscription:", err.message);
        throw new Error("Stripe subscription creation failed");
      });

    if (!subscription) {
      console.error("Subscription creation returned null or undefined");
      return res.status(500).json({ error: "Failed to create subscription" });
    }

    console.log("Subscription created. ID:", subscription.id);
    console.log("Subscription status:", subscription.status);
    console.log("Latest invoice ID:", subscription.latest_invoice?.id);

    const paymentIntent = subscription.latest_invoice?.payment_intent;
    if (!paymentIntent) {
      console.error("Missing payment intent in subscription");
      console.dir(subscription, { depth: null });
      return res
        .status(500)
        .json({ error: "Payment intent not available in subscription" });
    }

    console.log("PaymentIntent ID:", paymentIntent.id);
    console.log("PaymentIntent status:", paymentIntent.status);
    console.log("Client Secret:", paymentIntent.client_secret);

    await firestore
      .collection("payments")
      .add({
        lawyerId,
        stripeCustomerId: customer.id,
        subscriptionId: subscription.id,
        subscriptionType,
        paymentIntentId: paymentIntent.id,
        moneyPaid: null,
        status: "pending",
        createdAt: new Date(),
      })
      .catch((err) => {
        console.error("Failed to save payment to Firestore:", err.message);
        throw new Error("Firestore write failed");
      });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error("Error creating subscription:", error.message);
    console.error(error.stack);
    return res.status(500).json({
      error: error.message || "Failed to create subscription",
    });
  }
};
