import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { deleteAdmin, fetchAdmins, upsertAdmin } from '../services/adminApi';
import { ManagedAdmin } from '../types';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<ManagedAdmin[]>([]);
  const [uid, setUid] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'super_admin' | 'admin'>('admin');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadAdmins() {
    const result = await fetchAdmins();
    setAdmins(result);
  }

  useEffect(() => {
    void loadAdmins();
  }, []);

  async function handleAddAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      await upsertAdmin({
        uid,
        email,
        role,
        displayName,
        actorUid: user.uid
      });
      setUid('');
      setEmail('');
      setDisplayName('');
      setRole('admin');
      await loadAdmins();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin User Management</h1>
          <p className="text-sm text-slate-500">
            Only super admins can grant or revoke admin privileges.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin')}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Back to Dashboard
        </button>
      </div>

      <form onSubmit={handleAddAdmin} className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Add / Update Admin</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <input
            required
            type="text"
            placeholder="Firebase Auth UID"
            value={uid}
            onChange={(event) => setUid(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-900"
          />
          <input
            required
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-900"
          />
          <input
            type="text"
            placeholder="Display name (optional)"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-900"
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as 'super_admin' | 'admin')}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-900"
          >
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : 'Save Admin'}
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Current Admins</h2>
        <div className="space-y-3">
          {admins.map((admin) => (
            <article key={admin.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-800">{admin.displayName || admin.email}</p>
                <p className="text-sm text-slate-500">{admin.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900">
                  {admin.role}
                </span>
                <button
                  onClick={() => void deleteAdmin(admin.id).then(loadAdmins)}
                  className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
          {admins.length === 0 && <p className="text-sm text-slate-500">No admins configured yet.</p>}
        </div>
      </div>
    </div>
  );
}
