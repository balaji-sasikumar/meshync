import React from 'react';
import { X, Calendar, User, Users, Edit2, Trash2, Receipt, Tag } from 'lucide-react';
import type { Expense, GroupMeta } from '../domain/schema.ts';
import {
  CATEGORY_INFO,
  getAvatarColor,
  getCurrencySymbol,
  formatTimeAgo
} from '../domain/ui-helpers.ts';

interface ExpenseDetailModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  currentUserName: string;
  groupMeta: GroupMeta | null;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  expense,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  currentUserName,
  groupMeta
}) => {
  if (!isOpen || !expense) return null;

  const catInfo = CATEGORY_INFO[expense.category] || CATEGORY_INFO['General'];
  const symbol = getCurrencySymbol(expense.currency);
  const count = expense.participants.length || 1;
  const splitAmount = expense.amount / count;
  const payerColor = getAvatarColor(expense.payer);

  const getParticipantShare = (p: string): number => {
    if (expense.splitType === 'EXACT' && expense.customSplits && expense.customSplits[p] !== undefined) {
      return Number(expense.customSplits[p]) || 0;
    }
    if (expense.splitType === 'PERCENTAGE' && expense.customSplits && expense.customSplits[p] !== undefined) {
      return (expense.amount * (Number(expense.customSplits[p]) || 0)) / 100;
    }
    return expense.amount / count;
  };

  const formattedDate = new Date(expense.timestamp).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 relative border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition absolute top-4 right-4"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-center gap-3.5 mb-4">
          <div
            className={`w-14 h-14 rounded-2xl ${catInfo.bg} flex items-center justify-center text-3xl shadow-inner shrink-0`}
          >
            {catInfo.emoji}
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {expense.category}
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {expense.description}
            </h2>
          </div>
        </div>

        {/* Big Total Amount Hero */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total Amount
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {symbol}{Number(expense.amount).toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Per Person ({count})
            </p>
            <p className="text-base font-extrabold text-sky-600 dark:text-sky-400 font-mono mt-0.5">
              {symbol}{splitAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Paid By Section */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            Paid By
          </label>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${payerColor.bg} ${payerColor.text}`}
              >
                {expense.payer.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {expense.payer} {expense.payer.toLowerCase() === currentUserName.toLowerCase() && '(You)'}
                </p>
                <p className="text-[10px] text-slate-400">Paid full bill of {symbol}{expense.amount.toFixed(2)}</p>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
              +{symbol}{expense.amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Split Breakdown List */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Split Breakdown ({expense.participants.length} members • {
                expense.splitType === 'EXACT'
                  ? 'Exact'
                  : expense.splitType === 'PERCENTAGE'
                  ? 'Percent'
                  : 'Equal'
              })
            </label>
            {(!expense.splitType || expense.splitType === 'EQUAL') && (
              <span className="text-[10px] text-slate-400 font-medium">
                {symbol}{splitAmount.toFixed(2)} / member
              </span>
            )}
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {expense.participants.map(p => {
              const pColor = getAvatarColor(p);
              const pShare = getParticipantShare(p);
              const pPct = expense.splitType === 'PERCENTAGE' && expense.customSplits?.[p] !== undefined
                ? expense.customSplits[p]
                : null;

              return (
                <div
                  key={p}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${pColor.bg} ${pColor.text}`}
                    >
                      {p.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {p} {p.toLowerCase() === currentUserName.toLowerCase() && '(You)'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 font-mono">
                      {symbol}{pShare.toFixed(2)}
                    </span>
                    {pPct !== null && (
                      <span className="text-[10px] text-slate-400 block -mt-0.5 font-mono">
                        {pPct}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Date & Note Info */}
        <div className="mb-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formattedDate}</span>
          </div>
          {expense.note && (
            <p className="mt-1 italic text-slate-600 dark:text-slate-300">
              Note: {expense.note}
            </p>
          )}
        </div>

        {/* Action Buttons: Edit & Delete */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              onClose();
              onEdit(expense);
            }}
            className="flex-1 py-2.5 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Bill</span>
          </button>

          <button
            onClick={() => {
              if (confirm(`Delete "${expense.description}"?`)) {
                onClose();
                onDelete(expense.id);
              }
            }}
            className="py-2.5 px-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
