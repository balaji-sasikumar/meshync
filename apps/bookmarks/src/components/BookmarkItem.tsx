import React, { useState } from 'react';
import {
  Globe,
  Pin,
  ExternalLink,
  Copy,
  Check,
  MoreVertical,
  Edit2,
  Archive,
  Trash2
} from 'lucide-react';
import type { Bookmark } from '../domain/schema.ts';
import { getDomain, getFaviconUrl, formatTimeAgo, getAvatarColor } from '../domain/schema.ts';

interface BookmarkItemProps {
  bookmark: Bookmark;
  currentUserName: string;
  onTogglePin: (id: string, current: boolean) => void;
  onToggleArchive: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (bookmark: Bookmark) => void;
  onSelectTag: (tag: string) => void;
}

export const BookmarkItem: React.FC<BookmarkItemProps> = ({
  bookmark,
  currentUserName,
  onTogglePin,
  onToggleArchive,
  onDelete,
  onEdit,
  onSelectTag
}) => {
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const domain = getDomain(bookmark.url);
  const authorName = bookmark.author || 'Anonymous';
  const authorColor = getAvatarColor(authorName);
  const isSelf = currentUserName && authorName.toLowerCase() === currentUserName.toLowerCase();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(bookmark.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border rounded-2xl p-3 sm:p-3.5 transition-all shadow-sm hover:shadow-md relative group ${
        bookmark.pinned
          ? 'border-amber-300 dark:border-amber-500/40 bg-amber-500/[0.02]'
          : 'border-slate-200/80 dark:border-slate-800'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Favicon / Web Icon in squircle */}
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`Open ${domain}`}
          className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:scale-105 transition"
        >
          {imgError ? (
            <Globe className="w-5 h-5 text-sky-500 dark:text-sky-400" />
          ) : (
            <img
              src={getFaviconUrl(bookmark.url)}
              alt=""
              onError={() => setImgError(true)}
              className="w-5 h-5 object-contain"
              loading="lazy"
            />
          )}
        </a>

        {/* Content Section */}
        <div className="flex-1 min-w-0 pr-1">
          {/* Title row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-sm text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition truncate max-w-[calc(100%-2rem)] flex items-center gap-1"
            >
              <span>{bookmark.title}</span>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition shrink-0" />
            </a>

            {bookmark.pinned && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded text-[9px] font-black uppercase tracking-wider shrink-0">
                <Pin className="w-2.5 h-2.5 fill-current" />
                <span>Pinned</span>
              </span>
            )}
          </div>

          {/* Subtitle: Domain • Published by [Author] • Date */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
            <span className="font-semibold text-slate-600 dark:text-slate-300">{domain}</span>
            <span>•</span>
            <div className="inline-flex items-center gap-1">
              <span
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black ${authorColor.bg} ${authorColor.text}`}
              >
                {authorName.substring(0, 1).toUpperCase()}
              </span>
              <span>
                By <strong className="font-semibold text-slate-700 dark:text-slate-200">{authorName}</strong>
                {isSelf && ' (You)'}
              </span>
            </div>
            <span>•</span>
            <span>{formatTimeAgo(bookmark.createdAt)}</span>
          </div>

          {/* Optional Description */}
          {bookmark.description && (
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
              {bookmark.description}
            </p>
          )}

          {/* Tags List */}
          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {bookmark.tags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onSelectTag(tag)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 transition"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Action Icons & 3-Dot Menu */}
        <div className="flex items-center gap-1 shrink-0 pt-0.5">
          {/* Quick Copy Link */}
          <button
            type="button"
            onClick={handleCopy}
            title={copied ? 'Copied URL!' : 'Copy URL'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Quick Pin Toggle */}
          <button
            type="button"
            onClick={() => onTogglePin(bookmark.id, bookmark.pinned)}
            title={bookmark.pinned ? 'Unpin bookmark' : 'Pin to top'}
            className={`p-1.5 rounded-lg transition ${
              bookmark.pinned
                ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${bookmark.pinned ? 'fill-current' : ''}`} />
          </button>

          {/* 3-Dot Vertical Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              title="More options"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20 cursor-default"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div
                  onClick={e => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs font-semibold"
                >
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Open link</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit(bookmark);
                    }}
                    className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-sky-500" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onToggleArchive(bookmark.id, bookmark.archived);
                    }}
                    className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Archive className="w-3.5 h-3.5 text-amber-500" />
                    <span>{bookmark.archived ? 'Unarchive' : 'Archive'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (confirm(`Delete "${bookmark.title}"?`)) {
                        onDelete(bookmark.id);
                      }
                    }}
                    className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
