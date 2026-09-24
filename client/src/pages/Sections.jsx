import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Plus, Users, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Sections = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isTeacher = user?.role === 'Teacher' || user?.role === 'Admin';
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', program: '', semester: '', academic_year: '' });

  const load = async () => {
    try {
      const { data } = await axios.get(isTeacher ? '/teacher/sections' : '/student/sections');
      setSections(data || []);
    } catch { toast.error('Unable to load sections.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let active = true;
    axios.get(isTeacher ? '/teacher/sections' : '/student/sections').then(({ data }) => { if (active) setSections(data || []); }).catch(() => { if (active) toast.error('Unable to load sections.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isTeacher]);

  const createSection = async (event) => {
    event.preventDefault();
    setCreating(true);
    try {
      await axios.post('/teacher/sections', { ...form, semester: form.semester ? Number(form.semester) : null });
      setForm({ name: '', code: '', program: '', semester: '', academic_year: '' });
      toast.success('Section created.');
      await load();
    } catch (error) { toast.error(error.response?.data?.message || 'Could not create section.'); }
    finally { setCreating(false); }
  };

  return <div className="page-wrapper"><div className="page-content narrow-page">
    <button onClick={() => navigate(isTeacher ? '/teacher/dashboard' : '/student/dashboard')} className="back-link"><ArrowLeft size={16} /> Back to dashboard</button>
    <div className="list-heading"><div><p className="eyebrow">Class access</p><h1>{isTeacher ? 'My sections' : 'My classes'}</h1><p>{isTeacher ? 'Create sections and manage enrolled students.' : 'Only work assigned to your enrolled sections appears in your library.'}</p></div><div className="list-icon"><Users size={22} /></div></div>
    {isTeacher && <form className="glass-card section-form" onSubmit={createSection}><div className="card-title"><span className="section-icon"><Plus size={17} /></span><div><h2>Create section</h2><p>Students can be enrolled after creation.</p></div></div><div className="builder-options"><label className="label-dark">Name<input className="input-dark" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="BSSE 5A" /></label><label className="label-dark">Code<input className="input-dark" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="BSSE-5A" /></label></div><div className="builder-options"><label className="label-dark">Program<input className="input-dark" value={form.program} onChange={e => setForm({ ...form, program: e.target.value })} placeholder="BS Software Engineering" /></label><label className="label-dark">Semester<input className="input-dark" type="number" min="1" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} placeholder="5" /></label></div><label className="label-dark">Academic year<input className="input-dark" value={form.academic_year} onChange={e => setForm({ ...form, academic_year: e.target.value })} placeholder="2026-27" /></label><button className="btn-primary" disabled={creating}>{creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Create section</button></form>}
    {loading ? <div className="dashboard-loading"><Loader2 size={26} className="animate-spin" /><span>Loading sections...</span></div> : sections.length ? <div className="stack-list">{sections.map(section => <article className="exam-row exam-card glass-card" key={section.id}><div className="row-icon"><Users size={17} /></div><div className="row-copy"><span className="badge badge-indigo">{section.code}</span><strong>{section.name}</strong><span>{section.program || 'Academic section'} {section.teachers?.length ? `· Taught by ${section.teachers.map(t => t.name).join(', ')}` : ''}</span></div><div className="submission-status"><span><Users size={14} /> {section.student_count || 0}</span><span><BookOpen size={14} /> {section.test_count || 0}</span></div>{isTeacher && <button className="btn-secondary compact" onClick={() => navigate(`/teacher/sections/${section.id}`)}>Manage</button>}</article>)}</div> : <div className="empty-state glass-card"><Users size={30} /><h3>{isTeacher ? 'No sections yet' : 'No enrolled sections'}</h3><p>{isTeacher ? 'Create your first section to assign tests.' : 'Ask your teacher to enroll you in a section.'}</p></div>}
  </div></div>;
};
export default Sections;
