const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken"); 
const adminAuth  = require("../middleware/adminAuth");
const { addProduct } = require("../controllers/productController");

// POST route: /api/products/add
router.post("/add-products", verifyToken, adminAuth, addProduct );

module.exports = router;