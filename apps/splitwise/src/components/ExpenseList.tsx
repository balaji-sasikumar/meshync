import React, { useState } from 'react';
import { Trash2, Search, Filter, Receipt, Users } from 'lucide-react';
import type { Expense } from '../domain/schema.ts';
import {
  CATEGORY_INFO,
  getAvatarColor,
  getCurrencySymbol,
  formatTimeAgo
} from '../domain/ui-helpers.ts';

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onOpenAddExpense: () => void;
  currentUserName: string;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  onDeleteExpense,
  onOpenAddExpense,
  currentUserName
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredExpenses = expenses
    .filter(exp => {
      const matchesSearch =
        exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.payer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.participants.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'ALL' || exp.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="px-5 py-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
          Recent Bills
        </h3>
        <span className="text-xs font-bold text-sky-600">
          {expenses.length} total
        </span>
      </div>

      {/* Search Bar */}
      {expenses.length > 2 && (
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search bills, payers..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
          />
        </div>
      )}

      {/* Bill List */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No bills added yet</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-[220px] mx-auto">
            Add a bill to start splitting costs seamlessly with zero backend servers.
          </p>
          <button
            onClick={onOpenAddExpense}
            className="mt-4 px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/25 hover:bg-sky-600 transition"
          >
            + Add First Bill
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredExpenses.map(expense => {
            const catInfo = CATEGORY_INFO[expense.category] || CATEGORY_INFO['General'];
            const symbol = getCurrencySymbol(expense.currency);
            const count = expense.participants.length || 1;
            const splitPerPerson = (expense.amount / count).toFixed(2);
            const payerColor = getAvatarColor(expense.payer);
            const isUserPayer = expense.payer === currentUserName;

            return (
              <div
                key={expense.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
              >
                {/* Left: Category Icon */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl ${catInfo.bg} flex items-center justify-center text-xl shadow-inner shrink-0`}
                  >
                    {catInfo.emoji}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {expense.description}
                    </h4>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <span>{formatTimeAgo(expense.timestamp)}</span>
                      <span>•</span>
                      <span>{count} {count === 1 ? 'person' : 'people'}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-600">
                        {isUserPayer ? 'You paid' : `${expense.payer} paid`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Delete */}
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">
                      {symbol}{Number(expense.amount).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {symbol}{splitPerPerson} / person
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Delete "${expense.description}"?`)) {
                        onDeleteExpense(expense.id);
                      }
                    }}
                    title="Delete bill"
                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
