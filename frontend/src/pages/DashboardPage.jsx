/**
 * DashboardPage — role-aware home after Keycloak login.
 * Shows the user's classrooms (taught + enrolled).
 * @module pages/DashboardPage
 */

import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import useAppStore from '../store/useAppStore';
import ClassroomCard from '../components/classroom/ClassroomCard';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

export default function DashboardPage() {
    const auth = useAuth();
    const api = useApi();
    const navigate = useNavigate();
    const { setUserProfile } = useAppStore();

    // 1. Fetch the true database profile FIRST
    const { data: dbUser, isLoading: userLoading } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const res = await api.get('/api/v2/users/me');
            return res.data;
        },
    });

    const role = dbUser?.role || 'STUDENT';
    const profile = auth.user?.profile;
    const name = dbUser?.name || profile?.name || profile?.preferred_username || 'User';

    // 2. Fetch classrooms (V2 returns a direct array)
    const { data: classesData, isLoading: classLoading, error } = useQuery({
        queryKey: ['my-classrooms'],
        queryFn: async () => {
            const res = await api.get('/api/v2/classrooms');
            return res.data;
        },
    });

    // Sync user profile to Zustand
    useEffect(() => {
        if (dbUser || profile) {
            setUserProfile({ name, role, email: dbUser?.email || profile?.email });
        }
    }, [dbUser, profile, name, role]);

    const isLoading = userLoading || classLoading;
    
    // Safely extract array
    const classrooms = Array.isArray(classesData) ? classesData : (classesData?.classrooms || []);
    
    // Split based on role
    const taught = (role === 'TEACHER' || role === 'ADMIN') ? classrooms : [];
    const enrolledClassrooms = role === 'STUDENT' ? classrooms : [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Welcome header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-chalk-100">
                        Welcome back, {name.split(' ')[0]} 👋
                    </h1>
                    <Badge role={role} />
                </div>
                <p className="text-chalk-400">
                    {role === 'TEACHER'
                        ? 'Manage your classrooms, assignments, and students below.'
                        : role === 'ADMIN'
                        ? 'System overview — manage users and classrooms.'
                        : 'Your enrolled classrooms and upcoming assignments.'}
                </p>
            </div>

            {error && (
                <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 text-red-300 mb-6">
                    Failed to load classrooms. Please refresh the page.
                </div>
            )}

            {/* Teacher's classrooms */}
            {taught.length > 0 && (
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-chalk-100 font-semibold text-lg">{role === 'ADMIN' ? 'All Classrooms' : 'My Classrooms'}</h2>
                        <span className="text-chalk-400 text-sm">{taught.length} classroom{taught.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {taught.map((c) => (
                            <ClassroomCard key={c.id} classroom={c} isTeacher />
                        ))}
                    </div>
                </section>
            )}

            {/* Enrolled classrooms */}
            {enrolledClassrooms.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-chalk-100 font-semibold text-lg">Enrolled Classrooms</h2>
                        <span className="text-chalk-400 text-sm">{enrolledClassrooms.length} enrolled</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {enrolledClassrooms.map((c) => (
                            <ClassroomCard key={c.id} classroom={c} />
                        ))}
                    </div>
                </section>
            )}

            {taught.length === 0 && enrolledClassrooms.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-amber-400/10 rounded-2xl flex items-center justify-center mb-6 border border-amber-400/20">
                        <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <h3 className="text-chalk-100 font-semibold text-lg mb-2">No classrooms yet</h3>
                    <p className="text-chalk-400 text-sm max-w-sm">
                        {role === 'TEACHER' || role === 'ADMIN'
                            ? 'Create your first classroom to get started.'
                            : 'Ask your teacher for a classroom join code to enroll.'}
                    </p>
                </div>
            )}
        </div>
    );
}