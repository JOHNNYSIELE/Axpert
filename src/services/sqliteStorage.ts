/**
 * @file src/services/sqliteStorage.ts
 * Offline persistent storage adapter for the SQLite database binary file.
 * Uses IndexedDB for multi-megabyte binary blob storage with a base64 localStorage fallback.
 */

const IDB_DATABASE_NAME = 'AXpert_Offline_Data';
const IDB_STORE_NAME = 'sqlite_databases';
const IDB_KEY = 'axpert_auth.sqlite';
const LOCALSTORAGE_KEY = 'axpert_sqlite_db_backup';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(IDB_DATABASE_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSqliteBuffer(buffer: Uint8Array): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      const putRequest = store.put(buffer, IDB_KEY);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    });
  } catch (err) {
    console.warn('[SQLite Storage] IndexedDB save failed, attempting localStorage backup:', err);
    try {
      // Fallback: convert to binary string and base64
      let binary = '';
      const len = buffer.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(buffer[i]);
      }
      const b64 = btoa(binary);
      localStorage.setItem(LOCALSTORAGE_KEY, b64);
    } catch (fallbackErr) {
      console.error('[SQLite Storage] Both IndexedDB and localStorage failed:', fallbackErr);
    }
  }
}

export async function loadSqliteBuffer(): Promise<Uint8Array | null> {
  try {
    const db = await openDatabase();
    const result = await new Promise<Uint8Array | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const getRequest = store.get(IDB_KEY);

      getRequest.onsuccess = () => {
        const val = getRequest.result;
        if (val instanceof Uint8Array) {
          resolve(val);
        } else if (val) {
          resolve(new Uint8Array(val));
        } else {
          resolve(null);
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });

    if (result && result.byteLength > 0) {
      return result;
    }
  } catch (err) {
    console.warn('[SQLite Storage] IndexedDB load failed, attempting localStorage backup:', err);
  }

  // Fallback check
  try {
    const b64 = localStorage.getItem(LOCALSTORAGE_KEY);
    if (b64) {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }
  } catch (fallbackErr) {
    console.warn('[SQLite Storage] LocalStorage backup read failed:', fallbackErr);
  }

  return null;
}

export async function deleteSqliteDatabase(): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      const delRequest = store.delete(IDB_KEY);
      delRequest.onsuccess = () => resolve();
      delRequest.onerror = () => reject(delRequest.error);
    });
  } catch (err) {
    console.warn('[SQLite Storage] Failed to delete from IndexedDB:', err);
  }
  localStorage.removeItem(LOCALSTORAGE_KEY);
}
