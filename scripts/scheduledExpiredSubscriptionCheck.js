const cron = require("node-cron");
const {
  checkExpiredSubscriptions,
} = require("../services/subscriptionService");

const startExpiredSubscriptionsCheckScheduler = () => {
  cron.schedule("0 2 * * *", async () => {
    console.log("Daily subscription check start.");

    try {
      await checkExpiredSubscriptions();
      console.log("Daily subscription check complete.");
    } catch (err) {
      console.error("Subscription check failed:", err);
    }
  });
};

module.exports = { startExpiredSubscriptionsCheckScheduler };
