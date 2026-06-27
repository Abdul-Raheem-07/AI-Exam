import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Brain, Mail, Lock, User, ChevronDown, ArrowRight, Loader2 } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await register(name, email, password, role);

      if (user.role === 'Student') navigate('/student/dashboard');
      else if (user.role === 'Teacher') navigate('/teacher/dashboard');
      else navigate('/admin/dashboard');

    } catch (error) {
      // handled globally in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Background Glow */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '15%',
        width: 520,
        height: 520,
        background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 440, animation: 'fadeInUp 0.4s ease both' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 54,
            height: 54,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Brain size={26} color="#fff" />
          </div>

          <h1 style={{
            fontSize: '1.625rem',
            fontWeight: 800,
            color: '#f1f5f9',
            margin: 0
          }}>
            Create account
          </h1>

          <p style={{
            color: '#64748b',
            marginTop: '0.4rem',
            fontSize: '0.875rem'
          }}>
            Join ExamAI and start your journey
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card" style={{ padding: '2rem' }}>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

            {/* Name */}
            <div>
              <label className="label-dark">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{
                  position: 'absolute',
                  left: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b'
                }} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-dark"
                  placeholder="Enter your full name"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label-dark">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{
                  position: 'absolute',
                  left: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b'
                }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-dark"
                  placeholder="you@example.com"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label-dark">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{
                  position: 'absolute',
                  left: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b'
                }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dark"
                  placeholder="Create a strong password"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="label-dark">Select Role</label>
              <div style={{ position: 'relative' }}>
                <ChevronDown size={15} style={{
                  position: 'absolute',
                  right: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  pointerEvents: 'none'
                }} />

                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input-dark"
                  style={{ appearance: 'none', paddingRight: '2.5rem', cursor: 'pointer' }}
                >
                  <option value="Student">Student</option>
                  <option value="Teacher">Teacher</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>

          </form>

          {/* Footer */}
          <div className="divider" style={{ marginTop: '1.5rem' }} />

          <p style={{
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: '#64748b',
            margin: 0
          }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: '#818cf8',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Register;