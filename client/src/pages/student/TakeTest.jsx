import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Send, Loader2, Check, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';

const TakeTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const start = useCallback(async () => {
    setError('');
    try {
      const { data } = await axios.post(`/student/tests/${id}/start`);
      setTest(data.test);
      setAttempt(data.attempt);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'This test could not be opened.');
    }
  }, [id]);

  useEffect(() => { queueMicrotask(start); }, [start]);
  useEffect(() => {
    if (!attempt || !test?.time_limit) return undefined;
    const timer = setInterval(() => setSeconds(value => value + 1), 1000);
    return () => clearInterval(timer);
  }, [attempt, test]);

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="page-content exam-state">
          <AlertCircle size={30} />
          <h2>Unable to open test</h2>
          <p>{error}</p>
          <div>
            <button className="btn-secondary" onClick={() => navigate('/student/tests')}><ArrowLeft size={16} /> Back to tests</button>
            <button className="btn-primary" onClick={start}>Try again</button>
          </div>
        </div>
      </div>
    );
  }

  if (!test || !attempt) {
    return (
      <div className="page-wrapper">
        <div className="dashboard-loading">
          <Loader2 size={26} className="animate-spin" />
          <span>Preparing your test...</span>
        </div>
      </div>
    );
  }

  const question = test.questions[index];
  const completed = Object.keys(answers).length;
  const unanswered = test.questions.length - completed;
  const choose = value => setAnswers(current => ({ ...current, [question.id]: value }));
  const previous = () => setIndex(value => Math.max(value - 1, 0));
  const next = () => setIndex(value => Math.min(value + 1, test.questions.length - 1));
  const fade = reduceMotion ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.18 } };

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = { answers: test.questions.map(item => ({ question_id: item.id, answer: answers[item.id] || null })), time_taken: seconds };
      const { data } = await axios.post(`/student/attempts/${attempt.id}/submit`, payload);
      navigate(`/student/test-results/${data.id}`);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Your test could not be submitted.');
      setSubmitting(false);
      setConfirming(false);
    }
  };

  const navigatorButtons = test.questions.map((item, itemIndex) => {
    const answered = Boolean(answers[item.id]);
    const current = itemIndex === index;
    return (
      <button
        type="button"
        key={item.id}
        aria-label={`Question ${itemIndex + 1}${current ? ', current' : answered ? ', answered' : ', unanswered'}`}
        className={`question-number${current ? ' current' : ''}${answered ? ' answered' : ''}`}
        onClick={() => setIndex(itemIndex)}
      >
        <span>{itemIndex + 1}</span>
        <em>{answered ? <Check size={11} /> : current ? '●' : '—'}</em>
      </button>
    );
  });

  return (
    <div className="page-wrapper">
      <div className="page-content take-page">
        <div className="take-top">
          <button onClick={() => navigate('/student/dashboard')} className="back-link"><ArrowLeft size={16} /> Leave test</button>
          <div className="timer"><Clock size={15} /> {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</div>
        </div>
        <div className="take-header">
          <div>
            <p className="eyebrow">{test.difficulty || 'Practice test'}</p>
            <h1>{test.title}</h1>
          </div>
          <span>{completed} of {test.questions.length} answered</span>
        </div>
        <div className="take-progress" aria-label={`${completed} of ${test.questions.length} questions answered`}>
          <span style={{ width: `${(completed / test.questions.length) * 100}%` }} />
        </div>

        <div className="question-layout">
          <aside className="question-nav glass-card">
            <strong>Questions</strong>
            <div className="question-nav-track">{navigatorButtons}</div>
            <small className="question-legend">
              <span><i className="legend-dot current-dot" /> Current</span>
              <span><i className="legend-dot answered-dot" /> Answered</span>
              <span><i className="legend-dot" /> Unanswered</span>
            </small>
          </aside>

          <AnimatePresence mode="wait">
            <motion.main className="question-card glass-card" key={question.id} {...fade}>
              <div className="question-card-top">
                <p className="question-kicker">Question {index + 1} of {test.questions.length}</p>
                <span className={answers[question.id] ? 'answer-status complete' : 'answer-status'}>
                  {answers[question.id] ? 'Answered' : 'Not answered'}
                </span>
              </div>
              <h2>{question.question}</h2>
              <div className="answer-options">
                {Object.entries(question.options).map(([key, value]) => {
                  const selected = answers[question.id] === key;
                  return (
                    <button type="button" className={selected ? 'answer-option selected' : 'answer-option'} key={key} onClick={() => choose(key)}>
                      <span>{key}</span>
                      <strong>{value}</strong>
                      {selected && <Check className="option-check" size={16} />}
                    </button>
                  );
                })}
              </div>
              <div className="question-footer">
                <button className="btn-secondary" disabled={!index || submitting} onClick={previous}><ChevronLeft size={16} /> Previous</button>
                <div className="question-footer-actions">
                  {index < test.questions.length - 1 && <button className="btn-secondary" disabled={submitting} onClick={next}>Next <ChevronRight size={16} /></button>}
                  <button className="btn-primary submit-button" disabled={submitting} onClick={() => setConfirming(true)}>
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />} Submit test
                  </button>
                </div>
              </div>
            </motion.main>
          </AnimatePresence>
        </div>
      </div>

      {confirming && (
        <div className="modal-backdrop" onClick={() => !submitting && setConfirming(false)}>
          <motion.div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="submit-title" onClick={event => event.stopPropagation()} {...(reduceMotion ? {} : { initial: { opacity: 0, scale: 0.98 }, animate: { opacity: 1, scale: 1 } })}>
            <button className="modal-close icon-button" onClick={() => setConfirming(false)} aria-label="Close confirmation"><X size={17} /></button>
            <div className="modal-icon"><Send size={19} /></div>
            <h2 id="submit-title">Submit this test?</h2>
            <p>
              {unanswered === 0 ? 'You have answered every question.' : `You have ${unanswered} unanswered ${unanswered === 1 ? 'question' : 'questions'}.`}
              {' '}Your answers cannot be changed after submission.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" disabled={submitting} onClick={() => setConfirming(false)}>Keep reviewing</button>
              <button className="btn-primary" disabled={submitting} onClick={submit}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />} Confirm submit
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TakeTest;
