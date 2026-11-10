import React from 'react';
import { Search, Tag, X, Pin, Archive } from 'lucide-react';

interface Props {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  filterPinned: boolean;
  onToggleFilterPinned: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  showArchived: boolean;
  onToggleShowArchived: () => void;
  totalCount: number;
  filteredCount: number;
  pinnedCount: number;
}

export const TagFilter: React.FC<Props> = ({
  tags,
  selectedTag,
  onSelectTag,
  filterPinned,
  onToggleFilterPinned,
  searchTerm,
  onSearchChange,
  showArchived,
  onToggleShowArchived,
  totalCount,
  pinnedCount
}) => {
  return (
    <div className="space-y-2 mb-3">
      {/* Modern Search Bar */}
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search by title, url, tags, or author..."
          className="w-full pl-8 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm transition"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Chips Bar (Horizontal scroll) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
        {/* All Links */}
        <button
          onClick={() => {
            onSelectTag(null);
            if (filterPinned) onToggleFilterPinned();
          }}
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
            selectedTag === null && !filterPinned && !showArchived
              ? 'bg-sky-500 border-sky-500 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All ({totalCount})
        </button>

        {/* Pinned Links */}
        {pinnedCount > 0 && (
          <button
            onClick={onToggleFilterPinned}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition border flex items-center gap-1 ${
              filterPinned
                ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Pin className="w-3 h-3" />
            Pinned ({pinnedCount})
          </button>
        )}

        {/* Tag Pills */}
        {tags.map(t => {
          const isSelected = selectedTag === t;
          return (
            <button
              key={t}
              onClick={() => onSelectTag(isSelected ? null : t)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition border flex items-center gap-1 ${
                isSelected
                  ? 'bg-sky-500 border-sky-500 text-white shadow-sm font-semibold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>#{t}</span>
              {isSelected && <X className="w-3 h-3" />}
            </button>
          );
        })}

        {/* Archived Links Toggle */}
        <button
          onClick={onToggleShowArchived}
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition border flex items-center gap-1 ml-auto shrink-0 ${
            showArchived
              ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-transparent font-semibold shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Archive className="w-3 h-3" />
          <span>{showArchived ? 'Hide Archived' : 'Archived'}</span>
        </button>
      </div>
    </div>
  );
};
