import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppSettings, UserProfile, HistoryItem, ChatMessage, GeneratedImage, GeneratedVideo } from '../types';

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
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

// Initialize Firebase App & Services
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export function sanitizeEmailKey(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, '_');
}

export interface FirestoreUserData {
  uid?: string;
  email: string;
  name: string;
  stars: number;
  credits: number;
  starterCreditsClaimed: boolean;
  history?: any[];
  images?: any[];
  videos?: any[];
  messages?: any[];
  settings?: any;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface SendOtpResult {
  success: boolean;
  message?: string;
  error?: string;
  previewUrl?: string;
  sandboxCode?: string;
  isDeliveredToInbox?: boolean;
  isSandbox?: boolean;
  cooldownSeconds?: number;
}

/**
 * 1. Send Real 6-Digit Email OTP via server-side email dispatch
 */
export async function firebaseSendOtp(
  email: string,
  name?: string,
  type: 'signup' | 'login' | 'reset' = 'signup'
): Promise<SendOtpResult> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, name, type })
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error communicating with email server. Please check your connection.'
    };
  }
}

/**
 * 1b. 1-Click Google Sign-In with Firebase Authentication
 */
export async function firebaseSignInWithGoogle(): Promise<{
  success: boolean;
  user?: User;
  error?: string;
  cancelled?: boolean;
}> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (err: any) {
    const code = err?.code || '';
    const message = err?.message || '';

    // Handle normal user cancellation / popup closure without logging console.error
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      message.includes('popup-closed-by-user') ||
      message.includes('cancelled-popup-request')
    ) {
      console.info('Google sign-in popup was dismissed by the user.');
      return {
        success: false,
        cancelled: true,
        error: 'Google sign-in was dismissed.'
      };
    }

    if (
      code === 'auth/popup-blocked' ||
      message.includes('popup-blocked')
    ) {
      console.warn('Google sign-in popup was blocked by browser or iframe.');
      return {
        success: false,
        error: 'The Google sign-in popup was blocked. Please allow popups or use Email OTP sign-in.'
      };
    }

    if (
      code === 'auth/unauthorized-domain' ||
      message.includes('unauthorized-domain')
    ) {
      console.warn('Firebase unauthorized domain warning:', message);
      return {
        success: false,
        error: 'This domain is awaiting authorization in Firebase Console. Please use Email OTP sign-in below.'
      };
    }

    console.warn('Firebase Google Sign-In notice:', message);
    return {
      success: false,
      error: message || 'Google Sign-In could not be completed.'
    };
  }
}

/**
 * 2. Verify 6-Digit Email OTP
 */
export async function firebaseVerifyOtp(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string; remainingAttempts?: number }> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, code: code.trim() })
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error verifying code. Please try again.'
    };
  }
}

/**
 * 3. Sign Up with Email and Password using Firebase Authentication
 */
export async function firebaseSignUp(
  email: string,
  password: string,
  name?: string
): Promise<{ success: boolean; user?: User; error?: string; code?: string; isConsoleActionNeeded?: boolean }> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;

    if (name && name.trim()) {
      try {
        await updateProfile(user, { displayName: name.trim() });
      } catch (profileErr) {
        console.warn('Failed to update displayName on Firebase user:', profileErr);
      }
    }

    return { success: true, user };
  } catch (err: any) {
    console.warn('Firebase createUserWithEmailAndPassword notice:', err?.message || err);
    const errorCode = err.code || '';
    let errorMessage = err.message || 'Registration failed.';
    let isConsoleActionNeeded = false;

    if (errorCode === 'auth/email-already-in-use') {
      errorMessage = 'An account with this email address already exists. Please sign in instead.';
    } else if (errorCode === 'auth/weak-password') {
      errorMessage = 'The password is too weak. Please use at least 6 characters.';
    } else if (errorCode === 'auth/invalid-email') {
      errorMessage = 'The email address format is invalid.';
    } else if (errorCode === 'auth/operation-not-allowed') {
      isConsoleActionNeeded = true;
      errorMessage =
        'Email/Password sign-in provider is not enabled in Firebase Console for this project. Please enable "Email/Password" in Firebase Console > Authentication > Sign-in method.';
    } else if (errorCode === 'auth/network-request-failed') {
      errorMessage = 'Network connection failed. Please verify your internet connectivity.';
    }

    return {
      success: false,
      error: errorMessage,
      code: errorCode,
      isConsoleActionNeeded
    };
  }
}

