class SubscriptionModel {
  constructor({
    lawyerId,
    subscriptionType = "monthly",
    subscriptionStartDate = new Date(),
    subscriptionEndDate = null,
    moneyPaid = 0,
    subscriptionStatus = "active",
    createdAt = new Date(),
  }) {
    this.lawyerId = lawyerId;
    this.subscriptionType = subscriptionType;
    this.subscriptionStartDate = new Date(subscriptionStartDate);
    this.subscriptionEndDate = subscriptionEndDate
      ? new Date(subscriptionEndDate)
      : this.#calculateEndDate(subscriptionType, subscriptionStartDate);
    this.moneyPaid = moneyPaid;
    this.subscriptionStatus = subscriptionStatus;
    this.createdAt = new Date(createdAt);
  }

  #calculateEndDate(type, startDate) {
    const date = new Date(startDate || Date.now());
    if (type === "monthly") {
      date.setMonth(date.getMonth() + 1);
    } else if (type === "yearly") {
      date.setFullYear(date.getFullYear() + 1);
    }
    return date;
  }

  toPlainObject() {
    return {
      lawyerId: this.lawyerId,
      subscriptionType: this.subscriptionType,
      subscriptionStartDate: this.subscriptionStartDate,
      subscriptionEndDate: this.subscriptionEndDate,
      moneyPaid: this.moneyPaid,
      subscriptionStatus: this.subscriptionStatus,
      createdAt: this.createdAt,
    };
  }

  static fromStripeEvent(event, lawyerId) {
    return new SubscriptionModel({
      lawyerId,
      moneyPaid: event.amount_received / 100,
      subscriptionType: "monthly",
      subscriptionStartDate: new Date(event.created * 1000),
    });
  }
}

module.exports = SubscriptionModel;
