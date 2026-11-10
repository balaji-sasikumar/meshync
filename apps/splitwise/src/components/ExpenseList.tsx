import React, { useState } from 'react';
import { Trash2, Search, Receipt } from 'lucide-react';
import type { Expense } from '../domain/schema.ts';
import { isSettlementItem } from '../domain/schema.ts';
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

  // Strictly filter out any settlement records from the Bills list
  const genuineExpenses = expenses.filter(e => !isSettlementItem(e));

  const filteredExpenses = genuineExpenses
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
    <div className="px-4 py-3">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
          Recent Bills
        </h3>
        <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
          {genuineExpenses.length} {genuineExpenses.length === 1 ? 'bill' : 'bills'}
        </span>
      </div>

      {/* Search Bar */}
      {genuineExpenses.length > 2 && (
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search bills, members..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm dark:text-white"
          />
        </div>
      )}

      {/* Bill List */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-7 border border-slate-100 dark:border-slate-800 shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center mx-auto mb-2.5">
            <Receipt className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No bills added yet</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[220px] mx-auto">
            Add a bill to start splitting costs seamlessly with zero backend servers.
          </p>
          <button
            onClick={onOpenAddExpense}
            className="mt-3.5 px-4 py-1.5 bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/25 hover:bg-sky-600 transition"
          >
            + Add First Bill
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredExpenses.map(expense => {
            const catInfo = CATEGORY_INFO[expense.category] || CATEGORY_INFO['General'];
            const symbol = getCurrencySymbol(expense.currency);
            const count = expense.participants.length || 1;
            const splitPerPerson = expense.amount / count;

            // Accurate personal credit / share calculation for the current user
            const isPayer = expense.payer.toLowerCase() === currentUserName.toLowerCase();
            const isParticipant = expense.participants.some(
              p => p.toLowerCase() === currentUserName.toLowerCase()
            );

            let personalType: 'lent' | 'share' | 'none' = 'none';
            let personalAmount = 0;

            if (isPayer) {
              // User paid total bill. Net amount they lent to other members:
              personalAmount = isParticipant
                ? expense.amount - splitPerPerson
                : expense.amount;
              personalType = personalAmount > 0 ? 'lent' : 'none';
            } else if (isParticipant) {
              // User owes their share to the payer
              personalAmount = splitPerPerson;
              personalType = 'share';
            }

            return (
              <div
                key={expense.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
              >
                {/* Left: Category Icon & Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl ${catInfo.bg} flex items-center justify-center text-lg shadow-inner shrink-0`}
                  >
                    {catInfo.emoji}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug truncate">
                      {expense.description}
                    </h4>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      <span>{formatTimeAgo(expense.timestamp)}</span>
                      <span>•</span>
                      <span>{count} {count === 1 ? 'member' : 'members'}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Paid by {expense.payer}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Personal Credit/Debit and Total */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    {personalType === 'lent' && (
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        +{symbol}{personalAmount.toFixed(2)}
                      </p>
                    )}
                    {personalType === 'share' && (
                      <p className="text-xs font-black text-rose-600 dark:text-rose-400 font-mono">
                        -{symbol}{personalAmount.toFixed(2)}
                      </p>
                    )}
                    {personalType === 'none' && (
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
                        {symbol}{Number(expense.amount).toFixed(2)}
                      </p>
                    )}

                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      {personalType === 'lent'
                        ? 'you lent'
                        : personalType === 'share'
                        ? 'your share'
                        : 'not in bill'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Delete "${expense.description}"?`)) {
                        onDeleteExpense(expense.id);
                      }
                    }}
                    title="Delete bill"
                    className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition opacity-0 group-hover:opacity-100"
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
