const express = require("express");
const app = express();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cors = require("cors");
const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccount = JSON.parse(
  fs
    .readFileSync(
      "./qanony-app-firebase-adminsdk-fbsvc-10ba40e225.json",
      "utf8"
    )
    .replace(/\\n/g, "\n")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

app.use(cors());
app.use(express.json());

/** Health Check Route **/
app.get("/", (req, res) => {
  res.send("Qanony Stripe + Firebase server is running!");
});

/** Payment Route **/
app.post("/create-payment-intent", async (req, res) => {
  try {
    let { amount, email } = req.body;
    amount = amount * 100;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    const paymentData = {
      amount: amount,
      time: new Date().toISOString(),
    };

    if (email) {
      paymentData.email = email;
    }

    await db.collection("payments").add(paymentData);

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error("Stripe Error:", err);
    res.status(500).send({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
