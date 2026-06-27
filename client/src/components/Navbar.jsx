import React, { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Brain, LogOut, LayoutDashboard, PlusSquare, ShieldCheck } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [];
  if (user.role === 'Student') {
    links.push({ label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' });
  } else if (user.role === 'Teacher') {
    links.push({ label: 'Dashboard', icon: LayoutDashboard, path: '/teacher/dashboard' });
    links.push({ label: 'Create Exam', icon: PlusSquare, path: '/teacher/exam/create' });
  } else if (user.role === 'Admin') {
    links.push({ label: 'Admin Panel', icon: ShieldCheck, path: '/admin/dashboard' });
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(8,13,23,0.85)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      height: '64px', display: 'flex', alignItems: 'center',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }} onClick={() => navigate(links[0]?.path || '/')}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9', letterSpacing: '-0.01em' }}>ExamAI</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {links.map(({ label, icon: Icon, path }) => (
            <button key={path} onClick={() => navigate(path)} style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.5rem 0.875rem', borderRadius: 8, border: 'none',
              background: location.pathname === path ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: location.pathname === path ? '#a5b4fc' : '#94a3b8',
              fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease',
            }}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8125rem' }}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.5rem 0.875rem', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)',
            background: 'rgba(239,68,68,0.08)', color: '#fca5a5',
            fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease',
          }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;