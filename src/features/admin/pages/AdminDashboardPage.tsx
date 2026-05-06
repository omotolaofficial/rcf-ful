import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { ADMIN_COLLECTIONS } from '../collections';
import {
  removeCollectionItem,
  saveCollectionItem,
  subscribeCollectionItems,
  uploadAdminFile
} from '../services/adminApi';

type GenericItem = Record<string, unknown> & { id?: string };

const DEFAULT_VALUES: Record<string, Record<string, string>> = {
  announcements: { priority: 'regular' },
  posts: { mediaType: 'image' },
  media: { type: 'audio' }
};

export default function AdminDashboardPage() {
  const { user, adminProfile, isSuperAdmin, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const collectionKey = searchParams.get('tab') || 'posts';
  const config = useMemo(
    () => ADMIN_COLLECTIONS.find((item) => item.key === collectionKey) ?? ADMIN_COLLECTIONS[0],
    [collectionKey]
  );

  const [items, setItems] = useState<GenericItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<GenericItem | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeCollectionItems(
      config.key,
      (result) => {
        setItems(result as GenericItem[]);
        setIsLoading(false);
      },
      () => {
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [config.key]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !editingItem) return;
    setIsSaving(true);
    try {
      const { id, ...payload } = editingItem;
      await saveCollectionItem({
        collectionName: config.key,
        id: typeof id === 'string' ? id : undefined,
        payload,
        actorUid: user.uid
      });
      setEditingItem(null);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleFileChange(fieldName: string, file: File | null) {
    if (!file) return;
    const url = await uploadAdminFile(config.key, file);
    setEditingItem((current) => ({ ...(current ?? {}), [fieldName]: url }));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
            <p className="text-sm text-slate-500">
              Signed in as {adminProfile?.email} ({adminProfile?.role})
            </p>
          </div>
          <div className="flex gap-2">
            {isSuperAdmin && (
              <Link
                to="/admin/admins"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Manage Admins
              </Link>
            )}
            <button
              onClick={() => void logout().then(() => navigate('/admin/login'))}
              className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm h-fit">
          {ADMIN_COLLECTIONS.map((item) => (
            <button
              key={item.key}
              onClick={() => setSearchParams({ tab: item.key })}
              className={`mb-2 w-full rounded-lg px-3 py-2 text-left text-sm ${
                config.key === item.key
                  ? 'bg-blue-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">{config.label}</h2>
              <p className="text-sm text-slate-500">{config.description}</p>
            </div>
            <button
              onClick={() =>
                setEditingItem({
                  ...(DEFAULT_VALUES[config.key] || {})
                })
              }
              className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Add New
            </button>
          </div>

          {editingItem && (
            <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                {config.fields.map((field) => (
                  <label key={field.name} className={`text-sm ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                    <span className="mb-1 block font-medium text-slate-700">{field.label}</span>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={String(editingItem[field.name] ?? '')}
                        required={field.required}
                        onChange={(event) =>
                          setEditingItem((prev) => ({ ...(prev ?? {}), [field.name]: event.target.value }))
                        }
                        className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-900"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={String(editingItem[field.name] ?? field.options?.[0]?.value ?? '')}
                        onChange={(event) =>
                          setEditingItem((prev) => ({ ...(prev ?? {}), [field.name]: event.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-900"
                      >
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'image' ? (
                      <>
                        <input
                          type="text"
                          value={String(editingItem[field.name] ?? '')}
                          onChange={(event) =>
                            setEditingItem((prev) => ({ ...(prev ?? {}), [field.name]: event.target.value }))
                          }
                          placeholder="https://..."
                          className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-900"
                        />
                        <input type="file" accept="image/*,video/*,audio/*" onChange={(event) => void handleFileChange(field.name, event.target.files?.[0] ?? null)} />
                      </>
                    ) : (
                      <input
                        type={field.type}
                        value={String(editingItem[field.name] ?? '')}
                        required={field.required}
                        onChange={(event) =>
                          setEditingItem((prev) => ({ ...(prev ?? {}), [field.name]: event.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-900"
                      />
                    )}
                  </label>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {isLoading ? (
            <p className="py-12 text-center text-slate-500">Loading {config.label.toLowerCase()}...</p>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-slate-500">No entries yet.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <article key={String(item.id)} className="rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-800">
                    {String(item.title || item.heading || item.sectionKey || item.id)}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {String(item.description || item.content || item.location || '')}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => void removeCollectionItem(config.key, String(item.id))}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                  {'createdAt' in item && (
                    <p className="mt-2 text-xs text-slate-400">
                      Created:{' '}
                      {typeof item.createdAt === 'object' &&
                      item.createdAt &&
                      'toDate' in (item.createdAt as Record<string, unknown>) &&
                      typeof (item.createdAt as { toDate: () => Date }).toDate === 'function'
                        ? (item.createdAt as { toDate: () => Date }).toDate().toLocaleString()
                        : String(item.createdAt)}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
