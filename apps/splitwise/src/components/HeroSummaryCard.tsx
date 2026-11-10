import React from 'react';
import { ArrowRight, Plus, Sparkles, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import type { Expense, GroupMeta } from '../domain/schema.ts';
import { getCurrencySymbol } from '../domain/ui-helpers.ts';

interface HeroSummaryCardProps {
  expenses: Expense[];
  groupMeta: GroupMeta | null;
  currentUserName: string;
  userNetBalance: number;
  onOpenAddExpense: () => void;
  onViewPayoffs: () => void;
}

export const HeroSummaryCard: React.FC<HeroSummaryCardProps> = ({
  expenses,
  groupMeta,
  currentUserName,
  userNetBalance,
  onOpenAddExpense,
  onViewPayoffs
}) => {
  const currency = groupMeta?.currency || (expenses[0]?.currency) || 'USD';
  const symbol = getCurrencySymbol(currency);

  const totalGroupSpend = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const memberCount = groupMeta?.members?.length || 1;

  // Determine user balance status
  const isCreditor = userNetBalance > 0.01;
  const isDebtor = userNetBalance < -0.01;
  const isSettled = !isCreditor && !isDebtor;

  return (
    <div className="px-5 py-2">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-sky-400 to-sky-500 text-white shadow-xl shadow-sky-500/20 p-6 flex flex-col items-center text-center">
        {/* Decorative soft backdrop circles */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-sky-300/30 rounded-full blur-xl pointer-events-none" />

        {/* Playful bill/food icon badge */}
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner flex items-center justify-center text-3xl mb-3 border border-white/25">
          🍔
        </div>

        <p className="text-xs font-bold text-sky-100 uppercase tracking-widest">
          Total Group Spend
        </p>

        <h2 className="text-3xl font-black tracking-tight mt-1 mb-1">
          {symbol}{totalGroupSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>

        <p className="text-xs font-medium text-sky-100/90 mb-4">
          {expenses.length} {expenses.length === 1 ? 'bill' : 'bills'} • {memberCount} {memberCount === 1 ? 'person' : 'people'}
        </p>

        {/* Personalized Net Balance Pill */}
        <div className="w-full bg-white/20 backdrop-blur-md border border-white/25 rounded-2xl p-2.5 flex items-center justify-between text-xs mb-4">
          <div className="flex items-center gap-2 pl-1">
            {isCreditor && <TrendingUp className="w-4 h-4 text-emerald-200" />}
            {isDebtor && <TrendingDown className="w-4 h-4 text-rose-200" />}
            {isSettled && <CheckCircle2 className="w-4 h-4 text-white" />}
            <span className="font-semibold text-white/95">
              {isCreditor && 'You are owed'}
              {isDebtor && 'You owe'}
              {isSettled && 'Your balance'}
            </span>
          </div>
          <span className="font-extrabold text-sm pr-1">
            {isCreditor && `+${symbol}${userNetBalance.toFixed(2)}`}
            {isDebtor && `-${symbol}${Math.abs(userNetBalance).toFixed(2)}`}
            {isSettled && `${symbol}0.00`}
          </span>
        </div>

        {/* Action Row */}
        <div className="w-full flex items-center gap-2.5">
          <button
            onClick={onOpenAddExpense}
            className="flex-1 py-3 px-4 bg-white hover:bg-sky-50 active:scale-[0.98] text-sky-600 font-extrabold rounded-2xl shadow-md transition flex items-center justify-center gap-1.5 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bill</span>
          </button>

          <button
            onClick={onViewPayoffs}
            className="py-3 px-4 bg-sky-600/50 hover:bg-sky-600/70 border border-white/30 text-white font-bold rounded-2xl transition flex items-center justify-center gap-1.5 text-xs active:scale-[0.98]"
          >
            <span>Payoffs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
