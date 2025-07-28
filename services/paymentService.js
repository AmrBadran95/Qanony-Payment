const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

async function createCheckoutSession({
  priceInCents,
  lawyerStripeAccountId,
  feeInCents,
}) {
  return await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "egp",
          unit_amount: priceInCents,
          product_data: {
            name: "Legal Consultation",
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    payment_intent_data: {
      application_fee_amount: feeInCents,
      transfer_data: {
        destination: lawyerStripeAccountId,
      },
    },
    success_url: `${process.env.FRONTEND_URL}/payment-success`,
    cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
  });
}

module.exports = {
  createCheckoutSession,
};
