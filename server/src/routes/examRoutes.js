import express from 'express';
import { createExam, getExams, getExamById } from '../controllers/examController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, authorizeRoles('Teacher', 'Admin'), createExam)
  .get(protect, getExams);

router.route('/:id')
  .get(protect, getExamById);

export default router;
