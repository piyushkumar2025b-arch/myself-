const DB_NAME = 'PortfolioPersistentDB';
const DB_VERSION = 1;
const STORE_NAME = 'portfolio_store';

export const KEY_CUSTOM_PROFILE_IMAGE = 'portfolio_custom_profile_image_v1';
export const KEY_PORTFOLIO_DATA = 'portfolio_live_config_v3';

/**
 * Open or upgrade native IndexedDB safely
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported in current environment'));
        return;
      }
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        try {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        } catch (e) {
          // ignore
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Set a key-value pair in IndexedDB safely
 */
export async function idbSet(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch (txErr) {
        resolve();
      }
    });
  } catch (err) {
    // safely ignore
  }
}

/**
 * Get a key-value pair from IndexedDB safely
 */
export async function idbGet<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => resolve(null);
      } catch (txErr) {
        resolve(null);
      }
    });
  } catch (err) {
    return null;
  }
}

/**
 * Store custom profile image across all persistence tiers (IndexedDB + localStorage)
 */
export async function persistCustomProfileImage(imageUrl: string): Promise<void> {
  if (!imageUrl || imageUrl.trim() === '') return;

  // 1. Save to native IndexedDB (supports high resolution / large data URLs with no 5MB limit)
  await idbSet(KEY_CUSTOM_PROFILE_IMAGE, imageUrl);

  // 2. Also try saving to localStorage for instant synchronous access
  try {
    localStorage.setItem(KEY_CUSTOM_PROFILE_IMAGE, imageUrl);
  } catch (e) {
    // If quota exceeded in localStorage, IndexedDB still securely holds the image
    console.info('[PersistentStorage] Saved image in IndexedDB (localStorage quota reached)');
  }
}

/**
 * Retrieve custom profile image from IndexedDB or localStorage
 */
export async function getPersistedCustomProfileImage(): Promise<string | null> {
  // 1. Try synchronous localStorage first
  try {
    const local = localStorage.getItem(KEY_CUSTOM_PROFILE_IMAGE);
    if (local && local.trim() !== '') {
      return local;
    }
  } catch (e) {
    // ignore
  }

  // 2. Check IndexedDB
  try {
    const idbValue = await idbGet<string>(KEY_CUSTOM_PROFILE_IMAGE);
    if (idbValue && idbValue.trim() !== '') {
      return idbValue;
    }
  } catch (e) {
    // ignore
  }

  return null;
}
