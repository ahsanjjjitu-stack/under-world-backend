const Banner = require("../models/Banner");
const Category = require("../models/Category");
const Product = require("../models/Product");



const getHomeData = async (req, res) => {
    try {

        const cacheKey = 'home_banners_categories';

        // 1. Redis Cache check kora (Lakhs of user handle korar jonno crucial)
        // const cachedData = await redisClient.get(cacheKey);
        // if (cachedData) {
        //     return res.status(200).json(JSON.parse(cachedData));
        // }



        const [banners, categories] = await Promise.all([
            Banner.find({}).lean(),
            Category.find({}).lean()
        ]);



        const responseData = {
            success: true,
            message: "Home data fetched successfully",
            data: {
                banners,
                categories
            }
        };

        // TODO: Ekhane data Redis-e save korar code thakbe

        res.status(200).json(responseData);

    }
    catch (error) {
        console.error("Home Data Fetch Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error, please try again later"
        });
    }
}




















const getHomeProduct = async (req, res) => {
    try {

        let { page = 1, limit = 10, category } = req.query;


        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;


        // Redis cache key (Future use)
        // const cacheKey = `products_${category || 'all'}_page_${page}_limit_${limit}`;
        /* ================= REDIS CACHING (Commented for now) =================
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                source: 'redis',
                currentPage: page,
                limit: limit,
                data: JSON.parse(cachedData)
            });
        }
            ====================================================================== */




        // query builder 

        let query = { isActive: true };

        if (category && category !== 'All') {
            query.category = category;
        }



        const products = await Product.find(query)
            .sort({ createdAt: -1 })   
            .skip(skip)
            .limit(limit)
            .lean();

        const totalProducts = await Product.countDocuments(query);

        /* ================= REDIS SET CACHE (Commented for now) =================
        // Cache data for 60 seconds
        await redisClient.setEx(cacheKey, 60, JSON.stringify(products));
        ====================================================================== */


        return res.status(200).json({
            success: true,
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
            totalProducts: totalProducts,
            count: products.length,
            data: products
        });


    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch products",
            error: error.message
        });
    }
}





module.exports = {
    getHomeData, getHomeProduct
}