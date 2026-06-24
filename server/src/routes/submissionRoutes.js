import express from 'express';
import { submitExam, getSubmissions, evaluateSubmission, getSubmissionStatus, overrideMarks } from '../controllers/submissionController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, authorizeRoles('Student'), upload.array('images', 10), submitExam)
  .get(protect, getSubmissions);

router.post('/evaluate/:id', protect, authorizeRoles('Teacher', 'Admin'), evaluateSubmission);
router.get('/:id/status', protect, getSubmissionStatus);
router.put('/:id/override', protect, authorizeRoles('Teacher', 'Admin'), overrideMarks);

export default router;
