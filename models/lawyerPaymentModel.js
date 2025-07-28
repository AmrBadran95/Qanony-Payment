class LawyerPaymentModel {
  constructor({
    userId,
    lawyerId,
    amount,
    fee,
    transferredAmount,
    stripeSessionId,
    paymentStatus,
    createdAt,
  }) {
    this.userId = userId;
    this.lawyerId = lawyerId;
    this.amount = amount;
    this.fee = fee;
    this.transferredAmount = transferredAmount;
    this.stripeSessionId = stripeSessionId;
    this.paymentStatus = paymentStatus;
    this.createdAt = createdAt;
  }

  toFirestore() {
    return {
      userId: this.userId,
      lawyerId: this.lawyerId,
      amount: this.amount,
      fee: this.fee,
      transferredAmount: this.transferredAmount,
      stripeSessionId: this.stripeSessionId,
      paymentStatus: this.paymentStatus,
      createdAt: this.createdAt,
    };
  }
}

module.exports = LawyerPaymentModel;
