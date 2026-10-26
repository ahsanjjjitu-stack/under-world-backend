const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const jwt = require("jsonwebtoken");


const client = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);




const googleLogin = async (req, res) => {
    try {

        const { idToken, fcmToken } = req.body;

        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: "idToken পাঠানো হয়নি!"
            });
        }




        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_WEB_CLIENT_ID,
        });



        const payload = ticket.getPayload();
        const { sub, email, name, picture } = payload;


        let user = await User.findOne({ email });


        if (!user) {
            user = new User({
                name,
                email,
                googleId: sub,
                avatar: picture,
                fcmToken: fcmToken || "",
                role: "user"
            });

            await user.save();
        }
        else {
            if (fcmToken) {
                user.fcmToken = fcmToken;
                await user.save();
            }
        }




        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET
        );





        res.status(200).json({
            success: true,
            message: "Login successful!",
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                fcmToken: user.fcmToken,
                avatar: user.avatar
            }
        });



    }
    catch (error) {
        console.error("Google Auth Error:", error);
        res.status(401).json({
            success: false,
            message: "Invalid ba expired Google token"
        });
    }
}













const updateNotificationSettings = async (req, res) => {

    try {

        const userId = req.user.id || req.userId;
        const { pushNotificationsEnabled } = req.body;

        if (typeof pushNotificationsEnabled !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: "Invalid value. pushNotificationsEnabled must be a boolean (true or false)."
            });
        }



        const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { pushNotificationsEnabled: pushNotificationsEnabled },
            { new: true }
        ).select('pushNotificationsEnabled');


        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }



        console.log(`🔔 Notification settings updated for user ${userId}: ${pushNotificationsEnabled}`);

        return res.status(200).json({
            success: true,
            message: "Notification settings updated successfully",
            pushNotificationsEnabled: updatedUser.pushNotificationsEnabled
        });

    }
    catch (error) {
        console.error("Error updating notification settings:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update notification settings",
            error: error.message
        });
    }
}



module.exports = {
    googleLogin, updateNotificationSettings
}