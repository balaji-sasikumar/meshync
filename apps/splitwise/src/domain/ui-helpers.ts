// Helper mappings for categories, currencies, and member avatars

export interface CategoryInfo {
  name: string;
  emoji: string;
  bg: string;
  text: string;
}

export const CATEGORY_INFO: Record<string, CategoryInfo> = {
  'Food & Dining': { name: 'Food & Dining', emoji: '🍔', bg: 'bg-amber-100', text: 'text-amber-800' },
  'Groceries': { name: 'Groceries', emoji: '🛒', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  'Travel & Transit': { name: 'Travel & Transit', emoji: '🚕', bg: 'bg-sky-100', text: 'text-sky-800' },
  'Lodging': { name: 'Lodging', emoji: '🏠', bg: 'bg-indigo-100', text: 'text-indigo-800' },
  'Entertainment': { name: 'Entertainment', emoji: '🎟️', bg: 'bg-purple-100', text: 'text-purple-800' },
  'Utilities': { name: 'Utilities', emoji: '⚡', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'Shopping': { name: 'Shopping', emoji: '🛍️', bg: 'bg-pink-100', text: 'text-pink-800' },
  'General': { name: 'General', emoji: '🧾', bg: 'bg-slate-100', text: 'text-slate-800' }
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CAD: 'CA$'
};

export function getCurrencySymbol(curr: string = 'USD'): string {
  return CURRENCY_SYMBOLS[curr] || curr;
}

const AVATAR_PALETTES = [
  { bg: 'bg-sky-500', text: 'text-white', lightBg: 'bg-sky-100', lightText: 'text-sky-800' },
  { bg: 'bg-pink-500', text: 'text-white', lightBg: 'bg-pink-100', lightText: 'text-pink-800' },
  { bg: 'bg-emerald-500', text: 'text-white', lightBg: 'bg-emerald-100', lightText: 'text-emerald-800' },
  { bg: 'bg-purple-500', text: 'text-white', lightBg: 'bg-purple-100', lightText: 'text-purple-800' },
  { bg: 'bg-amber-500', text: 'text-white', lightBg: 'bg-amber-100', lightText: 'text-amber-800' },
  { bg: 'bg-teal-500', text: 'text-white', lightBg: 'bg-teal-100', lightText: 'text-teal-800' },
  { bg: 'bg-rose-500', text: 'text-white', lightBg: 'bg-rose-100', lightText: 'text-rose-800' },
  { bg: 'bg-indigo-500', text: 'text-white', lightBg: 'bg-indigo-100', lightText: 'text-indigo-800' }
];

export function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[idx];
}

export function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