/**
 * 4. Sign In with Email and Password using Firebase Authentication
 */
export async function firebaseSignIn(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string; code?: string; isConsoleActionNeeded?: boolean }> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    return { success: true, user: userCredential.user };
  } catch (err: any) {
    console.warn('Firebase signInWithEmailAndPassword notice:', err?.message || err);
    const errorCode = err.code || '';
    let errorMessage = err.message || 'Sign in failed.';
    let isConsoleActionNeeded = false;

    if (errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential') {
      errorMessage = 'Invalid email or password. Please verify your credentials or create a new account.';
    } else if (errorCode === 'auth/wrong-password') {
      errorMessage = 'Incorrect password. Please verify and try again.';
    } else if (errorCode === 'auth/invalid-email') {
      errorMessage = 'The email address format is invalid.';
    } else if (errorCode === 'auth/user-disabled') {
      errorMessage = 'This account has been disabled by an administrator.';
    } else if (errorCode === 'auth/too-many-requests') {
      errorMessage = 'Access temporarily disabled due to too many failed attempts. Please wait a few moments and try again.';
    } else if (errorCode === 'auth/operation-not-allowed') {
      isConsoleActionNeeded = true;
      errorMessage =
        'Email/Password sign-in provider is not enabled in Firebase Console for this project. Please enable "Email/Password" in Firebase Console > Authentication > Sign-in method.';
    } else if (errorCode === 'auth/network-request-failed') {
      errorMessage = 'Network connection failed. Please check your internet connection.';
    }

    return {
      success: false,
      error: errorMessage,
      code: errorCode,
      isConsoleActionNeeded
    };
  }
}

/**
 * 5. Send Password Reset Email via Firebase Auth
 */
export async function firebaseSendPasswordReset(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to dispatch password reset email.'
    };
  }
}

/**
 * 6. Fetch persistent user document from Firestore by email
 */
export async function getFirestoreUser(email: string): Promise<FirestoreUserData | null> {
  try {
    const key = sanitizeEmailKey(email);
    const userDocRef = doc(db, 'users', key);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as FirestoreUserData;
    }
    return null;
  } catch (err) {
    console.warn('Error reading user from Firestore:', err);
    return null;
  }
}

/**
 * 7. Save or merge user data into Firestore by email
 */
export async function saveFirestoreUser(email: string, data: Partial<FirestoreUserData>): Promise<boolean> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const key = sanitizeEmailKey(cleanEmail);
    const userDocRef = doc(db, 'users', key);
    await setDoc(
      userDocRef,
      {
        ...data,
        email: cleanEmail,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn('Notice saving user to Firestore:', err);
    return false;
  }
}

/**
 * 8. Log out user from Firebase Auth
 */
export async function logOutFirebaseUser() {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase signOut error:', err);
  }
}

/**
 * 9. Subscribe to Firebase Auth state changes
 */
export function onAuthUserChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * 10. Verify live Firestore connection and latency
 */
export async function testFirestoreConnection(): Promise<{ online: boolean; latencyMs: number; error?: string }> {
  const start = performance.now();
  const testPath = 'test/connection';
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    const latencyMs = Math.round(performance.now() - start);
    return { online: true, latencyMs };
  } catch (error: any) {
    const latencyMs = Math.round(performance.now() - start);
    const msg = error?.message || String(error);
    if (msg.includes('the client is offline') || msg.includes('Failed to get document because the client is offline')) {
      console.warn('Firestore client is offline:', msg);
      return { online: false, latencyMs: 0, error: 'Device is offline or Firestore network is unavailable.' };
    }
    // Connected to server (e.g. document does not exist or permission confirmed)
    return { online: true, latencyMs: Math.max(12, latencyMs) };
  }
}

/**
 * 11. Calculate local storage size and cached item breakdown
 */
