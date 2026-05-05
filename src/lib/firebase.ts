import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

type AppletFirebaseConfig = {
  projectId: string;
  firestoreDatabaseId?: string;
};

const typedFirebaseConfig = firebaseConfig as typeof firebaseConfig & AppletFirebaseConfig;
const firestoreDatabaseId =
  typedFirebaseConfig.firestoreDatabaseId && typedFirebaseConfig.firestoreDatabaseId.trim().length > 0
    ? typedFirebaseConfig.firestoreDatabaseId
    : '(default)';

console.log('Firebase Config Loaded:', typedFirebaseConfig.projectId, firestoreDatabaseId);

const app = initializeApp(typedFirebaseConfig);
export const db = getFirestore(app, firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Admin uploads are mostly small files; shorter retry windows avoid long "hanging" states.
storage.maxUploadRetryTime = 60_000;
storage.maxOperationRetryTime = 15_000;

export const authReady = setPersistence(auth, browserLocalPersistence).catch(error => {
  console.error('Failed to enable Firebase auth persistence:', error);
});
