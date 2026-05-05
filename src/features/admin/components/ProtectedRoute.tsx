import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

interface ProtectedRouteProps {
  requireRole?: 'super_admin';
}

export function ProtectedRoute({ requireRole }: ProtectedRouteProps) {
  const { loading, user, isAdmin, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      navigate('/not-authorized', { replace: true });
    }
  }, [loading, user, isAdmin, navigate]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Authenticating...</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return null;
  }

  if (requireRole === 'super_admin' && !isSuperAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Super Admin Required</h1>
          <p className="text-sm text-slate-600 mb-6">
            You do not have sufficient permissions to access this specific area.
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
