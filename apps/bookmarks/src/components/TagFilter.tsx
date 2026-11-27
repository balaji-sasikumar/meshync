import React from 'react';
import { Search, X, Pin, Archive } from 'lucide-react';

interface Props {
  tags: string[];
  totalCount: number;
  archivedCount: number;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  filterPinned: boolean;
  onToggleFilterPinned: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  showArchived: boolean;
  onToggleShowArchived: () => void;
  pinnedCount: number;
}

export const TagFilter: React.FC<Props> = ({
  tags,
  totalCount,
  archivedCount,
  selectedTag,
  onSelectTag,
  filterPinned,
  onToggleFilterPinned,
  searchTerm,
  onSearchChange,
  showArchived,
  onToggleShowArchived,
  pinnedCount
}) => {
  return (
    <div className="space-y-2.5">
      {/* Search Input Bar + Archive View Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex items-center flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 pointer-events-none" strokeWidth={1.75} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search links or #tags..."
            className="w-full h-9 pl-8 pr-8 rounded-xl bg-white dark:bg-[#121721] border border-slate-200/80 dark:border-slate-800 text-base sm:text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-2 transition"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleShowArchived}
          title={showArchived ? 'Back to active links' : `View archived (${archivedCount})`}
          aria-label={showArchived ? 'Back to active links' : `View archived (${archivedCount})`}
          className={`h-9 px-2.5 rounded-xl border text-xs font-medium transition flex items-center gap-1.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
            showArchived
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-white dark:bg-[#121721] border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <Archive className="w-3.5 h-3.5" strokeWidth={1.75} />
          {archivedCount > 0 && (
            <span className="text-[11px] font-semibold tabular-nums">{archivedCount}</span>
          )}
        </button>
      </div>

      {/* Horizontal Tag Pills Bar with subtle right-edge fade hint */}
      <div className="relative">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 pr-7 text-xs">
          {/* All Links Pill */}
          <button
            type="button"
            onClick={() => {
              onSelectTag(null);
              if (filterPinned) onToggleFilterPinned();
            }}
            className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold whitespace-nowrap shrink-0 transition flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
              selectedTag === null && !filterPinned
                ? 'bg-blue-600 text-white border border-blue-600'
                : 'bg-white dark:bg-[#121721] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {showArchived ? `Archived (${archivedCount})` : `All (${totalCount})`}
          </button>

          {/* Pinned Pill */}
          {pinnedCount > 0 && (
            <button
              type="button"
              onClick={onToggleFilterPinned}
              className={`h-7 px-2.5 rounded-lg text-[11px] font-medium whitespace-nowrap shrink-0 transition flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
                filterPinned
                  ? 'bg-blue-600 text-white border border-blue-600'
                  : 'bg-white dark:bg-[#121721] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Pin className="w-3 h-3" strokeWidth={1.75} />
              <span>Pinned ({pinnedCount})</span>
            </button>
          )}

          {/* Real Tag Pills */}
          {tags.map(t => {
            const isSelected = selectedTag === t;
            return (
              <button
                type="button"
                key={t}
                onClick={() => onSelectTag(isSelected ? null : t)}
                className={`h-7 px-2.5 rounded-lg text-[11px] font-medium whitespace-nowrap shrink-0 transition flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
                  isSelected
                    ? 'bg-blue-600 text-white border border-blue-600'
                    : 'bg-white dark:bg-[#121721] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span>#{t}</span>
                {isSelected && <X className="w-3 h-3 ml-0.5" strokeWidth={2} />}
              </button>
            );
          })}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#F5F7FA] via-[#F5F7FA]/80 dark:from-[#0B0E14] dark:via-[#0B0E14]/80 to-transparent"
        />
      </div>
    </div>
  );
};
