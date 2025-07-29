const stripe = require("../config/stripe");
const SubscriptionModel = require("../models/subscriptionModel");
const firestoreService = require("../services/firestoreService");

const createStripeSubscriptionAndSave = async (req, res) => {
  try {
    const { lawyerId, priceId, subscriptionType } = req.body;

    if (!lawyerId || !priceId || !subscriptionType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const lawyerDoc = await firestoreService.getLawyerById(lawyerId);
    if (!lawyerDoc.exists) {
      return res.status(404).json({ error: "Lawyer not found" });
    }

    const lawyerData = lawyerDoc.data();
    let customerId = lawyerData.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: lawyerData.email || undefined,
        metadata: { lawyerId },
      });

      customerId = customer.id;

      await firestoreService.updateLawyerSubscriptionInfo(lawyerId, {
        stripeCustomerId: customerId,
      });
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
    });

    const paymentIntent = subscription.latest_invoice.payment_intent;
    const clientSecret = paymentIntent.client_secret;

    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const subscriptionData = new SubscriptionModel({
      lawyerId,
      subscriptionType,
      subscriptionStartDate: now,
      subscriptionEndDate: endDate,
      moneyPaid: 0,
      createdAt: now,
    });

    await firestoreService.saveSubscription(subscriptionData.toFirestore());

    await firestoreService.updateLawyerSubscriptionInfo(lawyerId, {
      subscriptionType,
      subscriptionStartDate: now,
      subscriptionEndDate: endDate,
    });

    return res.status(201).json({
      subscriptionId: subscription.id,
      clientSecret,
      message: "Subscription created, awaiting payment confirmation",
    });
  } catch (err) {
    console.error("Stripe + Firestore Error:", err);
    return res.status(500).json({ error: "Failed to create subscription" });
  }
};

module.exports = {
  createStripeSubscriptionAndSave,
};
