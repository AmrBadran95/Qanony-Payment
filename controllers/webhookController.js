const stripe = require("../config/stripe");
const webhookService = require("../services/webhookService");

exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await webhookService.handleEvent(event);
  } catch (err) {
    console.error("Error handling webhook event:", err);
    return res.status(500).send("Internal Server Error");
  }

  res.status(200).send("Webhook received");
};
