const User = require("../models/User");

const adminAuth = async (req, res, next) => {
    try {
        const userId = req.user._id || req.userId;

        const user = await User.findById(userId);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: "Access denied! Admin privileges required." 
            });
        }

        next();
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}


module.exports =  adminAuth;