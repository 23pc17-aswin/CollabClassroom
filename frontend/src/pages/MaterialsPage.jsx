import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

/**
 * MaterialsPage — file list with download buttons, upload (teacher/admin).
 * Also used as a tab inside ClassroomPage.
 * Props: classroomId (optional, falls back to URL param)
 */
export default function MaterialsPage({ classroomId: propId }) {
  const params = useParams();
  const classroomId = propId || params.classroomId;
  const api = useApi();
  const fileRef = useRef(null);

  const [materials, setMaterials] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!classroomId) return;
    const load = async () => {
      const [mRes, uRes] = await Promise.all([
        api.get(`/api/v2/classrooms/${classroomId}/materials`),
        api.get('/api/v2/users/me'),
      ]);
      setMaterials(mRes.data);
      setUser(uRes.data);
      setLoading(false);
    };
    load().catch(console.error);
  }, [classroomId]);

  const handleDownload = async (materialId, fileName) => {
    try {
      const { data } = await api.get(`/api/v2/classrooms/${classroomId}/materials/${materialId}/download`);
      window.open(data.url, '_blank');
    } catch (e) {
      alert('Failed to get download URL');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    setError('');
    const fd = new FormData();
    fd.append('file', selectedFile);
    fd.append('title', uploadForm.title);
    if (uploadForm.description) fd.append('description', uploadForm.description);
    try {
      const { data } = await api.post(`/api/v2/classrooms/${classroomId}/materials`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMaterials(prev => [data, ...prev]);
      setShowUpload(false);
      setUploadForm({ title: '', description: '' });
      setSelectedFile(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId) => {
    if (!window.confirm('Delete this material?')) return;
    await api.delete(`/api/v2/classrooms/${classroomId}/materials/${materialId}`);
    setMaterials(prev => prev.filter(m => m._id !== materialId));
  };

  const fileIcon = (type) => {
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('presentation')) return '📊';
    if (type?.includes('word')) return '📝';
    if (type?.includes('image')) return '🖼️';
    return '📎';
  };

  const fmtSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  if (loading) return <div className="flex items-center justify-center h-40"><div className="animate-spin w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-white font-semibold">Materials ({materials.length})</h2>
        {isTeacherOrAdmin && (
          <button onClick={() => setShowUpload(p => !p)}
            className="bg-amber-500 hover:bg-amber-400 text-navy-900 font-semibold px-4 py-1.5 text-sm rounded-lg">
            + Upload
          </button>
        )}
      </div>

      {showUpload && (
        <form onSubmit={handleUpload} className="bg-[#0F1729] border border-[#1e3a5f] rounded-xl p-4 mb-5 space-y-3">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <input className="w-full bg-[#162133] border border-[#1e3a5f] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
            placeholder="Title *" value={uploadForm.title} onChange={e => setUploadForm(p => ({ ...p, title: e.target.value }))} required />
          <input className="w-full bg-[#162133] border border-[#1e3a5f] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
            placeholder="Description (optional)" value={uploadForm.description} onChange={e => setUploadForm(p => ({ ...p, description: e.target.value }))} />
          <div className="flex gap-3 items-center">
            <input ref={fileRef} type="file" accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg" className="hidden"
              onChange={e => setSelectedFile(e.target.files[0])} />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">
              {selectedFile ? selectedFile.name : 'Choose File'}
            </button>
            <button type="submit" disabled={!selectedFile || uploading}
              className="bg-amber-500 hover:bg-amber-400 text-navy-900 font-semibold px-4 py-1.5 rounded-lg text-sm disabled:opacity-50">
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <button type="button" onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-white text-sm">Cancel</button>
          </div>
        </form>
      )}

      {!materials.length ? (
        <div className="text-center py-12 text-slate-400">
          <div className="text-4xl mb-3">📂</div>
          <p>No materials uploaded yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {materials.map(m => (
            <div key={m._id} className="flex items-center gap-4 bg-[#0F1729] border border-[#1e3a5f] rounded-xl p-4 hover:border-amber-500/30 transition-colors">
              <div className="text-2xl">{fileIcon(m.fileType)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{m.title}</p>
                <p className="text-slate-500 text-xs">{m.fileName} · {fmtSize(m.fileSize)} · {m.uploaderName} · {new Date(m.createdAt).toLocaleDateString()}</p>
                {m.description && <p className="text-slate-400 text-xs mt-0.5 truncate">{m.description}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDownload(m._id, m.fileName)}
                  className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-medium">
                  ↓ Download
                </button>
                {isTeacherOrAdmin && (
                  <button onClick={() => handleDelete(m._id)}
                    className="text-red-400 hover:text-red-300 px-2 py-1.5 rounded-lg text-xs">
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
