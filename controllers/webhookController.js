const stripe = require("../config/stripe");
const webhookService = require("../services/webhookService");

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Invalid webhook signature:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await webhookService.routePaymentIntentSucceeded(event.data.object);
        break;

      case "checkout.session.completed":
        await webhookService.routeCheckoutCompleted(event.data.object);
        break;

      case "invoice.paid":
        await webhookService.routeInvoicePaid(event.data.object);
        break;

      case "invoice.finalized":
        console.log("Invoice finalized:", event.data.object.id);
        break;

      case "payment_intent.created":
      case "customer.subscription.created":
      case "invoice.created":
        console.log(`Received and ignored event type: ${event.type}`);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).send("Webhook handled");
  } catch (error) {
    console.error("Error in webhook handling:", error);
    res.status(500).send("Webhook handling failed");
  }
};
