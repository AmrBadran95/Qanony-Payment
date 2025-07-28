const stripe = require("../config/stripe");
const firestore = require("../config/firebase");

const createStripeCustomer = async (req, res) => {
  const { lawyerId, name, email } = req.body;

  if (!lawyerId || !email || !name) {
    return res
      .status(400)
      .json({ error: "lawyerId, name, and email are required" });
  }

  try {
    const customer = await stripe.customers.create({
      name,
      email,
      metadata: { lawyerId },
    });

    const lawyerRef = firestore.collection("lawyers").doc(lawyerId);
    await lawyerRef.update({
      stripeCustomerId: customer.id,
    });

    res.json({ customerId: customer.id });
  } catch (error) {
    console.error("Stripe Customer Error:", error);
    res.status(500).json({ error: "Failed to create Stripe customer" });
  }
};

module.exports = {
  createStripeCustomer,
};
