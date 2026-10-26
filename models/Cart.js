const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'BDT' },
    thumbnail: { type: String },
    selectedColour: {
        name: { type: String, required: true },
        hex: { type: String, required: true },
        image: { type: String }
    },
    selectedSize: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 }
});

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true 
    },
    items: [cartItemSchema],
    totalAmount: { type: Number, required: true, default: 0 }
}, {
    timestamps: true
});


cartSchema.index({ "items.productId": 1 });

module.exports = mongoose.model('Cart', schema = cartSchema);