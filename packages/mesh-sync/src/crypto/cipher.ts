import { EncryptedEnvelope } from './types.js';

/**
 * Helper to get the standard Web Crypto instance in browser or modern Node.js runtimes.
 */
function getSubtleCrypto(): SubtleCrypto {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('Web Crypto API (crypto.subtle) is unavailable in this environment.');
}

/**
 * Base64 encoding/decoding utilities compatible with Uint8Array.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Compute a SHA-256 digest returning a hex string.
 */
export async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const subtle = getSubtleCrypto();
  const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const hashBuffer = await subtle.digest('SHA-256', data as unknown as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}


/**
 * Derive a 256-bit AES-GCM encryption key from a passphrase and workspaceId using PBKDF2.
 * Uses 100,000 iterations of SHA-256 and a workspace-isolated salt.
 */
export async function deriveKey(passphrase: string, workspaceId: string): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const enc = new TextEncoder();

  // Import passphrase as PBKDF2 raw key material
  const keyMaterial = await subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive deterministic 16-byte salt from workspaceId
  const saltHash = await subtle.digest('SHA-256', enc.encode(`localfirst:salt:${workspaceId}`));
  const salt = new Uint8Array(saltHash).slice(0, 16);

  // Derive AES-GCM 256-bit symmetric key
  return await subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a binary payload into a sealed EncryptedEnvelope using AES-GCM with a fresh random 12-byte IV.
 */
export async function encryptPayload(
  payload: Uint8Array,
  key: CryptoKey,
  workspaceFingerprint?: string
): Promise<EncryptedEnvelope> {
  const subtle = getSubtleCrypto();
  const iv = new Uint8Array(12);
  globalThis.crypto.getRandomValues(iv);

  const ciphertextBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource
    },
    key,
    payload as unknown as BufferSource
  );

  return {
    v: 1,
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(ciphertextBuffer)),
    ts: Date.now(),
    fp: workspaceFingerprint
  };
}

/**
 * Decrypt an EncryptedEnvelope back into its original binary payload.
 * Throws an error if authentication fails (tampering, wrong key, or corrupted payload).
 */
export async function decryptPayload(
  envelope: EncryptedEnvelope,
  key: CryptoKey
): Promise<Uint8Array> {
  const subtle = getSubtleCrypto();
  const iv = base64ToBytes(envelope.iv);
  const ciphertext = base64ToBytes(envelope.data);

  const decryptedBuffer = await subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource
    },
    key,
    ciphertext as unknown as BufferSource
  );

  return new Uint8Array(decryptedBuffer);
}

/**
 * Generate a short cryptographic workspace routing fingerprint.
 * This can be used on public signaling relays without revealing the passphrase or full workspace id.
 */
export async function computeWorkspaceFingerprint(
  workspaceId: string,
  passphrase: string
): Promise<string> {
  const hash = await sha256Hex(`mesh-room:${workspaceId}:${passphrase}`);
  return hash.slice(0, 16);
}
