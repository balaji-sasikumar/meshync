import React, { useState } from 'react';
import { Trash2, Search, Receipt, Edit2, MoreVertical } from 'lucide-react';
import type { Expense, GroupMeta } from '../domain/schema.ts';
import { isSettlementItem } from '../domain/schema.ts';
import {
  CATEGORY_INFO,
  getAvatarColor,
  getCurrencySymbol,
  formatTimeAgo
} from '../domain/ui-helpers.ts';
import { ExpenseDetailModal } from './ExpenseDetailModal.tsx';

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
  onOpenAddExpense: () => void;
  currentUserName: string;
  groupMeta: GroupMeta | null;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  onDeleteExpense,
  onEditExpense,
  onOpenAddExpense,
  currentUserName,
  groupMeta
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMember, setSelectedMember] = useState<string>('ALL');
  const [selectedExpenseForDetail, setSelectedExpenseForDetail] = useState<Expense | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Strictly filter out any settlement records from the Bills list
  const genuineExpenses = expenses.filter(e => !isSettlementItem(e));

  // Compute all unique members present in expenses
  const allMembers = React.useMemo(() => {
    const set = new Set<string>();
    genuineExpenses.forEach(e => {
      if (e.payer) set.add(e.payer);
      e.participants.forEach(p => set.add(p));
    });
    return Array.from(set).sort();
  }, [genuineExpenses]);

  const filteredExpenses = genuineExpenses
    .filter(exp => {
      const matchesSearch =
        exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.payer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.participants.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'ALL' || exp.category === selectedCategory;

      const matchesMember =
        selectedMember === 'ALL' ||
        exp.payer.toLowerCase() === selectedMember.toLowerCase() ||
        exp.participants.some(p => p.toLowerCase() === selectedMember.toLowerCase());

      return matchesSearch && matchesCategory && matchesMember;
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

      {/* Search & Member Filter */}
      {genuineExpenses.length > 2 && (
        <div className="space-y-2 mb-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search bills, members..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm dark:text-white"
            />
          </div>

          {allMembers.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedMember('ALL')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shrink-0 ${
                  selectedMember === 'ALL'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                All Members
              </button>
              {allMembers.map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedMember(m)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shrink-0 ${
                    selectedMember.toLowerCase() === m.toLowerCase()
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
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
        <div className="space-y-2.5">
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
              personalAmount = isParticipant
                ? expense.amount - splitPerPerson
                : expense.amount;
              personalType = personalAmount > 0 ? 'lent' : 'none';
            } else if (isParticipant) {
              personalAmount = splitPerPerson;
              personalType = 'share';
            }

            const isMenuOpen = activeMenuId === expense.id;

            return (
              <div
                key={expense.id}
                onClick={() => setSelectedExpenseForDetail(expense)}
                className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-3.5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] relative group"
              >
                {/* Left: Category Icon & Title + Clean Subtitle */}
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  <div
                    className={`w-11 h-11 rounded-2xl ${catInfo.bg} flex items-center justify-center text-xl shadow-inner shrink-0`}
                  >
                    {catInfo.emoji}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                      {expense.description}
                    </h4>

                    {/* Clean spacious subtitle */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      <span>{formatTimeAgo(expense.timestamp)}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300 truncate">
                        Paid by {expense.payer}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Personal Credit/Debit and 3-Dot Menu */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    {personalType === 'lent' && (
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono leading-tight">
                        +{symbol}{personalAmount.toFixed(2)}
                      </p>
                    )}
                    {personalType === 'share' && (
                      <p className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono leading-tight">
                        -{symbol}{personalAmount.toFixed(2)}
                      </p>
                    )}
                    {personalType === 'none' && (
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-tight">
                        {symbol}{Number(expense.amount).toFixed(2)}
                      </p>
                    )}

                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                      {personalType === 'lent'
                        ? 'you lent'
                        : personalType === 'share'
                        ? 'your share'
                        : 'not in bill'}
                    </p>
                  </div>

                  {/* 3-Dot Vertical Menu (Replaces Edit & Delete icons) */}
                  <div className="relative">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setActiveMenuId(isMenuOpen ? null : expense.id);
                      }}
                      title="More actions"
                      className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-20 cursor-default"
                          onClick={e => {
                            e.stopPropagation();
                            setActiveMenuId(null);
                          }}
                        />
                        <div
                          onClick={e => e.stopPropagation()}
                          className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                        >
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onEditExpense(expense);
                            }}
                            className="w-full px-3 py-1.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-sky-500" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              if (confirm(`Delete "${expense.description}"?`)) {
                                onDeleteExpense(expense.id);
                              }
                            }}
                            className="w-full px-3 py-1.5 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expense Detail Breakdown Modal (Shows details on card click) */}
      <ExpenseDetailModal
        expense={selectedExpenseForDetail}
        isOpen={Boolean(selectedExpenseForDetail)}
        onClose={() => setSelectedExpenseForDetail(null)}
        onEdit={onEditExpense}
        onDelete={onDeleteExpense}
        currentUserName={currentUserName}
        groupMeta={groupMeta}
      />
    </div>
  );
};
