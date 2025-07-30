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

    const customers = await stripe.customers
      .list({ email, limit: 1 })
      .catch((err) => {
        console.error("Failed to list customers:", err.message);
        throw new Error("Stripe customer lookup failed");
      });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
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
    }

    const subscription = await stripe.subscriptions
      .create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
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

    const paymentIntent = subscription.latest_invoice?.payment_intent;
    if (!paymentIntent) {
      console.error(
        "Missing payment intent in subscription:",
        JSON.stringify(subscription, null, 2)
      );
      return res
        .status(500)
        .json({ error: "Payment intent not available in subscription" });
    }

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
    return res
      .status(500)
      .json({ error: error.message || "Failed to create subscription" });
  }
};
