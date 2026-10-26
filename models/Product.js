const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
    front: { type: String, required: true },
    back: { type: String, required: true },
    folded: { type: String, required: true }
}, { _id: false });

const colourSchema = new mongoose.Schema({
    name: { type: String, required: true },
    hex: { type: String, required: true },
    images: { type: imageSchema, required: true },
    sizes: [{ type: String, required: true }]
}, { _id: false });

const productSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, 
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: "BDT" },
    description: { type: String, required: true },
    thumbnail: { type: String, required: true },
    colours: [colourSchema],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);