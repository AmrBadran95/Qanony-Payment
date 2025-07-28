const {
  createConnectedAccount,
  createAccountLink,
} = require("../services/connectService");

const { updateLawyerStripeAccount } = require("../utils/firestoreUtils");

const createConnectAccount = async (req, res) => {
  const { lawyerId, email } = req.body;

  try {
    const account = await createConnectedAccount(email);
    const accountLink = await createAccountLink(account.id);

    await updateLawyerStripeAccount(lawyerId, {
      stripeConnectAccountId: account.id,
      stripeOnboardingStartedAt: new Date().toISOString(),
    });

    res.status(200).json({
      accountId: account.id,
      url: accountLink.url,
    });
  } catch (err) {
    console.error("Stripe Connect Error:", err);
    res.status(500).json({ error: "Stripe Connect creation failed." });
  }
};

module.exports = {
  createConnectAccount,
};
