const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { multerMiddleware } = require('../config/cloudinaryConfig');

const router = express.Router();

router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.get('/logout', authController.logout);

// Protected routes
router.put(
  '/update-profile',
  authMiddleware,
  multerMiddleware,
  authController.updateProfile
);

router.get(
  '/check-auth',
  authMiddleware,
  authController.checkAuthenticated
);

router.get(
  '/users',authMiddleware,
  authController.getAllUser
)

module.exports = router;
