const db = require("../config/firebase");

const createOrUpdateSubscription = async (
  lawyerId,
  subscriptionType,
  amountPaid
) => {
  const now = new Date();
  const startDate = now;
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  const subscriptionData = {
    lawyerId,
    subscriptionType,
    subscriptionStart: startDate,
    subscriptionEnd: endDate,
    moneyPaid: amountPaid || 0,
    updatedAt: new Date(),
  };

  const subsRef = db.collection("subscriptions");
  const existing = await subsRef
    .where("lawyerId", "==", lawyerId)
    .limit(1)
    .get();

  if (!existing.empty) {
    const docId = existing.docs[0].id;
    await subsRef.doc(docId).update(subscriptionData);
  } else {
    await subsRef.add({
      ...subscriptionData,
      createdAt: new Date(),
    });
  }

  await db.collection("lawyers").doc(lawyerId).update({
    subscriptionType,
    subscriptionStartDate: startDate,
    subscriptionEndDate: endDate,
  });

  console.log(`Subscription (${subscriptionType}) set for lawyer: ${lawyerId}`);
};

const checkExpiredSubscriptions = async () => {
  const now = new Date();

  const subsSnap = await db
    .collection("subscriptions")
    .where("subscriptionEnd", "<=", now)
    .where("subscriptionType", "!=", "free")
    .get();

  if (subsSnap.empty) {
    console.log("No expired subscriptions found.");
    return;
  }

  const batch = db.batch();

  subsSnap.forEach((doc) => {
    const subRef = doc.ref;
    const subData = doc.data();
    const lawyerRef = db.collection("lawyers").doc(subData.lawyerId);

    batch.update(subRef, {
      subscriptionType: "free",
      updatedAt: new Date(),
    });

    batch.update(lawyerRef, {
      subscriptionType: "free",
    });
  });

  await batch.commit();
  console.log(`${subsSnap.size} subscription(s) downgraded to 'free'.`);
};

module.exports = {
  createOrUpdateSubscription,
  checkExpiredSubscriptions,
};
