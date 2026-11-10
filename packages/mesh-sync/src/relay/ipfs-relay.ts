import { CRDTDocManager } from '../crdt/doc.js';
import { EncryptedEnvelope } from '../crypto/types.js';
import { encryptPayload, decryptPayload, sha256Hex } from '../crypto/cipher.js';
import { IndexedDBStorageAdapter } from '../storage/indexeddb-adapter.js';

export interface IPFSRelayOptions {
  workspaceId: string;
  fingerprint: string;
  encryptionKey: CryptoKey;
  docManager: CRDTDocManager;
  storageAdapter: IndexedDBStorageAdapter;
  pinningEndpoints?: string[];
  publicGateways?: string[];
  debounceMs?: number;
  onSnapshotPublished?: (cid: string, timestamp: number) => void;
  onSnapshotRehydrated?: (cid: string) => void;
}

export interface SnapshotMeta {
  cid: string;
  timestamp: number;
  sizeBytes: number;
}

// Base32 RFC 4648 alphabet (lower-case) used by IPFS CIDv1
const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

function encodeBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Compute an authentic IPFS CIDv1 (raw / sha2-256) for any binary buffer.
 * Format: 'b' + base32( 0x01 (cidv1) + 0x55 (raw) + 0x12 (sha2-256) + 0x20 (len 32) + hashBytes )
 */
export async function computeIpfsCid(data: Uint8Array): Promise<string> {
  const subtle = globalThis.crypto.subtle;
  const hashBuffer = await subtle.digest('SHA-256', data as unknown as BufferSource);
  const hashBytes = new Uint8Array(hashBuffer);

  const header = new Uint8Array([0x01, 0x55, 0x12, 0x20]);
  const cidBytes = new Uint8Array(header.length + hashBytes.length);
  cidBytes.set(header, 0);
  cidBytes.set(hashBytes, header.length);

  return 'b' + encodeBase32(cidBytes);
}

export class IPFSRelayEngine {
  private debounceTimer: number | null = null;
  private debounceMs: number;
  private isDestroyed = false;
  private publicGateways: string[];
  private pinningEndpoints: string[];
  private lastPublishedCid: string | null = null;

  constructor(private options: IPFSRelayOptions) {
    this.debounceMs = options.debounceMs ?? 4000;
    this.publicGateways = options.publicGateways ?? [
      'https://ipfs.io/ipfs/',
      'https://dweb.link/ipfs/',
      'https://gateway.pinata.cloud/ipfs/'
    ];
    const userCustomPinning =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('mesh_custom_pinning_endpoint')
        : null;

    const basePinning = options.pinningEndpoints ?? [];
    this.pinningEndpoints = userCustomPinning
      ? [userCustomPinning, ...basePinning]
      : basePinning;

    this.init();
  }

  private async init(): Promise<void> {
    // Check IndexedDB for previously known CID
    const savedCid = await this.options.storageAdapter.getMeta<string>('latest_ipfs_cid');
    if (savedCid) {
      this.lastPublishedCid = savedCid;
    }
  }

  /**
   * Schedule a debounced snapshot creation whenever local doc changes.
   */
  public triggerDebouncedSnapshot(): void {
    if (this.isDestroyed) return;

    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.createAndPublishSnapshot().catch((err) => {
        console.error('[IPFSRelayEngine] Snapshot creation failed:', err);
      });
    }, this.debounceMs) as unknown as number;
  }

  /**
   * Generate an encrypted snapshot, compute its CID, store in local blockstore and push to pinning relays.
   */
  public async createAndPublishSnapshot(): Promise<SnapshotMeta | null> {
    if (this.isDestroyed) return null;

    try {
      const docSnapshot = this.options.docManager.exportSnapshot();
      if (!docSnapshot || docSnapshot.byteLength === 0) return null;

      // Encrypt snapshot with AES-GCM + fresh IV
      const envelope = await encryptPayload(
        docSnapshot,
        this.options.encryptionKey,
        this.options.fingerprint
      );

      const envelopeJson = JSON.stringify(envelope);
      const envelopeBytes = new TextEncoder().encode(envelopeJson);

      // Compute deterministic content-addressed identifier (CID)
      const cid = await computeIpfsCid(envelopeBytes);

      // Store in local blockstore cache in IndexedDB
      await this.options.storageAdapter.setMeta(`ipfs_block_${cid}`, envelopeJson);
      await this.options.storageAdapter.setMeta('latest_ipfs_cid', cid);
      this.lastPublishedCid = cid;

      // Attempt push to configured pinning services / IPFS nodes asynchronously
      this.pushToPinningEndpoints(cid, envelopeBytes).catch((err) => {
        console.warn('[IPFSRelayEngine] Remote pinning notice:', err.message);
      });

      this.options.onSnapshotPublished?.(cid, Date.now());

      return {
        cid,
        timestamp: Date.now(),
        sizeBytes: envelopeBytes.byteLength
      };
    } catch (err) {
      console.error('[IPFSRelayEngine] Failed creating snapshot:', err);
      return null;
    }
  }

  /**
   * Rehydrate the CRDT document from a target CID (e.g. on peer rejoining when other peers are offline).
   */
  public async rehydrateFromCid(cid: string): Promise<boolean> {
    try {
      // 1. Check local blockstore first
      let rawJson = await this.options.storageAdapter.getMeta<string>(`ipfs_block_${cid}`);

      // 2. If not local, fetch from IPFS gateways
      if (!rawJson) {
        rawJson = await this.fetchFromGateways(cid);
      }

      if (!rawJson) {
        console.warn(`[IPFSRelayEngine] Could not resolve CID ${cid} from local storage or gateways`);
        return false;
      }

      const envelope = JSON.parse(rawJson) as EncryptedEnvelope;

      // Decrypt snapshot
      const decryptedSnapshot = await decryptPayload(envelope, this.options.encryptionKey);

      // Apply to CRDT doc
      this.options.docManager.applyUpdate(decryptedSnapshot, 'ipfs-rehydration');

      // Persist to local storage
      await this.options.storageAdapter.setMeta('latest_ipfs_cid', cid);
      this.lastPublishedCid = cid;

      this.options.onSnapshotRehydrated?.(cid);
      return true;
    } catch (err) {
      console.error(`[IPFSRelayEngine] Rehydration failed for CID ${cid}:`, err);
      return false;
    }
  }

  /**
   * Fetch an IPFS block from public IPFS gateways with timeout and fallback.
   */
  private async fetchFromGateways(cid: string): Promise<string | null> {
    for (const gateway of this.publicGateways) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(`${gateway}${cid}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json, application/octet-stream' }
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const text = await res.text();
          // Cache in local blockstore
          await this.options.storageAdapter.setMeta(`ipfs_block_${cid}`, text);
          return text;
        }
      } catch {
        // Try next gateway
      }
    }
    return null;
  }

  /**
   * Push encrypted snapshot to pinning endpoints (e.g. Pinata, Web3.Storage, or IPFS API endpoint).
   */
  private async pushToPinningEndpoints(cid: string, data: Uint8Array): Promise<void> {
    if (this.pinningEndpoints.length === 0) return;

    for (const endpoint of this.pinningEndpoints) {
      try {
        const blob = new Blob([data as unknown as BlobPart], { type: 'application/octet-stream' });
        const formData = new FormData();
        formData.append('file', blob, `${cid}.bin`);

        await fetch(endpoint, {
          method: 'POST',
          body: formData
        });
      } catch (err) {
        console.warn(`[IPFSRelayEngine] Pinning to ${endpoint} failed:`, err);
      }
    }
  }

  public getLatestCid(): string | null {
    return this.lastPublishedCid;
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}
