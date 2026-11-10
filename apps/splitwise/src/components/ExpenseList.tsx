import React, { useState } from 'react';
import type { Expense } from '../domain/schema.ts';
import { EXPENSE_CATEGORIES } from '../domain/schema.ts';
import { Trash2, Search, Filter, Calendar, Users, DollarSign } from 'lucide-react';

interface Props {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
}

export const ExpenseList: React.FC<Props> = ({ expenses, onDeleteExpense }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filtered = expenses
    .filter((exp) => {
      if (selectedCategory !== 'ALL' && exp.category !== selectedCategory) return false;
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        exp.description.toLowerCase().includes(q) ||
        exp.payer.toLowerCase().includes(q) ||
        exp.participants.some((p) => p.toLowerCase().includes(q)) ||
        (exp.note && exp.note.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Header Controls */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm text-slate-100">Transaction History</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {filtered.length} of {expenses.length}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search expenses..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filter Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs">
          {expenses.length === 0
            ? 'No expenses logged yet. Be the first to add one!'
            : 'No expenses match the current filter or search criteria.'}
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {filtered.map((exp) => {
            const dateStr = new Date(exp.timestamp).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={exp.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-200 truncate">
                      {exp.description}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                      {exp.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1 text-slate-300">
                      <span className="text-slate-500">Paid by</span>
                      <strong className="text-emerald-400">{exp.payer}</strong>
                    </span>

                    <span className="text-slate-600">•</span>

                    <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <Users className="w-3 h-3 text-slate-500" />
                      <span>{exp.participants.join(', ')}</span>
                    </span>

                    <span className="text-slate-600">•</span>

                    <span className="text-slate-500 text-[11px]">{dateStr}</span>
                  </div>

                  {exp.note && (
                    <p className="text-xs text-slate-500 italic mt-0.5 truncate">{exp.note}</p>
                  )}
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-mono text-base font-bold text-slate-100">
                      {exp.amount.toFixed(2)}
                      <span className="text-xs text-emerald-400 ml-1">{exp.currency}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {(exp.amount / exp.participants.length).toFixed(2)}/person
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteExpense(exp.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Delete expense"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
