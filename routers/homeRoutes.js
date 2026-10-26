const express = require("express");
const router = express.Router();
const { getHomeData, getHomeProduct } = require("../controllers/homeController");

// Home screen data get korar API route
router.get("/home-data", getHomeData);
router.get("/home-product", getHomeProduct);

module.exports = router;