import { WorkspaceCredentials } from '../crypto/types.js';

const STORAGE_KEY_ACTIVE = 'localfirst_active_workspace';
const STORAGE_KEY_HISTORY = 'localfirst_workspaces_history';

export interface WorkspaceHistoryItem {
  workspaceId: string;
  passphrase: string;
  lastAccessed: number;
}

/**
 * Deterministically and robustly parse workspace identity and passphrase.
 * Handles:
 * - Full URLs: https://domain.com/path#ws-id:passphrase
 * - URL encoded fragments: #ws-id%3Apassphrase
 * - Bare hashes: #ws-id:passphrase
 * - Plain strings: ws-id:passphrase
 */
export function parseHashCredentials(inputString?: string): WorkspaceCredentials | null {
  let raw = inputString;
  if (!raw && typeof window !== 'undefined') {
    raw = window.location.hash || window.location.href;
  }
  if (!raw) return null;

  // 1. Decode URI component in case browser or clipboard encoded `:` as `%3A`
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // Keep raw if decode fails
  }

  // 2. Extract hash portion if full URL was provided
  const hashIndex = raw.indexOf('#');
  let clean = hashIndex >= 0 ? raw.slice(hashIndex + 1) : raw;

  // Strip query parameters or trailing slashes if any
  clean = clean.split('?')[0].split('/')[0].trim();

  if (!clean) return null;

  // 3. Find separator colon
  const separatorIndex = clean.indexOf(':');

  if (separatorIndex > 0) {
    const workspaceId = clean.slice(0, separatorIndex).trim();
    const passphrase = clean.slice(separatorIndex + 1).trim();

    if (workspaceId && passphrase) {
      return { workspaceId, passphrase };
    }
  }

  // 4. Fallback: If only workspaceId was passed (no colon), check local history for saved passphrase
  const history = getWorkspacesHistory();
  const matched = history.find((h) => h.workspaceId === clean);
  if (matched) {
    return { workspaceId: matched.workspaceId, passphrase: matched.passphrase };
  }

  return null;
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
 * Update the browser URL hash without causing a page reload.
 */
export function syncCredentialsToUrl(creds: WorkspaceCredentials): void {
  if (typeof window === 'undefined') return;
  const hash = formatHashCredentials(creds);

  // Save to localStorage as last active workspace on this device
  saveActiveWorkspace(creds);

  if (window.location.hash !== hash) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
  }
}

/**
 * Persist active workspace to device localStorage so page refreshes never lose state.
 */
export function saveActiveWorkspace(creds: WorkspaceCredentials): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(creds));

    // Update history list
    const history = getWorkspacesHistory();
    const filtered = history.filter((h) => h.workspaceId !== creds.workspaceId);
    filtered.unshift({
      workspaceId: creds.workspaceId,
      passphrase: creds.passphrase,
      lastAccessed: Date.now()
    });
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(filtered.slice(0, 15)));
  } catch {}
}

/**
 * Retrieve the last active workspace credentials from device localStorage.
 */
export function getSavedActiveWorkspace(): WorkspaceCredentials | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.workspaceId && parsed.passphrase) {
      return parsed as WorkspaceCredentials;
    }
  } catch {}
  return null;
}

/**
 * Retrieve list of recent workspaces visited on this device.
 */
export function getWorkspacesHistory(): WorkspaceHistoryItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw) as WorkspaceHistoryItem[];
  } catch {
    return [];
  }
}
