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
    const email = lawyerData.email;
    const stripeConnectAccountId = lawyerData.stripeConnectAccountId;

    if (!email || !stripeConnectAccountId) {
      return res.status(400).json({
        error: "Lawyer must have both email and stripeConnectAccountId",
      });
    }

    let customerId = lawyerData.stripeCustomerId;
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch {
        customerId = null;
        await firestoreService.updateLawyerSubscriptionInfo(lawyerId, {
          stripeCustomerId: null,
        });
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { lawyerId },
      });
      customerId = customer.id;

      await firestoreService.updateLawyerSubscriptionInfo(lawyerId, {
        stripeCustomerId: customerId,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "egp",
            product_data: {
              name: `Qanony ${subscriptionType} subscription`,
            },
            unit_amount: parseInt(amount),
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        transfer_data: {
          destination: stripeConnectAccountId,
        },
        metadata: {
          lawyerId,
          subscriptionType,
        },
      },
      metadata: {
        lawyerId,
        subscriptionType,
      },
      success_url: "qanony://payment-success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "qanony://payment-cancel",
    });

    res.status(200).json({
      sessionId: session.id,
      message: "Checkout session created.",
    });
  } catch (err) {
    console.error("Error creating checkout session:", err.message);
    res.status(500).json({
      error: "Failed to create checkout session",
      details: err.message,
    });
  }
};

module.exports = {
  createLawyerSubscription,
};
