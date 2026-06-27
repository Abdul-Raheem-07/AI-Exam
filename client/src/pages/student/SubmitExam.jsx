import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { UploadCloud, X, Loader2, ArrowLeft, Send, ImagePlus } from 'lucide-react';

const SubmitExam = () => {
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [exam, setExam] = useState(null);
  const { id: examId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`/exams/${examId}`).then(r => setExam(r.data)).catch(() => {});
    return () => images.forEach(img => URL.revokeObjectURL(img.preview));
  }, [examId]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const toastId = toast.loading('Compressing images…');
    try {
      const compressed = await Promise.all(
        acceptedFiles.map(f => imageCompression(f, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true }))
      );
      setImages(prev => [...prev, ...compressed.map(f => ({ file: f, preview: URL.createObjectURL(f) }))]);
      toast.success(`${compressed.length} image(s) ready`, { id: toastId });
    } catch {
      toast.error('Compression failed', { id: toastId });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  const handleSubmit = async () => {
    if (!images.length) { toast.error('Add at least one image'); return; }
    setIsUploading(true);
    const fd = new FormData();
    fd.append('examId', examId);
    images.forEach(img => fd.append('images', img.file));
    try {
      const { data } = await axios.post('/submissions', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Submitted successfully!');
      navigate(`/student/submission/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ maxWidth: 760 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => navigate('/student/dashboard')} style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Submit Answers</h1>
            {exam && <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>{exam.title}</p>}
          </div>
        </div>

        {exam?.questions?.length > 0 && (
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1rem' }}>Questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {exam.questions.map((q, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.875rem' }}>
                  <div style={{ width: 24, height: 24, background: 'rgba(99,102,241,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <div>
                    <p style={{ color: '#e2e8f0', fontSize: '0.9rem', margin: '0 0 0.125rem' }}>{q.questionText}</p>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{q.maxMarks} marks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1rem' }}>Upload Answer Sheets</h2>

          <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? '#6366f1' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', background: isDragActive ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s ease' }}>
            <input {...getInputProps()} />
            <div style={{ width: 52, height: 52, background: 'rgba(99,102,241,0.12)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <UploadCloud size={24} color={isDragActive ? '#818cf8' : '#475569'} />
            </div>
            {isDragActive
              ? <p style={{ color: '#818cf8', fontWeight: 600, margin: 0 }}>Drop here…</p>
              : <>
                  <p style={{ color: '#e2e8f0', fontWeight: 600, margin: '0 0 0.375rem' }}>Drag & drop answer sheets</p>
                  <p style={{ color: '#64748b', fontSize: '0.8125rem', margin: 0 }}>or click to browse · auto-compressed</p>
                </>
            }
          </div>

          {images.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.75rem' }}>{images.length} image(s) selected</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.75rem' }}>
                {images.map((img, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: 9, overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '1' }}>
                    <img src={img.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => setImages(p => p.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={11} />
                    </button>
                  </div>
                ))}
                <div {...getRootProps()} style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', aspectRatio: '1' }}>
                  <input {...getInputProps()} /><ImagePlus size={18} color="#475569" />
                </div>
              </div>
            </div>
          )}

          <button onClick={handleSubmit} disabled={!images.length || isUploading} className="btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '0.875rem', opacity: (!images.length || isUploading) ? 0.5 : 1 }}>
            {isUploading ? <><Loader2 size={15} className="animate-spin" /> Uploading…</> : <><Send size={15} /> Submit Answers</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitExam;
