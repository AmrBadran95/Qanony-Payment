const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./config/firebase");

const app = express();

const paymentRoutes = require("./routes/paymentRoutes");
const subscriptionControllerRoutes = require("./routes/subscriptionRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const stripeCustomerRoutes = require("./routes/stripeCustomerRoutes");

app.use("/api/webhook", express.raw({ type: "application/json" }));

app.use(cors());
app.use(express.json());

app.use("/api/payments", paymentRoutes);
app.use("/api/subscriptions", subscriptionControllerRoutes);
app.use("/api/stripe-customers", stripeCustomerRoutes);
app.use("/api/webhook", webhookRoutes);

app.get("/", (req, res) => {
  res.send("Qanony Stripe + Firebase server is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
