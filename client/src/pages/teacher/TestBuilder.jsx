import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Plus, Trash2, Save, Send, Loader2, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';

const blankQuestion = () => ({
  id: crypto.randomUUID(),
  question: '',
  options: { A: '', B: '', C: '', D: '' },
  correct_answer: 'A',
  explanation: '',
});

const TestBuilder = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [material, setMaterial] = useState('');
  const [materialFile, setMaterialFile] = useState(null);
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState('Moderate');
  const [timeLimit, setTimeLimit] = useState('');
  const [questions, setQuestions] = useState([]);
  const [sections, setSections] = useState([]);
  const [sectionIds, setSectionIds] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    axios.get('/teacher/sections').then(({ data }) => setSections(data || [])).catch(() => toast.error('Unable to load your sections.'));
  }, []);

  const updateQuestion = (index, patch) => setQuestions(current => current.map((question, itemIndex) => itemIndex === index ? { ...question, ...patch } : question));
  const updateOption = (index, key, value) => updateQuestion(index, { options: { ...questions[index].options, [key]: value } });
  const moveQuestion = (index, direction) => setQuestions(current => {
    const target = index + direction;
    if (target < 0 || target >= current.length) return current;
    const copy = [...current];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    return copy;
  });
  const validQuestions = questions.length > 0 && questions.every(question => question.question.trim() && question.explanation.trim() && ['A', 'B', 'C', 'D'].includes(question.correct_answer) && Object.keys(question.options || {}).length === 4 && Object.values(question.options).every(option => option.trim()));
  const payloadQuestions = questions.map(({ question, options, correct_answer, explanation }) => ({ question, options, correct_answer, explanation }));
  const fade = reduceMotion ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 } };

  const generate = async () => {
    if (material.trim().length < 20 && !materialFile) { toast.error('Provide study material or attach a file.'); return; }
    setBusy(true);
    try {
      const formData = new FormData();
      if (material.trim().length >= 20) formData.append('material_text', material);
      if (materialFile) formData.append('material_file', materialFile);
      formData.append('question_count', Number(count));
      formData.append('difficulty', difficulty);
      const { data } = await axios.post('/teacher/tests/generate', formData);
      setQuestions((data.questions || []).map(question => ({ ...blankQuestion(), ...question })));
      toast.success('MCQs generated for review.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'The test could not be generated right now.');
    } finally {
      setBusy(false);
    }
  };

  const save = async (publish = false) => {
    if (!title.trim() || !questions.length) { toast.error('Add a title and at least one question.'); return; }
    if (!validQuestions) { toast.error('Every MCQ needs a question, four options, one correct answer, and an explanation.'); return; }
    if (publish && !sectionIds.length) { toast.error('Assign at least one section before publishing.'); return; }
    setBusy(true);
    try {
      const { data } = await axios.post('/teacher/tests', {
        title,
        description,
        question_count: Number(count),
        difficulty,
        time_limit: timeLimit ? Number(timeLimit) : null,
        material_text: material,
        questions: payloadQuestions,
        section_ids: sectionIds,
      });
      if (publish) await axios.post(`/teacher/tests/${data.id}/publish`);
      toast.success(publish ? 'Test published.' : 'Draft saved.');
      navigate('/teacher/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save the test.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-content builder-page">
        <button onClick={() => navigate('/teacher/dashboard')} className="back-link"><ArrowLeft size={16} /> Back to dashboard</button>
        <div className="builder-heading">
          <div>
            <p className="eyebrow">Teacher workspace</p>
            <h1>AI test builder</h1>
            <p>Generate four-option MCQs, refine every question, then publish when it is ready.</p>
          </div>
          <div className="builder-badge"><Sparkles size={17} /> AI assisted</div>
        </div>
        <div className="builder-layout">
          <section className="glass-card builder-settings">
            <div className="card-title">
              <span className="section-icon"><Brain size={17} /></span>
              <div>
                <h2>Test setup</h2>
                <p>Give your assessment a clear purpose.</p>
              </div>
            </div>
            <label className="label-dark">Test title<input className="input-dark" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. OOP fundamentals" /></label>
            <label className="label-dark">Description<textarea className="input-dark" value={description} onChange={e => setDescription(e.target.value)} placeholder="What should students learn?" rows="3" /></label>
            <fieldset className="section-assignment">
              <legend className="label-dark">Assign sections</legend>
              {sections.length
                ? sections.map(section => (
                  <label className="section-choice" key={section.id}>
                    <input type="checkbox" checked={sectionIds.includes(section.id)} onChange={e => setSectionIds(current => e.target.checked ? [...current, section.id] : current.filter(id => id !== section.id))} />
                    <span>{section.name} <small>{section.code}</small></span>
                  </label>
                ))
                : <p>Create a section before publishing a test.</p>}
            </fieldset>
            <label className="label-dark">Study material<textarea className="input-dark material-input" value={material} onChange={e => setMaterial(e.target.value)} placeholder="Paste the material Gemini should use..." rows="8" /></label>
            <label className="file-picker">
              {materialFile ? materialFile.name : 'Attach PDF, DOCX, or TXT (optional)'}
              <input type="file" accept=".pdf,.docx,.txt" onChange={e => setMaterialFile(e.target.files?.[0] || null)} />
            </label>
            <div className="builder-options">
              <label className="label-dark">Questions
                <select className="input-dark" value={count} onChange={e => setCount(e.target.value)}>
                  <option value="10">10 questions</option>
                  <option value="15">15 questions</option>
                  <option value="20">20 questions</option>
                </select>
              </label>
              <label className="label-dark">Difficulty
                <select className="input-dark" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  <option>Easy</option>
                  <option>Moderate</option>
                  <option>Hard</option>
                </select>
              </label>
              <label className="label-dark">Time limit
                <input className="input-dark" type="number" min="1" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} placeholder="Minutes" />
              </label>
            </div>
            <button className="btn-primary generate-button" disabled={busy} onClick={generate}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Generate MCQs
            </button>
          </section>

          <section className="glass-card question-review">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Review & refine</p>
                <h2>Questions {questions.length}</h2>
              </div>
              <button className="btn-secondary compact" onClick={() => setQuestions(current => [...current, blankQuestion()])}><Plus size={15} /> Add question</button>
            </div>
            {questions.length ? questions.map((question, index) => (
              <motion.article className="question-editor" key={question.id || index} {...fade}>
                <div className="question-editor-head">
                  <strong>Question {index + 1}</strong>
                  <div className="question-actions">
                    <button className="icon-button" title="Move up" onClick={() => moveQuestion(index, -1)}><ChevronUp size={15} /></button>
                    <button className="icon-button" title="Move down" onClick={() => moveQuestion(index, 1)}><ChevronDown size={15} /></button>
                    <button className="icon-button danger" title="Delete question" onClick={() => setQuestions(current => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></button>
                  </div>
                </div>
                <textarea className="input-dark" value={question.question} onChange={e => updateQuestion(index, { question: e.target.value })} placeholder="Question text" rows="3" />
                <div className="option-grid">
                  {Object.entries(question.options).map(([key, value]) => (
                    <label className={question.correct_answer === key ? 'option-editor selected' : 'option-editor'} key={key}>
                      <span>{key}</span>
                      <input className="input-dark" value={value} onChange={e => updateOption(index, key, e.target.value)} placeholder={`Option ${key}`} />
                      <button type="button" className="correct-toggle" onClick={() => updateQuestion(index, { correct_answer: key })}>
                        {question.correct_answer === key ? 'Correct' : 'Mark correct'}
                      </button>
                    </label>
                  ))}
                </div>
                <label className="label-dark">Explanation
                  <input className="input-dark" value={question.explanation} onChange={e => updateQuestion(index, { explanation: e.target.value })} placeholder="Why this answer is correct" />
                </label>
              </motion.article>
            )) : (
              <div className="empty-state">
                <Brain size={30} />
                <h3>Your MCQ draft will appear here</h3>
                <p>Add study material on the left to generate four-option questions.</p>
              </div>
            )}
            <div className="builder-actions">
              <button className="btn-secondary" disabled={busy} onClick={() => save(false)}><Save size={15} /> Save draft</button>
              <button className="btn-primary" disabled={busy || !sectionIds.length} onClick={() => save(true)}><Send size={15} /> Publish test</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TestBuilder;
