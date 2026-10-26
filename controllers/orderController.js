const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Notification = require("../models/Notification");
const { getIO, onlineUsers } = require('../config/socket');
const { sendAppNotification } = require('../utils/notificationService');



// order save controller 

const placeOrder = async (req, res) => {
    try {
        const userId = req.user.id || req.userId;
        const { shippingAddress, payment } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }



        const cart = await Cart.findOne({ userId });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }


        if (payment.method === 'bkash' || payment.method === 'nagad') {
            if (!payment.senderNumber || !payment.transactionId) {
                return res.status(400).json({
                    success: false,
                    message: "Sender number and Transaction ID are required for bKash/Nagad"
                });
            }
        }


        const newOrder = new Order({
            userId,
            items: cart.items,
            shippingAddress,
            payment,
            totalAmount: cart.totalAmount,
            orderStatus: 'pending'
        });




        const savedOrder = await newOrder.save();

        cart.items = [];
        cart.totalAmount = 0;
        await cart.save();





        try {

            const io = getIO();

            const admins = await User.find({ role: 'admin' });

            if (admins && admins.length > 0) {

                for (const admin of admins) {
                    await sendAppNotification(io, onlineUsers, {
                        recipientId: admin._id,
                        title: "New order has arrived!",
                        body: `New order has been placed. Total amount: ৳${savedOrder.totalAmount}`,
                        type: 'ORDER_PLACED',
                        orderId: savedOrder._id,
                        fcmToken: admin.fcmToken
                    });
                }
            }

        }
        catch (notifError) {
            console.error("Error sending order notification to admin:", notifError);
        }




        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: savedOrder
        });


    }
    catch (error) {
        console.error("Error placing order:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to place order",
            error: error.message
        });
    }
}











// order confirm for admin controller 

const confirmOrder = async (req, res) => {

    try {

        const { orderId } = req.params;


        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }


        order.orderStatus = 'confirmed';
        const updatedOrder = await order.save();


        try {

            const io = getIO();
            const userId = order.userId;

            const user = await User.findById(userId);

            if (user) {
                await sendAppNotification(io, onlineUsers, {
                    recipientId: user._id,
                    title: "Your Order confirmed!",
                    body: `Order number #${updatedOrder._id.toString().slice(-6)} Successfully confirmed.`,
                    type: 'ORDER_CONFIRMED',
                    orderId: updatedOrder._id,
                    fcmToken: user.fcmToken
                });
                console.log(`Order confirmation notification sent to user: ${userId}`);
            }

        }
        catch (notifError) {
            console.error("Error sending notification to user:", notifError);
        }



        return res.status(200).json({
            success: true,
            message: "Order confirmed successfully",
            data: updatedOrder
        });

    }
    catch (error) {
        console.error("Error confirming order:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to confirm order",
            error: error.message
        });
    }


}

















// get unread notification count controller 

const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id || req.userId;

        const count = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });

        return res.status(200).json({
            success: true,
            unreadCount: count
        });
    } catch (error) {
        console.error("Error fetching unread count:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch unread count",
            error: error.message
        });
    }
};

















// get notification item 

const getNotificationsWithPagination = async (req, res) => {

    try {

        const userId = req.user.id || req.userId;
        const { limit = 10, lastCreatedAt } = req.query;

        let query = { recipient: userId };

        if (lastCreatedAt) {
            query.createdAt = { $lt: new Date(lastCreatedAt) };
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();


        const nextCursor = notifications.length > 0
            ? notifications[notifications.length - 1].createdAt
            : null;



        return res.status(200).json({
            success: true,
            count: notifications.length,
            nextCursor,
            data: notifications
        });

    }
    catch (error) {
        console.error("Error fetching paginated notifications:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
            error: error.message
        });
    }

}















// update read notification controller 

const markNotificationAsRead = async (req, res) => {
    try {
        const userId = req.user.id || req.userId;
        const notificationId = req.params.id;

        console.log("--- MARK AS READ DEBUG ---");
        console.log("Notification ID:", notificationId);
        console.log("User ID from Token:", userId);

        const updatedNotification = await Notification.findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(notificationId),
                recipient: new mongoose.Types.ObjectId(userId)
            },
            { $set: { isRead: true } },
            { returnDocument: 'after' }
        );

        if (!updatedNotification) {
            console.log("❌ Notification not found or recipient mismatch in DB!");
            return res.status(404).json({
                success: false,
                message: "Notification not found or unauthorized"
            });
        }

        console.log("✅ Successfully marked as read in DB!");
        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: updatedNotification
        });

    } catch (error) {
        console.error("Error marking notification as read:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update notification",
            error: error.message
        });
    }
};














const deleteNotification = async (req, res) => {

    try {
        const userId = req.user.id || req.userId;
        const notificationId = req.params.id;


        const deletedNotification = await Notification.findOneAndDelete({
            _id: new mongoose.Types.ObjectId(notificationId),
            recipient: new mongoose.Types.ObjectId(userId)
        });



        if (!deletedNotification) {
            console.log("❌ Notification not found or recipient mismatch in DB!");
            return res.status(404).json({
                success: false,
                message: "Notification not found or unauthorized"
            });
        }



        console.log("✅ Successfully deleted notification from DB!");
        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully"
        });

    }
    catch (error) {
        console.error("Error deleting notification:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete notification",
            error: error.message
        });
    }

}

















// get order controller 

const getOrderDetailsById = async (req, res) => {

    try {

        const userId = req.user.id || req.userId;
        const orderId = req.params.id;

        const order = await Order.findById({
            _id: new mongoose.Types.ObjectId(orderId),
            userId: new mongoose.Types.ObjectId(userId)
        }).lean();




        if (!order) {
            console.log("❌ Order not found or recipient mismatch in DB!");
            return res.status(404).json({
                success: false,
                message: "Order not found or unauthorized"
            });
        }



        console.log("✅ Order fetched successfully!");
        return res.status(200).json({
            success: true,
            message: "Order details fetched successfully",
            data: order
        });


    }
    catch (error) {
        console.error("Error fetching order details:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch order details",
            error: error.message
        });
    }

};



















// user order get controller 

const getUserOrdersWithPagination = async (req, res) => {

    try {

        const userId = req.user.id || req.userId;

        const limit = parseInt(req.query.limit) || 10;
        const lastCreatedAt = req.query.lastCreatedAt;


        let query = { userId: new mongoose.Types.ObjectId(userId) };

        if (lastCreatedAt) {
            query.createdAt = { $lt: new Date(lastCreatedAt) };
        }


        const rawOrders = await Order.find(query)
            .select('_id orderStatus createdAt totalAmount items')
            .sort({ createdAt: -1, _id: -1 })
            .limit(limit)
            .lean();


        const orders = rawOrders.map(order => {
            const totalItemCount = order.items ? order.items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;

            return {
                _id: order._id,
                orderStatus: order.orderStatus,
                createdAt: order.createdAt,
                totalAmount: order.totalAmount,
                totalItemCount: totalItemCount
            };
        });



        let nextCursor = null;
        if (orders.length > 0) {
            nextCursor = orders[orders.length - 1].createdAt;
        }




        return res.status(200).json({
            success: true,
            count: orders.length,
            nextCursor: nextCursor,
            data: orders
        });


    }
    catch (error) {
        console.error("Error fetching user orders with pagination:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch orders",
            error: error.message
        });
    }

}









module.exports = {
    placeOrder, confirmOrder, getUnreadCount, getNotificationsWithPagination,
    markNotificationAsRead, deleteNotification, getOrderDetailsById, getUserOrdersWithPagination
};