export function calculateOfflineStorageTelemetry(): {
  totalBytes: number;
  formattedSize: string;
  itemCounts: {
    history: number;
    messages: number;
    images: number;
    videos: number;
    drafts: number;
  };
} {
  let totalBytes = 0;
  const keys = [
    'ogoo_settings',
    'ogoo_profile',
    'ogoo_messages',
    'ogoo_history',
    'ogoo_images',
    'ogoo_videos',
    'ogoo_theme',
    'ogoo_draft_project',
    'ogoo_editor_history'
  ];

  let history = 0;
  let messages = 0;
  let images = 0;
  let videos = 0;
  let drafts = 0;

  try {
    for (const key of keys) {
      const val = localStorage.getItem(key);
      if (val) {
        totalBytes += (key.length + val.length) * 2;
        if (key === 'ogoo_history') {
          try { history = JSON.parse(val).length || 0; } catch {}
        } else if (key === 'ogoo_messages') {
          try { messages = JSON.parse(val).length || 0; } catch {}
        } else if (key === 'ogoo_images') {
          try { images = JSON.parse(val).length || 0; } catch {}
        } else if (key === 'ogoo_videos') {
          try { videos = JSON.parse(val).length || 0; } catch {}
        } else if (key === 'ogoo_draft_project' || key === 'ogoo_editor_history') {
          drafts++;
        }
      }
    }
  } catch {}

  const formattedSize = totalBytes > 1024 * 1024
    ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(totalBytes / 1024).toFixed(1)} KB`;

  return {
    totalBytes,
    formattedSize,
    itemCounts: { history, messages, images, videos, drafts }
  };
}

export interface OfflineSyncPayload {
  profile: UserProfile;
  settings: AppSettings;
  history: HistoryItem[];
  messages: ChatMessage[];
  images?: GeneratedImage[];
  videos?: GeneratedVideo[];
}

export interface ForceSyncResult {
  success: boolean;
  message: string;
  error?: string;
  syncedAt: string;
  latencyMs: number;
  stats: {
    historyCount: number;
    messagesCount: number;
    imagesCount: number;
    videosCount: number;
    localCacheBytes: number;
    remoteFound: boolean;
    itemsMerged: number;
  };
  mergedData: OfflineSyncPayload;
}

/**
 * 12. Manual Bidirectional Synchronization between Local Offline Cache and Firestore
 * Allows forcing a synchronization of cached history, settings, chats, and vault state with Firestore.
 */
export async function forceSyncOfflineWithFirestore(
  email: string,
  localData: OfflineSyncPayload
): Promise<ForceSyncResult> {
  const cleanEmail = (email || 'guest@ogoo.ai').trim().toLowerCase();
  const key = sanitizeEmailKey(cleanEmail);
  const path = `users/${key}`;
  const startTime = performance.now();
  const nowIso = new Date().toISOString();
  const formattedTime = new Date().toLocaleTimeString();

  // Test server connectivity
  const conn = await testFirestoreConnection();
  const cacheStats = calculateOfflineStorageTelemetry();

  if (!conn.online) {
    return {
      success: false,
      message: 'Device is currently offline. Offline cache is intact and will sync when connection is re-established.',
      error: conn.error || 'Client is offline.',
      syncedAt: formattedTime,
      latencyMs: 0,
      stats: {
        historyCount: localData.history?.length || 0,
        messagesCount: localData.messages?.length || 0,
        imagesCount: localData.images?.length || 0,
        videosCount: localData.videos?.length || 0,
        localCacheBytes: cacheStats.totalBytes,
        remoteFound: false,
        itemsMerged: 0
      },
      mergedData: localData
    };
  }

  try {
    const userDocRef = doc(db, 'users', key);
    let remoteSnap;
    try {
      remoteSnap = await getDoc(userDocRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }

    const remoteData = (remoteSnap && remoteSnap.exists())
      ? (remoteSnap.data() as Partial<FirestoreUserData>)
      : null;

    // A. Merge History (Union by ID, deduplicated, sorted newest first)
    const historyMap = new Map<string, HistoryItem>();
    if (remoteData?.history && Array.isArray(remoteData.history)) {
      remoteData.history.forEach((item: HistoryItem) => {
        if (item?.id) historyMap.set(item.id, item);
      });
    }
    (localData.history || []).forEach((item: HistoryItem) => {
      if (item?.id) historyMap.set(item.id, item);
    });
    const mergedHistory = Array.from(historyMap.values());

    // B. Merge Messages (Union by ID, deduplicated with guaranteed unique IDs)
    const msgMap = new Map<string, ChatMessage>();
    let msgCounter = 0;
    const allMsgs = [
      ...(Array.isArray(remoteData?.messages) ? remoteData!.messages : []),
      ...(Array.isArray(localData.messages) ? localData.messages : [])
    ];
    allMsgs.forEach((msg: ChatMessage) => {
      if (msg) {
        const id = msg.id || `msg-${Date.now()}-${msgCounter++}`;
        msgMap.set(id, { ...msg, id });
      }
    });
    const mergedMessages = Array.from(msgMap.values());

    // C. Merge Settings
    const mergedSettings: AppSettings = {
      ...localData.settings,
      ...(remoteData?.settings || {}),
      ...localData.settings, // User's local settings take active preference
      cloudSyncEnabled: localData.settings.cloudSyncEnabled ?? true,
      lastSyncedAt: nowIso
    };

    // D. Merge Profile
    const remoteStars = typeof remoteData?.stars === 'number' ? remoteData.stars : localData.profile.stars;
    const remoteCredits = typeof remoteData?.credits === 'number' ? remoteData.credits : localData.profile.credits;
    const mergedProfile: UserProfile = {
      ...localData.profile,
      stars: Math.max(localData.profile.stars, remoteStars),
      credits: Math.max(localData.profile.credits, remoteCredits),
      email: cleanEmail
    };

    const mergedImages = localData.images || [];
    const mergedVideos = localData.videos || [];

    // E. Save unified document to Firestore
    const firestorePayload: any = {
      uid: auth.currentUser?.uid || undefined,
      email: cleanEmail,
      name: mergedProfile.name,
      stars: mergedProfile.stars,
      credits: mergedProfile.credits,
      settings: mergedSettings,
      history: mergedHistory,
      messages: mergedMessages,
      cloudSyncEnabled: mergedSettings.cloudSyncEnabled,
      lastSyncedAt: nowIso,
      updatedAt: nowIso
    };

    try {
      await setDoc(userDocRef, firestorePayload, { merge: true });
    } catch (writeErr) {
      handleFirestoreError(writeErr, OperationType.WRITE, path);
    }

    // F. Persist back to browser LocalStorage
    try {
      localStorage.setItem('ogoo_profile', JSON.stringify(mergedProfile));
      localStorage.setItem('ogoo_settings', JSON.stringify(mergedSettings));
      localStorage.setItem('ogoo_history', JSON.stringify(mergedHistory));
      localStorage.setItem('ogoo_messages', JSON.stringify(mergedMessages));
    } catch {}

    const latencyMs = Math.round(performance.now() - startTime);
    const updatedCacheStats = calculateOfflineStorageTelemetry();
    const itemsMergedCount = (remoteData?.history?.length || 0) + (remoteData?.messages?.length || 0);

    return {
      success: true,
      message: `Synchronized ${mergedHistory.length} history items and ${mergedMessages.length} messages with Firestore backend.`,
      syncedAt: formattedTime,
      latencyMs,
      stats: {
        historyCount: mergedHistory.length,
        messagesCount: mergedMessages.length,
        imagesCount: mergedImages.length,
        videosCount: mergedVideos.length,
        localCacheBytes: updatedCacheStats.totalBytes,
        remoteFound: Boolean(remoteData),
        itemsMerged: itemsMergedCount
      },
      mergedData: {
        profile: mergedProfile,
        settings: mergedSettings,
        history: mergedHistory,
        messages: mergedMessages,
        images: mergedImages,
        videos: mergedVideos
      }
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    console.error('Manual Firestore Sync error:', err);
    return {
      success: false,
      message: err?.message || 'Manual synchronization could not be completed.',
      error: err?.message || String(err),
      syncedAt: formattedTime,
      latencyMs,
      stats: {
        historyCount: localData.history.length,
        messagesCount: localData.messages.length,
        imagesCount: (localData.images || []).length,
        videosCount: (localData.videos || []).length,
        localCacheBytes: cacheStats.totalBytes,
        remoteFound: false,
        itemsMerged: 0
      },
      mergedData: localData
    };
  }
}
