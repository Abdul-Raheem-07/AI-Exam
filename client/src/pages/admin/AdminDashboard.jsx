import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Users, FileText, CheckSquare, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f1729', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '0.625rem 1rem', fontSize: '0.8125rem', color: '#f1f5f9' }}>
      <p style={{ margin: '0 0 0.25rem', fontWeight: 600 }}>{label}</p>
      <p style={{ margin: 0, color: '#818cf8' }}>{payload[0].value}</p>
    </div>
  );
};

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/admin/dashboard')
      .then(r => setMetrics(r.data.metrics))
      .catch(err => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} color="#6366f1" className="animate-spin" />
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <div style={{ width: 52, height: 52, background: 'rgba(239,68,68,0.12)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertCircle size={24} color="#f87171" />
      </div>
      <p style={{ color: '#f87171', fontWeight: 600 }}>{error}</p>
      <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  if (!metrics) return null;

  const roleData = [
    { name: 'Students', value: metrics.totalStudents || 0 },
    { name: 'Teachers', value: metrics.totalTeachers || 0 },
  ];
  const subData = [
    { name: 'AI Graded', value: metrics.evaluatedSubmissions || 0 },
    { name: 'Pending', value: Math.max(0, (metrics.totalSubmissions || 0) - (metrics.evaluatedSubmissions || 0)) },
  ];
  const roleColors = ['#6366f1', '#8b5cf6'];
  const subColors  = ['#10b981', '#f59e0b'];

  const stats = [
    { icon: Users,       label: 'Total Users',  value: metrics.totalUsers || 0,   color: '#818cf8', bg: 'rgba(99,102,241,0.12)' },
    { icon: FileText,    label: 'Total Exams',  value: metrics.totalExams || 0,   color: '#a78bfa', bg: 'rgba(139,92,246,0.12)' },
    { icon: CheckSquare, label: 'Submissions',  value: metrics.totalSubmissions || 0, color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
    { icon: TrendingUp,  label: 'Avg Score',    value: Number(metrics.averageScore || 0).toFixed(1), color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
  ];

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '0.375rem' }}>System Overview</p>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>Admin Dashboard</h1>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {stats.map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="stat-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 44, height: 44, background: bg, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} color={color} />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.25rem' }}>{label}</p>
                <p style={{ fontSize: '1.875rem', fontWeight: 900, color: '#f1f5f9', margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {[
            { title: 'User Distribution', sub: 'Students vs Teachers', data: roleData, colors: roleColors },
            { title: 'Submission Status', sub: `AI Success Rate: ${metrics.aiSuccessRate || 0}%`, data: subData, colors: subColors },
          ].map(({ title, sub, data, colors }) => (
            <div key={title} className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 0.25rem' }}>{title}</h3>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>{sub}</p>
              </div>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                      {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
