import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
export interface MediaItem {
  id?: string;
  title?: string;
  imageUrl?: string;
  isUploading?: boolean;
  [key: string]: any; // fallback for multi-collection flexibility
}

import {
  collection,
  query,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

import {
  Calendar,
  Video,
  Users,
  MessageSquare,
  List,
  Clock,
  ShieldAlert,
  Image as ImageIcon
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';

/* -------------------- TABS -------------------- */
const TABS = [
  { id: 'schedules', label: 'Schedules', icon: Clock },
  { id: 'announcements', label: 'Announcements', icon: MessageSquare },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'media', label: 'Media', icon: Video },
  { id: 'posts', label: 'Posts', icon: ImageIcon },
  { id: 'executives', label: 'Executives', icon: Users },
  { id: 'visitors', label: 'Visitors', icon: List },
  { id: 'admins', label: 'Admins', icon: ShieldAlert }
];


/* -------------------- TYPES -------------------- */
type UploadState = {
  downloadURL: string | null;
  publicId: string | null;
  resourceType: string | null;
  error: string | null;
  fileName: string;
  isUploading: boolean;
  progress: number;
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('schedules');
  const [data, setData] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const [uploadState, setUploadState] = useState<Record<string, UploadState>>({});

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, activeTab));
      const snapshot = await getDocs(q);
      const fetchedData: MediaItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<MediaItem, "id">)
      }));
      setData(fetchedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UPLOAD KEY UTILS ---------------- */

  const getAllowedTypes = () => {
    if (activeTab === "media") {
      return ["audio", "video"]; // allow audio + video
    }
    return ["image"]; // all other tabs only allow images
  };

  /* ---------------- UPLOAD (CLOUDINARY) ---------------- */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = getAllowedTypes();
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const isAudio = file.type.startsWith("audio/");

    if (
      (allowedTypes.includes("image") && isImage) ||
      (allowedTypes.includes("video") && isVideo) ||
      (allowedTypes.includes("audio") && isAudio)
    ) {
      // ✅ proceed with upload
    } else {
      alert(`Only ${allowedTypes.join(" or ")} files are allowed in the ${activeTab} tab.`);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('File size exceeds the 20MB limit. Please choose a smaller file.');
      return;
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.error("ENV DEBUG:", { cloudName, uploadPreset });
      alert("Cloudinary config missing. Please check your .env variables.");
      return;
    }

    // Mark upload as starting
    setUploadState(prev => ({
      ...prev,
      [key]: {
        downloadURL: null,
        publicId: null,
        resourceType: null,
        error: null,
        fileName: file.name,
        isUploading: true,
        progress: 50 // fake progress for fetch
      }
    }));

    try {
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      const resourceType = isVideo ? 'video' : isAudio ? 'raw' : 'image';
      const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "rcf-images");

      // Clean async/await fetch
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      const res = await response.json();

      if (!response.ok) {
        alert("Upload Failed! Cloudinary said: " + (res?.error?.message || "Unknown Error"));
        throw new Error(res?.error?.message || "Upload failed");
      }

      console.log('Cloudinary response:', res);
      const url = res.secure_url;
      const mediaKey = activeTab === 'media' ? 'mediaUrl' : 'imageUrl';

      // 1. Update form state (THIS is what Firestore uses)
      setEditItem(prev => ({
        ...(prev || {}),
        [mediaKey]: url,
        cloudinaryPublicId: res.public_id,
        cloudinaryResourceType: res.resource_type
      }));

      // 2. Update UI state only
      setUploadState(prev => ({
        ...prev,
        [mediaKey]: {
          downloadURL: url,
          publicId: res.public_id,
          resourceType: res.resource_type,
          error: null,
          fileName: file.name,
          isUploading: false,
          progress: 100
        }
      }));
    } catch (err: any) {
      console.error('Upload error:', err);
      alert("Something went wrong during upload: " + err.message);
      setUploadState(prev => ({
        ...prev,
        [key]: {
          downloadURL: null,
          publicId: null,
          resourceType: null,
          error: err.message || "Failed to upload",
          fileName: file.name,
          isUploading: false,
          progress: 0
        }
      }));
    }
  };

  /* ---------------- SAVE ---------------- */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const uploading = Object.values(uploadState).some((s) => (s as UploadState)?.isUploading ?? false);
    if (uploading) {
      alert("Please wait for all active uploads to finish before saving.");
      return;
    }

    try {
      const mediaKey = activeTab === 'media' ? 'mediaUrl' : 'imageUrl';

      const payload = {
        ...editItem,
        [mediaKey]: editItem?.[mediaKey] || uploadState?.[mediaKey]?.downloadURL
      };

      // Safe purge of undefined values so Firestore doesn't throw errors
      Object.keys(payload).forEach(k => {
        if (payload[k] === undefined) delete payload[k];
      });

      console.log("🔥 SAVING PAYLOAD:", payload);
      console.log("🔥 MEDIA KEY:", mediaKey);
      console.log("🔥 EDIT ITEM:", editItem);

      if (activeTab === 'admins') {
        const email = payload.email.trim().toLowerCase();

        await setDoc(doc(db, activeTab, email), {
          ...payload,
          email,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
          createdAt: payload.id ? payload.createdAt : serverTimestamp(),
          createdBy: payload.id ? payload.createdBy : user.uid
        }, { merge: true });

      } else {
        const requiresMedia = ['events', 'announcements', 'posts', 'media', 'executives']
          .includes(activeTab);

        if (requiresMedia && !payload[mediaKey]) {
          alert("Media is required before saving.");
          return;
        }

        if (!editItem.id) {
          payload.createdAt = serverTimestamp();
          payload.createdBy = user.uid;
        }

        payload.updatedAt = serverTimestamp();

        if (editItem.id) {
          const docRef = doc(db, activeTab, editItem.id);
          const { id, ...rest } = payload;
          await updateDoc(docRef, rest);
        } else {
          await addDoc(collection(db, activeTab), payload);
        }
      }

      setIsEditing(false);
      setEditItem(null);
      setUploadState({});
      fetchData();

    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteDoc(doc(db, activeTab, id));
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error deleting item');
    }
  };

  /* ---------------- UI ACTIONS ---------------- */
  const startCreate = () => {
    setEditItem({});
    setUploadState({});
    setIsEditing(true);
  };

  const startEdit = (item: any) => {
    setEditItem({ ...item });
    setUploadState({});
    setIsEditing(true);
  };

  /* ---------------- RENDERING UTILS ---------------- */
  const renderUpload = (key: string) => {
    const state = uploadState[key] as UploadState | undefined;
    const isUploading = state?.isUploading ?? false;
    const progress = state?.progress ?? 0;
    const error = state?.error ?? null;
    const isDone = state?.downloadURL ?? null;

    return (
      <div style={{ marginBottom: 20, padding: 10, border: '1px dashed #cbd5e1', borderRadius: 8, background: '#f8fafc' }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#334155' }}>
          Upload Media (or paste URL)
        </label>

        <input
          type="text"
          value={editItem?.[key] || ''}
          onChange={e => setEditItem((prev: any) => ({ ...(prev || {}), [key]: e.target.value }))}
          placeholder="https://..."
          style={{ display: 'block', width: '100%', marginBottom: 10, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          disabled={isUploading}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="file"
            accept={
              activeTab === "media"
                ? "audio/*,video/*"
                : "image/*"
            }
            onChange={(e) => handleFileUpload(e, activeTab === 'media' ? 'mediaUrl' : 'imageUrl')}
            disabled={isUploading}
            style={{ fontSize: '14px' }}
          />
        </div>

        {isUploading && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '4px' }}>
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div style={{ width: '100%', background: '#e2e8f0', height: 6, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, background: '#3b82f6', height: '100%', transition: 'width 0.2s' }}></div>
            </div>
          </div>
        )}

        {error && (
          <p style={{ color: '#ef4444', marginTop: 10, fontSize: '14px', fontWeight: '500' }}>{error}</p>
        )}

        {isDone && (
          <p style={{ color: '#10b981', marginTop: 10, fontSize: '14px', fontWeight: '600' }}>✓ Upload Complete</p>
        )}

        {/* DEBUG LOG VISUALIZER */}
        <div style={{ marginTop: 15, padding: 10, background: '#1e293b', color: '#10b981', fontSize: '11px', fontFamily: 'monospace', borderRadius: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          <strong>Upload State Debugger:</strong><br />
          isUploading: {String(isUploading)}<br />
          progress: {progress}%<br />
          error: {String(error)}<br />
          downloadURL: {String(isDone)}<br />
          current editItem URL: {String(editItem?.[key])}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '24px', color: '#0f172a' }}>
        Admin Dashboard
      </h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsEditing(false);
                setEditItem(null);
                setUploadState({});
              }}
              style={{
                padding: '10px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: activeTab === tab.id ? '#1e3a8a' : '#f1f5f9',
                color: activeTab === tab.id ? 'white' : '#475569',
                border: activeTab === tab.id ? '1px solid #1e3a8a' : '1px solid #cbd5e1',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <button
        onClick={startCreate}
        style={{ padding: '10px 20px', marginBottom: '20px', cursor: 'pointer', background: '#f59e0b', color: '#1e3a8a', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <span style={{ fontSize: '18px' }}>+</span> Add New Record
      </button>

      {isEditing && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', color: '#1e293b' }}>
            {editItem?.id ? 'Edit Record' : 'Create New Record'}
          </h3>
          <form onSubmit={handleSave}>
            {activeTab === 'admins' ? (
              <>
                <input
                  placeholder="Email Address"
                  type="email"
                  value={editItem?.email || ''}
                  onChange={e => setEditItem((prev: any) => ({ ...(prev || {}), email: e.target.value }))}
                  style={{ display: 'block', width: '100%', marginBottom: 15, padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                />
                <select
                  value={editItem?.role || 'admin'}
                  onChange={e => setEditItem((prev: any) => ({ ...(prev || {}), role: e.target.value }))}
                  style={{ display: 'block', width: '100%', marginBottom: 15, padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </>
            ) : (
              <input
                placeholder="Title / Name"
                value={editItem?.title || editItem?.name || ''}
                onChange={e => {
                  const key = ['executives', 'visitors'].includes(activeTab) ? 'name' : 'title';
                  setEditItem((prev: any) => ({ ...(prev || {}), [key]: e.target.value }))
                }}
                style={{ display: 'block', width: '100%', marginBottom: 15, padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                required={activeTab !== 'schedules'}
              />
            )}

            {activeTab === 'announcements' && (
              <>
                <textarea
                  placeholder="Content details..."
                  value={editItem?.content || ''}
                  onChange={e => setEditItem((prev: any) => ({ ...(prev || {}), content: e.target.value }))}
                  rows={4}
                  style={{ display: 'block', width: '100%', marginBottom: 15, padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
                <input
                  type="date"
                  value={editItem?.date || ''}
                  onChange={e => setEditItem((prev: any) => ({ ...(prev || {}), date: e.target.value }))}
                  style={{ display: 'block', marginBottom: 15, padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                />
              </>
            )}

            {/* Unified Upload Area */}
            {['events', 'announcements', 'posts', 'media', 'executives'].includes(activeTab) && (
              renderUpload(activeTab === 'media' ? 'mediaUrl' : 'imageUrl')
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                type="submit"
                disabled={Object.values(uploadState).some((s) => (s as UploadState)?.isUploading ?? false)}
                style={{
                  padding: '12px 24px',
                background: Object.values(uploadState).some((s) => (s as UploadState)?.isUploading ?? false) ? '#94a3b8' : '#1e3a8a',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: Object.values(uploadState).some((s) => (s as UploadState)?.isUploading ?? false) ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                flex: 1
              }}
              >
                {Object.values(uploadState).some((s) => (s as UploadState)?.isUploading ?? false) ? 'Uploading...' : `Save ${activeTab}`}
              </button>
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditItem(null); setUploadState({}); }}
                style={{ padding: '12px 24px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <hr style={{ margin: '30px 0', borderColor: '#e2e8f0' }} />

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '18px', fontWeight: '500' }}>
          Loading records...
        </div>
      ) : data.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          No records found for {activeTab}.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data.map((item: MediaItem) => (
            <div key={item.id} style={{ display: 'flex', gap: '15px', alignItems: 'center', padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '600' }}>
                  {activeTab === 'admins' ? item.email : (item.title || item.name || 'Untitled Record')}
                </h4>
                {activeTab === 'admins' && (
                  <span style={{ display: 'inline-block', marginTop: '6px', padding: '4px 10px', background: '#e0e7ff', color: '#3730a3', borderRadius: '4px', fontSize: '12px', fontWeight: '700' }}>
                    {item.role.toUpperCase()}
                  </span>
                )}
              </div>

              <button
                onClick={() => startEdit(item)}
                style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                style={{ padding: '8px 16px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}