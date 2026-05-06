import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/Home';
import EventsPage from './pages/Events';
import MediaPage from './pages/Media';
import ExecutivesPage from './pages/Executives';
import AnnouncementsPage from './pages/Announcements';
import AboutPage from './pages/About';
import ContactPage from './pages/Contact';
import JoinPage from './pages/Join';
import PostsPage from './pages/Posts';
import AdminDashboardPage from './features/admin/pages/AdminDashboardPage';
import AdminLoginPage from './features/admin/pages/AdminLoginPage';
import AdminUsersPage from './features/admin/pages/AdminUsersPage';
import { ProtectedRoute } from './features/admin/components/ProtectedRoute';
import NotAuthorizedPage from './pages/NotAuthorized';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="media" element={<MediaPage />} />
            <Route path="executives" element={<ExecutivesPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="join" element={<JoinPage />} />
            <Route path="posts" element={<PostsPage />} />
            <Route path="not-authorized" element={<NotAuthorizedPage />} />

            <Route path="admin/login" element={<AdminLoginPage />} />
            <Route path="admin" element={<ProtectedRoute />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="admins" element={<ProtectedRoute requireRole="super_admin" />}>
                <Route index element={<AdminUsersPage />} />
              </Route>
            </Route>
            <Route path="admin/*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
