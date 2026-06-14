/**
 * NotFoundPage — 404 and unauthorized page.
 * @module pages/NotFoundPage
 */

import { useNavigate } from 'react-router-dom';

export default function NotFoundPage({ message }) {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-navy-900 flex items-center justify-center">
            <div className="text-center px-4">
                <p className="text-7xl font-bold text-amber-400 mb-4">
                    {message ? '403' : '404'}
                </p>
                <h1 className="text-2xl font-bold text-chalk-100 mb-3">
                    {message ? 'Access Denied' : 'Page Not Found'}
                </h1>
                <p className="text-chalk-400 mb-8">
                    {message || "The page you're looking for doesn't exist."}
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-amber-400 hover:bg-amber-500 text-navy-900 font-semibold px-6 py-2.5 rounded-xl transition-colors"
                >
                    Go Home
                </button>
            </div>
        </div>
    );
}
