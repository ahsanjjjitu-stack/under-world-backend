const express = require('express');
const router = express.Router();
const { placeOrder, confirmOrder, getUnreadCount, getNotificationsWithPagination,
     markNotificationAsRead, 
     deleteNotification,
     getOrderDetailsById,
     getUserOrdersWithPagination} = require('../controllers/orderController');
const verifyToken = require('../middleware/verifyToken'); 

router.post('/place-order', verifyToken, placeOrder);
router.get('/notifications/unread-count', verifyToken, getUnreadCount);
router.put('/confirm-order/:orderId', confirmOrder);
router.get('/notifications', verifyToken, getNotificationsWithPagination);
router.patch('/notifications/:id/read', verifyToken, markNotificationAsRead);
router.get('/orders/my-orders', verifyToken, getUserOrdersWithPagination);
router.delete('/notifications/:id', verifyToken, deleteNotification);
router.get('/orders/:id', verifyToken, getOrderDetailsById);

module.exports = router;