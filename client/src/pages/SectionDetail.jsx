import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, UserPlus, UserMinus, Users, Search, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const SectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const load = async () => {
    try {
      const [{ data: sectionData }, { data: studentData }] = await Promise.all([axios.get(`/teacher/sections/${id}`), axios.get('/teacher/students')]);
      setSection(sectionData); setStudents(studentData || []);
    } catch (error) { toast.error(error.response?.data?.message || 'Unable to load this section.'); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    let active = true;
    Promise.all([axios.get(`/teacher/sections/${id}`), axios.get('/teacher/students')]).then(([{ data: sectionData }, { data: studentData }]) => { if (active) { setSection(sectionData); setStudents(studentData || []); } }).catch(error => { if (active) toast.error(error.response?.data?.message || 'Unable to load this section.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const enroll = async (event) => {
    event.preventDefault();
    if (!selectedStudent || enrolling) return;
    setEnrolling(true);
    try { await axios.post(`/teacher/sections/${id}/students`, { student_id: Number(selectedStudent) }); toast.success('Student enrolled.'); setSelectedStudent(''); setSearchQuery(''); await load(); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not enroll student.'); }
    finally { setEnrolling(false); }
  };

  const remove = async () => {
    if (!removingId || isRemoving) return;
    setIsRemoving(true);
    try { await axios.delete(`/teacher/sections/${id}/students/${removingId}`); toast.success('Student removed.'); setRemovingId(null); await load(); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not remove student.'); }
    finally { setIsRemoving(false); }
  };

  if (loading) return <div className="page-wrapper"><div className="page-content dashboard-loading"><Loader2 size={26} className="animate-spin" /><span>Loading section...</span></div></div>;
  if (!section) return <div className="page-wrapper"><div className="page-content"><button className="back-link" onClick={() => navigate('/teacher/sections')}><ArrowLeft size={16} /> Back to sections</button></div></div>;
  
  const enrolled = new Set((section.students || []).map(student => student.id));
  const available = students.filter(student => !enrolled.has(student.id));
  const filteredAvailable = available.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="page-wrapper">
      <div className="page-content narrow-page">
        <button className="back-link" onClick={() => navigate('/teacher/sections')}><ArrowLeft size={16} /> Back to sections</button>
        <div className="list-heading">
          <div><p className="eyebrow">Section management</p><h1>{section.name}</h1><p>{section.code} {section.program ? `· ${section.program}` : ''}</p></div>
          <div className="list-icon"><Users size={22} /></div>
        </div>
        
        <form className="glass-card section-form" onSubmit={enroll}>
          <div className="card-title">
            <span className="section-icon"><UserPlus size={17} /></span>
            <div><h2>Enroll student</h2><p>Find and add students to this section.</p></div>
          </div>
          <div className="field-with-icon" style={{ marginBottom: '.5rem' }}>
            <Search size={16} />
            <input className="input-dark" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setSelectedStudent(''); }} placeholder="Search by name or email..." />
          </div>
          <select className="input-dark" value={selectedStudent} onChange={event => setSelectedStudent(event.target.value)} size={Math.min(5, Math.max(2, filteredAvailable.length + 1))}>
            {filteredAvailable.length === 0 ? <option value="" disabled>No matching students found</option> : <option value="" disabled>Select a student to enroll</option>}
            {filteredAvailable.map(student => <option value={student.id} key={student.id}>{student.name} ({student.email})</option>)}
          </select>
          <button className="btn-primary" disabled={!selectedStudent || enrolling}>{enrolling ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} {enrolling ? 'Enrolling...' : 'Enroll student'}</button>
        </form>

        <section>
          <div className="section-heading">
            <div><p className="eyebrow">Enrolled students</p><h2>{section.students?.length || 0} students</h2></div>
          </div>
          {section.students?.length ? (
            <div className="stack-list">
              {section.students.map(student => (
                <article className="exam-row exam-card glass-card" key={student.id}>
                  <div className="row-icon"><Users size={17} /></div>
                  <div className="row-copy"><strong>{student.name}</strong><span>{student.email}</span></div>
                  <button className="btn-secondary compact" onClick={() => setRemovingId(student.id)}><UserMinus size={14} /> Remove</button>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state glass-card">
              <Users size={30} />
              <h3>No students enrolled</h3>
              <p>Search and select a student above to add them to this section.</p>
            </div>
          )}
        </section>

        {removingId && (
          <div className="modal-backdrop" onClick={() => !isRemoving && setRemovingId(null)}>
            <div className="confirm-modal" role="dialog" aria-modal="true" onClick={event => event.stopPropagation()}>
              <button className="modal-close icon-button" onClick={() => setRemovingId(null)} aria-label="Cancel"><X size={17} /></button>
              <div className="modal-icon" style={{ color: 'var(--danger)', background: '#fff5f6' }}><UserMinus size={19} /></div>
              <h2>Remove student?</h2>
              <p>Are you sure you want to remove this student from the section? They will lose access to assigned tests.</p>
              <div className="modal-actions">
                <button className="btn-secondary" disabled={isRemoving} onClick={() => setRemovingId(null)}>Cancel</button>
                <button className="btn-danger" disabled={isRemoving} onClick={remove}>{isRemoving ? <Loader2 size={16} className="animate-spin" /> : <UserMinus size={15} />} Remove</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default SectionDetail;
