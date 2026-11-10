import React from 'react';
import type { Expense, SettlementTransaction } from '../domain/schema.ts';
import { DollarSign, Users, Scale, Zap } from 'lucide-react';

interface Props {
  expenses: Expense[];
  settlementsByCurrency: Map<string, SettlementTransaction[]>;
  knownParticipants: string[];
}

export const StatsCard: React.FC<Props> = ({
  expenses,
  settlementsByCurrency,
  knownParticipants
}) => {
  // Sum by currency
  const totalsByCurrency: Record<string, number> = {};
  for (const exp of expenses) {
    totalsByCurrency[exp.currency] = (totalsByCurrency[exp.currency] || 0) + exp.amount;
  }

  const currencies = Object.keys(totalsByCurrency);
  let totalSettlements = 0;
  for (const list of settlementsByCurrency.values()) {
    totalSettlements += list.length;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Group Spend */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Group Spend</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="font-mono text-xl font-bold text-slate-100">
          {currencies.length === 0 ? (
            '0.00'
          ) : (
            <span>
              {totalsByCurrency[currencies[0]]?.toFixed(2)}{' '}
              <span className="text-xs text-emerald-400">{currencies[0]}</span>
              {currencies.length > 1 && (
                <span className="text-xs text-slate-500 ml-1">+{currencies.length - 1} more</span>
              )}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 mt-1">{expenses.length} total transaction(s)</p>
      </div>

      {/* 2. Group Members */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Active Members</span>
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="font-mono text-xl font-bold text-slate-100">
          {knownParticipants.length}
        </div>
        <p className="text-[11px] text-slate-500 mt-1 truncate">
          {knownParticipants.length > 0 ? knownParticipants.join(', ') : 'No members yet'}
        </p>
      </div>

      {/* 3. Debt Settlements Remaining */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Required Payoffs</span>
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="font-mono text-xl font-bold text-amber-400">
          {totalSettlements}
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Direct transfers to balance</p>
      </div>

      {/* 4. Coordination Status */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Network Mode</span>
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5 mt-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Local-First CRDT</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Zero backend servers</p>
      </div>
    </div>
  );
};
