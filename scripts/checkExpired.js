require("dotenv").config();
const {
  checkExpiredSubscriptions,
} = require("../services/subscriptionService");

checkExpiredSubscriptions().then(() => {
  console.log("Done checking expired subscriptions.");
  process.exit(0);
});
