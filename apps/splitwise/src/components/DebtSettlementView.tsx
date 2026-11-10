import React from 'react';
import { ArrowRight, CheckCircle2, Check, ArrowRightLeft, Clock, Trash2 } from 'lucide-react';
import type { NetBalance, SettlementTransaction, SettlementRecord, GroupMeta } from '../domain/schema.ts';
import { getAvatarColor, getCurrencySymbol, formatTimeAgo } from '../domain/ui-helpers.ts';

interface DebtSettlementViewProps {
  balancesByCurrency: Map<string, NetBalance[]>;
  settlementsByCurrency: Map<string, SettlementTransaction[]>;
  settlementHistory: SettlementRecord[];
  onSettleUp: (settlement: SettlementTransaction) => void;
  onDeleteSettlement?: (id: string) => void;
  groupMeta: GroupMeta | null;
  currentUserName: string;
}

export const DebtSettlementView: React.FC<DebtSettlementViewProps> = ({
  balancesByCurrency,
  settlementsByCurrency,
  settlementHistory = [],
  onSettleUp,
  onDeleteSettlement,
  groupMeta,
  currentUserName
}) => {
  const currencies = Array.from(balancesByCurrency.keys());

  if (currencies.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">All balances are settled!</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[240px] mx-auto">
            No pending debts in this group. Everyone is even.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 space-y-4">
      {currencies.map(currency => {
        const balances = balancesByCurrency.get(currency) || [];
        const pendingSettlements = settlementsByCurrency.get(currency) || [];
        const symbol = getCurrencySymbol(currency);

        return (
          <div key={currency} className="space-y-4">
            {/* 1. Member Balances Visualizer */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Member Balances ({currency})
                </h4>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                  Zero-Sum Verified
                </span>
              </div>

              {/* Avatar Balance Pins */}
              <div className="flex items-end justify-around pt-2 pb-1 gap-2 overflow-x-auto">
                {balances.map(b => {
                  const color = getAvatarColor(b.person);
                  const isPositive = b.balance > 0.01;
                  const isNegative = b.balance < -0.01;
                  const isCurrentUser = b.person.toLowerCase() === currentUserName.toLowerCase();

                  return (
                    <div
                      key={b.person}
                      className="flex flex-col items-center flex-1 min-w-[54px]"
                    >
                      {/* Avatar */}
                      <div className="relative mb-1.5">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shadow-sm ring-2 ${
                            isCurrentUser ? 'ring-sky-400' : 'ring-transparent'
                          } ${color.bg} ${color.text}`}
                        >
                          {b.person.substring(0, 2).toUpperCase()}
                        </div>
                      </div>

                      {/* Person Name */}
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate max-w-[60px] text-center mb-0.5">
                        {b.person}
                      </p>

                      {/* Vertical line indicator */}
                      <div className="w-0.5 h-6 bg-slate-100 dark:bg-slate-800 my-0.5 relative flex items-center justify-center">
                        <div
                          className={`w-1.5 h-1.5 rounded-full absolute ${
                            isPositive
                              ? 'bg-emerald-500'
                              : isNegative
                              ? 'bg-rose-500'
                              : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        />
                      </div>

                      {/* Balance Amount Tag */}
                      <span
                        className={`text-[11px] font-black px-1.5 py-0.5 rounded-lg mt-0.5 whitespace-nowrap font-mono ${
                          isPositive
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                            : isNegative
                            ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {isPositive ? `+${symbol}${b.balance.toFixed(2)}` : ''}
                        {isNegative ? `-${symbol}${Math.abs(b.balance).toFixed(2)}` : ''}
                        {!isPositive && !isNegative ? `${symbol}0.00` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Optimal Payoff Transfers (Differentiated Flow Style) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-sky-500" />
                  <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Suggested Debt Payoffs ({pendingSettlements.length})
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400">Min-flow</span>
              </div>

              {pendingSettlements.length === 0 ? (
                <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    All group debts resolved!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingSettlements.map((tx, idx) => {
                    const fromColor = getAvatarColor(tx.from);
                    const toColor = getAvatarColor(tx.to);
                    const isUserDebtor = tx.from.toLowerCase() === currentUserName.toLowerCase();
                    const isUserCreditor = tx.to.toLowerCase() === currentUserName.toLowerCase();

                    return (
                      /* Differentiated Flow Ribbon (Not a standard card) */
                      <div
                        key={tx.id || idx}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                          isUserDebtor
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                            : isUserCreditor
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                            : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60'
                        }`}
                      >
                        {/* Interactive Flow Pathway */}
                        <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                          {/* Debtor Avatar */}
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${fromColor.bg} ${fromColor.text}`}
                          >
                            {tx.from.substring(0, 2).toUpperCase()}
                          </div>

                          {/* Flow Arrow with Amount */}
                          <div className="flex-1 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                              {tx.from}
                            </span>
                            <div className="w-full flex items-center my-0.5">
                              <div className="h-0.5 flex-1 bg-gradient-to-r from-slate-300 via-sky-400 to-emerald-400 dark:from-slate-700 dark:via-sky-600 dark:to-emerald-500" />
                              <ArrowRight className="w-3 h-3 text-emerald-500 shrink-0 -ml-1" />
                            </div>
                            <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                              {symbol}{tx.amount.toFixed(2)}
                            </span>
                          </div>

                          {/* Creditor Avatar */}
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${toColor.bg} ${toColor.text}`}
                          >
                            {tx.to.substring(0, 2).toUpperCase()}
                          </div>
                        </div>

                        {/* Record Payment Button */}
                        <button
                          onClick={() => onSettleUp(tx)}
                          title={`Record ${tx.from} paid ${tx.to}`}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-1 shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Settle</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Settled Payments History */}
            {settlementHistory.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Settled Payment History ({settlementHistory.length})
                  </h4>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {settlementHistory.map(rec => (
                    <div
                      key={rec.id}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {rec.from} paid {rec.to}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatTimeAgo(rec.timestamp)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                          {getCurrencySymbol(rec.currency)}{rec.amount.toFixed(2)}
                        </span>
                        {onDeleteSettlement && (
                          <button
                            onClick={() => {
                              if (confirm('Undo this settlement payment?')) {
                                onDeleteSettlement(rec.id);
                              }
                            }}
                            className="text-slate-300 hover:text-rose-500 p-1"
                            title="Undo payment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
