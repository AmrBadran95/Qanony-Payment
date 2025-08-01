const subscriptionService = require("./subscriptionService");
const paymentService = require("./paymentService");

const handleEvent = async (event) => {
  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(event.data.object);
      break;

    case "payment_intent.payment_failed":
      await handlePaymentIntentFailed(event.data.object);
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};

const handlePaymentIntentSucceeded = async (paymentIntent) => {
  const metadata = paymentIntent.metadata || {};

  if (metadata.paymentType === "subscription") {
    console.log(
      `Subscription payment succeeded for lawyerId: ${metadata.lawyerId}`
    );
    await subscriptionService.createOrUpdateSubscription(
      metadata.lawyerId,
      metadata.subscriptionType,
      paymentIntent.price / 100
    );
  } else if (metadata.paymentType === "client-service") {
    console.log(
      `Client service payment succeeded for orderId: ${metadata.orderId}`
    );
    await paymentService.processLawyerPayment({
      orderId: metadata.orderId,
      lawyerId: metadata.lawyerId,
    });
  } else {
    console.log(
      "PaymentIntent succeeded with unknown paymentType metadata:",
      metadata
    );
  }
};

const handlePaymentIntentFailed = async (paymentIntent) => {
  const metadata = paymentIntent.metadata || {};
  console.log(
    `PaymentIntent failed for paymentType: ${metadata.paymentType}`,
    paymentIntent.id
  );
};

const handleSubscriptionDeleted = async (subscription) => {
  console.log(`Subscription deleted: ${subscription.id}`);
};

module.exports = {
  handleEvent,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  handleSubscriptionDeleted,
};
