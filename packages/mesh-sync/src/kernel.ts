import { WorkspaceCredentials } from './crypto/types.js';
import { deriveKey, computeWorkspaceFingerprint } from './crypto/cipher.js';
import {
  parseHashCredentials,
  generateWorkspaceCredentials,
  syncCredentialsToUrl,
  getSavedActiveWorkspace
} from './identity/credentials.js';
import { CRDTDocManager } from './crdt/doc.js';
import { IndexedDBStorageAdapter } from './storage/indexeddb-adapter.js';
import { WebRTCMeshTransport } from './transport/webrtc-mesh.js';
import { IPFSRelayEngine } from './relay/ipfs-relay.js';
import { Collection, Identifiable } from './collection/types.js';
import { CRDTCollection } from './collection/collection.js';
import { PeerInfo } from './transport/types.js';

export interface MeshKernelConfig {
  credentials?: WorkspaceCredentials;
  signalingUrls?: string[];
  iceServers?: RTCIceServer[];
  pinningEndpoints?: string[];
  publicGateways?: string[];
  ipfsDebounceMs?: number;
  autoSyncUrl?: boolean;
}

export interface MeshKernelStatus {
  workspaceId: string;
  fingerprint: string;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  peersCount: number;
  peers: PeerInfo[];
  lastSyncTimestamp: number;
  latestIpfsCid: string | null;
  isPersisted: boolean;
}

export class MeshKernel {
  public readonly credentials: WorkspaceCredentials;
  public readonly fingerprint: string;
  public readonly docManager: CRDTDocManager;
  public readonly storageAdapter: IndexedDBStorageAdapter;
  public readonly transport: WebRTCMeshTransport;
  public readonly ipfsRelay: IPFSRelayEngine;

  private collections = new Map<string, Collection<any>>();
  private statusListeners = new Set<(status: MeshKernelStatus) => void>();
  private lastSyncTimestamp: number = Date.now();
  private isDestroyed = false;

  private constructor(
    credentials: WorkspaceCredentials,
    fingerprint: string,
    key: CryptoKey,
    docManager: CRDTDocManager,
    storageAdapter: IndexedDBStorageAdapter,
    config: MeshKernelConfig
  ) {
    this.credentials = credentials;
    this.fingerprint = fingerprint;
    this.docManager = docManager;
    this.storageAdapter = storageAdapter;

    // Initialize IPFS Relay
    this.ipfsRelay = new IPFSRelayEngine({
      workspaceId: credentials.workspaceId,
      fingerprint,
      encryptionKey: key,
      docManager,
      storageAdapter,
      pinningEndpoints: config.pinningEndpoints,
      publicGateways: config.publicGateways,
      debounceMs: config.ipfsDebounceMs,
      onSnapshotPublished: (cid) => {
        this.transport.broadcastSnapshotAnnouncement(cid, Date.now());
        this.notifyStatusChange();
      },
      onSnapshotRehydrated: () => {
        this.notifyStatusChange();
      }
    });

    // Initialize WebRTC Mesh Transport
    this.transport = new WebRTCMeshTransport({
      workspaceId: credentials.workspaceId,
      fingerprint,
      encryptionKey: key,
      docManager,
      signalingUrls: config.signalingUrls,
      iceServers: config.iceServers,
      onPeerChange: () => {
        this.notifyStatusChange();
      },
      onSnapshotAnnounce: async (cid, timestamp) => {
        const currentCid = this.ipfsRelay.getLatestCid();
        if (cid !== currentCid) {
          await this.ipfsRelay.rehydrateFromCid(cid);
          this.notifyStatusChange();
        }
      }
    });

    // Hook CRDT updates to local storage buffer & IPFS debouncer
    this.docManager.subscribeToUpdates((event) => {
      this.lastSyncTimestamp = Date.now();
      // Persist update asynchronously
      this.storageAdapter.persistUpdate(event.update).catch((err) => {
        console.error('[MeshKernel] Storage buffering error:', err);
      });
      this.storageAdapter.checkCompaction(this.docManager);
      this.ipfsRelay.triggerDebouncedSnapshot();
      this.notifyStatusChange();
    });

    // Start network mesh
    this.transport.start();
  }

