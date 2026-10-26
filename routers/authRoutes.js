const express = require("express");
const router = express.Router();
const { googleLogin, updateNotificationSettings } = require('../controllers/authController');
const verifyToken = require("../middleware/verifyToken");

router.post('/google-login', googleLogin);
router.put('/update-notifications', verifyToken, updateNotificationSettings);

module.exports = router;