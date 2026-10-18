import { getApi, isDesktop } from "../api";

const DB_NAME = "membetter-media";
const STORE = "files";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    });
  }
  return dbPromise;
}

async function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = action(transaction.objectStore(STORE));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

/** Address of a stored file in the desktop app (served by the main process). */
export function mediaUrl(id: string): string {
  return `membetter-media://media/${encodeURIComponent(id)}`;
}

export async function putMedia(id: string, blob: Blob): Promise<void> {
  if (isDesktop()) {
    const name = blob instanceof File ? blob.name : "file";
    const result = await getApi().media.put(id, new Uint8Array(await blob.arrayBuffer()), name);
    if (!result.ok) throw new Error(result.error.message);
    return;
  }
  await run("readwrite", (store) => store.put(blob, id));
}

export async function getMedia(id: string): Promise<Blob | undefined> {
  return run("readonly", (store) => store.get(id) as IDBRequest<Blob | undefined>);
}

export async function deleteMedia(id: string): Promise<void> {
  if (isDesktop()) {
    await getApi().media.remove(id);
    return;
  }
  await run("readwrite", (store) => store.delete(id));
}
