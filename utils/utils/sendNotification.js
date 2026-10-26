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
      console.log("FCM token missing.");
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

    console.log("FCM Notification sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Error sending FCM notification:", error);
  }
};

module.exports = sendFCMNotification;
