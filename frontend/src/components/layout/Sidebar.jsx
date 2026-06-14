/**
 * Sidebar navigation.
 * @module components/layout/Sidebar
 */

import { NavLink } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../hooks/useApi';
import useAppStore from '../../store/useAppStore';

const globalNavItems = [
    {
        label: 'Dashboard',
        to: '/',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
            </svg>
        ),
    },
    {
        label: 'Classrooms',
        to: '/classrooms',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        ),
    },
    // 🔥 NEW: Messages Button
    {
        label: 'Messages',
        to: '/messages',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
        ),
    }
];

const studentItems = [
    {
        label: 'My Grades',
        to: '/grades',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
    }
];

const adminItems = [
    {
        label: 'Admin Center',
        to: '/admin',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
];

export default function Sidebar() {
    const api = useApi();
    const { isSidebarOpen } = useAppStore();

    // Query DB for true role (syncs with Navbar)
    const { data: dbUser } = useQuery({
        queryKey: ['me'],
        queryFn: () => api.get('/api/v2/users/me').then(res => res.data),
    });

    const role = dbUser?.role || 'STUDENT';
    const isAdmin = role === 'ADMIN';
    const isStudent = role === 'STUDENT';

    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
            isActive
                ? 'border-l-2 border-amber-400 bg-navy-700 text-chalk-100 pl-[14px]'
                : 'text-chalk-400 hover:text-chalk-200 hover:bg-navy-700'
        }`;

    return (
        <>
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" />
            )}

            <aside
                className={`fixed left-0 top-0 h-full w-60 bg-navy-800 border-r border-white/5 z-30
                    flex flex-col transition-transform duration-200
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0 lg:static lg:h-auto`}
            >
                <div className="h-16 flex items-center gap-3 px-6 border-b border-white/5">
                    <div className="w-8 h-8 bg-amber-400/10 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        </svg>
                    </div>
                    <span className="text-chalk-100 font-semibold text-sm">Virtual Classroom</span>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {/* Everyone sees these */}
                    {globalNavItems.map((item) => (
                        <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClass}>
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}

                    {/* Students see Grades */}
                    {isStudent && studentItems.map((item) => (
                        <NavLink key={item.to} to={item.to} className={linkClass}>
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}

                    {/* Admins see Admin Center */}
                    {isAdmin && (
                        <>
                            <div className="pt-4 pb-2">
                                <span className="text-chalk-400/50 text-xs uppercase tracking-wider px-4">Administration</span>
                            </div>
                            {adminItems.map((item) => (
                                <NavLink key={item.to} to={item.to} className={linkClass}>
                                    {item.icon}
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </>
                    )}
                </nav>
            </aside>
        </>
    );
}