import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Loader2, CheckCircle, AlertCircle, RefreshCw, Edit3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';

const EvaluationResult = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  
  // Override state
  const [showOverride, setShowOverride] = useState(false);
  const [newScore, setNewScore] = useState('');
  const [justification, setJustification] = useState('');

  const fetchStatus = async () => {
    try {
      const { data } = await axios.get(`/submissions/${id}/status`);
      setSubmission(data);
      if (data.status === 'Completed' || data.status === 'Failed') {
        setPolling(false);
      } else {
        setPolling(true);
      }
    } catch (error) {
      toast.error('Failed to fetch status');
      setPolling(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [id]);

  useEffect(() => {
    let interval;
    if (polling) {
      interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
    }
    return () => clearInterval(interval);
  }, [polling]);

  const handleOverride = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/submissions/${id}/override`, {
        newScore: Number(newScore),
        justification
      });
      toast.success('Marks overridden successfully');
      setShowOverride(false);
      fetchStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to override marks');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;

  if (!submission) return <div className="text-center py-12">Submission not found.</div>;

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const confidenceData = [
    { name: 'Confidence', value: submission.confidence || 0 },
    { name: 'Uncertainty', value: 100 - (submission.confidence || 0) }
  ];
  const COLORS = ['#10b981', '#f3f4f6'];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Evaluation Result</h1>
            <p className="text-sm text-gray-500 mt-1">Submission ID: {submission._id}</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            {submission.status === 'Pending' && (
              <button 
                onClick={async () => {
                  try {
                    await axios.post(`/submissions/evaluate/${id}`);
                    toast.success('Evaluation started!');
                    fetchStatus();
                  } catch (e) {
                    toast.error('Failed to start evaluation');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Start AI Evaluation
              </button>
            )}
            {polling && <span className="text-sm text-gray-500 animate-pulse flex items-center"><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> AI is grading...</span>}
            <span className={`px-4 py-2 rounded-full border font-medium text-sm flex items-center ${getStatusColor(submission.status)}`}>
              {submission.status === 'Completed' && <CheckCircle className="h-4 w-4 mr-2" />}
              {submission.status === 'Failed' && <AlertCircle className="h-4 w-4 mr-2" />}
              {submission.status}
            </span>
          </div>
        </div>

        {submission.status === 'Completed' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Score Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Total Score</h3>
              <div className="text-5xl font-extrabold text-blue-600">
                {submission.totalMarks}
              </div>
              <p className="text-sm text-gray-500 mt-2">Points Awarded</p>
            </div>

            {/* Confidence Meter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center">
              <h3 className="text-lg font-medium text-gray-700 mb-2">AI Confidence</h3>
              <div className="h-32 w-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={confidenceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={55}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      stroke="none"
                    >
                      {confidenceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-xl font-bold text-gray-800">{submission.confidence}%</span>
                </div>
              </div>
            </div>

            {/* Actions / Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Metadata</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Evaluated By AI:</span>
                  <span className="font-semibold">{submission.evaluatedByAI ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span className="font-semibold">{new Date(submission.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Feedback Section */}
            <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Question-wise Feedback</h3>
                {user?.role === 'Teacher' && (
                  <button 
                    onClick={() => {
                      setNewScore(submission.totalMarks);
                      setShowOverride(true);
                    }}
                    className="flex items-center px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium"
                  >
                    <Edit3 className="h-4 w-4 mr-2" /> Override Marks
                  </button>
                )}
              </div>
              
              <div className="space-y-6">
                {submission.feedback?.map((fb, idx) => (
                  <div key={idx} className="p-4 rounded-lg border border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-4">
                    <div className="sm:w-24 flex-shrink-0 text-center">
                      <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Question</div>
                      <div className="text-2xl font-bold text-gray-800">{fb.question}</div>
                    </div>
                    <div className="sm:w-24 flex-shrink-0 text-center border-t sm:border-t-0 sm:border-l border-gray-200 pt-4 sm:pt-0 sm:pl-4">
                      <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Score</div>
                      <div className="text-2xl font-bold text-green-600">{fb.score}</div>
                    </div>
                    <div className="flex-grow border-t sm:border-t-0 sm:border-l border-gray-200 pt-4 sm:pt-0 sm:pl-6">
                      <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">AI Remarks</div>
                      <p className="text-gray-700 text-sm leading-relaxed">{fb.remarks}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Override Modal */}
      {showOverride && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Manual Override</h3>
            <form onSubmit={handleOverride} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">New Total Score</label>
                <input 
                  type="number" 
                  required 
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Justification / Reason</label>
                <textarea 
                  required
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Why are you changing the AI's marks?"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowOverride(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Confirm Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default EvaluationResult;
