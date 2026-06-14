import { useNavigate } from 'react-router-dom';

/**
 * UnauthorizedPage — 403 error page with back navigation.
 */
export default function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0F1729] flex items-center justify-center">
      <div className="text-center">
        <div className="text-7xl mb-6">🔒</div>
        <h1 className="text-3xl font-bold text-white mb-3">Access Denied</h1>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          You don't have permission to view this page. Contact your administrator if you believe this is a mistake.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-navy-900 font-semibold rounded-lg transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
