import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore, doc, getDoc, setLogLevel } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfigData);
  const dbId = firebaseConfigData.firestoreDatabaseId;

  // Suppress verbose internal SDK network reconnect notices
  try {
    setLogLevel('error');
  } catch (logErr) {
    // Non-critical
  }

  // Use auto-detect long-polling to prevent WebSocket/streaming stalls in sandboxed iframe environments
  try {
    db = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    }, dbId);
  } catch (initErr) {
    db = dbId ? getFirestore(app, dbId) : getFirestore(app);
  }

  try {
    auth = getAuth(app);
  } catch (authErr) {
    auth = {} as Auth;
  }
} catch (err) {
  console.error('Firebase initialization error:', err);
  app = {} as FirebaseApp;
  db = {} as Firestore;
  auth = {} as Auth;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Safe connection verification helper (callable on demand, not run automatically on load)
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    if (!db || !db.type) return false;
    await getDoc(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    const errorMsg = (error instanceof Error ? error.message : String(error || '')).toLowerCase();
    const isUnavailable = error?.code === 'unavailable' || errorMsg.includes('offline') || errorMsg.includes('unavailable') || errorMsg.includes('could not reach');
    if (isUnavailable) {
      console.warn('Firebase client operating in resilient offline mode.');
      return false;
    }
    return true;
  }
}

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfigData && firebaseConfigData.projectId && firebaseConfigData.apiKey);
}

export function getFirebaseConfig() {
  return firebaseConfigData;
}

export function logFirebaseStatus(): void {
  if (isFirebaseConfigured()) {
    console.log(
      `%c[Firebase Firestore] Active Database%c ${firebaseConfigData.projectId} (${firebaseConfigData.firestoreDatabaseId || 'default'})`,
      'background: #f5820d; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
      'color: #0284c7; font-weight: bold;'
    );
  }
}

export { app, db, auth };
export default db;

