const express = require("express");
const app = express();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cors = require("cors");
const admin = require("firebase-admin");

const serviceAccount = require("./qanony-app-firebase-adminsdk-fbsvc-10ba40e225.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

app.use(cors());
app.use(express.json());

// app.get("/", (req, res) => {
//   res.send("Server is up and running!");
// });

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

app.listen(3000, () => console.log("Server running on port 3000"));
