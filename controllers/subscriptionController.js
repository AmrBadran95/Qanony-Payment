const stripe = require("../config/stripe");
const SubscriptionModel = require("../models/subscriptionModel");
const firestoreService = require("../services/firestoreService");

const createStripeSubscriptionAndSave = async (req, res) => {
  try {
    const { lawyerId, priceId, subscriptionType } = req.body;

    // Step 1: التحقق من المدخلات
    if (!lawyerId || !priceId || !subscriptionType) {
      return res.status(400).json({
        error:
          "Missing required fields: lawyerId, priceId, or subscriptionType",
      });
    }

    // Step 2: جلب بيانات المحامي من Firestore
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

    // Step 3: التحقق من صلاحية stripeCustomerId
    let customerId = null;

    if (lawyerData.stripeCustomerId) {
      try {
        await stripe.customers.retrieve(lawyerData.stripeCustomerId);
        customerId = lawyerData.stripeCustomerId;
      } catch (err) {
        console.warn("⚠️ Invalid or deleted Stripe customer, creating new one");
        await firestoreService.updateLawyerSubscriptionInfo(lawyerId, {
          stripeCustomerId: null,
        });
      }
    }

    // Step 4: إنشاء Stripe Customer لو مش موجود
    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: lawyerData.email,
          metadata: { lawyerId },
        });

        customerId = customer.id;

        await firestoreService.updateLawyerSubscriptionInfo(lawyerId, {
          stripeCustomerId: customerId,
        });
      } catch (customerError) {
        console.error(
          "❌ Stripe Customer Creation Failed:",
          customerError.message
        );
        return res.status(500).json({
          error: "Failed to create Stripe customer",
          details: customerError.message,
        });
      }
    }

    // Step 5: إنشاء الاشتراك
    let subscription;
    try {
      subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: {
          payment_method_types: ["card"],
          save_default_payment_method: "on_subscription",
        },
        expand: ["latest_invoice.payment_intent"],
      });
    } catch (subscriptionError) {
      console.error(
        "❌ Stripe Subscription Creation Failed:",
        subscriptionError.message
      );
      return res.status(500).json({
        error: "Failed to create Stripe subscription",
        details: subscriptionError.message,
      });
    }

    const paymentIntent = subscription.latest_invoice.payment_intent;
    const clientSecret = paymentIntent?.client_secret || null;

    // Step 6: حفظ بيانات الاشتراك في Firestore
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

    try {
      await firestoreService.saveSubscription(subscriptionData.toFirestore());

      await firestoreService.updateLawyerSubscriptionInfo(lawyerId, {
        subscriptionType,
        subscriptionStartDate: now,
        subscriptionEndDate: endDate,
      });
    } catch (firestoreError) {
      console.error("❌ Firestore Save Failed:", firestoreError.message);
      return res.status(500).json({
        error: "Failed to save subscription to Firestore",
        details: firestoreError.message,
      });
    }

    return res.status(201).json({
      subscriptionId: subscription.id,
      clientSecret,
      message: "✅ Subscription created successfully. Awaiting payment.",
    });
  } catch (err) {
    console.error("🔥 Unexpected Error:", err.message);
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
};

module.exports = {
  createStripeSubscriptionAndSave,
};
