const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
require("./config/firebase");
const {
  startNotificationScheduler,
} = require("./scripts/scheduledNotification");

const app = express();

app.use("/api/webhook", bodyParser.raw({ type: "application/json" }));

app.use(cors());
app.use(express.json());

const webhookRoutes = require("./routes/webhookRoutes");
app.use("/api/webhook", webhookRoutes);

const subscriptionControllerRoutes = require("./routes/subscriptionRoutes");
const stripeConnectRoutes = require("./routes/connectRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

app.use("/api/subscriptions", subscriptionControllerRoutes);
app.use("/api/stripe-connect", stripeConnectRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("Qanony Stripe + Firebase server is running!");
});

startNotificationScheduler();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
