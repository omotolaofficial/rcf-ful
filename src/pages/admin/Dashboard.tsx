import React, { useState, useEffect } from 'react';
import { db, storage } from '../../lib/firebase';
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
  ref,
  uploadBytesResumable,
  getDownloadURL
} from 'firebase/storage';

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
import { format } from 'date-fns';

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
  error: string | null;
  fileName: string;
  isUploading: boolean;
  progress: number;
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('schedules');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  // ✅ SINGLE SOURCE OF TRUTH FOR UPLOAD
  const [uploadState, setUploadState] = useState<Record<string, UploadState>>({});

  /* -------------------- FETCH DATA -------------------- */
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, activeTab));
      const snapshot = await getDocs(q);
      setData(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- FILE UPLOAD -------------------- */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileRef = ref(
      storage,
      `uploads/${activeTab}/${Date.now()}_${file.name}`
    );

    const uploadTask = uploadBytesResumable(fileRef, file);

    setUploadState(prev => ({
      ...prev,
      [key]: {
        downloadURL: null,
        error: null,
        fileName: file.name,
        isUploading: true,
        progress: 0
      }
    }));

    uploadTask.on(
      'state_changed',
      snapshot => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );

        setUploadState(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            downloadURL: prev[key]?.downloadURL ?? null,
            progress,
            isUploading: true
          }
        }));
      },
      error => {
        console.error(error);

        setEditItem(prev => ({
          ...prev,
          [key]: undefined
        }));

        setUploadState(prev => ({
          ...prev,
          [key]: {
            downloadURL: null,
            error: error.message,
            fileName: file.name,
            isUploading: false,
            progress: 0
          }
        }));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          setEditItem(prev => ({
            ...prev,
            [key]: downloadURL
          }));

          setUploadState(prev => ({
            ...prev,
            [key]: {
              downloadURL,
              error: null,
              fileName: file.name,
              isUploading: false,
              progress: 100
            }
          }));
        } catch (error: any) {
          console.error(error);
          setUploadState(prev => ({
            ...prev,
            [key]: {
              downloadURL: null,
              error: error?.message ?? 'Upload finished, but the file URL could not be resolved.',
              fileName: file.name,
              isUploading: false,
              progress: 100
            }
          }));
        }
      }
    );
  };

  /* -------------------- SAVE -------------------- */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // 🚨 ONLY CHECK REAL UPLOADING FILES
    const uploading = Object.values(uploadState).some(state => (state as UploadState).isUploading);

    if (uploading) {
      alert('Please wait for upload to finish');
      return;
    }

    try {
      const payload = { ...editItem };

      if (!editItem.id) {
        payload.createdAt = serverTimestamp();
        payload.createdBy = user.uid;
      }

      payload.updatedAt = serverTimestamp();

      Object.keys(payload).forEach(k => {
        if (payload[k] === undefined) delete payload[k];
      });

      if (activeTab === 'admins' && payload.email) {
        const adminEmail = String(payload.email).trim().toLowerCase();
        const adminPayload = {
          ...payload,
          email: adminEmail
        };

        delete adminPayload.id;

        await setDoc(doc(db, activeTab, adminEmail), adminPayload, { merge: true });
      } else if (editItem.id) {
        const { id, ...rest } = payload;
        await updateDoc(doc(db, activeTab, id), rest);
      } else {
        await addDoc(collection(db, activeTab), payload);
      }

      setIsEditing(false);
      setEditItem(null);
      setUploadState({});
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error saving');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteDoc(doc(db, activeTab, id));
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error deleting item');
    }
  };

  /* -------------------- UI -------------------- */
  const startCreate = () => {
    setEditItem({});
    setUploadState({});
    setIsEditing(true);
  };

  const startEdit = (item: any) => {
    setEditItem(item);
    setUploadState({});
    setIsEditing(true);
  };

  const renderFileUpload = (key: string, label: string) => (
    <div className="mb-4">
      <label>{label}</label>

      <input
        type="file"
        onChange={(e) => handleFileUpload(e, key)}
      />

      {uploadState[key]?.isUploading && (
        <p>{uploadState[key].progress}% uploading...</p>
      )}

      {!uploadState[key]?.isUploading && uploadState[key]?.downloadURL && (
        <p style={{ color: 'green' }}>Upload complete</p>
      )}

      {uploadState[key]?.error && (
        <p style={{ color: 'red' }}>{uploadState[key].error}</p>
      )}
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Dashboard</h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsEditing(false);
                setEditItem(null);
              }}
              style={{
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: activeTab === tab.id ? '#1e3a8a' : '#f1f5f9',
                color: activeTab === tab.id ? 'white' : '#1e293b',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <button onClick={startCreate} style={{ padding: '8px 16px', marginBottom: '20px', cursor: 'pointer' }}>+ Add New</button>

      {isEditing && (
        <form onSubmit={handleSave}>
          {activeTab === 'admins' ? (
            <>
              <input
                placeholder="Email Address"
                type="email"
                value={editItem?.email || ''}
                onChange={e => setEditItem({ ...editItem, email: e.target.value })}
                style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
                required
              />
              <select
                value={editItem?.role || 'admin'}
                onChange={e => setEditItem({ ...editItem, role: e.target.value })}
                style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </>
          ) : (
            <input
              placeholder="Title"
              value={editItem?.title || ''}
              onChange={e =>
                setEditItem({ ...editItem, title: e.target.value })
              }
              style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
            />
          )}

          {activeTab === 'announcements' && (
            <>
              <textarea
                placeholder="Content"
                value={editItem?.content || ''}
                onChange={e => setEditItem({ ...editItem, content: e.target.value })}
                rows={4}
                style={{ display: 'block', width: '100%', marginBottom: 10 }}
              />
              <input
                type="date"
                value={editItem?.date || ''}
                onChange={e => setEditItem({ ...editItem, date: e.target.value })}
                style={{ display: 'block', marginBottom: 10 }}
              />
            </>
          )}

          {/* Example file upload */}
          {renderFileUpload('mediaUrl', 'Upload File')}

          <button type="submit">Save</button>
        </form>
      )}

      <hr />

      {loading ? (
        <p>Loading...</p>
      ) : (
        data.map(item => (
          <div key={item.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}>
            <h4 style={{ margin: 0, flex: 1 }}>{activeTab === 'admins' ? item.email : item.title}</h4>
            {activeTab === 'admins' && <span style={{ marginRight: 10, padding: '4px 8px', background: '#e2e8f0', borderRadius: 4, fontSize: 12 }}>{item.role}</span>}
            <button onClick={() => startEdit(item)}>Edit</button>
            <button onClick={() => handleDelete(item.id)} style={{ color: 'red' }}>Delete</button>
          </div>
        ))
      )}
    </div>
  );
}
