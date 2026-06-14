/**
 * Navbar component — top bar with user info and role badge.
 * @module components/layout/Navbar
 */

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../hooks/useApi';
import Badge from '../ui/Badge';
import useAppStore from '../../store/useAppStore';

export default function Navbar() {
    const auth = useAuth();
    const api = useApi();
    const { toggleSidebar } = useAppStore();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Ask the backend for your true PostgreSQL profile
    const { data: dbUser } = useQuery({
        queryKey: ['me'],
        queryFn: () => api.get('/api/v2/users/me').then(res => res.data),
    });

    // Use the database role (Defaults to STUDENT only while loading)
    const role = dbUser?.role || 'STUDENT';
    
    // Fallback to Keycloak profile if DB name isn't loaded yet
    const profile = auth.user?.profile;
    const name = dbUser?.name || profile?.name || profile?.preferred_username || 'User';
    const initials = name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

    // Close dropdown if user clicks outside of it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="h-16 bg-navy-800 border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-30">
            {/* Hamburger + Brand */}
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="text-chalk-400 hover:text-chalk-100 transition-colors lg:hidden"
                    aria-label="Toggle sidebar"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <span className="font-semibold text-chalk-100 hidden sm:block">Virtual Classroom</span>
            </div>

            {/* User info & Dropdown */}
            <div className="flex items-center gap-3">
                <Badge role={role} />
                
                {/* Profile Dropdown Container */}
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
                    >
                        <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center overflow-hidden">
                            {dbUser?.avatarUrl ? (
                                <img src={dbUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-amber-400 text-xs font-bold">{initials}</span>
                            )}
                        </div>
                        <span className="text-chalk-200 text-sm hidden sm:block font-medium">{name}</span>
                        <svg className={`w-4 h-4 text-chalk-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-3 w-56 bg-navy-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                            {/* Header / Info Area */}
                            <div className="px-4 py-3 border-b border-white/5 bg-black/20">
                                <p className="text-sm font-bold text-chalk-100 truncate">{name}</p>
                                <p className="text-xs text-chalk-400 truncate mt-0.5">{dbUser?.userId || profile?.email}</p>
                            </div>
                            
                            {/* Links Area */}
                            <div className="py-1">
                                <Link 
                                    to="/profile" 
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-chalk-200 hover:bg-navy-700 hover:text-white transition-colors"
                                >
                                    <svg className="w-4 h-4 text-chalk-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    My Profile
                                </Link>
                            </div>

                            {/* Logout Area */}
                            <div className="border-t border-white/5 py-1">
                                <button 
                                    onClick={() => auth.signoutRedirect()} 
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}