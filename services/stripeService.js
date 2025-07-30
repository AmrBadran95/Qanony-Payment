const stripe = require("../config/stripe");
const firestore = require("../config/firebase");

async function getOrCreateCustomer(lawyerId, email) {
  const lawyerRef = firestore.collection("lawyers").doc(lawyerId);
  const doc = await lawyerRef.get();

  if (!doc.exists) {
    throw new Error("Lawyer not found in Firestore");
  }

  const data = doc.data();

  if (data.stripeCustomerId) {
    return data.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { lawyerId },
  });

  await lawyerRef.update({
    stripeCustomerId: customer.id,
  });

  return customer.id;
}

module.exports = {
  getOrCreateCustomer,
};
