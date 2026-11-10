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
            {/* 1. Ultra-Modern Member Balances Pillar Grid (Inspired by Reference UX Slide 3) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
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
                  const isCurrent = b.person.toLowerCase() === currentUserName.toLowerCase();

                  return (
                    <div
                      key={b.person}
                      className="flex flex-col items-center flex-1 min-w-[62px]"
                    >
                      {/* Avatar */}
                      <div className="relative mb-1.5">
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-black shadow-sm ring-2 ${
                            isCurrent ? 'ring-sky-400 dark:ring-sky-500' : 'ring-transparent'
                          } ${color.bg} ${color.text}`}
                        >
                          {b.person.substring(0, 2).toUpperCase()}
                        </div>
                      </div>

                      {/* Person Full Name */}
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[68px] text-center mb-0.5">
                        {b.person}
                      </p>

                      {/* Sleek Vertical Stem Indicator */}
                      <div className="w-0.5 h-7 bg-slate-100 dark:bg-slate-800 my-0.5 relative flex items-center justify-center">
                        <div
                          className={`w-2 h-2 rounded-full absolute ${
                            isPositive
                              ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                              : isNegative
                              ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                              : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        />
                      </div>

                      {/* Modern Balance Tag */}
                      <span
                        className={`text-[11px] font-black px-2 py-0.5 rounded-lg mt-0.5 whitespace-nowrap font-mono ${
                          isPositive
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : isNegative
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
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

            {/* 2. Sleek Connected Payoff Ribbons (With explicit names) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-sky-500" />
                  <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Suggested Debt Payoffs ({pendingSettlements.length})
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Min-flow</span>
              </div>

              {pendingSettlements.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    All group debts resolved!
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    No transfers are needed between group members.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pendingSettlements.map((tx, idx) => {
                    const fromColor = getAvatarColor(tx.from);
                    const toColor = getAvatarColor(tx.to);

                    return (
                      <div
                        key={tx.id || idx}
                        className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all flex items-center justify-between shadow-sm"
                      >
                        {/* Connected Arrow Flow */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-3">
                          {/* Debtor Avatar & Name */}
                          <div className="flex flex-col items-center shrink-0 min-w-[48px]">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm ${fromColor.bg} ${fromColor.text}`}
                            >
                              {tx.from.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1 truncate max-w-[54px] text-center">
                              {tx.from}
                            </span>
                          </div>

                          {/* Arrow Ribbon with Clear Title & Amount */}
                          <div className="flex-1 flex flex-col items-center px-1">
                            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                              {tx.from} pays {tx.to}
                            </span>
                            <div className="w-full flex items-center my-1">
                              <div className="h-0.5 flex-1 bg-gradient-to-r from-slate-200 via-sky-400 to-emerald-400 dark:from-slate-700 dark:via-sky-600 dark:to-emerald-500" />
                              <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0 -ml-1" />
                            </div>
                            <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                              {symbol}{tx.amount.toFixed(2)}
                            </span>
                          </div>

                          {/* Creditor Avatar & Name */}
                          <div className="flex flex-col items-center shrink-0 min-w-[48px]">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm ${toColor.bg} ${toColor.text}`}
                            >
                              {tx.to.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1 truncate max-w-[54px] text-center">
                              {tx.to}
                            </span>
                          </div>
                        </div>

                        {/* Modern Settle Button */}
                        <button
                          onClick={() => onSettleUp(tx)}
                          title={`Record ${tx.from} paid ${tx.to} ${symbol}${tx.amount.toFixed(2)}`}
                          className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-1.5 shrink-0"
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

            {/* 3. Settled Payment History */}
            {settlementHistory.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-1.5 mb-3">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Settled Repayments Log ({settlementHistory.length})
                  </h4>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {settlementHistory.map(rec => (
                    <div
                      key={rec.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {rec.from} paid {rec.to}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatTimeAgo(rec.timestamp)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          {getCurrencySymbol(rec.currency)}{rec.amount.toFixed(2)}
                        </span>
                        {onDeleteSettlement && (
                          <button
                            onClick={() => {
                              if (confirm(`Undo repayment of ${rec.from} to ${rec.to}?`)) {
                                onDeleteSettlement(rec.id);
                              }
                            }}
                            className="text-slate-300 hover:text-rose-500 p-1"
                            title="Undo this payment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
