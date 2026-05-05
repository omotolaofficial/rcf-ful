import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

export default function AdminLoginPage() {
  const { user, isAdmin, signInWithGoogle, loading } = useAuth();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      navigate('/not-authorized', { replace: true });
    }
  }, [loading, user, isAdmin, navigate]);

  if (!loading && user) {
    if (!isAdmin) {
      return null;
    }
    const redirectPath = (location.state as { from?: { pathname?: string } } | undefined)?.from
      ?.pathname;
    return <Navigate to={redirectPath || '/admin'} replace />;
  }

  async function handleGoogleSignIn() {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Google sign-in failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">Admin Login</h1>
        <p className="mt-2 text-sm text-slate-500">
          Sign in with your approved Google account to manage website content.
        </p>
        <div className="mt-6 space-y-4">
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <button
            type="button"
            onClick={() => void handleGoogleSignIn()}
            disabled={isSubmitting}
            className="w-full rounded-xl bg-blue-900 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
