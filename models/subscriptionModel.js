class SubscriptionModel {
  constructor({
    lawyerId,
    subscriptionType = "one_time",
    subscriptionStart = new Date(),
    subscriptionEnd = null,
    moneyPaid = 0,
    subscriptionStatus = "paid",
    currency = "egp",
    createdAt = new Date(),
  }) {
    this.lawyerId = lawyerId;
    this.subscriptionType = subscriptionType;
    this.subscriptionStart = new Date(subscriptionStart);
    this.subscriptionEnd = subscriptionEnd;
    this.moneyPaid = moneyPaid;
    this.subscriptionStatus = subscriptionStatus;
    this.currency = currency;
    this.createdAt = new Date(createdAt);
  }

  toPlainObject() {
    return {
      lawyerId: this.lawyerId,
      subscriptionType: this.subscriptionType,
      subscriptionStart: this.subscriptionStart,
      subscriptionEnd: this.subscriptionEnd,
      moneyPaid: this.moneyPaid,
      subscriptionStatus: this.subscriptionStatus,
      currency: this.currency,
      createdAt: this.createdAt,
    };
  }

  static fromPaymentIntent(intent, lawyerId) {
    return new SubscriptionModel({
      lawyerId,
      moneyPaid: intent.amount / 100,
      subscriptionStart: new Date(intent.created * 1000),
      currency: intent.currency,
    });
  }
}

module.exports = SubscriptionModel;
