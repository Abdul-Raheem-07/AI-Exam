import express from 'express';
import rateLimit from 'express-rate-limit';
import { registerUser, loginUser, verifyOTP, resetPassword } from '../controllers/authController.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  message: { message: 'Too many login attempts, please try again later' }
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many OTP verification attempts, please try again later' }
});

router.post('/register', registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/verify-otp', otpLimiter, verifyOTP);
router.post('/reset-password', resetPassword);

export default router;
