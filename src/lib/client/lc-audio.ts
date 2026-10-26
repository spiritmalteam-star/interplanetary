"use client";

/* ------------------------------------------------------------------ */
/*  THE KEEPING LAW — the chamber's sounds rest on the visitor's own    */
/*  device, never in the house's cellar. The engine hands the sound     */
/*  over once; the visitor's browser keeps it (IndexedDB), so the       */
/*  shelf of transmissions replays across visits without the house      */
/*  holding a single byte of audio. Forgetting a transmission forgets   */
/*  its sound here too — the privacy control is the visitor's own hand. */
/* ------------------------------------------------------------------ */

const DB_NAME = "mirror-lc-audio";
const STORE = "tracks";
const VERSION = 1;

interface StoredAudio {
  id: string;
  bytes: ArrayBuffer;
  mime: string;
}

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Keep one transmission's sound on the visitor's device. */
export async function lcAudioSave(
  id: string,
  bytes: Uint8Array,
  mime: string
): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({
        id,
        bytes: bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength
        ) as ArrayBuffer,
        mime,
      } satisfies StoredAudio);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } finally {
    db.close();
  }
}

/** Recall one transmission's sound — null when the visit that wove it is gone. */
export async function lcAudioGet(
  id: string
): Promise<{ bytes: ArrayBuffer; mime: string } | null> {
  const db = await openDb();
  if (!db) return null;
  try {
    const found = await new Promise<StoredAudio | null>((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result as StoredAudio) ?? null);
      req.onerror = () => resolve(null);
    });
    return found ? { bytes: found.bytes, mime: found.mime } : null;
  } finally {
    db.close();
  }
}

/** The visitor's own hand forgets — the sound leaves the device entirely. */
export async function lcAudioDelete(id: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } finally {
    db.close();
  }
}
