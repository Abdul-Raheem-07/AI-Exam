import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Brain, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading || !email.trim() || !password) return;
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      navigate({ Student: '/student/dashboard', Teacher: '/teacher/dashboard', Admin: '/admin/dashboard' }[user?.role] || '/');
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };
  return <main className="auth-shell"><div className="auth-aside"><div className="auth-brand"><span className="brand-icon"><Brain size={20} /></span><strong>ExamAI</strong></div><div><p className="eyebrow">Your academic co-pilot</p><h1>Make every study session count.</h1><p>Practice with purpose, review with clarity, and keep your progress moving forward.</p></div><div className="auth-note"><ShieldCheck size={17} /><span>Built for focused learning and fair assessment.</span></div></div><section className="auth-panel"><div className="auth-form-wrap"><div className="auth-heading"><p className="eyebrow">Welcome back</p><h2>Sign in to ExamAI</h2><p>Pick up where you left off.</p></div><form className="auth-form" onSubmit={handleSubmit}><div><label className="label-dark">Email address</label><div className="field-with-icon"><Mail size={16} /><input className="input-dark" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div></div><div><div className="field-label-row"><label className="label-dark">Password</label><Link to="/forgot-password">Forgot password?</Link></div><div className="field-with-icon"><Lock size={16} /><input className="input-dark" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" /><button type="button" className="field-action" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div><button className="btn-primary auth-submit" disabled={loading}>{loading ? <Loader2 size={18} className="animate-spin" /> : <>Continue <ArrowRight size={16} /></>}</button></form><p className="auth-footer">New to ExamAI? <Link to="/register">Create an account</Link></p></div></section></main>;
};
export default Login;
