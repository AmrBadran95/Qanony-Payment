const SubscriptionModel = require("../models/subscriptionModel");
const firestoreService = require("../services/firestoreService");

const createSubscription = async (req, res) => {
  try {
    const {
      lawyerId,
      subscriptionType,
      subscriptionStartDate,
      subscriptionEndDate,
      moneyPaid,
    } = req.body;

    if (
      !lawyerId ||
      !subscriptionType ||
      !subscriptionStartDate ||
      !subscriptionEndDate ||
      !moneyPaid
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const subscription = new SubscriptionModel({
      lawyerId,
      subscriptionType,
      subscriptionStartDate: new Date(subscriptionStartDate),
      subscriptionEndDate: new Date(subscriptionEndDate),
      moneyPaid,
      createdAt: new Date(),
    });

    await firestoreService.saveSubscription(subscription.toFirestore());

    await firestoreService.updateLawyerSubscriptionInfo(lawyerId, {
      subscriptionType,
      subscriptionStartDate: new Date(subscriptionStartDate),
      subscriptionEndDate: new Date(subscriptionEndDate),
    });

    return res
      .status(201)
      .json({ message: "Subscription created successfully" });
  } catch (err) {
    console.error("Error creating subscription:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createSubscription,
};
