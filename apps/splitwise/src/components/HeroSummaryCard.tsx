import React from 'react';
import { ArrowRight, Plus, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
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
  const currency = groupMeta?.currency || (expenses[0]?.currency) || 'INR';
  const symbol = getCurrencySymbol(currency);

  const totalGroupSpend = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const memberCount = groupMeta?.members?.length || 1;

  // Determine user balance status
  const isCreditor = userNetBalance > 0.01;
  const isDebtor = userNetBalance < -0.01;
  const isSettled = !isCreditor && !isDebtor;

  // Dynamic gradient based on user's personal financial position (income vs outgoing)
  const cardGradient = isCreditor
    ? 'from-emerald-500 via-teal-500 to-cyan-600 shadow-emerald-500/20'
    : isDebtor
    ? 'from-rose-500 via-orange-500 to-amber-600 shadow-rose-500/20'
    : 'from-sky-500 via-blue-500 to-indigo-600 shadow-sky-500/20';

  return (
    <div className="px-4 py-1">
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${cardGradient} text-white shadow-lg p-4 transition-all duration-300`}
      >
        {/* Subtle decorative circles */}
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3">
          {/* Left Column: Total Group Spend */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest leading-none mb-1">
              Total Group Spend
            </p>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight truncate">
              {symbol}{totalGroupSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-[11px] text-white/85 font-medium mt-0.5">
              {expenses.length} {expenses.length === 1 ? 'bill' : 'bills'} • {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </p>
          </div>

          {/* Right Column: User's Personalized Income/Outgoing Balance */}
          <div className="bg-white/20 backdrop-blur-md border border-white/25 rounded-xl px-3 py-2 text-right shrink-0">
            <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-white/90 uppercase tracking-wider mb-0.5">
              {isCreditor && <TrendingUp className="w-3 h-3 text-emerald-200" />}
              {isDebtor && <TrendingDown className="w-3 h-3 text-amber-200" />}
              {isSettled && <CheckCircle2 className="w-3 h-3 text-white" />}
              <span>{isCreditor ? 'You get back' : isDebtor ? 'You owe' : 'Your balance'}</span>
            </div>
            <p className="text-base font-black tracking-tight">
              {isCreditor && `+${symbol}${userNetBalance.toFixed(2)}`}
              {isDebtor && `-${symbol}${Math.abs(userNetBalance).toFixed(2)}`}
              {isSettled && `${symbol}0.00`}
            </p>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/20">
          <button
            onClick={onOpenAddExpense}
            className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-900 font-extrabold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5 text-sky-600" />
            <span>Add Bill</span>
          </button>

          <button
            onClick={onViewPayoffs}
            className="py-1.5 px-3 bg-black/20 hover:bg-black/30 border border-white/20 text-white font-bold rounded-xl transition flex items-center justify-center gap-1 text-xs active:scale-[0.98]"
          >
            <span>Balances</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
