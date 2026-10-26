const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true },
            selectedColour: {
                name: { type: String, required: true },
                hex: { type: String, required: true },
                image: { type: String }
            },
            selectedSize: { type: String, required: true },
            image: { type: String } 
        }
    ],
    shippingAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        district: { type: String, required: true },
        area: { type: String, required: true },
        addressLine: { type: String, required: true }
    },
    payment: {
        method: { 
            type: String, 
            enum: ['bkash', 'nagad', 'cod'], 
            required: true 
        },
        senderNumber: { type: String, default: "" }, 
        transactionId: { type: String, default: "" } 
    },
    totalAmount: {
        type: Number,
        required: true
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'confirmed'],
        default: 'pending' 
    }
}, {
    timestamps: true 
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;