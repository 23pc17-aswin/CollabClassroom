import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import useAppStore from '../../store/useAppStore';

export default function AppShell() {
    const { isSidebarOpen } = useAppStore();

    return (
        <div className="flex h-screen bg-navy-900 overflow-hidden">
            {/* Fixed Sidebar */}
            <Sidebar />

            {/* Main Scrollable Content */}
            <main
                className="flex-1 overflow-y-auto transition-all duration-300"
                style={{ marginLeft: !isSidebarOpen ? '72px' : 'var(--sidebar-width)' }}
            >
                <div className="min-h-full p-6 md:p-8 animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}