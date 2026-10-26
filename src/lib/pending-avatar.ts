const DB_NAME = 'dainik-patrika-signup';
const STORE_NAME = 'pending-avatars';

type PendingAvatar = {
  email: string;
  name: string;
  type: string;
  blob: Blob;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'email' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open pending avatar storage.'));
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = run(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not access pending avatar storage.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('Pending avatar storage transaction failed.'));
    };
  });
}

export function savePendingAvatar(email: string, file: File): Promise<IDBValidKey> {
  const record: PendingAvatar = { email: email.trim().toLowerCase(), name: file.name, type: file.type, blob: file };
  return withStore('readwrite', (store) => store.put(record));
}

export async function getPendingAvatar(email: string): Promise<File | null> {
  const record = await withStore<PendingAvatar | undefined>('readonly', (store) => store.get(email.trim().toLowerCase()));
  return record ? new File([record.blob], record.name, { type: record.type }) : null;
}

export function removePendingAvatar(email: string): Promise<undefined> {
  return withStore('readwrite', (store) => store.delete(email.trim().toLowerCase()));
}
