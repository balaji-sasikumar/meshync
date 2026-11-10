import React from 'react';
import { Search, Tag, X } from 'lucide-react';

interface Props {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  showArchived: boolean;
  onToggleShowArchived: () => void;
  totalCount: number;
  filteredCount: number;
}

export const TagFilter: React.FC<Props> = ({
  tags,
  selectedTag,
  onSelectTag,
  searchTerm,
  onSearchChange,
  showArchived,
  onToggleShowArchived,
  totalCount,
  filteredCount
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-6 space-y-3">
      {/* Search & Archived Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search bookmarks by title, URL or notes..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 justify-end text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-slate-200">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={onToggleShowArchived}
              className="rounded bg-slate-950 border-slate-800 text-indigo-500"
            />
            <span>Show Archived</span>
          </label>

          <span className="text-slate-500 font-mono text-[11px]">
            {filteredCount} of {totalCount} items
          </span>
        </div>
      </div>

      {/* Tags Chips Bar */}
      {tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800/60">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mr-1">
            <Tag className="w-3 h-3 text-indigo-400" />
            Tags:
          </span>

          <button
            onClick={() => onSelectTag(null)}
            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
              selectedTag === null
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>

          {tags.map((t) => {
            const isSelected = selectedTag === t;
            return (
              <button
                key={t}
                onClick={() => onSelectTag(isSelected ? null : t)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span>#{t}</span>
                {isSelected && <X className="w-3 h-3 text-indigo-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
