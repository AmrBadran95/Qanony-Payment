const admin = require("firebase-admin");

const sendNotification = async ({ fcmToken, title, body, data }) => {
  const message = {
    token: fcmToken,
    notification: {
      title,
      body,
    },
    data,
  };

  await admin.messaging().send(message);
};

module.exports = {
  sendNotification,
};
