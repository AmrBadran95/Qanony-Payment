const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./config/firebase");

const app = express();

app.use("/api/webhook", express.raw({ type: "application/json" }));
const webhookRoutes = require("./routes/webhookRoutes");
app.use("/api/webhook", webhookRoutes);

app.use(cors());
app.use(express.json());

const subscriptionControllerRoutes = require("./routes/subscriptionRoutes");
const stripeCustomerRoutes = require("./routes/stripeCustomerRoutes");
const stripeConnectRoutes = require("./routes/connectRoutes");
const paymentIntentRoutes = require("./routes/paymentRoutes");

app.use("/api/subscriptions", subscriptionControllerRoutes);
app.use("/api/stripe-customers", stripeCustomerRoutes);
app.use("/api/stripe-connect", stripeConnectRoutes);
app.use("/api/payment-intent-secret", paymentIntentRoutes);

app.get("/", (req, res) => {
  res.send("Qanony Stripe + Firebase server is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
