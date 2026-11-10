import { WorkspaceCredentials } from '../crypto/types.js';

/**
 * Deterministically and securely parse workspace identity and passphrase from URL hash.
 * URL hash format: `#<workspaceId>:<passphrase>`
 * Note: Under RFC 3986, URL hash fragments are strictly client-side only and are NEVER transmitted
 * in HTTP request headers, ensuring zero server-side credential leakage.
 */
export function parseHashCredentials(hashString?: string): WorkspaceCredentials | null {
  const raw = hashString ?? (typeof window !== 'undefined' ? window.location.hash : '');
  if (!raw) return null;

  const clean = raw.startsWith('#') ? raw.slice(1) : raw;
  const separatorIndex = clean.indexOf(':');

  if (separatorIndex <= 0) return null;

  const workspaceId = clean.slice(0, separatorIndex).trim();
  const passphrase = clean.slice(separatorIndex + 1).trim();

  if (!workspaceId || !passphrase) return null;

  return { workspaceId, passphrase };
}

/**
 * Generate cryptographically secure random workspace credentials.
 */
export function generateWorkspaceCredentials(prefix = 'ws'): WorkspaceCredentials {
  const randomBytes = new Uint8Array(12);
  globalThis.crypto.getRandomValues(randomBytes);
  const randomHex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const workspaceId = `${prefix}-${randomHex.slice(0, 8)}`;
  const passphrase = randomHex.slice(8);

  return { workspaceId, passphrase };
}

/**
 * Format credentials as a URL hash fragment.
 */
export function formatHashCredentials(creds: WorkspaceCredentials): string {
  return `#${creds.workspaceId}:${creds.passphrase}`;
}

/**
 * Update the browser URL hash without causing a page reload or triggering network traffic.
 */
export function syncCredentialsToUrl(creds: WorkspaceCredentials): void {
  if (typeof window === 'undefined') return;
  const hash = formatHashCredentials(creds);
  if (window.location.hash !== hash) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
  }
}
