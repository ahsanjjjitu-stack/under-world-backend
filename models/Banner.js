const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true
    },
    head: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);