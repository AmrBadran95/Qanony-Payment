const db = require("../config/firebase");

const updateLawyerStripeAccount = async (lawyerId, data) => {
  try {
    const lawyerRef = db.collection("lawyers").doc(lawyerId);
    await lawyerRef.update(data);
  } catch (error) {
    console.error("Error updating lawyer Stripe account:", error);
    throw error;
  }
};

module.exports = {
  updateLawyerStripeAccount,
};
