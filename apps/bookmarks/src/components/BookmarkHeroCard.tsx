import React from 'react';
import { Plus, Bookmark as BookmarkIcon, Pin, ShieldCheck } from 'lucide-react';
import type { Bookmark, SpaceMeta } from '../domain/schema.ts';

interface BookmarkHeroCardProps {
  bookmarks: Bookmark[];
  spaceMeta: SpaceMeta | null;
  onOpenAddBookmark: () => void;
}

export const BookmarkHeroCard: React.FC<BookmarkHeroCardProps> = ({
  bookmarks,
  spaceMeta,
  onOpenAddBookmark
}) => {
  const activeBookmarks = bookmarks.filter(b => !b.archived);
  const pinnedCount = activeBookmarks.filter(b => b.pinned).length;
  const uniqueTagsCount = new Set(activeBookmarks.flatMap(b => b.tags || [])).size;
  const memberCount = spaceMeta?.members?.length || 1;

  return (
    <div className="px-4 py-1">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-sky-500/20 p-3.5 sm:p-4 transition-all duration-300">
        {/* Subtle decorative glow */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3">
          {/* Left Column: Total Saved Links */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest leading-none mb-1">
              Total Saved Links
            </p>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight truncate">
              {activeBookmarks.length} {activeBookmarks.length === 1 ? 'Link' : 'Links'}
            </h2>
            <p className="text-[11px] text-white/85 font-medium mt-0.5">
              {pinnedCount} pinned • {uniqueTagsCount} tags • {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </p>
          </div>

          {/* Right Column: Encrypted Badge */}
          <div className="bg-white/20 backdrop-blur-md border border-white/25 rounded-xl px-3 py-2 text-right shrink-0">
            <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-white/90 uppercase tracking-wider mb-0.5">
              <ShieldCheck className="w-3 h-3 text-sky-200" />
              <span>Encrypted</span>
            </div>
            <p className="text-xs font-black tracking-tight font-mono">
              P2P Mesh
            </p>
          </div>
        </div>

        {/* Action Button inside Hero Card */}
        <div className="mt-3 pt-3 border-t border-white/20">
          <button
            onClick={onOpenAddBookmark}
            className="w-full py-2 px-4 rounded-xl bg-white text-sky-700 hover:bg-sky-50 font-extrabold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-sky-600" />
            <span>Add Bookmark</span>
          </button>
        </div>
      </div>
    </div>
  );
};
