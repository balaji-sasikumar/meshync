export interface Bookmark {
  id: string;
  url: string;
  title: string;
  tags: string[];
  description?: string;
  pinned: boolean;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
  author?: string; // Who published this link
}

export interface SpaceMeta {
  id: string;
  name: string;
  members: string[];
  createdAt: number;
}

export const PRESET_TAGS = [
  'Local-First',
  'CRDT',
  'WebRTC',
  'IPFS',
  'Tech & Dev',
  'Design',
  'Tools',
  'Research',
  'Articles'
] as const;

export function getDomain(urlStr: string): string {
  try {
    const formatted = urlStr.startsWith('http://') || urlStr.startsWith('https://')
      ? urlStr
      : `https://${urlStr}`;
    const parsed = new URL(formatted);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'link';
  }
}

export function getFaviconUrl(urlStr: string): string {
  const domain = getDomain(urlStr);
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

export function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const AVATAR_COLORS = [
  { bg: 'bg-indigo-500', text: 'text-white' },
  { bg: 'bg-emerald-500', text: 'text-white' },
  { bg: 'bg-purple-500', text: 'text-white' },
  { bg: 'bg-amber-500', text: 'text-white' },
  { bg: 'bg-rose-500', text: 'text-white' },
  { bg: 'bg-cyan-500', text: 'text-white' },
  { bg: 'bg-blue-500', text: 'text-white' },
  { bg: 'bg-teal-500', text: 'text-white' }
];

export function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}
