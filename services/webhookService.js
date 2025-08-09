const subscriptionService = require("./subscriptionService");
const paymentService = require("./paymentService");
const db = require("../config/firebase");
const { sendNotification } = require("./notificationService");

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
    const amountPaid = paymentIntent.amount_received / 100;

    console.log(
      `Subscription payment succeeded for lawyerId: ${metadata.lawyerId}`
    );
    await subscriptionService.createOrUpdateSubscription(
      metadata.lawyerId,
      metadata.subscriptionType,
      amountPaid
    );

    const lawyerDoc = await db
      .collection("lawyers")
      .doc(metadata.lawyerId)
      .get();

    if (lawyerDoc.exists) {
      const lawyerData = lawyerDoc.data();

      if (lawyerData.fcmToken) {
        await sendNotification({
          fcmToken: lawyerData.fcmToken,
          title: "تم الاشتراك",
          body: `تم دفع مبلغ ${amountPaid} لإشتراكك بنجاح.`,
          data: {
            type: "subscription_paid",
          },
        });
      }
    }
  } else if (metadata.paymentType === "client-service") {
    console.log(
      `Client service payment succeeded for orderId: ${metadata.orderId}`
    );
    await paymentService.processLawyerPayment({
      orderId: metadata.orderId,
      lawyerId: metadata.lawyerId,
    });

    const orderDoc = await db.collection("orders").doc(metadata.orderId).get();
    const lawyerDoc = await db
      .collection("lawyers")
      .doc(metadata.lawyerId)
      .get();

    if (orderDoc.exists && lawyerDoc.exists) {
      const orderData = orderDoc.data();
      const lawyerData = lawyerDoc.data();

      if (lawyerData.fcmToken) {
        await sendNotification({
          fcmToken: lawyerData.fcmToken,
          title: "تم تأكيد موعد",
          body: `تم تحويل مبلغ ${amountPaid} إليك و لديك موعد مع العميل يوم ${orderData.date}`,
          data: {
            type: "lawyer_order_accepted",
            orderId: metadata.orderId,
          },
        });
      }

      if (orderData.userId) {
        const userDoc = await db
          .collection("users")
          .doc(orderData.userId)
          .get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData.fcmToken) {
            await sendNotification({
              fcmToken: userData.fcmToken,
              title: "تم الدفع بنجاح",
              body: `تم تأكيد دفع طلبك لخدمة المحامي.`,
              data: {
                type: "user_order",
                orderId: metadata.orderId,
              },
            });
          }
        }
      }
    }
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
