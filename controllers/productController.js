const Product = require("../models/Product");

const addProduct = async (req, res) => {
    try {
        const productData = req.body;

        if (!productData) {
            return res.status(400).json({ success: false, message: "Product data is required." });
        }


        if (Array.isArray(productData)) {
            const savedProducts = await Product.insertMany(productData);
            return res.status(201).json({
                success: true,
                message: `${savedProducts.length} products added successfully!`,
                data: savedProducts
            });
        }
        else {
            const newProduct = new Product(productData);
            const savedProduct = await newProduct.save();
            return res.status(201).json({
                success: true,
                message: "Product added successfully!",
                data: savedProduct
            });
        }





    }
    catch (error) {
        console.error("Error adding product:", error);
        res.status(400).json({
            success: false,
            message: "Failed to add products",
            error: error.message
        });
    }
}

module.exports = {
    addProduct
}