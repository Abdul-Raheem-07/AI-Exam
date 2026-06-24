import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  question: { type: Number, required: true }, // e.g., 1
  score: { type: Number, required: true },
  remarks: { type: String },
});

const submissionSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    images: [{ type: String, required: true }], // Cloudinary URLs
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Completed', 'Failed'],
      default: 'Pending',
    },
    totalMarks: { type: Number },
    confidence: { type: Number }, // AI confidence meter
    feedback: [feedbackSchema],
    evaluatedByAI: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
