const {
  createConnectedAccount,
  createAccountLink,
} = require("../services/connectService");

const { updateLawyerStripeAccount } = require("../services/firestoreService");

const createConnectAccount = async (req, res) => {
  const { lawyerId, email } = req.body;

  try {
    const lawyerDoc = await db.collection("lawyers").doc(lawyerId).get();
    if (!lawyerDoc.exists) {
      return res.status(404).json({ error: "Lawyer not found." });
    }

    const lawyerData = lawyerDoc.data();

    let accountId = lawyerData.stripeConnectAccountId;
    if (!accountId) {
      const account = await createConnectedAccount(email);
      accountId = account.id;

      await updateLawyerStripeAccount(lawyerId, {
        stripeConnectAccountId: accountId,
        stripeOnboardingStartedAt: new Date().toISOString(),
      });
    }

    const accountLink = await createAccountLink(accountId);

    res.status(200).json({
      accountId,
      url: accountLink.url,
    });
  } catch (err) {
    console.error("Stripe Connect Error:", err);

    res.status(500).json({
      error: "Stripe Connect creation failed.",
      message: err.message,
      details: err?.raw || err,
    });
  }
};

module.exports = {
  createConnectAccount,
};
