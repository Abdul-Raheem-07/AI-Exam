import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock3, CheckCircle2, ChevronRight, Plus, Upload, Loader2, FileText, Sparkles, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

const StatusBadge = ({ status }) => {
  const cls = { Pending: 'badge badge-yellow', Processing: 'badge badge-indigo', Completed: 'badge badge-green', Failed: 'badge badge-red', Active: 'badge badge-green', Inactive: 'badge badge-slate' }[status] || 'badge badge-slate';
  return <span className={cls}>{status}</span>;
};

const Dashboard = () => {
  const { user } = useContext(AuthContext); const navigate = useNavigate();
  const [exams, setExams] = useState([]); const [submissions, setSubmissions] = useState([]); const [sections, setSections] = useState([]); const [tests, setTests] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const examPath = user?.role === 'Student' ? '/student/exams' : '/exams';
    const submissionPath = user?.role === 'Student' ? '/student/results' : '/submissions';
    const sectionPath = user?.role === 'Student' ? '/student/sections' : '/teacher/sections';
    const testPath = user?.role === 'Student' ? '/student/tests' : '/teacher/tests';
    const loadRequired = async () => {
      const results = await Promise.allSettled([axios.get(examPath), axios.get(submissionPath), axios.get(testPath)]);
      if (!active) return;
      const [examResult, submissionResult, testResult] = results;
      if (examResult.status === 'fulfilled') setExams(examResult.value.data || []);
      else if (examResult.reason?.response?.status !== 401) toast.error('Unable to load your exams.');
      if (submissionResult.status === 'fulfilled') setSubmissions(submissionResult.value.data || []);
      else if (submissionResult.reason?.response?.status !== 401) toast.error('Unable to load your recent activity.');
      if (testResult.status === 'fulfilled') setTests(testResult.value.data || []);
      setLoading(false);
    };
    const loadSections = async () => {
      try { const { data } = await axios.get(sectionPath); if (active) setSections(data || []); }
      catch (error) { if (active && error.response?.status !== 401) setSections([]); }
    };
    loadRequired();
    loadSections();
    return () => { active = false; };
  }, [user?.role]);
  if (loading) return <div className="page-wrapper"><div className="page-content dashboard-loading"><Loader2 size={28} className="animate-spin" /><span>Preparing your workspace...</span></div></div>;
  const isStudent = user?.role === 'Student'; const isTeacher = user?.role === 'Teacher'; const graded = submissions.filter(s => s.status === 'Completed').length; const pending = submissions.filter(s => ['Pending', 'Processing'].includes(s.status)).length;
  const firstName = user?.name?.split(' ')[0] || 'there';
  const stats = isStudent ? [{ label: 'Available exams', value: exams.length, icon: BookOpen, tone: 'blue' }, { label: 'Completed work', value: graded, icon: CheckCircle2, tone: 'green' }, { label: 'Awaiting review', value: pending, icon: Clock3, tone: 'amber' }] : [{ label: 'My exams', value: exams.length, icon: BookOpen, tone: 'blue' }, { label: 'Graded submissions', value: graded, icon: CheckCircle2, tone: 'green' }, { label: 'Needs attention', value: pending, icon: Clock3, tone: 'amber' }];
  return <div className="page-wrapper"><div className="page-content">
    <section className="welcome-banner"><div><p className="eyebrow">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p><h1>Good to see you, <span className="gradient-text">{firstName}</span>.</h1><p>{isStudent ? 'Keep your momentum going. Your next learning milestone is close.' : 'A clear view of your assessment work, all in one place.'}</p></div><div className="welcome-art"><Sparkles size={25} /><span>{isStudent ? 'Learn with confidence' : 'Build better assessments'}</span></div></section>
    <div className="dashboard-stats">{stats.map(({ label, value, icon: Icon, tone }) => <div className="stat-card stat-card-modern" key={label}><div className={`stat-icon ${tone}`}><Icon size={18} /></div><div><span>{label}</span><strong>{value}</strong></div></div>)}</div>
    <section className="dashboard-section-strip"><div className="section-heading"><div><p className="eyebrow">Class access</p><h2>{isStudent ? 'My sections' : 'My sections'}</h2></div>{isTeacher && <button className="btn-secondary compact" onClick={() => navigate('/teacher/sections')}>Manage sections</button>}</div>{sections.length ? <div className="section-chip-list">{sections.map(section => <span className="badge badge-indigo" key={section.id}>{section.code} · {section.student_count || 0} students</span>)}</div> : <p className="muted-copy">{isTeacher ? 'Create a section to assign tests.' : 'You are not enrolled in a section yet.'}</p>}</section>
    <div className={`dashboard-grid ${submissions.length ? '' : 'single'}`}>
      <section><div className="section-heading"><div><p className="eyebrow">Your workspace</p><h2>{isStudent ? 'Available exams' : 'My exams'}</h2></div>{isTeacher && <button className="btn-primary" onClick={() => navigate('/teacher/exam/create')}><Plus size={16} /> New exam</button>}</div>{exams.length === 0 ? <div className="empty-state glass-card"><FileText size={30} /><h3>No exams yet</h3><p>{isTeacher ? 'Create your first assessment to get started.' : 'Published exams will appear here.'}</p></div> : <div className="stack-list">{exams.slice(0, 8).map(exam => <div className="exam-row exam-card" key={exam._id}><div className="row-icon"><BookOpen size={17} /></div><div className="row-copy"><div><StatusBadge status={exam.status} /> <span className="row-meta">{exam.questions?.length || 0} questions</span></div><strong>{exam.title}</strong></div>{isStudent && exam.status === 'Active' && <button className="btn-secondary compact" onClick={() => navigate(`/student/exam/${exam._id}/submit`)}><Upload size={14} /> Submit</button>}<ChevronRight size={17} className="row-arrow" /></div>)}</div>}</section>
      {submissions.length > 0 && <section><div className="section-heading"><div><p className="eyebrow">Recent activity</p><h2>Submissions</h2></div></div><div className="stack-list">{submissions.slice(0, 7).map(sub => <button className="submission-row" key={sub._id} onClick={() => navigate(isStudent ? `/student/submission/${sub._id}` : `/teacher/submission/${sub._id}`)}><div className="row-icon soft"><ClipboardList size={17} /></div><div className="row-copy"><strong>{sub.examId?.title || 'Exam submission'}</strong>{!isStudent && sub.studentId && <span>{sub.studentId.name}</span>}</div><div className="submission-status">{sub.status === 'Completed' && <b>{sub.totalMarks} pts</b>}<StatusBadge status={sub.status} /></div><ChevronRight size={16} className="row-arrow" /></button>)}</div></section>}
    </div>
    <section className="tests-preview">
      <div className="section-heading">
        <div><p className="eyebrow">MCQ tests</p><h2>{isStudent ? 'Assigned tests' : 'My MCQ tests'}</h2></div>
        {isStudent && <button className="btn-secondary compact" onClick={() => navigate('/student/tests')}>View all</button>}
        {isTeacher && <button className="btn-secondary compact" onClick={() => navigate('/teacher/test/create')}>Create test</button>}
      </div>
      {tests.length === 0 ? <p className="muted-copy">{isTeacher ? 'Generate and publish MCQs from the AI test builder.' : 'Tests assigned to your sections will appear here.'}</p> : <div className="stack-list">{tests.slice(0, 6).map(test => <article className="exam-row exam-card" key={test.id}><div className="row-icon soft"><ClipboardList size={17} /></div><div className="row-copy"><div><span className="badge badge-indigo">{test.difficulty || 'MCQ'}</span><span className="row-meta">{test.question_count} questions</span></div><strong>{test.title}</strong></div>{isStudent && <button className="btn-primary compact" onClick={() => navigate(`/student/test/${test.id}`)}>Start test</button>}</article>)}</div>}
    </section>
  </div></div>;
};
export default Dashboard;
