const mongoose = require("mongoose");
const Product = require("../models/Product");
const Cart = require("../models/Cart");



const addCart = async (req, res) => {
    try {

        const userId = req.user.id || req.userId;
        const { productId, selectedColour, selectedSize, quantity = 1 } = req.body;

        const product = await Product.findById(productId).lean();
        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: "Product not found or unavailable!"
            });
        }


        const qtyToAdd = parseInt(quantity);
        if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid quantity!"
            });
        }



        const newItemData = {
            productId: product._id,
            name: product.name,
            category: product.category,
            price: product.price,
            currency: product.currency || 'BDT',
            thumbnail: product.thumbnail,
            selectedColour: {
                name: selectedColour.name,
                hex: selectedColour.hex,
                image: selectedColour.image || product.thumbnail
            },
            selectedSize: selectedSize,
            quantity: qtyToAdd
        }






        let cart = await Cart.findOne({ userId }); 
        if (!cart) {
            cart = new Cart({
                userId,
                items: [newItemData],
                totalAmount: product.price * qtyToAdd
            });
        }
        else {
            const existingItemIndex = cart.items.findIndex(item =>
                item.productId.toString() === productId.toString() &&
                item.selectedColour.name === selectedColour.name &&
                item.selectedSize === selectedSize
            );

            if (existingItemIndex > -1) {
                cart.items[existingItemIndex].quantity += qtyToAdd;
            } else {
                cart.items.push(newItemData);
            }

            cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        }



        await cart.save();



        return res.status(200).json({
            success: true,
            message: "Item added to cart successfully",
            data: cart
        });



    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to add item to cart",
            error: error.message
        });
    }
}












const getCartCount = async (req, res) => {
    try {
        const userId = req.user.id || req.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const cart = await Cart.findOne({ userId }).lean();

        let totalCount = 0;
        if (cart && cart.items) {
            totalCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        }

        return res.status(200).json({
            success: true,
            count: totalCount
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch cart count",
            error: error.message
        });
    }
}















const getCart = async (req, res) => {
    try {

        const userId = req.user.id || req.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID not found!"
            });
        }



        // Pagination Params (Default page 1, limit 10)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;


        const cart = await Cart.findOne({ userId }).lean();


        if (!cart) {
            return res.status(200).json({
                success: true,
                data: {
                    items: [],
                    totalAmount: 0,
                    currentPage: page,
                    totalPages: 0
                }
            });
        }



        // Slice items array for pagination
        const paginatedItems = (cart.items || []).slice(startIndex, endIndex);
        const totalItems = cart.items ? cart.items.length : 0;
        const totalPages = Math.ceil(totalItems / limit);


        return res.status(200).json({
            success: true,
            data: {
                _id: cart._id,
                userId: cart.userId,
                items: paginatedItems,
                totalAmount: cart.totalAmount,
                currentPage: page,
                totalPages: totalPages
            }
        });

    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch cart",
            error: error.message
        });
    }
}



















const updateCartQuantity = async (req, res) => {
    try {

        const userId = req.user.id || req.userId;
        const { productId, selectedColour, selectedSize, quantity } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (quantity < 1) {
            return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
        }



        const updatedCart = await Cart.findOneAndUpdate(
            {
                userId,
                "items.productId": productId,
                "items.selectedColour.name": selectedColour,
                "items.selectedSize": selectedSize
            },
            { 
                $set: { "items.$[elem].quantity": quantity } 
            },
            { 
                arrayFilters: [{ 
                    "elem.productId": productId, 
                    "elem.selectedColour.name": selectedColour, 
                    "elem.selectedSize": selectedSize 
                }],
                new: true 
            }
        );



        if (!updatedCart) {
            return res.status(404).json({ success: false, message: "Cart or item not found" });
        }



        updatedCart.totalAmount = updatedCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        await updatedCart.save();



        return res.status(200).json({
            success: true,
            message: "Cart quantity updated successfully",
            data: updatedCart
        });


    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update quantity",
            error: error.message
        });
    }
}















const removeCartItem = async (req, res) => {
    try {

        const userId = req.user.id || req.userId;
        const { productId, selectedColour, selectedSize } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }



        const updatedCart = await Cart.findOneAndUpdate(
            { userId },
            { 
                $pull: { 
                    items: { 
                        productId: productId, 
                        "selectedColour.name": selectedColour, 
                        selectedSize: selectedSize 
                    } 
                } 
            },
            { new: true }
        );



        if (!updatedCart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        updatedCart.totalAmount = updatedCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        await updatedCart.save();

        return res.status(200).json({
            success: true,
            message: "Item removed successfully",
            data: updatedCart
        });

    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to remove item",
            error: error.message
        });
    }
}





module.exports = {
    addCart, getCartCount, getCart, updateCartQuantity, removeCartItem
}