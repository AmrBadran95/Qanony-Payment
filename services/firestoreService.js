const db = require("../config/firebase");

const saveSubscription = async (subscription) => {
  try {
    if (!subscription.createdAt) {
      subscription.createdAt = new Date();
    }

    await db.collection("subscriptions").add(subscription);
    console.log("Subscription saved to Firestore");
  } catch (error) {
    console.error("Failed to save subscription:", error);
    throw error;
  }
};

const updateLawyerSubscriptionInfo = async (lawyerId, subscriptionData) => {
  try {
    subscriptionData.updatedAt = new Date();

    const lawyerRef = db.collection("lawyers").doc(lawyerId);
    await lawyerRef.update(subscriptionData);

    console.log(`Lawyer (${lawyerId}) updated with subscription info.`);
  } catch (error) {
    console.error("Failed to update lawyer subscription info:", error);
    throw error;
  }
};

module.exports = {
  saveSubscription,
  updateLawyerSubscriptionInfo,
};
