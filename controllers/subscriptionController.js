const stripe = require("../config/stripe");
const SubscriptionModel = require("../models/subscriptionModel");
const firestoreService = require("../services/firestoreService");

const createLawyerSubscription = async (req, res) => {
  try {
    const { lawyerId, amount, subscriptionType } = req.body;

    if (!lawyerId || !amount || !subscriptionType) {
      return res.status(400).json({
        error: "Missing required fields: lawyerId, amount, or subscriptionType",
      });
    }

    const lawyerDoc = await firestoreService.getLawyerById(lawyerId);
    if (!lawyerDoc.exists) {
      return res.status(404).json({ error: "Lawyer not found in Firestore" });
    }

    const lawyerData = lawyerDoc.data();
    if (!lawyerData.email) {
      return res
        .status(400)
        .json({ error: "Lawyer is missing an email in Firestore" });
    }

    let customerId = lawyerData.stripeCustomerId;
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch {
        console.warn("Invalid Stripe customer, creating new one...");
        customerId = null;
        await firestoreService.updateLawyerSubscriptionInfo(lawyerId, {
          stripeCustomerId: null,
        });
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: lawyerData.email,
        metadata: { lawyerId },
      });
      customerId = customer.id;

      await firestoreService.updateLawyerSubscriptionInfo(lawyerId, {
        stripeCustomerId: customerId,
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt(amount),
      currency: "egp",
      customer: customerId,
      description: `Qanony ${subscriptionType} subscription`,
      metadata: {
        lawyerId,
        subscriptionType,
      },
    });

    const now = new Date();
    const endDate = new Date();
    if (subscriptionType === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (subscriptionType === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const subscriptionData = new SubscriptionModel({
      lawyerId,
      subscriptionType,
      subscriptionStart: now,
      subscriptionEnd: endDate,
      moneyPaid: 50000,
      subscriptionStatus: "active",
      createdAt: now,
    });

    await firestoreService.saveSubscription(subscriptionData.toPlainObject());
    await firestoreService.updateLawyerSubscriptionInfo(lawyerId, {
      subscriptionType,
      subscriptionStart: now,
      subscriptionEnd: endDate,
    });

    return res.status(201).json({
      clientSecret: paymentIntent.client_secret,
      message: "PaymentIntent created. Awaiting payment.",
    });
  } catch (err) {
    console.error("Unexpected Error:", err.message);
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
};

module.exports = {
  createLawyerSubscription,
};