  /**
   * Factory method to boot the MeshKernel.
   * Auto-derives cryptographic keys, rehydrates offline IndexedDB state, and activates the mesh.
   */
  public static async create(config: MeshKernelConfig = {}): Promise<MeshKernel> {
    // 1. Resolve workspace credentials
    let creds = config.credentials || parseHashCredentials();
    if (!creds) {
      // Check device saved workspace before generating a brand new one
      creds = getSavedActiveWorkspace();
    }
    if (!creds) {
      creds = generateWorkspaceCredentials();
      if (config.autoSyncUrl !== false) {
        syncCredentialsToUrl(creds);
      }
    } else if (config.autoSyncUrl !== false) {
      syncCredentialsToUrl(creds);
    }

    // 2. Cryptographic key derivation
    const key = await deriveKey(creds.passphrase, creds.workspaceId);
    const fingerprint = await computeWorkspaceFingerprint(creds.workspaceId, creds.passphrase);

    // 3. Document manager
    const docManager = new CRDTDocManager(creds.workspaceId);

    // 4. Offline persistence adapter
    const storageAdapter = new IndexedDBStorageAdapter({
      workspaceId: creds.workspaceId
    });
    await storageAdapter.init();

    // Instant offline loading from IndexedDB
    await storageAdapter.loadInto(docManager);

    // 5. Instantiate kernel
    return new MeshKernel(creds, fingerprint, key, docManager, storageAdapter, config);
  }

  /**
   * Strongly typed, collection-oriented consumer abstraction.
   */
  public collection<T extends Identifiable>(name: string): Collection<T> {
    if (this.collections.has(name)) {
      return this.collections.get(name) as Collection<T>;
    }

    const col = new CRDTCollection<T>(name, this.docManager);
    this.collections.set(name, col);
    return col;
  }

  /**
   * Get current engine status.
   */
  public getStatus(): MeshKernelStatus {
    const peers = this.transport.getConnectedPeers();
    const isSimulated = this.transport.isOfflineSimulated;
    return {
      workspaceId: this.credentials.workspaceId,
      fingerprint: this.fingerprint,
      isOnline: isSimulated ? false : typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSimulatedOffline: isSimulated,
      peersCount: peers.length,
      peers,
      lastSyncTimestamp: this.lastSyncTimestamp,
      latestIpfsCid: this.ipfsRelay.getLatestCid(),
      isPersisted: true
    };
  }

  /**
   * Toggle offline network partition simulation.
   * When enabled, WebRTC and BroadcastChannel transports are severed, buffering edits in IndexedDB.
   * When disabled, the mesh reconnects and vector clocks reconcile automatically.
   */
  public setOfflineSimulation(offline: boolean): void {
    if (offline) {
      this.transport.pause();
    } else {
      this.transport.resume();
    }
    this.notifyStatusChange();
  }

  public toggleOfflineSimulation(): boolean {
    const newState = !this.transport.isOfflineSimulated;
    this.setOfflineSimulation(newState);
    return newState;
  }

  /**
   * Subscribe to kernel status changes (peers joining/leaving, IPFS snapshot updates).
   */
  public onStatusChange(callback: (status: MeshKernelStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.getStatus());
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private notifyStatusChange(): void {
    if (this.isDestroyed) return;
    const status = this.getStatus();
    for (const listener of this.statusListeners) {
      try {
        listener(status);
      } catch (err) {
        console.error('[MeshKernel] Error in status change listener:', err);
      }
    }
  }

  /**
   * Graceful shutdown.
   */
  public destroy(): void {
    this.isDestroyed = true;
    this.statusListeners.clear();
    this.transport.destroy();
    this.ipfsRelay.destroy();
    this.storageAdapter.destroy();
    this.docManager.destroy();
    this.collections.clear();
  }
}
