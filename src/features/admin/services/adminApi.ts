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
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../../lib/firebase';
import { AdminRole, ManagedAdmin } from '../types';

export async function fetchCollectionItems(collectionName: string) {
  const snapshot = await getDocs(query(collection(db, collectionName), orderBy('updatedAt', 'desc')));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export function subscribeCollectionItems(
  collectionName: string,
  onItems: (items: Array<Record<string, unknown> & { id: string }>) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, collectionName), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      onItems(items as Array<Record<string, unknown> & { id: string }>);
    },
    (error) => {
      // Keep dashboard resilient if collection lacks the ordered field initially.
      if ((error as Error).message?.toLowerCase().includes('requires an index')) {
        console.warn(`Falling back to unordered fetch for ${collectionName}:`, error);
      } else {
        console.error(`Error subscribing to ${collectionName}:`, error);
      }
      onError?.(error as Error);
    }
  );
}

export async function saveCollectionItem(params: {
  collectionName: string;
  id?: string;
  payload: Record<string, unknown>;
  actorUid: string;
}) {
  const { collectionName, id, payload, actorUid } = params;
  const cleaned = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
  const withAudit = {
    ...cleaned,
    updatedAt: serverTimestamp(),
    updatedBy: actorUid
  };

  if (id) {
    await updateDoc(doc(db, collectionName, id), withAudit);
    return;
  }

  await addDoc(collection(db, collectionName), {
    ...withAudit,
    createdAt: serverTimestamp(),
    createdBy: actorUid
  });
}

export async function removeCollectionItem(collectionName: string, id: string) {
  await deleteDoc(doc(db, collectionName, id));
}

export async function uploadAdminFile(collectionName: string, file: File) {
  const filePath = `uploads/${collectionName}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function fetchAdmins() {
  const snapshot = await getDocs(query(collection(db, 'admins'), orderBy('updatedAt', 'desc')));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as ManagedAdmin[];
}

export async function upsertAdmin(params: {
  uid: string;
  email: string;
  role: AdminRole;
  displayName?: string;
  actorUid: string;
}) {
  const email = params.email.trim().toLowerCase();
  await setDoc(
    doc(db, 'admins', params.uid.trim()),
    {
      email,
      role: params.role,
      displayName: params.displayName?.trim() || null,
      updatedAt: serverTimestamp(),
      updatedBy: params.actorUid,
      createdAt: serverTimestamp(),
      createdBy: params.actorUid
    },
    { merge: true }
  );
}

export async function deleteAdmin(uid: string) {
  await deleteDoc(doc(db, 'admins', uid));
}
