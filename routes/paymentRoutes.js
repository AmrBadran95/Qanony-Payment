const express = require("express");
const router = express.Router();
const stripe = require("../config/stripe");
const firestore = require("../config/firebase");

async function getOrCreateCustomer(userId, email) {
  const userRef = firestore.collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (userDoc.exists && userDoc.data().stripeCustomerId) {
    return userDoc.data().stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await userRef.set(
    {
      stripeCustomerId: customer.id,
    },
    { merge: true }
  );

  return customer.id;
}

router.post("/subscribe", async (req, res) => {
  try {
    const {
      userId,
      email,
      priceId = "price_1RpgrKBCYVFzcUuX4j1dOcaB",
      role,
      subscriptionType = "monthly",
    } = req.body;

    if (!userId || !email || !role) {
      return res.status(400).json({
        error: "userId, email, and role are required",
      });
    }

    const customerId = await getOrCreateCustomer(userId, email);

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    await firestore.collection("payments").add({
      userId,
      role,
      paymentType: "subscription",
      subscriptionType,
      subscriptionId: subscription.id,
      status: subscription.status,
      createdAt: new Date(),
    });

    const clientSecret =
      subscription.latest_invoice &&
      subscription.latest_invoice.payment_intent &&
      subscription.latest_invoice.payment_intent.client_secret;

    res.status(200).json({
      subscriptionId: subscription.id,
      clientSecret: clientSecret || null,
    });
  } catch (err) {
    console.error("Stripe Subscription Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
