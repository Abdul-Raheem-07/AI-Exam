import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  Brain,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      return;
    }

    setLoading(true);

    try {
      const user = await login(trimmedEmail, password);

      if (!user?.role) return;

      switch (user.role) {
        case 'Student':
          navigate('/student/dashboard');
          break;

        case 'Teacher':
          navigate('/teacher/dashboard');
          break;

        case 'Admin':
          navigate('/admin/dashboard');
          break;

        default:
          navigate('/');
      }
    } catch (err) {
      // Toast handled inside AuthProvider
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-25%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 650,
          height: 650,
          background:
            'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 420,
          animation: 'fadeInUp 0.4s ease both',
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 10px 30px rgba(99,102,241,0.25)',
            }}
          >
            <Brain size={26} color="#fff" />
          </div>

          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: '#f1f5f9',
              margin: 0,
              letterSpacing: '-0.03em',
            }}
          >
            Welcome Back
          </h1>

          <p
            style={{
              color: '#64748b',
              marginTop: 6,
              fontSize: '0.875rem',
            }}
          >
            Sign in to continue
          </p>
        </div>

        {/* Card */}
        <div
          className="glass-card"
          style={{
            padding: '2rem',
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >            {/* Email */}
            <div>
              <label className="label-dark">Email</label>

              <div style={{ position: 'relative' }}>
                <Mail
                  size={15}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                  }}
                />

                <input
                  type="email"
                  required
                  autoComplete="email"
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <label className="label-dark" style={{ marginBottom: 0 }}>
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: '0.8rem',
                    color: '#818cf8',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Forgot Password?
                </Link>
              </div>

              <div style={{ position: 'relative' }}>
                <Lock
                  size={15}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                  }}
                />

                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dark"
                  placeholder="••••••••"
                  style={{
                    paddingLeft: '2.5rem',
                    paddingRight: '2.7rem',
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                marginTop: 6,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div
            className="divider"
            style={{
              marginTop: '1.5rem',
            }}
          />

          <p
            style={{
              textAlign: 'center',
              fontSize: '0.82rem',
              color: '#64748b',
              margin: 0,
            }}
          >
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{
                color: '#818cf8',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;