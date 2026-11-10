import React, { useState } from 'react';
import type { Bookmark } from '../domain/schema.ts';
import { PRESET_TAGS } from '../domain/schema.ts';
import { Plus, Link, Pin, Tag, Sparkles } from 'lucide-react';

interface Props {
  onAddBookmark: (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => void;
  existingTags: string[];
}

export const BookmarkForm: React.FC<Props> = ({ onAddBookmark, existingTags }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [pinned, setPinned] = useState(false);

  const toggleTag = (t: string) => {
    const trimmed = t.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setTags(tags.filter((item) => item !== trimmed));
    } else {
      setTags([...tags, trimmed]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let validUrl = url.trim();
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = `https://${validUrl}`;
    }

    onAddBookmark({
      url: validUrl,
      title: title.trim() || validUrl,
      description: description.trim() || undefined,
      tags: tags.length > 0 ? tags : ['General'],
      pinned,
      archived: false
    });

    // Reset
    setUrl('');
    setTitle('');
    setDescription('');
    setTags([]);
    setPinned(false);
    setIsOpen(false);
  };

  const allTagSuggestions = Array.from(new Set([...PRESET_TAGS, ...existingTags]));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg mb-6">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-slate-300 hover:text-indigo-400 hover:bg-slate-800/40 transition-all font-semibold text-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <span>Add Bookmark to Mesh</span>
          </div>
          <span className="text-xs text-slate-500 font-normal">Syncs instantly with peers</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              Save Bookmark
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-400">Target URL</label>
              <div className="relative mt-1">
                <Link className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://localfirstweb.dev or ipfs://..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Local-First Software Architecture"
                  className="w-full px-3 py-2 mt-1 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Notes / Summary</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key concepts or research notes"
                  className="w-full px-3 py-2 mt-1 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Tag Selection */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                Tags ({tags.length} selected)
              </label>

              <div className="flex flex-wrap gap-1.5 pb-1">
                {allTagSuggestions.slice(0, 10).map((tag) => {
                  const isSelected = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        isSelected
                          ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddCustomTag}
                  placeholder="Custom tag (press Enter)"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Add Tag
                </button>
              </div>
            </div>

            {/* Pin to top */}
            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-300 flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 text-indigo-400" />
                Pin to top of workspace
              </span>
            </label>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all"
            >
              Add Bookmark
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
