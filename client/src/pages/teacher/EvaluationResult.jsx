import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import { Loader2, CheckCircle, AlertCircle, RefreshCw, Edit3, ArrowLeft, Brain, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const StatusBadge = ({ status }) => {
  const styles = {
    Pending:    { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)' },
    Processing: { color: '#818cf8', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.25)' },
    Completed:  { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
    Failed:     { color: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)' },
  };
  const s = styles[status] || styles.Pending;
  return (
    <span style={{ padding: '0.375rem 0.875rem', borderRadius: 999, fontSize: '0.8125rem', fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
      {status === 'Completed'  && <CheckCircle size={13} />}
      {status === 'Failed'     && <AlertCircle size={13} />}
      {status === 'Processing' && <RefreshCw size={13} className="animate-spin" />}
      {status}
    </span>
  );
};

const EvaluationResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [newScore, setNewScore] = useState('');
  const [justification, setJustification] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await axios.get(`/submissions/${id}/status`);
      setSubmission(data);
      setPolling(data?.status === 'Pending' || data?.status === 'Processing');
    } catch {
      toast.error('Failed to fetch status');
      setPolling(false);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);
  useEffect(() => {
    if (!polling) return;
    const t = setInterval(fetchStatus, 4000);
    return () => clearInterval(t);
  }, [polling, fetchStatus]);

  const handleOverride = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/submissions/${id}/override`, { newScore: Number(newScore), justification });
      toast.success('Marks updated');
      setShowOverride(false);
      fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Override failed');
    }
  };

  const backPath = user?.role === 'Student' ? '/student/dashboard' : '/teacher/dashboard';

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} color="#6366f1" className="animate-spin" />
    </div>
  );
  if (!submission) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Submission not found.</div>
  );

  const confidence = submission.confidence || 0;
  const confidenceData = [{ name: 'Confidence', value: confidence }, { name: 'Uncertainty', value: 100 - confidence }];

  return (
    <div className="page-wrapper">
      <div className="page-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => navigate(backPath)} style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>AI Evaluation Result</h1>
            <p style={{ color: '#64748b', fontSize: '0.8125rem', margin: 0, fontFamily: 'monospace' }}>#{submission._id?.slice(-8)}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {polling && <span style={{ fontSize: '0.8125rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Brain size={14} /> Grading…</span>}
            {submission.status === 'Pending' && (
              <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                onClick={async () => { try { await axios.post(`/submissions/evaluate/${id}`); toast.success('Evaluation started!'); fetchStatus(); } catch { toast.error('Failed'); } }}>
                Start AI Evaluation
              </button>
            )}
            <StatusBadge status={submission.status} />
          </div>
        </div>

        {submission.status === 'Completed' && (
          <>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1.75rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem' }}>Total Score</p>
                <p style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.04em', lineHeight: 1 }} className="gradient-text">{submission.totalMarks ?? 0}</p>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0.5rem 0 0' }}>points</p>
              </div>

              <div className="glass-card" style={{ padding: '1.75rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.5rem' }}>AI Confidence</p>
                <div style={{ height: 100, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={confidenceData} cx="50%" cy="50%" innerRadius={30} outerRadius={44} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                        <Cell fill="#6366f1" /><Cell fill="rgba(255,255,255,0.05)" />
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0f1729', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1.125rem' }}>{confidence}%</span>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 1rem' }}>Metadata</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Brain size={13} />AI Graded</span>
                    <span className={`badge ${submission.evaluatedByAI ? 'badge-green' : 'badge-slate'}`}>{submission.evaluatedByAI ? 'Yes' : 'No'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Clock size={13} />Updated</span>
                    <span style={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 500 }}>{new Date(submission.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Question-wise Feedback</h2>
                {user?.role === 'Teacher' && (
                  <button onClick={() => { setNewScore(submission.totalMarks); setShowOverride(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
                    <Edit3 size={13} /> Override Marks
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {submission.feedback?.map((fb, i) => (
                  <div key={i} style={{ display: 'flex', gap: '1.25rem', padding: '1.25rem', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 48 }}>
                      <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: '0 0 0.25rem' }}>Q</p>
                      <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#e2e8f0', margin: 0, lineHeight: 1 }}>{fb.question}</p>
                    </div>
                    <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', flexShrink: 0 }} />
                    <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 48 }}>
                      <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: '0 0 0.25rem' }}>Score</p>
                      <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#34d399', margin: 0, lineHeight: 1 }}>{fb.score}</p>
                    </div>
                    <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.5rem' }}>AI Remarks</p>
                      <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>{fb.remarks}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {(submission.status === 'Pending' || submission.status === 'Processing') && (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, background: 'rgba(99,102,241,0.12)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <Brain size={30} color="#818cf8" />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 0.5rem' }}>
              {submission.status === 'Processing' ? 'AI is grading your answers…' : 'Waiting for evaluation'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
              {submission.status === 'Processing' ? 'Usually 30–60 seconds. Page auto-refreshes.' : 'Teacher will start the AI evaluation soon.'}
            </p>
          </div>
        )}
      </div>

      {/* Override Modal */}
      {showOverride && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: 440 }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 1.5rem' }}>Manual Override</h3>
            <form onSubmit={handleOverride} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label-dark">New Total Score</label>
                <input type="number" required value={newScore} onChange={e => setNewScore(e.target.value)} className="input-dark" />
              </div>
              <div>
                <label className="label-dark">Reason</label>
                <textarea required rows={3} value={justification} onChange={e => setJustification(e.target.value)} className="input-dark" placeholder="Why are you changing the marks?" style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowOverride(false)} style={{ padding: '0.625rem 1.25rem', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: '#94a3b8', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.625rem 1.25rem' }}>Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationResult;
