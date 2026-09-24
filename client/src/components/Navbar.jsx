import { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Brain, LogOut, LayoutDashboard, PlusSquare, ShieldCheck, Menu, X, ClipboardList, BarChart3, Users } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  if (!user) return null;

  const links = user.role === 'Student'
    ? [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
      { label: 'Published tests', icon: ClipboardList, path: '/student/tests' },
      { label: 'My sections', icon: Users, path: '/student/sections' },
      { label: 'Results', icon: BarChart3, path: '/student/dashboard' },
    ]
    : user.role === 'Teacher'
      ? [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher/dashboard' },
        { label: 'Create exam', icon: PlusSquare, path: '/teacher/exam/create' },
        { label: 'AI test builder', icon: Brain, path: '/teacher/test/create' },
        { label: 'My sections', icon: Users, path: '/teacher/sections' },
      ]
      : [{ label: 'Admin panel', icon: ShieldCheck, path: '/admin/dashboard' }];

  const go = (path) => { navigate(path); setOpen(false); };
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      <header className="app-header">
        <div className="brand-mark" onClick={() => go(links[0]?.path || '/')} role="button" tabIndex={0}>
          <span className="brand-icon"><Brain size={19} /></span>
          <span><strong>ExamAI</strong><small>Learning, made clearer</small></span>
        </div>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map(({ label, icon: Icon, path }) => <button key={label} className={location.pathname === path ? 'nav-link active' : 'nav-link'} onClick={() => go(path)}><Icon size={16} />{label}</button>)}
        </nav>
        <div className="header-account">
          <div className="avatar">{user.name?.charAt(0).toUpperCase()}</div>
          <div className="account-copy"><strong>{user.name}</strong><span>{user.role}</span></div>
          <button className="icon-button logout-button" title="Sign out" onClick={handleLogout}><LogOut size={16} /></button>
          <button className="mobile-menu icon-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </header>
      {open && <div className="mobile-nav">{links.map(({ label, icon: Icon, path }) => <button key={label} className={location.pathname === path ? 'nav-link active' : 'nav-link'} onClick={() => go(path)}><Icon size={17} />{label}</button>)}<button className="nav-link danger-link" onClick={handleLogout}><LogOut size={17} />Sign out</button></div>}
    </>
  );
};
export default Navbar;
