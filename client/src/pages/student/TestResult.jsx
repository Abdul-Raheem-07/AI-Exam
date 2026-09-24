import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Trophy, LayoutDashboard } from 'lucide-react';

const TestResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    axios.get(`/student/attempts/${id}`).then(({ data }) => setResult(data)).catch(() => setError('Unable to load this result.'));
  }, [id]);

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="page-content exam-state">
          <XCircle size={30} />
          <h2>Result unavailable</h2>
          <p>{error}</p>
          <div>
            <button className="btn-secondary" onClick={() => navigate('/student/dashboard')}><ArrowLeft size={16} /> Back to dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="page-wrapper">
        <div className="dashboard-loading">
          <Loader2 size={26} className="animate-spin" />
          <span>Preparing your result...</span>
        </div>
      </div>
    );
  }

  const total = result.total_questions || result.test.questions?.length || result.correct_answers + result.incorrect_answers;
  const fade = reduceMotion ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.22 } };

  return (
    <div className="page-wrapper">
      <div className="page-content result-page">
        <button onClick={() => navigate('/student/dashboard')} className="back-link"><ArrowLeft size={16} /> Back to dashboard</button>
        <div className="result-heading">
          <div>
            <p className="eyebrow">Test completed</p>
            <h1>{result.test.title}</h1>
            <p>Here is a clear breakdown of your performance.</p>
          </div>
          <div className="trophy-mark"><Trophy size={25} /></div>
        </div>
        <motion.section className="score-hero glass-card" {...fade}>
          <div className="score-ring">
            <strong>{Number(result.percentage)}%</strong>
            <span>score</span>
          </div>
          <div className="score-copy">
            <h2>{result.correct_answers} / {total}</h2>
            <p>You answered {result.correct_answers} of {total} questions correctly.</p>
          </div>
          <div className="score-stats">
            <div><span>Correct</span><strong className="success-text">{result.correct_answers}</strong></div>
            <div><span>Incorrect</span><strong className="danger-text">{result.incorrect_answers}</strong></div>
            <div><span>Total score</span><strong>{result.score}</strong></div>
          </div>
        </motion.section>
        <div className="result-actions">
          <button className="btn-primary" onClick={() => setReviewing(true)}><CheckCircle size={16} /> Review answers</button>
          <button className="btn-secondary" onClick={() => navigate('/student/dashboard')}><LayoutDashboard size={16} /> Back to dashboard</button>
        </div>
        {reviewing && (
          <div className="result-review">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Review answers</p>
                <h2>Learn from every question</h2>
              </div>
            </div>
            <div className="result-list">
              {result.answers.map((answer, index) => (
                <article className="result-item glass-card" key={index}>
                  <div className="result-item-title">
                    {answer.is_correct ? <CheckCircle className="success-text" size={18} /> : <XCircle className="danger-text" size={18} />}
                    <strong>Question {index + 1}</strong>
                    <span>{answer.is_correct ? 'Correct' : 'Review this one'}</span>
                  </div>
                  <p className="result-question">{answer.question}</p>
                  <p><b>Your answer:</b> {answer.selected_answer || 'Not answered'}</p>
                  {!answer.is_correct && <p className="correct-answer"><b>Correct answer:</b> {answer.correct_answer}</p>}
                  {answer.explanation && <p className="explanation"><b>Explanation:</b> {answer.explanation}</p>}
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestResult;
