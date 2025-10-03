// This file uses the global `idb` object loaded from the script tag in index.html
// to interact with IndexedDB. This provides a robust, promise-based API for database operations.
declare const idb: any;

const DB_NAME = 'ngo-dashboard-db';
const DB_VERSION = 2; // Version incremented to add the new sync-queue store
const API_CACHE_STORE = 'api-cache';
const SYNC_QUEUE_STORE = 'sync-queue';

// This promise ensures the database is opened only once.
let dbPromise: Promise<any> | null = null;

const getDb = (): Promise<any> => {
  if (!dbPromise) {
    dbPromise = idb.openDB(DB_NAME, DB_VERSION, {
      upgrade(db: any, oldVersion: number) {
        if (oldVersion < 1) {
          db.createObjectStore(API_CACHE_STORE);
        }
        if (oldVersion < 2) {
          const store = db.createObjectStore(SYNC_QUEUE_STORE, {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
};

// --- API Cache Functions ---

/**
 * Retrieves a value from the API cache store.
 * @param key The key of the item to retrieve.
 * @returns The cached value, or undefined if not found.
 */
export const get = async (key: string): Promise<any> => {
  const db = await getDb();
  return db.get(API_CACHE_STORE, key);
};

/**
 * Stores a value in the API cache store.
 * @param key The key under which to store the value.
 * @param value The value to store.
 */
export const put = async (key: string, value: any): Promise<void> => {
  const db = await getDb();
  return db.put(API_CACHE_STORE, value, key);
};

// --- Sync Queue Functions ---

/**
 * Adds a change to the synchronization queue.
 * @param change An object representing the change to be synced.
 * @returns The ID of the newly added change.
 */
export const addChange = async (change: any): Promise<number> => {
    const db = await getDb();
    return db.add(SYNC_QUEUE_STORE, change);
};

/**
 * Retrieves all changes from the synchronization queue, sorted by timestamp.
 * @returns An array of all pending changes.
 */
export const getChanges = async (): Promise<any[]> => {
    const db = await getDb();
    return db.getAllFromIndex(SYNC_QUEUE_STORE, 'timestamp');
};

/**
 * Deletes a change from the synchronization queue by its ID.
 * @param id The ID of the change to delete.
 */
export const deleteChange = async (id: number): Promise<void> => {
    const db = await getDb();
    return db.delete(SYNC_QUEUE_STORE, id);
};
