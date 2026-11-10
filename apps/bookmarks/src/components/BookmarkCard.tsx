import React from 'react';
import type { Bookmark } from '../domain/schema.ts';
import {
  ExternalLink,
  Pin,
  Archive,
  ArchiveRestore,
  Trash2,
  Calendar,
  Globe
} from 'lucide-react';

interface Props {
  bookmark: Bookmark;
  onTogglePin: (id: string, current: boolean) => void;
  onToggleArchive: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onSelectTag: (tag: string) => void;
}

export const BookmarkCard: React.FC<Props> = ({
  bookmark,
  onTogglePin,
  onToggleArchive,
  onDelete,
  onSelectTag
}) => {
  let hostname = '';
  try {
    hostname = new URL(bookmark.url).hostname.replace('www.', '');
  } catch {
    hostname = bookmark.url;
  }

  const dateStr = new Date(bookmark.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });

  return (
    <div
      className={`bg-slate-900/80 border rounded-xl p-4 flex flex-col justify-between gap-3 transition-all duration-200 hover:border-slate-700 shadow-md ${
        bookmark.pinned
          ? 'border-indigo-500/40 bg-indigo-950/20 shadow-indigo-500/5'
          : 'border-slate-800'
      }`}
    >
      <div className="space-y-2">
        {/* Top meta */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate max-w-[160px]">{hostname}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onTogglePin(bookmark.id, bookmark.pinned)}
              className={`p-1 rounded-md transition-colors ${
                bookmark.pinned
                  ? 'text-indigo-400 bg-indigo-500/10'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title={bookmark.pinned ? 'Unpin bookmark' : 'Pin to top'}
            >
              <Pin className={`w-3.5 h-3.5 ${bookmark.pinned ? 'fill-indigo-400' : ''}`} />
            </button>

            <button
              onClick={() => onToggleArchive(bookmark.id, bookmark.archived)}
              className="p-1 text-slate-500 hover:text-slate-300 rounded-md transition-colors"
              title={bookmark.archived ? 'Unarchive' : 'Archive'}
            >
              {bookmark.archived ? (
                <ArchiveRestore className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Archive className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={() => onDelete(bookmark.id)}
              className="p-1 text-slate-500 hover:text-rose-400 rounded-md transition-colors"
              title="Delete bookmark"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start justify-between gap-2 text-slate-100 hover:text-indigo-300 transition-colors"
        >
          <h3 className="font-semibold text-sm leading-snug line-clamp-2">
            {bookmark.title || bookmark.url}
          </h3>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 flex-shrink-0 mt-0.5" />
        </a>

        {/* Description */}
        {bookmark.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {bookmark.description}
          </p>
        )}
      </div>

      {/* Footer Tags & Date */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex flex-wrap gap-1">
          {bookmark.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onSelectTag(tag)}
              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>

        <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">{dateStr}</span>
      </div>
    </div>
  );
};
