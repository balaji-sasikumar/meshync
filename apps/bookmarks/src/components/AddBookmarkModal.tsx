import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Bookmark as BookmarkIcon, Tag, Globe, User } from 'lucide-react';
import type { Bookmark } from '../domain/schema.ts';
import { PRESET_TAGS, getDomain, getAvatarColor } from '../domain/schema.ts';

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>, editId?: string) => void;
  editingBookmark?: Bookmark | null;
  existingTags: string[];
  currentUserName: string;
}

export const AddBookmarkModal: React.FC<AddBookmarkModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingBookmark = null,
  existingTags,
  currentUserName
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingBookmark) {
        setUrl(editingBookmark.url);
        setTitle(editingBookmark.title);
        setDescription(editingBookmark.description || '');
        setSelectedTags(editingBookmark.tags || []);
        setPinned(editingBookmark.pinned);
      } else {
        setUrl('');
        setTitle('');
        setDescription('');
        setSelectedTags([]);
        setPinned(false);
      }
      setNewTagInput('');
    }
  }, [isOpen, editingBookmark]);

  if (!isOpen) return null;

  // Auto-fill title from URL domain if title is empty
  const handleUrlBlur = () => {
    if (url.trim() && !title.trim()) {
      const d = getDomain(url);
      const cleanName = d.split('.')[0];
      const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      setTitle(capitalized);
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

    onSubmit(
      {
        url: formattedUrl,
        title: title.trim(),
        description: description.trim() || undefined,
        tags: selectedTags,
        pinned,
        archived: editingBookmark ? editingBookmark.archived : false,
        author: editingBookmark?.author || currentUserName || 'Anonymous'
      },
      editingBookmark?.id
    );

    onClose();
  };

  const allAvailableTags = Array.from(new Set([...PRESET_TAGS, ...existingTags]));
  const userColor = getAvatarColor(currentUserName || 'Author');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 relative border border-slate-100 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {editingBookmark ? 'Edit Link' : 'Save New Link'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Publish encrypted link to your P2P workspace
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
                <Globe className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                autoFocus
                value={url}
                onChange={e => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="https://github.com/..."
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Link Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Local-First Software Manifesto"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition dark:text-white"
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Note / Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Key insights, context, or summary..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition dark:text-white resize-none"
            />
          </div>

          {/* Tags Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Tags ({selectedTags.length} selected)
              </label>
            </div>

            {/* Quick Preset Tag Pills */}
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto mb-2">
              {allAvailableTags.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
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
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
              <button
                type="button"
                onClick={() => handleAddCustomTag()}
                disabled={!newTagInput.trim()}
                className="px-3.5 py-1.5 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-900 disabled:opacity-40 transition"
              >
                + Tag
              </button>
            </div>
          </div>

          {/* Author Badge & Pin to Top */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${userColor.bg} ${userColor.text}`}
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
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Pin to top</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!url.trim() || !title.trim()}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
          >
            <Check className="w-4 h-4" />
            <span>{editingBookmark ? 'Update Link' : 'Save Link'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
