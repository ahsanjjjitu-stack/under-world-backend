const Notification = require('../models/Notification');
const sendFCMNotification = require('./sendNotification');
const User = require('../models/User');


const sendAppNotification = async (io, getSocketId, data) => {
    try {

        const { recipientId, title, body, type, orderId, fcmToken } = data;

        const newNotification = new Notification({
            recipient: recipientId,
            title,
            body,
            type,
            orderId,
            isRead: false
        });

        const savedNotification = await newNotification.save();



        const recipientSocketId = getSocketId ? getSocketId.get(recipientId.toString()) : null;

        if (recipientSocketId && io) {
            io.to(recipientSocketId).emit('new_notification', savedNotification);
            console.log(`Socket notification sent to user: ${recipientId}`);
        }
        else if (fcmToken) {
            const user = await User.findById(recipientId).select('pushNotificationsEnabled');
            const pushEnabled = user ? user.pushNotificationsEnabled : true; 

            if (pushEnabled) {
                const fcmPayload = {
                    title,
                    body,
                    data: {
                        orderId: orderId.toString(),
                        type,
                        notificationId: savedNotification._id.toString()
                    }
                };
                await sendFCMNotification(fcmToken, fcmPayload);
                console.log(`FCM push notification sent to user: ${recipientId}`);
            } else {
                console.log(`FCM push notification skipped for user ${recipientId} (Push notifications disabled)`);
            }
        }

        return savedNotification;

    }
    catch (error) {
        console.error("Error in sendAppNotification service:", error);
    }
}


module.exports = { sendAppNotification };