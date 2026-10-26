const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { addCart, getCartCount, getCart, updateCartQuantity, removeCartItem } = require('../controllers/cartController');
const router = express.Router();

router.post('/cart-add', verifyToken, addCart);
router.get('/cart-count', verifyToken, getCartCount);
router.get('/cart', verifyToken, getCart);
router.put('/update-quantity', verifyToken, updateCartQuantity);
router.delete('/remove-item', verifyToken, removeCartItem);

module.exports = router;