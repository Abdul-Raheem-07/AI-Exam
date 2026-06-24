import Submission from '../models/Submission.js';
import Exam from '../models/Exam.js';
import cloudinary from '../config/cloudinary.js';
import { evaluateWithGemini } from '../services/geminiService.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'ai-exam-checking' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

// @desc    Submit an exam (upload images)
// @route   POST /api/submissions
// @access  Private/Student
export const submitExam = async (req, res) => {
  try {
    const { examId } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    // Upload all files to Cloudinary concurrently
    const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
    const imageUrls = await Promise.all(uploadPromises);

    const submission = new Submission({
      examId,
      studentId: req.user._id,
      images: imageUrls,
      status: 'Pending',
    });

    const createdSubmission = await submission.save();
    res.status(201).json(createdSubmission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Teacher overrides AI marks
// @route   PUT /api/submissions/:id/override
// @access  Private/Teacher
export const overrideMarks = async (req, res) => {
  try {
    const { newScore, justification, updatedFeedback } = req.body;
    
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    const previousScore = submission.totalMarks;

    // Update Submission
    submission.totalMarks = newScore;
    if (updatedFeedback) {
      submission.feedback = updatedFeedback;
    }
    await submission.save();

    // Create Audit Log
    await AuditLog.create({
      submissionId: submission._id,
      teacherId: req.user._id,
      previousScore,
      newScore,
      justification
    });

    // Create Notification for Student
    await Notification.create({
      userId: submission.studentId,
      message: `Your exam score has been manually updated by the teacher. New Score: ${newScore}. Reason: ${justification}`
    });

    res.json({ message: 'Marks overridden successfully', submission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get submissions (Student sees own, Teacher sees for their exams)
// @route   GET /api/submissions
// @access  Private
export const getSubmissions = async (req, res) => {
  // ... existing implementation ...
  try {
    if (req.user.role === 'Student') {
      const submissions = await Submission.find({ studentId: req.user._id })
        .populate('examId', 'title')
        .sort({ createdAt: -1 });
      return res.json(submissions);
    } else if (req.user.role === 'Teacher') {
      // Find all submissions for exams created by this teacher
      // Simple approach: get exams, then get submissions in those exams
      const teacherExams = await Exam.find({ teacherId: req.user._id }).select('_id');
      const examIds = teacherExams.map(ex => ex._id);
      
      const submissions = await Submission.find({ examId: { $in: examIds } })
        .populate('examId', 'title')
        .populate('studentId', 'name email')
        .sort({ createdAt: -1 });
        
      return res.json(submissions);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Trigger AI Evaluation
// @route   POST /api/submissions/evaluate/:id
// @access  Private/Teacher
export const evaluateSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate('examId');
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    if (submission.status === 'Processing' || submission.status === 'Completed') {
      return res.status(400).json({ message: 'Submission is already evaluated or processing' });
    }

    // Update status to processing and return 202 immediately
    submission.status = 'Processing';
    await submission.save();
    res.status(202).json({ message: 'Evaluation started in background' });

    // Background process
    (async () => {
      try {
        const evaluationResult = await evaluateWithGemini(submission.images, submission.examId);
        
        submission.totalMarks = evaluationResult.totalMarks;
        submission.confidence = evaluationResult.confidence;
        submission.feedback = evaluationResult.feedback;
        submission.status = 'Completed';
        submission.evaluatedByAI = true;
        await submission.save();
      } catch (err) {
        submission.status = 'Failed';
        await submission.save();
        console.error('Background Evaluation Error:', err);
      }
    })();

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get submission status
// @route   GET /api/submissions/:id/status
// @access  Private
export const getSubmissionStatus = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .select('status totalMarks confidence feedback evaluatedByAI updatedAt');
      
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
