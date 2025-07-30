const getPaymentIntentSecret = async (req, res) => {
  try {
    const { invoiceId } = req.query;

    const invoice = await stripe.invoices.retrieve(invoiceId);

    if (!invoice.payment_intent) {
      return res
        .status(202)
        .json({ ready: false, message: "PaymentIntent not ready yet" });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(
      invoice.payment_intent
    );

    return res.status(200).json({
      ready: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error("Failed to fetch payment intent:", err);
    res.status(500).json({ ready: false, message: "Internal error" });
  }
};
