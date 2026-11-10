import React, { useState } from "react";
import {
  Globe,
  Pin,
  ExternalLink,
  Copy,
  Check,
  MoreVertical,
  Edit2,
  Archive,
  Trash2,
} from "lucide-react";
import type { Bookmark } from "../domain/schema.ts";
import {
  getDomain,
  getFaviconUrl,
  formatFeedDate,
  getAvatarColor,
} from "../domain/schema.ts";

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
  onSelectTag,
}) => {
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const domain = getDomain(bookmark.url);
  const authorName = bookmark.author || "Anonymous";
  const authorColor = getAvatarColor(authorName);
  const isSelf =
    currentUserName &&
    authorName.toLowerCase() === currentUserName.toLowerCase();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(bookmark.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="border-b border-slate-200/80 dark:border-slate-800/80 py-4 px-2 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors relative group">
      {/* Top Meta Row: Favicon + Domain / Author + Date + Pin badge */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          {/* Favicon Icon */}
          <div className="w-4 h-4 rounded shrink-0 overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800">
            {imgError ? (
              <Globe className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <img
                src={getFaviconUrl(bookmark.url)}
                alt=""
                onError={() => setImgError(true)}
                className="w-3.5 h-3.5 object-contain"
                loading="lazy"
              />
            )}
          </div>

          {/* Domain in Uppercase */}
          <span className="font-bold text-[11px] tracking-wider uppercase text-slate-700 dark:text-slate-300 truncate">
            {domain}
          </span>

          <span className="text-slate-400 dark:text-slate-600">•</span>

          {/* Author Name */}
          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
            <span>By {authorName}</span>
            {isSelf && (
              <span className="text-sky-500 font-semibold">(You)</span>
            )}
          </span>
        </div>

        {/* Date & Pin Status */}
        <div className="flex items-center gap-2 shrink-0">
          {bookmark.pinned && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
              <Pin className="w-2.5 h-2.5 fill-current" />
              <span>PINNED</span>
            </span>
          )}
          <span className="text-[11px] font-semibold text-slate-400 tracking-wider">
            {formatFeedDate(bookmark.createdAt)}
          </span>
        </div>
      </div>

      {/* Main Title Row: Clean, Bold, Wraps naturally without cutting off */}
      <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug mb-1.5 hover:text-sky-500 transition-colors">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-baseline gap-1"
        >
          <span>{bookmark.title}</span>
          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition shrink-0 translate-y-0.5" />
        </a>
      </h2>

      {/* Optional Description */}
      {bookmark.description && (
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2 line-clamp-2">
          {bookmark.description}
        </p>
      )}

      {/* Bottom Row: Tag Pills + Action Icons */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-1">
        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {bookmark.tags && bookmark.tags.length > 0 ? (
            bookmark.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onSelectTag(tag)}
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-500 hover:text-white transition"
              >
                #{tag}
              </button>
            ))
          ) : (
            <span className="text-[11px] text-slate-400 italic">No tags</span>
          )}
        </div>

        {/* Action Buttons: Copy, Pin, 3-Dot Menu */}
        <div className="flex items-center gap-1 text-slate-400">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy URL"
            className="p-1.5 rounded-lg hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onTogglePin(bookmark.id, bookmark.pinned)}
            title={bookmark.pinned ? "Unpin" : "Pin to top"}
            className={`p-1.5 rounded-lg transition ${
              bookmark.pinned
                ? "text-amber-500 hover:bg-amber-500/10"
                : "hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800"
            }`}
          >
            <Pin
              className={`w-3.5 h-3.5 ${bookmark.pinned ? "fill-current" : ""}`}
            />
          </button>

          {/* 3-Dot Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              title="More options"
              className="p-1.5 rounded-lg hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 bottom-full mb-1 z-40 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 text-xs">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit(bookmark);
                    }}
                    className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onToggleArchive(bookmark.id, bookmark.archived);
                    }}
                    className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>{bookmark.archived ? "Unarchive" : "Archive"}</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (confirm(`Delete bookmark "${bookmark.title}"?`)) {
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
    </article>
  );
};
