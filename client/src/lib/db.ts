import { openDB, IDBPDatabase } from 'idb';
import { HistoryEntry } from '../types';

const DB_NAME = 'social_content_desk_db';
const DB_VERSION = 1;
const STORE_NAME = 'history';
const MAX_ENTRIES = 200;
const FALLBACK_KEY = 'social_content_history_fallback';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> | null {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return null;
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('updatedAt', 'updatedAt');
        }
      },
    }).catch(err => {
      console.warn('IndexedDB failed to open, falling back to localStorage:', err);
      dbPromise = null;
      return Promise.reject(err);
    });
  }
  return dbPromise;
}

// LocalStorage fallback helpers
function getFallbackHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFallbackHistory(list: HistoryEntry[]): void {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(list.slice(0, MAX_ENTRIES)));
  } catch (err) {
    console.error('Failed to save to localStorage fallback:', err);
  }
}

export async function getAllHistory(): Promise<HistoryEntry[]> {
  const db = getDb();
  if (db) {
    try {
      const database = await db;
      const tx = database.transaction(STORE_NAME, 'readonly');
      const index = tx.store.index('createdAt');
      const all = await index.getAll();
      // Filter out soft deleted items and sort descending by createdAt
      return all.filter(item => !item.deleted).reverse();
    } catch (err) {
      console.warn('Error reading from IndexedDB, trying fallback:', err);
    }
  }

  const fallback = getFallbackHistory();
  return fallback.filter(item => !item.deleted).sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveHistory(entry: HistoryEntry): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      const database = await db;
      const tx = database.transaction(STORE_NAME, 'readwrite');
      await tx.store.put(entry);

      // Check cap: if count > 200, delete oldest
      const index = tx.store.index('createdAt');
      const keys = await index.getAllKeys();
      if (keys.length > MAX_ENTRIES) {
        const excess = keys.length - MAX_ENTRIES;
        for (let i = 0; i < excess; i++) {
          await tx.store.delete(keys[i]);
        }
      }

      await tx.done;
      return;
    } catch (err) {
      console.warn('IndexedDB write failed, writing to fallback:', err);
    }
  }

  // Fallback
  const list = getFallbackHistory().filter(e => e.id !== entry.id);
  list.unshift(entry);
  saveFallbackHistory(list);
}

export async function deleteHistory(id: string): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      const database = await db;
      const tx = database.transaction(STORE_NAME, 'readwrite');
      // We can soft delete or hard delete. For local-only v1, hard delete or tombstone
      await tx.store.delete(id);
      await tx.done;
      return;
    } catch (err) {
      console.warn('IndexedDB delete failed, deleting from fallback:', err);
    }
  }

  const list = getFallbackHistory().filter(e => e.id !== id);
  saveFallbackHistory(list);
}

export async function clearAllHistory(): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      const database = await db;
      const tx = database.transaction(STORE_NAME, 'readwrite');
      await tx.store.clear();
      await tx.done;
      return;
    } catch (err) {
      console.warn('IndexedDB clear failed:', err);
    }
  }

  saveFallbackHistory([]);
}
