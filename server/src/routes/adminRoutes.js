import express from 'express';
import { getDashboardAnalytics } from '../controllers/adminController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, authorizeRoles('Admin'), getDashboardAnalytics);

export default router;
