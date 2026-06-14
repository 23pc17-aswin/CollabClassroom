import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

/**
 * TestPage — test details + publish button (teacher) / take button (student)
 */
export default function TestPage() {
  const { classroomId, testId } = useParams();
  const api = useApi();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [results, setResults] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [tests, uRes] = await Promise.all([
          api.get(`/api/v2/classrooms/${classroomId}/tests`),
          api.get('/api/v2/users/me'),
        ]);
        const found = tests.data.find(t => t.id === testId);
        setTest(found);
        setUser(uRes.data);
        if (found) {
          const rRes = await api.get(`/api/v2/classrooms/${classroomId}/tests/${testId}/results`).catch(() => null);
          if (rRes) setResults(rRes.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [classroomId, testId]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await api.patch(`/api/v2/classrooms/${classroomId}/tests/${testId}/publish`);
      setTest(p => ({ ...p, isPublished: true }));
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full" /></div>;
  if (!test) return <div className="text-slate-400 text-center py-16">Test not found.</div>;

  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const scheduledAt = new Date(test.scheduledAt);
  const endsAt = new Date(scheduledAt.getTime() + test.duration * 60 * 1000);
  const now = new Date();
  const isLive = now >= scheduledAt && now <= endsAt;
  const hasEnded = now > endsAt;
  const hasAttempted = results && !results.message;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white text-sm flex items-center gap-1">← Back</button>

      <div className="bg-[#162133] border border-[#1e3a5f] rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">{test.title}</h1>
          {test.isPublished
            ? <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-medium">Published</span>
            : <span className="text-xs bg-slate-700 text-slate-400 px-2 py-1 rounded-full">Draft</span>}
        </div>
        {test.description && <p className="text-slate-400 text-sm mb-4">{test.description}</p>}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-[#0F1729] rounded-xl p-3">
            <p className="text-slate-500 text-xs mb-1">Scheduled</p>
            <p className="text-white font-medium">{scheduledAt.toLocaleString()}</p>
          </div>
          <div className="bg-[#0F1729] rounded-xl p-3">
            <p className="text-slate-500 text-xs mb-1">Ends At</p>
            <p className="text-white font-medium">{endsAt.toLocaleString()}</p>
          </div>
          <div className="bg-[#0F1729] rounded-xl p-3">
            <p className="text-slate-500 text-xs mb-1">Duration</p>
            <p className="text-white font-medium">{test.duration} minutes</p>
          </div>
          <div className="bg-[#0F1729] rounded-xl p-3">
            <p className="text-slate-500 text-xs mb-1">Total Marks</p>
            <p className="text-white font-medium">{test.totalMarks}</p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          {isTeacherOrAdmin && !test.isPublished && (
            <button onClick={handlePublish} disabled={publishing}
              className="bg-amber-500 hover:bg-amber-400 text-navy-900 font-semibold px-6 py-2 rounded-lg disabled:opacity-50">
              {publishing ? 'Publishing…' : '📢 Publish Test'}
            </button>
          )}
          {!isTeacherOrAdmin && test.isPublished && !hasAttempted && isLive && (
            <Link to={`/classrooms/${classroomId}/tests/${testId}/take`}
              className="bg-amber-500 hover:bg-amber-400 text-navy-900 font-semibold px-6 py-2 rounded-lg inline-block">
              🖊️ Take Test
            </Link>
          )}
          {!isTeacherOrAdmin && hasAttempted && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
              <p className="text-green-400 font-semibold">Test submitted</p>
              <p className="text-slate-400 text-sm">Score: {results.score} / {test.totalMarks} ({((results.score / test.totalMarks) * 100).toFixed(1)}%)</p>
            </div>
          )}
        </div>
      </div>

      {/* Results (teacher) */}
      {isTeacherOrAdmin && results?.stats && (
        <div className="bg-[#162133] border border-[#1e3a5f] rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Results</h2>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Enrolled', val: results.stats.total },
              { label: 'Attempted', val: results.stats.attempted },
              { label: 'Average', val: results.stats.average },
              { label: 'Highest', val: results.stats.highest },
            ].map(s => (
              <div key={s.label} className="bg-[#0F1729] rounded-xl p-3 text-center">
                <p className="text-amber-400 text-xl font-bold">{s.val}</p>
                <p className="text-slate-500 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
          <table className="w-full text-sm">
            <thead><tr className="text-slate-400 border-b border-slate-700"><th className="text-left py-2">Student</th><th className="text-left py-2">Score</th><th className="text-left py-2">Time</th></tr></thead>
            <tbody className="divide-y divide-slate-800">
              {results.attempts?.map(a => (
                <tr key={a.id} className="text-white">
                  <td className="py-2">{a.user?.name} <span className="text-slate-500 text-xs">({a.user?.userId})</span></td>
                  <td className="py-2 text-amber-400 font-medium">{a.score}/{test.totalMarks}</td>
                  <td className="py-2 text-slate-400">{a.timeTaken ? `${Math.floor(a.timeTaken / 60)}m ${a.timeTaken % 60}s` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
