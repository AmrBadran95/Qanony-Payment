const cron = require("node-cron");
const db = require("../config/firebase");
const { sendNotification } = require("../services/notificationService");

const startNotificationScheduler = () => {
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const targetTime = new Date(now.getTime() + 10 * 60 * 1000);

    const ordersSnapshot = await db
      .collection("orders")
      .where("status", "==", "payment_done")
      .get();

    ordersSnapshot.forEach(async (doc) => {
      const order = doc.data();
      if (!order.date || !order.userId || !order.lawyerId) return;

      const orderDate = order.date.toDate();
      const timeDiff = Math.abs(orderDate - targetTime);
      if (timeDiff <= 60 * 1000) {
        const userRef = db.collection("users").doc(order.userId);
        const lawyerRef = db.collection("lawyers").doc(order.lawyerId);

        const [userSnap, lawyerSnap] = await Promise.all([
          userRef.get(),
          lawyerRef.get(),
        ]);

        const userToken = userSnap.exists ? userSnap.data().fcmToken : null;
        const lawyerToken = lawyerSnap.exists
          ? lawyerSnap.data().fcmToken
          : null;

        const formatted = formatArabicDate(orderDate);

        if (userToken) {
          await sendNotification({
            fcmToken: userToken,
            title: "تنبيه بميعادك",
            body: `عندك ميعاد مع المحامي يوم ${formatted}`,
            data: { type: "user_order" },
          });
        }

        if (lawyerToken) {
          await sendNotification({
            fcmToken: lawyerToken,
            title: "تنبيه بميعاد مع عميل",
            body: `👤 عندك ميعاد مع عميل يوم ${formatted}`,
            data: { type: "lawyer_order" },
          });
        }
      }
    });

    await handleAppointments(targetTime);
  });
};

const handleAppointments = async (targetTime) => {
  const appointmentsSnapshot = await db.collection("appointments").get();

  appointmentsSnapshot.forEach(async (doc) => {
    const appointment = doc.data();

    if (!appointment.date || !appointment.lawyerId) return;

    const appointmentDate = appointment.date.toDate();
    const timeDiff = Math.abs(appointmentDate - targetTime);

    if (timeDiff <= 60 * 1000) {
      const lawyerSnap = await db
        .collection("lawyers")
        .doc(appointment.lawyerId)
        .get();

      if (lawyerSnap.exists) {
        const lawyerToken = lawyerSnap.data().fcmToken;
        const formatted = formatArabicDate(appointmentDate);

        if (lawyerToken) {
          await sendNotification({
            fcmToken: lawyerToken,
            title: "تذكير بميعادك الداخلي",
            body: `عندك ميعاد داخلي يوم ${formatted}`,
            data: { type: "lawyer_appointment" },
          });
        }
      }
    }
  });
};

const formatArabicDate = (date) =>
  date.toLocaleString("ar-EG", {
    timeZone: "Africa/Cairo",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

module.exports = { startNotificationScheduler };
