import React from 'react';
import { TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import type { Expense, GroupMeta } from '../domain/schema.ts';
import { isSettlementItem } from '../domain/schema.ts';
import { getCurrencySymbol } from '../domain/ui-helpers.ts';

interface HeroSummaryCardProps {
  expenses: Expense[];
  groupMeta: GroupMeta | null;
  userNetBalance: number;
}

export const HeroSummaryCard: React.FC<HeroSummaryCardProps> = ({
  expenses,
  groupMeta,
  userNetBalance,
}) => {
  const currency = groupMeta?.currency || (expenses[0]?.currency) || 'INR';
  const symbol = getCurrencySymbol(currency);

  const genuineExpenses = expenses.filter(e => !isSettlementItem(e));
  const totalGroupSpend = genuineExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const memberCount = groupMeta?.members?.length || 1;

  const isCreditor = userNetBalance > 0.01;
  const isDebtor = userNetBalance < -0.01;
  const isSettled = !isCreditor && !isDebtor;

  return (
    <div className="px-4 py-2">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Total Group Spend */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">
              Group Spend
            </p>
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-tight truncate font-mono">
              {symbol}{totalGroupSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              {genuineExpenses.length} {genuineExpenses.length === 1 ? 'bill' : 'bills'} · {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </p>
          </div>

          {/* Divider */}
          <div className="w-px h-10 bg-slate-100 dark:bg-slate-800 shrink-0" />

          {/* Right: User balance */}
          <div className="text-right shrink-0">
            <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
              {isCreditor && <TrendingUp className="w-3 h-3 text-emerald-500" />}
              {isDebtor && <TrendingDown className="w-3 h-3 text-rose-500" />}
              {isSettled && <CheckCircle2 className="w-3 h-3 text-slate-400" />}
              <span>{isCreditor ? 'You get back' : isDebtor ? 'You owe' : 'Settled'}</span>
            </div>
            <p className={`text-base font-black tracking-tight font-mono ${
              isCreditor
                ? 'text-emerald-600 dark:text-emerald-400'
                : isDebtor
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-400 dark:text-slate-500'
            }`}>
              {isCreditor && `+${symbol}${userNetBalance.toFixed(2)}`}
              {isDebtor && `-${symbol}${Math.abs(userNetBalance).toFixed(2)}`}
              {isSettled && `${symbol}0.00`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
