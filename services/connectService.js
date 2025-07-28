const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

async function createConnectedAccount(email) {
  return await stripe.accounts.create({
    type: "express",
    email,
    business_type: "individual",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
}

async function createAccountLink(accountId) {
  return await stripe.accountLinks.create({
    account: accountId,
    refresh_url: process.env.STRIPE_REFRESH_URL,
    return_url: process.env.STRIPE_REDIRECT_URL,
    type: "account_onboarding",
  });
}

module.exports = {
  createConnectedAccount,
  createAccountLink,
};
