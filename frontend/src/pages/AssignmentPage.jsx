import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

/**
 * AssignmentPage — student submission uploader + teacher grading table
 */
export default function AssignmentPage() {
  const { classroomId, assignmentId } = useParams();
  const api = useApi();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [assignment, setAssignment] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [grades, setGrades] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, uRes] = await Promise.all([
          api.get(`/api/v2/classrooms/${classroomId}/assignments/${assignmentId}`),
          api.get('/api/v2/users/me'),
        ]);
        setAssignment(aRes.data);
        setUser(uRes.data);
        setEditForm({
          title: aRes.data.title,
          description: aRes.data.description,
          dueDate: aRes.data.dueDate?.slice(0, 16),
          maxMarks: aRes.data.maxMarks,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [classroomId, assignmentId]);

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setSubmitting(true);
    setError('');
    const fd = new FormData();
    fd.append('file', selectedFile);
    try {
      await api.post(`/api/v2/classrooms/${classroomId}/assignments/${assignmentId}/submit`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccessMsg('Submitted successfully!');
      setSelectedFile(null);
      // Refresh
      const { data } = await api.get(`/api/v2/classrooms/${classroomId}/assignments/${assignmentId}`);
      setAssignment(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrade = async (submissionId, grade, feedback) => {
    try {
      await api.patch(
        `/api/v2/classrooms/${classroomId}/assignments/${assignmentId}/submissions/${submissionId}/grade`,
        { grade: parseFloat(grade), feedback }
      );
      const { data } = await api.get(`/api/v2/classrooms/${classroomId}/assignments/${assignmentId}`);
      setAssignment(data);
    } catch (err) {
      alert(err.response?.data?.error || 'Grading failed');
    }
  };

  const handleDownload = async (submissionId) => {
    try {
      const { data } = await api.get(`/api/v2/submissions/${submissionId}/download`);
      window.open(data.url, '_blank');
    } catch (e) {
      alert('Failed to get download URL');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/api/v2/classrooms/${classroomId}/assignments/${assignmentId}`, editForm);
      const { data } = await api.get(`/api/v2/classrooms/${classroomId}/assignments/${assignmentId}`);
      setAssignment(data);
      setEditMode(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Update failed');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full" />
    </div>
  );
  if (!assignment) return <div className="text-slate-400 text-center py-16">Assignment not found.</div>;

  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const mySubmission = !isTeacherOrAdmin ? assignment.submissions?.[0] : null;
  const dueDate = new Date(assignment.dueDate);
  const isOverdue = new Date() > dueDate;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white text-sm mb-2 flex items-center gap-1">
            ← Back
          </button>
          {editMode ? (
            <form onSubmit={handleEdit} className="space-y-3">
              <input className="text-2xl font-bold bg-transparent border-b border-amber-500 text-white outline-none w-full"
                value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
              <div className="flex gap-3">
                <input type="datetime-local" className="bg-[#0F1729] border border-[#1e3a5f] text-white rounded px-2 py-1 text-sm"
                  value={editForm.dueDate} onChange={e => setEditForm(p => ({ ...p, dueDate: e.target.value }))} />
                <input type="number" placeholder="Max marks" className="bg-[#0F1729] border border-[#1e3a5f] text-white rounded px-2 py-1 text-sm w-24"
                  value={editForm.maxMarks} onChange={e => setEditForm(p => ({ ...p, maxMarks: e.target.value }))} />
              </div>
              <textarea className="w-full bg-[#0F1729] border border-[#1e3a5f] text-white rounded-lg px-3 py-2 text-sm resize-none"
                rows={3} value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
              <div className="flex gap-2">
                <button type="submit" className="bg-amber-500 text-navy-900 font-semibold px-4 py-1.5 rounded-lg text-sm">Save</button>
                <button type="button" onClick={() => setEditMode(false)} className="text-slate-400 hover:text-white text-sm px-4 py-1.5">Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white">{assignment.title}</h1>
              <p className="text-slate-400 text-sm mt-1">{assignment.description}</p>
            </>
          )}
        </div>
        <div className="text-right">
          <p className={`text-sm font-medium ${isOverdue ? 'text-red-400' : 'text-amber-400'}`}>
            Due: {dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-slate-500 text-xs mt-0.5">Max marks: {assignment.maxMarks}</p>
          {isTeacherOrAdmin && !editMode && (
            <button onClick={() => setEditMode(true)} className="mt-2 text-xs text-amber-400 hover:text-amber-300">Edit</button>
          )}
        </div>
      </div>

      {/* Student submission area */}
      {!isTeacherOrAdmin && (
        <div className="bg-[#162133] border border-[#1e3a5f] rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Your Submission</h2>
          {mySubmission ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${mySubmission.isLate ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                  {mySubmission.isLate ? 'Late' : 'Submitted'}
                </span>
                <span className="text-slate-400 text-sm">{new Date(mySubmission.submittedAt).toLocaleString()}</span>
              </div>
              {mySubmission.grade !== null && mySubmission.grade !== undefined ? (
                <div className="bg-[#0F1729] rounded-xl p-4">
                  <p className="text-white font-semibold">Grade: <span className="text-amber-400">{mySubmission.grade}/{assignment.maxMarks}</span></p>
                  {mySubmission.feedback && <p className="text-slate-400 text-sm mt-2">Feedback: {mySubmission.feedback}</p>}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">Not yet graded.</p>
              )}
              <button onClick={() => setSelectedFile(null)} className="text-amber-400 text-sm hover:underline">Resubmit</button>
            </div>
          ) : null}

          {(!mySubmission || true) && (
            <form onSubmit={handleFileSubmit} className="mt-4 space-y-4">
              {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</p>}
              {successMsg && <p className="text-green-400 text-sm bg-green-500/10 p-3 rounded-lg">{successMsg}</p>}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? 'border-amber-500 bg-amber-500/5' : 'border-[#1e3a5f] hover:border-amber-500/50'}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); setSelectedFile(e.dataTransfer.files[0]); }}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file"
                  accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={e => setSelectedFile(e.target.files[0])}
                />
                {selectedFile ? (
                  <p className="text-amber-400 font-medium">{selectedFile.name}</p>
                ) : (
                  <p className="text-slate-400">Drop file here or click to browse<br /><span className="text-xs">PDF, DOCX, PPTX, PNG, JPG</span></p>
                )}
              </div>
              {selectedFile && (
                <button type="submit" disabled={submitting} className="w-full bg-amber-500 hover:bg-amber-400 text-navy-900 font-semibold py-2.5 rounded-lg disabled:opacity-50">
                  {submitting ? 'Uploading…' : 'Submit Assignment'}
                </button>
              )}
            </form>
          )}
        </div>
      )}

      {/* Teacher grading table */}
      {isTeacherOrAdmin && (
        <div className="space-y-6">
          <div className="bg-[#162133] border border-[#1e3a5f] rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">
              Submissions ({assignment.submissions?.length ?? 0})
            </h2>
            {!assignment.submissions?.length ? (
              <p className="text-slate-500 text-sm">No submissions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="text-left py-2 pr-4">Student</th>
                      <th className="text-left py-2 pr-4">Submitted</th>
                      <th className="text-left py-2 pr-4">Status</th>
                      <th className="text-left py-2 pr-4">Grade</th>
                      <th className="text-left py-2 pr-4">Feedback</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {assignment.submissions.map(sub => (
                      <tr key={sub.id} className="text-white">
                        <td className="py-3 pr-4">
                          <div>{sub.user?.name}</div>
                          <div className="text-slate-500 text-xs">{sub.user?.userId}</div>
                        </td>
                        <td className="py-3 pr-4 text-slate-400 text-xs">{new Date(sub.submittedAt).toLocaleString()}</td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${sub.isLate ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                            {sub.isLate ? 'Late' : 'On time'}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <input type="number" className="w-20 bg-[#0F1729] border border-[#1e3a5f] text-white rounded px-2 py-1 text-sm"
                            defaultValue={sub.grade ?? ''} placeholder={`/${assignment.maxMarks}`}
                            onChange={e => setGrades(p => ({ ...p, [sub.id]: { ...p[sub.id], grade: e.target.value } }))}
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <input className="w-40 bg-[#0F1729] border border-[#1e3a5f] text-white rounded px-2 py-1 text-sm"
                            defaultValue={sub.feedback ?? ''} placeholder="Feedback"
                            onChange={e => setGrades(p => ({ ...p, [sub.id]: { ...p[sub.id], feedback: e.target.value } }))}
                          />
                        </td>
                        <td className="py-3 flex gap-2">
                          <button
                            onClick={() => handleGrade(sub.id, grades[sub.id]?.grade ?? sub.grade, grades[sub.id]?.feedback ?? sub.feedback)}
                            className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 px-3 py-1 rounded-lg text-xs font-medium"
                          >Save</button>
                          <button onClick={() => handleDownload(sub.id)} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-lg text-xs">
                            ↓
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
