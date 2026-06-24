import Submission from '../models/Submission.js';
import User from '../models/User.js';
import Exam from '../models/Exam.js';

// @desc    Get dashboard analytics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboardAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'Student' });
    const totalTeachers = await User.countDocuments({ role: 'Teacher' });
    
    const totalExams = await Exam.countDocuments();
    const activeExams = await Exam.countDocuments({ status: 'Active' });

    const totalSubmissions = await Submission.countDocuments();
    const evaluatedSubmissions = await Submission.countDocuments({ evaluatedByAI: true });

    // Calculate average score
    const submissions = await Submission.find({ status: 'Completed' }).select('totalMarks');
    const totalScoreSum = submissions.reduce((sum, sub) => sum + (sub.totalMarks || 0), 0);
    const averageScore = submissions.length > 0 ? (totalScoreSum / submissions.length).toFixed(2) : 0;

    // Evaluation Success Rate
    const aiSuccessRate = totalSubmissions > 0 
      ? ((evaluatedSubmissions / totalSubmissions) * 100).toFixed(1) 
      : 0;

    res.json({
      metrics: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalExams,
        activeExams,
        totalSubmissions,
        evaluatedSubmissions,
        averageScore,
        aiSuccessRate,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
