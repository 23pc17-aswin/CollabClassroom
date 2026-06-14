/**
 * LandingPage — the public entry point.
 * Shows a "Login with College ID" button that redirects to Keycloak.
 * No username/password fields — authentication is entirely delegated to Keycloak.
 * @module pages/LandingPage
 */

import { useAuth } from 'react-oidc-context';

export default function LandingPage() {
    const auth = useAuth();

    return (
        <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
            {/* Background subtle pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                <div className="bg-navy-800 rounded-2xl p-12 shadow-card border border-white/10">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <div className="w-20 h-20 bg-amber-400/10 rounded-2xl flex items-center justify-center border border-amber-400/20">
                            {/* Graduation cap SVG */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-10 h-10 text-amber-400"
                            >
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                <path d="M6 12v5c3 3 9 3 12 0v-5" />
                            </svg>
                        </div>
                    </div>

                    {/* Headings */}
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-bold text-chalk-100 mb-3">
                            Virtual Classroom
                        </h1>
                        <p className="text-chalk-400 text-base">
                            Sign in with your college credentials to continue
                        </p>
                    </div>

                    {/* Login Button */}
                    <button
                        onClick={() => auth.signinRedirect()}
                        disabled={auth.isLoading}
                        className="w-full bg-amber-400 hover:bg-amber-500 text-navy-900 font-bold py-3.5 px-8 rounded-xl text-lg transition-all hover:shadow-glow disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {auth.isLoading ? (
                            <span className="animate-spin rounded-full h-5 w-5 border-2 border-navy-900 border-t-transparent" />
                        ) : (
                            <>
                                {/* College ID icon */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="w-5 h-5"
                                >
                                    <rect x="2" y="5" width="20" height="14" rx="2" />
                                    <circle cx="8" cy="12" r="2" />
                                    <path d="M11 12h6M11 15h4" />
                                </svg>
                                Login with College ID
                            </>
                        )}
                    </button>

                    {/* Footer note */}
                    <p className="text-center text-chalk-400 text-sm mt-6">
                        Contact your administrator if you don't have an account.
                    </p>
                </div>

                {/* Brand footer */}
                <p className="text-center text-chalk-400/50 text-xs mt-6">
                    Virtual Classroom — Secure Single Sign-On via Keycloak
                </p>
            </div>
        </div>
    );
}
