const notificationService = require("../services/notificationService");

const sendNotification = async (req, res) => {
  try {
    const { fcmToken, title, body, data } = req.body;

    if (!fcmToken || !title || !body || !data) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await notificationService.sendNotification({ fcmToken, title, body, data });

    return res.status(200).json({ message: "Notification sent successfully" });
  } catch (err) {
    console.error("Error sending notification:", err);
    return res.status(500).json({ error: "Failed to send notification" });
  }
};

module.exports = {
  sendNotification,
};
