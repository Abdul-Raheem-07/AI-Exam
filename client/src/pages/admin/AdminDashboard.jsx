import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Users, FileText, CheckSquare, BarChart2, AlertCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Token retrieval if authentication is active
        const token = localStorage.getItem('token');
        
        // Agar backend base URL configure nahi hai, toh environment variable use karein ya exact path dein
        const API_URL = import.meta.env.VITE_API_URL || ''; 
        
        const { data } = await axios.get(`${API_URL}/api/admin/dashboard`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        });
        
        setMetrics(data.metrics);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        setError(error.response?.data?.message || 'Failed to load dashboard analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-gray-500 animate-pulse">Loading analytics engine...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 max-w-md mx-auto text-center">
        <div className="p-3 bg-red-100 rounded-full text-red-600 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Analytics Error</h3>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12 text-gray-500">
        No operational metrics available at this time.
      </div>
    );
  }

  // Data processing with clean structural mapping
  const roleData = [
    { name: 'Students', value: metrics.totalStudents || 0, color: '#3b82f6' },
    { name: 'Teachers', value: metrics.totalTeachers || 0, color: '#10b981' },
  ];

  const totalSubmissions = metrics.totalSubmissions || 0;
  const evaluatedSubmissions = metrics.evaluatedSubmissions || 0;
  const pendingSubmissions = Math.max(0, totalSubmissions - evaluatedSubmissions);

  const submissionData = [
    { name: 'Evaluated (AI)', value: evaluatedSubmissions, color: '#6366f1' },
    { name: 'Pending Review', value: pendingSubmissions, color: '#f59e0b' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time oversight of the AI Exam Checking Ecosystem</p>
      </div>

      {/* Metric Cards Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 mr-4">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Active Users</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{metrics.totalUsers || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center hover:shadow-md transition-shadow">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600 mr-4">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Exams</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{metrics.totalExams || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center hover:shadow-md transition-shadow">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 mr-4">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Submissions</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalSubmissions}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 mr-4">
            <BarChart2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg Grading Score</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              {Number(metrics.averageScore || 0).toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Data Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
        {/* User Distribution Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">User Demographics</h3>
            <p className="text-xs text-gray-400">Ratio mapping of registered Students to Teachers</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={45}>
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evaluation Tracking Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">Evaluation Lifecycle</h3>
            <p className="text-xs text-gray-400">Overview of AI analyzed scripts vs pending queue</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={submissionData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={45}>
                  {submissionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">AI Processing Integrity:</span>
            <span className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-full">
              {metrics.aiSuccessRate || 0}% Accuracy Rate
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;