import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  diagramUrl: { type: String }, // Optional image for the question
  maxMarks: { type: Number, required: true },
});

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [questionSchema],
    rubric: { type: String, required: true }, // Can be JSON string or text explaining criteria
    status: { type: String, enum: ['Draft', 'Active', 'Closed'], default: 'Active' },
  },
  { timestamps: true }
);

const Exam = mongoose.model('Exam', examSchema);

export default Exam;
