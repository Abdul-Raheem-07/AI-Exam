import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';

import {
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Edit3,
  ArrowLeft,
  Brain,
  Clock
} from 'lucide-react';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

const StatusBadge = ({ status }) => {
  const styles = {
    Pending: { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
    Processing: { color: '#818cf8', bg: 'rgba(99,102,241,0.12)' },
    Completed: { color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
    Failed: { color: '#f87171', bg: 'rgba(239,68,68,0.12)' }
  };

  const s = styles[status] || styles.Pending;

  return (
    <span style={{
      padding: '0.4rem 0.8rem',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      background: s.bg,
      color: s.color,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }}>
      {status === 'Completed' && <CheckCircle size={14} />}
      {status === 'Failed' && <AlertCircle size={14} />}
      {status === 'Processing' && <RefreshCw size={14} className="animate-spin" />}
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

      const isActive = data?.status === 'Pending' || data?.status === 'Processing';
      setPolling(isActive);
    } catch (err) {
      toast.error('Failed to fetch submission status');
      setPolling(false);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, [polling, fetchStatus]);

  const startEvaluation = async () => {
    try {
      await axios.post(`/submissions/evaluate/${id}`);
      toast.success('AI evaluation started');
      fetchStatus();
    } catch {
      toast.error('Could not start evaluation');
    }
  };

  const handleOverride = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/submissions/${id}/override`, {
        newScore: Number(newScore),
        justification
      });

      toast.success('Marks updated');
      setShowOverride(false);
      fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Override failed');
    }
  };

  const confidence = submission?.confidence || 0;

  const confidenceData = [
    { name: 'Confidence', value: confidence },
    { name: 'Uncertainty', value: 100 - confidence }
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-12 text-gray-500">
        Submission not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">

      {/* Header */}
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-6">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft />
        </button>

        <div className="text-center">
          <h1 className="text-xl font-bold">Evaluation Result</h1>
          <p className="text-xs text-gray-500">ID: {submission._id?.slice(-6)}</p>
        </div>

        <div className="flex items-center gap-3">
          {polling && (
            <span className="text-sm text-blue-500 flex items-center gap-1">
              <Brain size={14} className="animate-pulse" />
              Grading
            </span>
          )}

          {submission.status === 'Pending' && (
            <button
              onClick={startEvaluation}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              Start AI
            </button>
          )}

          <StatusBadge status={submission.status} />
        </div>
      </div>

      {/* Main */}
      {submission.status === 'Completed' && (
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-4">

          {/* Score */}
          <div className="bg-white p-6 rounded-xl text-center">
            <p className="text-sm text-gray-500">Total Score</p>
            <h2 className="text-4xl font-bold text-blue-600">
              {submission.totalMarks || 0}
            </h2>
          </div>

          {/* Confidence */}
          <div className="bg-white p-6 rounded-xl text-center">
            <p className="text-sm text-gray-500">Confidence</p>

            <div className="h-32">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={confidenceData} innerRadius={35} outerRadius={50} dataKey="value">
                    <Cell fill="#6366f1" />
                    <Cell fill="#e5e7eb" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <p className="font-bold">{confidence}%</p>
          </div>

          {/* Meta */}
          <div className="bg-white p-6 rounded-xl">
            <p className="text-sm text-gray-500">Meta</p>

            <div className="mt-2 text-sm space-y-2">
              <div className="flex justify-between">
                <span>AI Evaluated</span>
                <b>{submission.evaluatedByAI ? 'Yes' : 'No'}</b>
              </div>

              <div className="flex justify-between">
                <span>Updated</span>
                <b>{new Date(submission.updatedAt).toLocaleDateString()}</b>
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className="md:col-span-3 bg-white p-6 rounded-xl">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold">Feedback</h2>

              {user?.role === 'Teacher' && (
                <button
                  onClick={() => {
                    setNewScore(submission.totalMarks);
                    setShowOverride(true);
                  }}
                  className="text-sm text-blue-600"
                >
                  <Edit3 size={14} /> Override
                </button>
              )}
            </div>

            <div className="space-y-3">
              {submission.feedback?.map((f, i) => (
                <div key={i} className="border p-3 rounded">
                  <p className="font-semibold">
                    Q{f.question}: {f.score} marks
                  </p>
                  <p className="text-sm text-gray-600">{f.remarks}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Override Modal */}
      {showOverride && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <form
            onSubmit={handleOverride}
            className="bg-white p-6 rounded-xl w-96 space-y-3"
          >
            <h3 className="font-bold">Override Marks</h3>

            <input
              type="number"
              value={newScore}
              onChange={(e) => setNewScore(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="New Score"
            />

            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Reason"
            />

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowOverride(false)}>
                Cancel
              </button>
              <button className="bg-blue-600 text-white px-3 py-1 rounded">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default EvaluationResult;