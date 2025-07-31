const paymentService = require("../services/paymentService");

const handleClientPayment = async (req, res) => {
  try {
    const { orderId, lawyerId } = req.body;

    if (!orderId || !lawyerId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing orderId or lawyerId" });
    }

    const result = await paymentService.processLawyerPayment({
      orderId,
      lawyerId,
    });

    return res
      .status(200)
      .json({ success: true, message: "Payment processed", result });
  } catch (err) {
    console.error("Error processing payment:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  handleClientPayment,
};
