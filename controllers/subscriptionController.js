const stripe = require("../config/stripe");
const firestore = require("../config/firebase");

exports.createLawyerSubscription = async (req, res) => {
  const { lawyerId, email, priceId, subscriptionType } = req.body;

  try {
    if (!lawyerId || !email || !priceId || !subscriptionType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let customer;
    const customers = await stripe.customers.list({ email, limit: 1 });

    if (customers.data.length > 0) {
      customer = customers.data[0];
      console.log("Found existing customer:", customer.id);
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: { lawyerId },
      });
      console.log("Created new customer:", customer.id);
    }

    await firestore.collection("lawyers").doc(lawyerId).update({
      stripeCustomerId: customer.id,
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      collection_method: "charge_automatically",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: { lawyerId, subscriptionType },
    });

    console.log("Subscription created. ID:", subscription.id);

    let paymentIntent = subscription.latest_invoice?.payment_intent;

    if (!paymentIntent) {
      const invoiceId = subscription.latest_invoice?.id;
      console.warn("PaymentIntent missing. Trying manual fetch...");

      if (invoiceId) {
        const invoice = await stripe.invoices.retrieve(invoiceId, {
          expand: ["payment_intent"],
        });

        if (invoice?.payment_intent) {
          paymentIntent = invoice.payment_intent;
          console.log("Fetched PaymentIntent manually:", paymentIntent.id);
        }
      }
    }

    if (!paymentIntent || !paymentIntent.client_secret) {
      console.error("PaymentIntent is still null or has no client secret.");
      return res.status(500).json({ error: "Payment intent not available" });
    }

    await firestore.collection("payments").add({
      lawyerId,
      stripeCustomerId: customer.id,
      subscriptionId: subscription.id,
      subscriptionType,
      paymentIntentId: paymentIntent.id,
      moneyPaid: null,
      status: "pending",
      createdAt: new Date(),
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return res.status(500).json({ error: error.message });
  }
};
