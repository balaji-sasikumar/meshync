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
  getDisplayUrl,
  getFaviconUrl,
  formatFeedDate,
  getAvatarColor,
} from "../domain/schema.ts";

interface BookmarkItemProps {
  bookmark: Bookmark;
  currentUserName: string;
  showAuthor?: boolean;
  onTogglePin: (id: string, current: boolean) => void;
  onToggleArchive: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (bookmark: Bookmark) => void;
  onSelectTag: (tag: string) => void;
}

export const BookmarkItem: React.FC<BookmarkItemProps> = ({
  bookmark,
  currentUserName,
  showAuthor = true,
  onTogglePin,
  onToggleArchive,
  onDelete,
  onEdit,
  onSelectTag,
}) => {
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);

  const MAX_VISIBLE_TAGS = 2;
  const tags = bookmark.tags || [];
  const hasMoreTags = tags.length > MAX_VISIBLE_TAGS;
  const visibleTags = showAllTags ? tags : tags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenTagCount = tags.length - MAX_VISIBLE_TAGS;

  const domain = getDomain(bookmark.url);
  const displayUrl = getDisplayUrl(bookmark.url);
  const authorName = bookmark.author || "Anonymous";
  const isSelf =
    currentUserName &&
    authorName.toLowerCase() === currentUserName.toLowerCase();
  const authorColor = getAvatarColor(authorName);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(bookmark.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenCard = () => {
    if (isMenuOpen) return;
    const selectedText = typeof window !== "undefined" ? window.getSelection()?.toString() : "";
    if (selectedText) return;
    window.open(bookmark.url, "_blank", "noopener,noreferrer");
  };

  return (
    <article
      onClick={handleOpenCard}
      className="bg-white dark:bg-[#121721] rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-3.5 sm:p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition-all relative group cursor-pointer active:scale-[0.997]"
    >
      {/* Top Meta Row: Favicon + Domain + Author Dot + Date */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Favicon Icon */}
          <div className="w-4 h-4 rounded shrink-0 overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800">
            {imgError ? (
              <Globe className="w-3 h-3 text-slate-400" strokeWidth={1.75} />
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

          {/* Domain */}
          <span className="font-medium text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400 truncate">
            {domain}
          </span>

          {showAuthor && (
            <>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                <span
                  className={`w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-[7px] font-bold shrink-0 ${authorColor.bg} ${authorColor.text}`}
                >
                  {authorName.substring(0, 1).toUpperCase()}
                </span>
                <span className="truncate font-medium">
                  {isSelf ? "You" : authorName}
                </span>
              </span>
            </>
          )}
        </div>

        {/* Date & Pin Status */}
        <div className="flex items-center gap-2 shrink-0">
          {bookmark.pinned && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
              <Pin className="w-2.5 h-2.5 fill-current" />
              <span>Pinned</span>
            </span>
          )}
          <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 tabular-nums">
            {formatFeedDate(bookmark.createdAt)}
          </span>
        </div>
      </div>

      {/* Main Title Row */}
      <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 leading-snug tracking-[-0.01em] mb-1 break-words">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors inline"
        >
          {bookmark.title}
          <ExternalLink className="inline-block w-3.5 h-3.5 ml-1.5 text-slate-400 opacity-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:opacity-90 transition -translate-y-0.5" strokeWidth={1.75} />
        </a>
      </h2>

      {/* Subtle URL Path Preview */}
      <p className="text-xs text-slate-400 dark:text-slate-500 truncate mb-2">
        {displayUrl}
      </p>

      {/* Optional Description */}
      {bookmark.description && (
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2.5 line-clamp-2">
          {bookmark.description}
        </p>
      )}

      {/* Bottom Row: Tag Pills + Action Icons */}
      <div
        className={`flex justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/70 ${
          showAllTags ? "items-start" : "items-center"
        }`}
      >
        {/* Tags (single row with +N pill by default; wraps when expanded) */}
        <div
          className={`flex items-center gap-1.5 min-w-0 ${
            showAllTags ? "flex-wrap" : "flex-nowrap overflow-hidden"
          }`}
        >
          {visibleTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectTag(tag);
              }}
              className="h-6 px-2 rounded-md text-[11px] font-medium bg-slate-100/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 transition max-w-[120px] truncate shrink inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              #{tag}
            </button>
          ))}
          {hasMoreTags && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAllTags((prev) => !prev);
              }}
              className="h-6 px-2 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition shrink-0 whitespace-nowrap inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              {showAllTags ? "Less" : `+${hiddenTagCount}`}
            </button>
          )}
        </div>

        {/* Action Buttons: Copy, Pin, 3-Dot Menu */}
        <div className="flex items-center gap-0.5 text-slate-400 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy URL"
            aria-label="Copy URL"
            className="w-7 h-7 rounded-lg hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" strokeWidth={2} />
            ) : (
              <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(bookmark.id, bookmark.pinned);
            }}
            title={bookmark.pinned ? "Unpin" : "Pin to top"}
            aria-label={bookmark.pinned ? "Unpin" : "Pin to top"}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
              bookmark.pinned
                ? "text-amber-500 hover:bg-amber-500/10"
                : "hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Pin
              className={`w-3.5 h-3.5 ${bookmark.pinned ? "fill-current" : ""}`}
              strokeWidth={1.75}
            />
          </button>

          {/* 3-Dot Menu */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                setConfirmDelete(false);
                setIsMenuOpen(!isMenuOpen);
              }}
              title="More options"
              aria-label="More options"
              className="w-7 h-7 rounded-lg hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              <MoreVertical className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setConfirmDelete(false);
                  }}
                />
                <div className="absolute right-0 bottom-full mb-1 z-40 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 text-xs">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setConfirmDelete(false);
                      onEdit(bookmark);
                    }}
                    className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setConfirmDelete(false);
                      onToggleArchive(bookmark.id, bookmark.archived);
                    }}
                    className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>{bookmark.archived ? "Unarchive" : "Archive"}</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                  {confirmDelete ? (
                    <div className="px-2 py-1 flex items-center gap-1">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setConfirmDelete(false);
                          onDelete(bookmark.id);
                        }}
                        className="flex-1 py-1 px-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold transition"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-semibold transition"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
