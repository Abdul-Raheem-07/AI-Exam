import Exam from '../models/Exam.js';

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private/Teacher
export const createExam = async (req, res) => {
  try {
    const { title, description, questions, rubric } = req.body;

    const exam = new Exam({
      title,
      description,
      teacherId: req.user._id,
      questions,
      rubric,
    });

    const createdExam = await exam.save();
    res.status(201).json(createdExam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
export const getExams = async (req, res) => {
  try {
    let exams;
    if (req.user.role === 'Teacher') {
      exams = await Exam.find({ teacherId: req.user._id }).sort({ createdAt: -1 });
    } else if (req.user.role === 'Student') {
      exams = await Exam.find({ status: 'Active' }).sort({ createdAt: -1 }).select('-rubric');
    } else {
      exams = await Exam.find({}).sort({ createdAt: -1 });
    }
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get exam by ID
// @route   GET /api/exams/:id
// @access  Private
export const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (exam) {
      res.json(exam);
    } else {
      res.status(404).json({ message: 'Exam not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
