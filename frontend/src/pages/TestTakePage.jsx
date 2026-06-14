import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

/**
 * TestTakePage — timed, locked full-screen MCQ environment.
 * Hides navbar/sidebar by rendering outside AppShell.
 */
export default function TestTakePage() {
  const { classroomId, testId } = useParams();
  const api = useApi();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedAnswer }
  const [timeLeft, setTimeLeft] = useState(null); // seconds
  const [startTime] = useState(Date.now());
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/api/v2/classrooms/${classroomId}/tests/${testId}/take`);
        setTest(data);
        const endsAt = new Date(data.endsAt);
        const remaining = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
        setTimeLeft(remaining);
      } catch (e) {
        setError(e.response?.data?.error || 'Cannot load test');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [classroomId, testId]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, submitted]);

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const answerArr = Object.entries(answers).map(([questionId, selectedAnswer]) => ({ questionId, selectedAnswer }));
    try {
      const { data } = await api.post(`/api/v2/classrooms/${classroomId}/tests/${testId}/submit`, {
        answers: answerArr, timeTaken,
      });
      setResult(data);
      setSubmitted(true);
    } catch (e) {
      alert(e.response?.data?.error || 'Submission failed');
      setSubmitting(false);
    }
  }, [answers, submitting, submitted, startTime, classroomId, testId]);

  if (loading) return <div className="min-h-screen bg-[#0F1729] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full" /></div>;
  if (error) return <div className="min-h-screen bg-[#0F1729] flex items-center justify-center"><div className="text-red-400 text-center"><p className="text-xl font-bold mb-2">Cannot take this test</p><p className="text-slate-400">{error}</p><button onClick={() => navigate(-1)} className="mt-4 text-amber-400">Go back</button></div></div>;

  // Results screen
  if (submitted && result) {
    const pct = parseFloat(result.percentage);
    const color = pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400';
    return (
      <div className="min-h-screen bg-[#0F1729] flex items-center justify-center">
        <div className="bg-[#162133] border border-[#1e3a5f] rounded-2xl p-10 max-w-lg w-full text-center">
          <div className={`text-6xl font-black mb-4 ${color}`}>{pct}%</div>
          <h2 className="text-white text-2xl font-bold mb-2">Test Submitted!</h2>
          <p className="text-slate-400 mb-6">Score: {result.score} / {result.total}</p>
          <div className="space-y-2 text-left mb-6">
            {result.attempt?.answers?.map((a, i) => (
              <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${a.correct ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <span className={a.correct ? 'text-green-400' : 'text-red-400'}>{a.correct ? '✓' : '✗'}</span>
                <span className="text-xs text-slate-300 flex-1 truncate">Q{i + 1}: {a.selectedAnswer}</span>
                {!a.correct && <span className="text-xs text-slate-500">Ans: {a.correctAnswer}</span>}
              </div>
            ))}
          </div>
          <button onClick={() => navigate(`/classrooms/${classroomId}`)} className="bg-amber-500 hover:bg-amber-400 text-navy-900 font-semibold px-6 py-2 rounded-lg">
            Back to Classroom
          </button>
        </div>
      </div>
    );
  }

  const questions = test?.questions || [];
  const current = questions[currentIdx];
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <div className="min-h-screen bg-[#0F1729] flex flex-col">
      {/* Header */}
      <div className="bg-[#162133] border-b border-[#1e3a5f] px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-white font-bold text-lg truncate">{test?.title}</h1>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">{answeredCount}/{questions.length} answered</span>
          <div className={`font-mono text-lg font-bold ${timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
            {mm}:{ss}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Question Navigator */}
        <aside className="w-48 bg-[#162133] border-r border-[#1e3a5f] p-4 overflow-y-auto">
          <p className="text-slate-400 text-xs mb-3 font-medium uppercase tracking-wide">Questions</p>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(i)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                  i === currentIdx ? 'bg-amber-500 text-navy-900' :
                  answers[q.id] ? 'bg-amber-500/20 text-amber-400' :
                  'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </aside>

        {/* Main Panel */}
        <main className="flex-1 overflow-y-auto p-8">
          {current && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <p className="text-slate-400 text-sm mb-2">Question {currentIdx + 1} of {questions.length} · {current.marks} mark{current.marks !== 1 ? 's' : ''}</p>
                <p className="text-white text-lg font-medium leading-relaxed">{current.questionText}</p>
              </div>
              <div className="space-y-3">
                {(current.options || []).map((opt, i) => (
                  <label
                    key={i}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      answers[current.id] === opt
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-[#1e3a5f] bg-[#162133] hover:border-amber-500/50'
                    }`}
                  >
                    <input type="radio" name={current.id} value={opt}
                      checked={answers[current.id] === opt}
                      onChange={() => setAnswers(p => ({ ...p, [current.id]: opt }))}
                      className="accent-amber-500"
                    />
                    <span className="text-white">{opt}</span>
                  </label>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <button onClick={() => setCurrentIdx(p => Math.max(0, p - 1))} disabled={currentIdx === 0}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-40 hover:bg-slate-700">
                  ← Previous
                </button>
                {currentIdx < questions.length - 1 ? (
                  <button onClick={() => setCurrentIdx(p => p + 1)} className="px-4 py-2 bg-amber-500 text-navy-900 font-semibold rounded-lg hover:bg-amber-400">
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={`px-6 py-2 font-semibold rounded-lg ${allAnswered || timeLeft <= 0 ? 'bg-amber-500 hover:bg-amber-400 text-navy-900' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
                  >
                    {submitting ? 'Submitting…' : allAnswered ? '✓ Submit Test' : `Submit (${questions.length - answeredCount} unanswered)`}
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
