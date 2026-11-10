import { CRDTDocManager } from '../crdt/doc.js';

export interface StorageAdapterOptions {
  workspaceId: string;
  compactionThreshold?: number;
}

export class IndexedDBStorageAdapter {
  private dbName: string;
  private db: IDBDatabase | null = null;
  private isInitializing = false;
  private pendingUpdates: Uint8Array[] = [];
  private compactionThreshold: number;
  private updateCounter = 0;

  constructor(options: StorageAdapterOptions) {
    this.dbName = `localfirst_mesh_${options.workspaceId}`;
    this.compactionThreshold = options.compactionThreshold ?? 40;
  }

  /**
   * Open the workspace-isolated IndexedDB database.
   */
  public async init(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      console.warn('[IndexedDBStorageAdapter] IndexedDB is not supported in this runtime.');
      return;
    }

    if (this.db) return;
    this.isInitializing = true;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('snapshots')) {
          db.createObjectStore('snapshots', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('updates')) {
          db.createObjectStore('updates', { autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isInitializing = false;
        // Flush any updates that arrived before DB was fully ready
        if (this.pendingUpdates.length > 0) {
          const queued = [...this.pendingUpdates];
          this.pendingUpdates = [];
          for (const u of queued) {
            await this.persistUpdate(u);
          }
        }
        resolve();
      };

      request.onerror = (event) => {
        this.isInitializing = false;
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  /**
   * Load the persisted document state (snapshot + pending delta updates) and apply to docManager.
   * Enables zero-latency instant offline boot.
   */
  public async loadInto(docManager: CRDTDocManager): Promise<{ loaded: boolean; updateCount: number }> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      return { loaded: false, updateCount: 0 };
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction(['snapshots', 'updates'], 'readonly');
        const snapshotStore = tx.objectStore('snapshots');
        const updateStore = tx.objectStore('updates');

        const snapshotReq = snapshotStore.get('latest');
        const updatesReq = updateStore.getAll();

        let snapshotData: Uint8Array | null = null;

        snapshotReq.onsuccess = () => {
          if (snapshotReq.result?.data) {
            snapshotData = snapshotReq.result.data;
          }
        };

        tx.oncomplete = () => {
          let count = 0;
          if (snapshotData) {
            docManager.applyUpdate(snapshotData, 'indexeddb-snapshot');
            count++;
          }

          const updates = updatesReq.result as Uint8Array[] | undefined;
          if (updates && updates.length > 0) {
            for (const upd of updates) {
              if (upd && upd.byteLength > 0) {
                docManager.applyUpdate(upd, 'indexeddb-delta');
                count++;
              }
            }
          }

          resolve({ loaded: count > 0, updateCount: count });
        };

        tx.onerror = () => {
          reject(tx.error);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Immediately buffer and persist a local binary update into IndexedDB.
   */
  public async persistUpdate(update: Uint8Array): Promise<void> {
    if (!this.db) {
      this.pendingUpdates.push(update);
      if (!this.isInitializing) {
        await this.init();
      }
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction(['updates'], 'readwrite');
        const store = tx.objectStore('updates');
        store.add(update);

        tx.oncomplete = () => {
          this.updateCounter++;
          resolve();
        };

        tx.onerror = () => {
          reject(tx.error);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Compact the log of updates into a single full snapshot, clearing the updates store.
   */
  public async compact(docManager: CRDTDocManager): Promise<void> {
    if (!this.db) return;

    const snapshot = docManager.exportSnapshot();

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction(['snapshots', 'updates'], 'readwrite');
        const snapshotStore = tx.objectStore('snapshots');
        const updateStore = tx.objectStore('updates');

        snapshotStore.put({ id: 'latest', data: snapshot, timestamp: Date.now() });
        updateStore.clear();

        tx.oncomplete = () => {
          this.updateCounter = 0;
          resolve();
        };

        tx.onerror = () => {
          reject(tx.error);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Periodically check if compaction is needed.
   */
  public checkCompaction(docManager: CRDTDocManager): void {
    if (this.updateCounter >= this.compactionThreshold) {
      this.compact(docManager).catch((err) => {
        console.error('[IndexedDBStorageAdapter] Compaction failed:', err);
      });
    }
  }

  /**
   * Store metadata (e.g. latest known IPFS CID).
   */
  public async setMeta(key: string, value: unknown): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['metadata'], 'readwrite');
      tx.objectStore('metadata').put({ key, value, timestamp: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Retrieve metadata.
   */
  public async getMeta<T = unknown>(key: string): Promise<T | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    return new Promise((resolve) => {
      const tx = this.db!.transaction(['metadata'], 'readonly');
      const req = tx.objectStore('metadata').get(key);
      req.onsuccess = () => resolve(req.result ? (req.result.value as T) : null);
      req.onerror = () => resolve(null);
    });
  }

  /**
   * Close the IndexedDB connection.
   */
  public destroy(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
