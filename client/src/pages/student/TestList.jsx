import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock3, ClipboardList, Loader2, Search } from 'lucide-react';

const TestList = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]); const [loading, setLoading] = useState(true); const [query, setQuery] = useState('');
  useEffect(() => { axios.get('/student/tests').then(({ data }) => setTests(data || [])).catch(() => toast.error('Unable to load published tests.')).finally(() => setLoading(false)); }, []);
  const filtered = tests.filter(test => test.title?.toLowerCase().includes(query.toLowerCase()));
  return <div className="page-wrapper"><div className="page-content narrow-page"><button onClick={() => navigate('/student/dashboard')} className="back-link"><ArrowLeft size={16} /> Back to dashboard</button><div className="list-heading"><div><p className="eyebrow">Practice library</p><h1>Published MCQ tests</h1><p>Build confidence with focused, bite-sized practice.</p></div><div className="list-icon"><ClipboardList size={22} /></div></div><div className="search-wrap"><Search size={16} /><input className="input-dark" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tests" /></div>{loading ? <div className="dashboard-loading"><Loader2 size={26} className="animate-spin" /><span>Loading tests...</span></div> : filtered.length ? <div className="test-list">{filtered.map(test => <article className="test-card glass-card" key={test.id}><div className="test-card-icon"><BookOpen size={19} /></div><div className="row-copy"><span className="badge badge-indigo">{test.difficulty || 'Moderate'}</span><h3>{test.title}</h3><p>{test.description || 'A guided practice test to check your understanding.'}</p><div className="test-meta"><span><ClipboardList size={14} /> {test.question_count} questions</span><span><Clock3 size={14} /> Self-paced</span></div></div><button className="btn-primary" onClick={() => navigate(`/student/test/${test.id}`)}>Start test</button></article>)}</div> : <div className="empty-state glass-card"><ClipboardList size={30} /><h3>{query ? 'No matching tests' : 'No published tests yet'}</h3><p>{query ? 'Try a different search term.' : 'Your teacher will publish practice tests here.'}</p></div>}</div></div>;
};
export default TestList;
