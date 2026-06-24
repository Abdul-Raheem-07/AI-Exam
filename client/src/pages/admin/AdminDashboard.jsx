import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Users, FileText, CheckSquare, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await axios.get('/admin/dashboard');
        setMetrics(data.metrics);
      } catch (error) {
        console.error('Failed to fetch analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;

  if (!metrics) return <div className="text-center py-12">Failed to load analytics.</div>;

  const roleData = [
    { name: 'Students', value: metrics.totalStudents },
    { name: 'Teachers', value: metrics.totalTeachers },
  ];

  const submissionData = [
    { name: 'Evaluated (AI)', value: metrics.evaluatedSubmissions },
    { name: 'Pending', value: metrics.totalSubmissions - metrics.evaluatedSubmissions },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600 mr-4"><Users className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg text-purple-600 mr-4"><FileText className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Exams</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalExams}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
            <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4"><CheckSquare className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalSubmissions}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg text-yellow-600 mr-4"><BarChart2 className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.averageScore}</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">User Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: '#f3f4f6' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Submission Status</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={submissionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: '#f3f4f6' }} />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-500">AI Evaluation Success Rate: </span>
              <span className="font-semibold text-gray-900">{metrics.aiSuccessRate}%</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
