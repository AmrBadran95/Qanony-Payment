const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

async function createConnectedAccount(email) {
  return await stripe.accounts.create({
    type: "express",
    email,
    country: "EG",
    business_type: "individual",
    capabilities: {
      transfers: { requested: true },
    },
  });
}

async function createAccountLink(accountId) {
  return await stripe.accountLinks.create({
    account: accountId,
    return_url: "https://qanony-admin-panel.vercel.app/stripe-connect/success",
    refresh_url: "https://qanony-admin-panel.vercel.app/stripe-connect/retry",
    type: "account_onboarding",
  });
}

module.exports = {
  createConnectedAccount,
  createAccountLink,
};
