import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusCircle, Trash2, ArrowLeft, Save, Brain } from 'lucide-react';

const CreateExam = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rubric, setRubric] = useState('');
  const [questions, setQuestions] = useState([
    { questionText: '', maxMarks: 10 },
  ]);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, { questionText: '', maxMarks: 10 }]);
  };

  const handleRemoveQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const validateForm = () => {
    if (!title.trim()) return 'Title is required';
    if (!rubric.trim()) return 'Rubric is required';

    const hasEmptyQuestion = questions.some(
      (q) => !q.questionText.trim()
    );
    if (hasEmptyQuestion) return 'All questions must be filled';

    const hasInvalidMarks = questions.some(
      (q) => !q.maxMarks || q.maxMarks <= 0
    );
    if (hasInvalidMarks) return 'Marks must be greater than 0';

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);

    try {
      await axios.post('/exams', {
        title: title.trim(),
        description: description.trim(),
        rubric: rubric.trim(),
        questions: questions.map((q) => ({
          questionText: q.questionText.trim(),
          maxMarks: Number(q.maxMarks),
        })),
      });

      toast.success('Exam created successfully');
      navigate('/teacher/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create exam');
    } finally {
      setSaving(false);
    }
  };

  const totalMarks = questions.reduce(
    (sum, q) => sum + (Number(q.maxMarks) || 0),
    0
  );

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ maxWidth: 760 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => navigate('/teacher/dashboard')}
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={16} />
          </button>

          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9' }}>
              Create New Exam
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Build structured AI-evaluated exam
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Basic Info */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <h2 style={{ color: '#e2e8f0', marginBottom: '1rem', display: 'flex', gap: 8 }}>
              <Brain size={16} /> Exam Details
            </h2>

            <input
              className="input-dark"
              placeholder="Exam Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              className="input-dark"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ marginTop: 10 }}
            />

            <textarea
              className="input-dark"
              placeholder="AI Grading Rubric (very important)"
              value={rubric}
              onChange={(e) => setRubric(e.target.value)}
              style={{ marginTop: 10 }}
            />
          </div>

          {/* Questions */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ color: '#e2e8f0' }}>
                Questions ({totalMarks} marks)
              </h2>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="btn-secondary"
              >
                <PlusCircle size={14} /> Add
              </button>
            </div>

            {questions.map((q, i) => (
              <div key={i} style={{ marginBottom: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 10 }}>
                
                <input
                  className="input-dark"
                  placeholder={`Question ${i + 1}`}
                  value={q.questionText}
                  onChange={(e) =>
                    handleQuestionChange(i, 'questionText', e.target.value)
                  }
                />

                <input
                  className="input-dark"
                  type="number"
                  min="1"
                  placeholder="Marks"
                  value={q.maxMarks}
                  onChange={(e) =>
                    handleQuestionChange(i, 'maxMarks', e.target.value)
                  }
                  style={{ marginTop: 8, width: 120 }}
                />

                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(i)}
                    style={{
                      marginTop: 8,
                      color: '#f87171',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ width: '100%', padding: '0.9rem' }}
          >
            {saving ? 'Saving...' : <><Save size={16} /> Save Exam</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateExam;