import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Spinner from './components/ui/Spinner';

// Pages
import LandingPage         from './pages/LandingPage';
import DashboardPage       from './pages/DashboardPage';
import ClassroomsPage      from './pages/ClassroomsPage';
import ClassroomPage       from './pages/ClassroomPage';
import AssignmentPage      from './pages/AssignmentPage';
import TestPage            from './pages/TestPage';
import TestTakePage        from './pages/TestTakePage';
import MaterialsPage       from './pages/MaterialsPage';
import ChatPage            from './pages/ChatPage';
import GradesPage          from './pages/GradesPage';
import WorkspacePage       from './pages/WorkspacePage';
import AdminPage           from './pages/AdminPage';
import NotificationsPage   from './pages/NotificationsPage';
import NotFoundPage        from './pages/NotFoundPage';
import UnauthorizedPage    from './pages/UnauthorizedPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';

// ── App Shell Layout ─────────────────────────────────────────────
function AppShell() {
  return (
    <div className="min-h-screen bg-[#0F1729] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        <Navbar />
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ── OIDC Callback Handler ────────────────────────────────────────
function OidcCallback() {
  const auth = useAuth();
  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1729] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  return <Navigate to="/" replace />;
}

// ── App ──────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<LandingPage />} />
        <Route path="/callback" element={<OidcCallback />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        {/* Protected — inside AppShell */}
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route index                                                           element={<DashboardPage />} />
          <Route path="/dashboard"                                               element={<DashboardPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/classrooms"                                              element={<ClassroomsPage />} />
          <Route path="/classrooms/:classroomId"                                 element={<ClassroomPage />} />
          <Route path="/classrooms/:classroomId/assignments/:assignmentId"       element={<AssignmentPage />} />
          <Route path="/classrooms/:classroomId/tests/:testId"                   element={<TestPage />} />
          <Route path="/classrooms/:classroomId/tests/:testId/take"
            element={<ProtectedRoute allowedRoles={['STUDENT']}><TestTakePage /></ProtectedRoute>} />
          <Route path="/classrooms/:classroomId/materials"                       element={<MaterialsPage />} />
          <Route path="/classrooms/:classroomId/chat"                            element={<ChatPage />} />
          <Route path="/classrooms/:classroomId/workspace"                       element={<WorkspacePage />} />
          <Route path="/grades"
            element={<ProtectedRoute allowedRoles={['STUDENT']}><GradesPage /></ProtectedRoute>} />
          <Route path="/notifications"                                            element={<NotificationsPage />} />
          <Route path="/admin"
            element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminPage /></ProtectedRoute>} />

          {/* Old routes for backward compat */}
          <Route path="/chat"                 element={<ChatPage />} />
          <Route path="/workspace/:roomId"    element={<WorkspacePage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
