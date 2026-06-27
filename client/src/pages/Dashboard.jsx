import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle, ChevronRight, PlusSquare, Upload, Loader2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const StatusBadge = ({ status }) => {
  const map = {
    Pending:    { cls: 'badge badge-yellow' },
    Processing: { cls: 'badge badge-indigo' },
    Completed:  { cls: 'badge badge-green'  },
    Failed:     { cls: 'badge badge-red'    },
    Active:     { cls: 'badge badge-green'  },
    Inactive:   { cls: 'badge badge-slate'  },
  };
  const s = map[status] || { cls: 'badge badge-slate' };
  return <span className={s.cls}>{status}</span>;
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [eRes, sRes] = await Promise.all([
          axios.get('/exams'),
          axios.get('/submissions')
        ]);
        setExams(eRes.data || []);
        setSubmissions(sRes.data || []);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} color="#6366f1" className="animate-spin" />
    </div>
  );

  const isStudent = user?.role === 'Student';
  const isTeacher = user?.role === 'Teacher';
  const graded  = submissions.filter(s => s.status === 'Completed').length;
  const pending = submissions.filter(s => s.status === 'Pending' || s.status === 'Processing').length;

  return (
    <div className="page-wrapper">
      <div className="page-content">

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '0.375rem' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>
            Hello, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.375rem' }}>
            {isStudent ? 'Here are your exams and submissions.' : 'Manage exams and review submissions.'}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { icon: BookOpen, label: isStudent ? 'Available Exams' : 'My Exams', value: exams.length, color: '#818cf8', bg: 'rgba(99,102,241,0.15)' },
            { icon: CheckCircle, label: 'Graded', value: graded, color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
            { icon: Clock, label: 'Pending', value: pending, color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="stat-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ width: 36, height: 36, background: bg, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={color} />
                </div>
                <span style={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 500 }}>{label}</span>
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: submissions.length ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>

          {/* Exams */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                {isStudent ? 'Available Exams' : 'My Exams'}
              </h2>
              {isTeacher && (
                <button className="btn-primary" style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }} onClick={() => navigate('/teacher/exam/create')}>
                  <PlusSquare size={14} /> New Exam
                </button>
              )}
            </div>

            {exams.length === 0 ? (
              <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                <FileText size={36} color="#334155" style={{ margin: '0 auto 0.75rem' }} />
                <p style={{ color: '#64748b', margin: 0 }}>No exams yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {exams.map(exam => (
                  <div key={exam._id} className="exam-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <StatusBadge status={exam.status} />
                        <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>{exam.questions?.length} Q</span>
                      </div>
                      <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#e2e8f0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exam.title}</p>
                    </div>
                    {isStudent && exam.status === 'Active' && (
                      <button onClick={() => navigate(`/student/exam/${exam._id}/submit`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.75rem', borderRadius: 7, border: 'none', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                        <Upload size={12} /> Submit
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submissions */}
          {submissions.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 1rem' }}>Submissions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {submissions.slice(0, 8).map(sub => (
                  <div key={sub._id}
                    onClick={() => navigate(isStudent ? `/student/submission/${sub._id}` : `/teacher/submission/${sub._id}`)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', margin: '0 0 0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sub.examId?.title || 'Exam'}
                      </p>
                      {!isStudent && sub.studentId && (
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{sub.studentId.name}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      {sub.status === 'Completed' && (
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#34d399' }}>{sub.totalMarks} pts</span>
                      )}
                      <StatusBadge status={sub.status} />
                      <ChevronRight size={14} color="#475569" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;