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
}

export const PRESET_TAGS = [
  'Distributed Systems',
  'Local-First',
  'Cryptography',
  'CRDT',
  'WebRTC',
  'IPFS',
  'Research Papers',
  'Tools'
] as const;
