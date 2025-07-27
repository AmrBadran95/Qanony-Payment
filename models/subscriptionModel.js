class SubscriptionModel {
  constructor({
    lawyerId,
    subscriptionType,
    subscriptionStartDate,
    subscriptionEndDate,
    moneyPaid,
    createdAt,
  }) {
    this.lawyerId = lawyerId;
    this.subscriptionType = subscriptionType;
    this.subscriptionStartDate = subscriptionStartDate;
    this.subscriptionEndDate = subscriptionEndDate;
    this.moneyPaid = moneyPaid;
    this.createdAt = createdAt;
  }

  toFirestore() {
    return {
      lawyerId: this.lawyerId,
      subscriptionType: this.subscriptionType,
      subscriptionStartDate: this.subscriptionStartDate,
      subscriptionEndDate: this.subscriptionEndDate,
      moneyPaid: this.moneyPaid,
      createdAt: this.createdAt,
    };
  }
}

module.exports = SubscriptionModel;
