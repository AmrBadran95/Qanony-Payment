const stripe = require("../config/stripe");

exports.createSetupIntent = async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: "Missing customerId" });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
    });

    res.json({
      clientSecret: setupIntent.client_secret,
      customerId: setupIntent.customer,
    });
  } catch (err) {
    console.error("Error creating SetupIntent:", err);
    res.status(500).json({ error: "Failed to create SetupIntent" });
  }
};
