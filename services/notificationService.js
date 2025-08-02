const admin = require("firebase-admin");

const sendNotification = async ({ fcmToken, title, body, data }) => {
  const message = {
    token: fcmToken,
    notification: {
      title,
      body,
    },
    data: {
      ...data,
      click_action: "FLUTTER_NOTIFICATION_CLICK",
    },
    android: {
      priority: "high",
      notification: {
        channelId: "qanony_channel",
        sound: "default",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
  };

  await admin.messaging().send(message);
};

module.exports = {
  sendNotification,
};
