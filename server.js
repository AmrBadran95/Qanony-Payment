const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./config/firebase");

const app = express();

app.use(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  require("./routes/webhookRoutes")
);

app.use(cors());
app.use(express.json());

const subscriptionControllerRoutes = require("./routes/subscriptionRoutes");
const stripeCustomerRoutes = require("./routes/stripeCustomerRoutes");
const stripeConnectRoutes = require("./routes/connectRoutes");

app.use("/api/subscriptions", subscriptionControllerRoutes);
app.use("/api/stripe-customers", stripeCustomerRoutes);
app.use("/api/stripe-connect", stripeConnectRoutes);

app.get("/", (req, res) => {
  res.send("Qanony Stripe + Firebase server is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
