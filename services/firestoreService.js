const db = require("../config/firebase");

const saveSubscription = async (subscription, customId = null) => {
  try {
    subscription.createdAt = subscription.createdAt || new Date();
    subscription.subscriptionStatus =
      subscription.subscriptionStatus || "active";
    subscription.subscriptionType = subscription.subscriptionType || "monthly";

    let docRef;

    if (customId) {
      docRef = db.collection("subscriptions").doc(customId);
      await docRef.set(subscription);
    } else {
      docRef = await db.collection("subscriptions").add(subscription);
    }

    console.log("Subscription saved to Firestore");

    return docRef.id;
  } catch (error) {
    console.error("Failed to save subscription:", error);
    throw error;
  }
};

const updateLawyerSubscriptionInfo = async (
  lawyerId,
  subscriptionData,
  merge = true
) => {
  try {
    subscriptionData.updatedAt = new Date();

    const lawyerRef = db.collection("lawyers").doc(lawyerId);
    const lawyerDoc = await lawyerRef.get();

    if (!lawyerDoc.exists) {
      throw new Error(`Lawyer (${lawyerId}) does not exist in Firestore.`);
    }

    if (merge) {
      await lawyerRef.set(subscriptionData, { merge: true });
    } else {
      await lawyerRef.update(subscriptionData);
    }

    console.log(`Lawyer (${lawyerId}) subscription info updated.`);
  } catch (error) {
    console.error("Failed to update lawyer subscription info:", error);
    throw error;
  }
};

const updateLawyerStripeAccount = async (lawyerId, data) => {
  try {
    data.stripeUpdatedAt = new Date();

    const lawyerRef = db.collection("lawyers").doc(lawyerId);
    await lawyerRef.set(data, { merge: true });

    console.log(`Lawyer (${lawyerId}) Stripe account updated.`);
  } catch (error) {
    console.error("Failed to update lawyer Stripe account:", error);
    throw error;
  }
};

const getLawyerById = async (lawyerId) => {
  try {
    const doc = await db.collection("lawyers").doc(lawyerId).get();
    return doc;
  } catch (error) {
    console.error("Error getting lawyer by ID:", error);
    throw error;
  }
};

const findPaymentByTransactionId = async (transactionId) => {
  try {
    const snapshot = await db
      .collection("payments")
      .where("transactionId", "==", transactionId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      data: doc.data(),
    };
  } catch (error) {
    console.error("Error finding payment by transaction ID:", error);
    throw error;
  }
};

module.exports = {
  saveSubscription,
  updateLawyerSubscriptionInfo,
  updateLawyerStripeAccount,
  getLawyerById,
  findPaymentByTransactionId,
};
