/**
 * Cryptographic envelope definitions for `@localfirst/mesh-sync`.
 * Every state payload leaving the browser is encrypted with a unique initialization vector (IV)
 * using AES-GCM 256-bit with an authenticated integrity tag.
 */

export interface EncryptedEnvelope {
  /** Envelope protocol version */
  v: number;
  /** Base64-encoded 12-byte initialization vector */
  iv: string;
  /** Base64-encoded ciphertext (includes AES-GCM 128-bit authentication tag) */
  data: string;
  /** Unix timestamp (milliseconds) when envelope was sealed */
  ts: number;
  /** Workspace fingerprint (SHA-256 prefix) for fast message routing */
  fp?: string;
}

export interface WorkspaceCredentials {
  workspaceId: string;
  passphrase: string;
}
