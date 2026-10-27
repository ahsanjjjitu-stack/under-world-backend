const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

const serviceAccount = require("../serviceAccountKey.json");

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount)
    });

console.log("Firebase Admin Initialized Successfully!");

const sendFCMNotification = async (fcmToken, payload) => {
  try {
    if (!fcmToken) {
      console.log("❌ FCM token missing in database for this user.");
      return;
    }

    const message = {
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body
      },
      data: Object.fromEntries(
        Object.entries(payload.data || {}).map(
          ([key, value]) => [key, String(value)]
        )
      )
    };

    const response = await getMessaging(app).send(message);

    console.log("🚀 FCM Notification sent successfully:", response);
    return response;
  } catch (error) {
    // 🔍 ফায়ারবেসের আসল এরর দেখার জন্য ডিটেইলড লগ
    console.error("❌ Error sending FCM notification:", error.message);
    if (error.errorInfo) {
      console.error("Firebase Error Info:", JSON.stringify(error.errorInfo, null, 2));
    }
  }
};

module.exports = sendFCMNotification;