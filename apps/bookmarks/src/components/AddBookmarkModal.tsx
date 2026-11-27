import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Globe, Sparkles, Loader2 } from 'lucide-react';
import type { Bookmark } from '../domain/schema.ts';
import { PRESET_TAGS, getDomain, getAvatarColor } from '../domain/schema.ts';
import { fetchUrlMeta } from '../lib/fetchUrlMeta.ts';

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>, editId?: string) => void;
  editingBookmark?: Bookmark | null;
  initialUrl?: string;
  existingTags: string[];
  currentUserName: string;
}

export const AddBookmarkModal: React.FC<AddBookmarkModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingBookmark = null,
  initialUrl = '',
  existingTags,
  currentUserName
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [pinned, setPinned] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [aiEnhanced, setAiEnhanced] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const lastFetchedUrl = useRef('');
  const fetchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Cancel any in-flight fetch when the modal re-opens / resets
      fetchAbortRef.current?.abort();
      fetchAbortRef.current = null;

      if (editingBookmark) {
        setUrl(editingBookmark.url);
        setTitle(editingBookmark.title);
        setDescription(editingBookmark.description || '');
        setSelectedTags(editingBookmark.tags || []);
        setPinned(editingBookmark.pinned);
      } else {
        setUrl(initialUrl);
        if (initialUrl.trim()) {
          const d = getDomain(initialUrl);
          const cleanName = d.split('.')[0];
          setTitle(cleanName ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) : '');
        } else {
          setTitle('');
        }
        setDescription('');
        setSelectedTags([]);
        setPinned(false);
      }
      setNewTagInput('');
      setAiEnhanced(false);
      setFetchError(false);
      lastFetchedUrl.current = '';
    }
  }, [isOpen, editingBookmark, initialUrl]);

  if (!isOpen) return null;

  /**
   * When the user leaves the URL field (or pastes a URL), try to auto-populate
   * title + description by fetching page metadata via a CORS proxy.
   * Falls back to a plain domain-name title if the fetch fails.
   */
  const handleUrlBlur = async () => {
    const trimmed = url.trim();
    if (!trimmed || trimmed === lastFetchedUrl.current) return;
    lastFetchedUrl.current = trimmed;

    // Cancel any previous in-flight fetch
    fetchAbortRef.current?.abort();
    const ctrl = new AbortController();
    fetchAbortRef.current = ctrl;

    // Kick off fetch (show spinner)
    setIsFetching(true);
    setFetchError(false);
    setAiEnhanced(false);

    const meta = await fetchUrlMeta(trimmed, ctrl.signal);
    // Ignore stale result if a new fetch was started or modal closed
    if (ctrl.signal.aborted) return;

    setIsFetching(false);

    if (meta) {
      if (meta.title && !title.trim()) setTitle(meta.title);
      if (meta.description && !description.trim()) setDescription(meta.description);
      setAiEnhanced(!!meta.aiEnhanced);
    } else {
      // Fallback: derive from domain
      setFetchError(true);
      if (!title.trim()) {
        const d = getDomain(trimmed);
        const cleanName = d.split('.')[0];
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTagInput.trim().replace(/^#/, '');
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !title.trim()) return;

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const pendingTag = newTagInput.trim().replace(/^#/, '');
    const finalTags =
      pendingTag && !selectedTags.includes(pendingTag)
        ? [...selectedTags, pendingTag]
        : selectedTags;

    onSubmit(
      {
        url: formattedUrl,
        title: title.trim(),
        description: description.trim() || undefined,
        tags: finalTags,
        pinned,
        archived: editingBookmark ? editingBookmark.archived : false,
        author: editingBookmark?.author || currentUserName || 'Anonymous'
      },
      editingBookmark?.id
    );

    onClose();
  };

  // Put user-created / previously used tags and active selections first so they are never hidden behind presets
  const allAvailableTags = Array.from(
    new Set([...existingTags, ...selectedTags, ...PRESET_TAGS])
  );
  const userColor = getAvatarColor(currentUserName || 'Author');

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6 relative border-t sm:border border-slate-100 dark:border-slate-800 max-h-[90dvh] sm:max-h-[92vh] overflow-y-auto overscroll-contain"
      >
        {/* Mobile bottom-sheet drag handle */}
        <div className="sm:hidden flex justify-center -mt-2 mb-3">
          <div className="w-9 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {editingBookmark ? 'Edit Link' : 'Save New Link'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Save a link for everyone in this space
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* URL Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Website URL
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                {isFetching
                  ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  : <Globe className="w-4 h-4" strokeWidth={1.75} />}
              </span>
              <input
                type="text"
                required
                autoFocus
                value={url}
                onChange={e => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="https://github.com/..."
                className="w-full pl-9 pr-3.5 py-2 text-base sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition dark:text-white font-mono"
              />
            </div>
            {/* Status feedback */}
            {isFetching && (
              <p className="mt-1 text-[10px] text-blue-500 dark:text-blue-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Fetching page info…
              </p>
            )}
            {!isFetching && fetchError && (
              <p className="mt-1 text-[10px] text-amber-500 dark:text-amber-400">
                Couldn't auto-fill — fill in title manually.
              </p>
            )}
          </div>

          {/* Title Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Link Title
              </label>
              {isFetching && <span className="text-[10px] text-blue-400 italic">auto-filling…</span>}
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Local-First Software Manifesto"
              className="w-full px-3.5 py-2 text-base sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition dark:text-white"
            />
          </div>

          {/* Description Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Note / Description (Optional)
              </label>
              {aiEnhanced && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-purple-500 dark:text-purple-400 font-semibold">
                  <Sparkles className="w-3 h-3" /> AI summary
                </span>
              )}
            </div>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Key insights, context, or summary..."
              className="w-full px-3.5 py-2 text-base sm:text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition dark:text-white resize-none"
            />
          </div>

          {/* Tags Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Tags ({selectedTags.length} selected)
              </label>
            </div>

            {/* Tag Pills (created tags + presets, all visible without vertical clipping) */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {allAvailableTags.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>

            {/* Add Custom Tag Input */}
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newTagInput}
                onChange={e => setNewTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                placeholder="New tag..."
                className="flex-1 min-w-0 px-3 py-1.5 text-base sm:text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:text-white"
              />
              <button
                type="button"
                onClick={() => handleAddCustomTag()}
                disabled={!newTagInput.trim()}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 rounded-xl text-xs font-semibold transition shrink-0"
              >
                + Tag
              </button>
            </div>
          </div>

          {/* Author Badge & Pin to Top */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${userColor.bg} ${userColor.text}`}
              >
                {(currentUserName || 'A').substring(0, 1).toUpperCase()}
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Publishing as <strong className="text-slate-800 dark:text-slate-200">{currentUserName || 'Anonymous'}</strong>
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={pinned}
                onChange={e => setPinned(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pin to top</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!url.trim() || !title.trim()}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
          >
            <Check className="w-4 h-4" strokeWidth={2} />
            <span>{editingBookmark ? 'Update Link' : 'Save Link'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
