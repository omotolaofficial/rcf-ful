import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function NotAuthorizedPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };
  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Not Authorized</h1>
        <p className="text-sm text-slate-600 mb-6">
          Your account does not have administrator privileges to access this area.
        </p>
        <div className="space-y-3">
          <Link
            to="/"
            className="inline-block w-full rounded-xl bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800"
          >
            Return to Homepage
          </Link>
          {user && (
            <button
              onClick={() => void handleSignOut()}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Sign out of Google
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
