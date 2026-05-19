import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';

import { db } from '../../../lib/firebase';
import { AdminRole, ManagedAdmin } from '../types';

/* ---------------- FIRESTORE HELPERS ---------------- */

export async function fetchCollectionItems(collectionName: string) {
  const snapshot = await getDocs(
    query(collection(db, collectionName), orderBy('updatedAt', 'desc'))
  );

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export function subscribeCollectionItems(collectionName: string, onItems: any, onError?: any) {
  const q = query(collection(db, collectionName), orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      onItems(items);
    },
    err => onError?.(err)
  );
}

export async function saveCollectionItem(params: any) {
  const { collectionName, id, payload, actorUid } = params;

  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined)
  );

  const data = {
    ...cleanPayload,
    updatedAt: serverTimestamp(),
    updatedBy: actorUid
  };

  if (id) {
    await updateDoc(doc(db, collectionName, id), data);
  } else {
    await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      createdBy: actorUid
    });
  }
}

export async function removeCollectionItem(collectionName: string, id: string) {
  await deleteDoc(doc(db, collectionName, id));
}

/* ---------------- CLOUDINARY UPLOAD (FIXED) ---------------- */

export async function uploadAdminFile(collectionNameOrFile: string | File, maybeFile?: File) {
  // Signature supports either (file: File) or (collectionName: string, file: File)
  const file = typeof collectionNameOrFile === 'string' ? maybeFile : (collectionNameOrFile as File);
  if (!file) throw new Error('Missing file for upload');

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Missing Cloudinary config");
  }

  const isVideo = file.type.startsWith("video/");
  const isAudio = file.type.startsWith("audio/");

  // Use explicit Cloudinary resource types:
  // - video for video files
  // - raw for audio files (more compatible for various audio containers)
  // - image for images
  const resourceType = isVideo ? "video" : isAudio ? "raw" : "image";

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "rcf-media");
  // Tell Cloudinary the resource type explicitly
  formData.append('resource_type', resourceType);

  const res = await fetch(endpoint, {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Upload failed");
  }

  // Provide both legacy and explicit Cloudinary fields for callers
  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
    resource_type: data.resource_type || resourceType,
    url: data.secure_url,
    publicId: data.public_id,
    type: resourceType,
    raw: data
  };
}

/* ---------------- ADMINS HELPERS ---------------- */

export async function fetchAdmins() {
  const snap = await getDocs(query(collection(db, 'admins'), orderBy('updatedAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as ManagedAdmin[];
}

export async function upsertAdmin(params: { uid: string; email: string; role: AdminRole; displayName?: string; actorUid: string }) {
  const { uid, email, role, displayName, actorUid } = params;
  const id = uid.trim();
  await setDoc(doc(db, 'admins', id), {
    email: email.trim().toLowerCase(),
    role,
    displayName: displayName?.trim() || null,
    updatedAt: serverTimestamp(),
    updatedBy: actorUid,
    createdAt: serverTimestamp(),
    createdBy: actorUid
  }, { merge: true });
}

export async function deleteAdmin(uid: string) {
  if (!uid) throw new Error('Missing uid');
  await deleteDoc(doc(db, 'admins', uid));
}