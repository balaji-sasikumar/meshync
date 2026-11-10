import React from 'react';
import type { Expense, SettlementTransaction, NetBalance } from '../domain/schema.ts';
import { ArrowRight, CheckCircle2, TrendingUp, TrendingDown, Sparkles, Scale } from 'lucide-react';

interface Props {
  balancesByCurrency: Map<string, NetBalance[]>;
  settlementsByCurrency: Map<string, SettlementTransaction[]>;
  onSettleUp: (settlement: SettlementTransaction) => void;
  rawExpenseCount: number;
}

export const DebtSettlementView: React.FC<Props> = ({
  balancesByCurrency,
  settlementsByCurrency,
  onSettleUp,
  rawExpenseCount
}) => {
  const currencies = Array.from(balancesByCurrency.keys());

  if (currencies.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <Scale className="w-10 h-10 mx-auto text-slate-600 mb-3" />
        <h4 className="font-semibold text-slate-300">No Expenses Recorded</h4>
        <p className="text-xs text-slate-500 mt-1">
          Add group expenses above to compute optimal settlement payoffs.
        </p>
      </div>
    );
  }

  let totalSimplifiedCount = 0;
  for (const s of settlementsByCurrency.values()) {
    totalSimplifiedCount += s.length;
  }

  return (
    <div className="space-y-6">
      {/* Cash Flow Optimization Callout */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-teal-950/40 border border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Autonomous Cash-Flow Minimization
            </h4>
            <p className="text-xs text-slate-400">
              Deterministic min-flow algorithm simplified tangled debt graph to{' '}
              <span className="text-emerald-400 font-semibold">{totalSimplifiedCount} direct payment(s)</span>.
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold self-end sm:self-auto">
          Coordinator-Free
        </span>
      </div>

      {currencies.map((curr) => {
        const balances = balancesByCurrency.get(curr) || [];
        const settlements = settlementsByCurrency.get(curr) || [];

        return (
          <div key={curr} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <span>Currency:</span>
                <span className="text-emerald-400 font-mono text-base">{curr}</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {balances.length} active participant(s)
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* 1. Net Balances Tree */}
              <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-400" />
                  Net Balance Tree
                </h4>

                <div className="space-y-2">
                  {balances.map((item) => {
                    const isPositive = item.balance > 0.005;
                    const isZero = Math.abs(item.balance) <= 0.005;
                    return (
                      <div
                        key={item.person}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                              isPositive
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : isZero
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {item.person.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-200 block">
                              {item.person}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {isPositive ? 'gets back' : isZero ? 'settled' : 'owes'}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`font-mono text-xs font-bold flex items-center gap-1 ${
                            isPositive
                              ? 'text-emerald-400'
                              : isZero
                              ? 'text-slate-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
                          {!isPositive && !isZero && <TrendingDown className="w-3.5 h-3.5" />}
                          <span>
                            {isPositive ? '+' : ''}
                            {item.balance.toFixed(2)} {curr}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Simplified Payoff Graph */}
              <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  Optimized Settlement Payoffs ({settlements.length})
                </h4>

                {settlements.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-950/40 rounded-lg border border-slate-800/50">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-300">All debts in {curr} are fully settled!</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Everyone is square.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {settlements.map((s) => (
                      <div
                        key={s.id}
                        className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2 text-xs">
                          {/* Debtor */}
                          <span className="font-bold text-rose-300 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20">
                            {s.from}
                          </span>

                          <div className="flex items-center gap-1 text-slate-500">
                            <span className="text-[10px]">owes</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          </div>

                          {/* Creditor */}
                          <span className="font-bold text-emerald-300 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                            {s.to}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-slate-100">
                            {s.amount.toFixed(2)} <span className="text-xs text-emerald-400">{curr}</span>
                          </span>

                          <button
                            onClick={() => onSettleUp(s)}
                            className="px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-all shadow-sm"
                            title="Record this settlement payment into CRDT log"
                          >
                            Settle Up
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
