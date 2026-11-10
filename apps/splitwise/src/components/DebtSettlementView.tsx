import React from 'react';
import { ArrowRight, CheckCircle2, Check, ArrowRightLeft, Clock, Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
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

        // Find current user's balance
        const userBalance = balances.find(
          b => b.person.toLowerCase() === currentUserName.toLowerCase()
        )?.balance || 0;

        const isUserCreditor = userBalance > 0.01;
        const isUserDebtor = userBalance < -0.01;
        const isUserSettled = !isUserCreditor && !isUserDebtor;

        return (
          <div key={currency} className="space-y-3.5">
            {/* 1. Clear Human-Friendly Summary Banner for Current User */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                isUserCreditor
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : isUserDebtor
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  : 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {isUserCreditor && <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                {isUserDebtor && <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
                {isUserSettled && <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />}

                <p className="text-xs font-semibold leading-relaxed">
                  {isUserCreditor && (
                    <>
                      You are owed <span className="font-extrabold">{symbol}{userBalance.toFixed(2)}</span> in total. Members below need to pay you back.
                    </>
                  )}
                  {isUserDebtor && (
                    <>
                      You owe <span className="font-extrabold">{symbol}{Math.abs(userBalance).toFixed(2)}</span> in total to balance your share.
                    </>
                  )}
                  {isUserSettled && (
                    <>
                      You are completely settled up ({symbol}0.00). You neither owe nor are owed money.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* 2. Direct Payoffs (Who Pays Whom in Plain English) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-sky-500" />
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Who Pays Whom ({pendingSettlements.length})
                  </h4>
                </div>
                <span className="text-[10px] font-semibold text-slate-400">
                  Minimal transfers to balance all debts
                </span>
              </div>

              {pendingSettlements.length === 0 ? (
                <div className="text-center py-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    All debts settled!
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
                    const isDebtor = tx.from.toLowerCase() === currentUserName.toLowerCase();
                    const isCreditor = tx.to.toLowerCase() === currentUserName.toLowerCase();

                    return (
                      <div
                        key={tx.id || idx}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isDebtor
                            ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                            : isCreditor
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60'
                        }`}
                      >
                        {/* Plain English statement: [Bob] pays ₹333.33 to [Balaji] */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            {/* Payer / Debtor */}
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${fromColor.bg} ${fromColor.text}`}
                              >
                                {tx.from.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                                {isDebtor ? 'You' : tx.from}
                              </span>
                            </div>

                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                              pays
                            </span>

                            {/* Recipient / Creditor */}
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${toColor.bg} ${toColor.text}`}
                              >
                                {tx.to.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                                {isCreditor ? 'You' : tx.to}
                              </span>
                            </div>
                          </div>

                          {/* Bold Amount */}
                          <span className="text-sm font-black text-slate-900 dark:text-white font-mono shrink-0">
                            {symbol}{tx.amount.toFixed(2)}
                          </span>
                        </div>

                        {/* Action row with clear explanatory button */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/50">
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {isDebtor
                              ? `Pay ${symbol}${tx.amount.toFixed(2)} to ${tx.to}`
                              : isCreditor
                              ? `${tx.from} owes you ${symbol}${tx.amount.toFixed(2)}`
                              : `${tx.from} owes ${tx.to} ${symbol}${tx.amount.toFixed(2)}`}
                          </p>

                          <button
                            onClick={() => onSettleUp(tx)}
                            title={`Record that ${tx.from} paid ${tx.to} ${symbol}${tx.amount.toFixed(2)}`}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-1 shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Paid</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Each Member's Net Standing (Gets Back vs Owes) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">
                Individual Net Balances ({currency})
              </h4>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {balances.map(b => {
                  const color = getAvatarColor(b.person);
                  const isPositive = b.balance > 0.01;
                  const isNegative = b.balance < -0.01;
                  const isCurrent = b.person.toLowerCase() === currentUserName.toLowerCase();

                  return (
                    <div
                      key={b.person}
                      className="py-2.5 flex items-center justify-between first:pt-1 last:pb-1"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${color.bg} ${color.text}`}
                        >
                          {b.person.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {b.person} {isCurrent && <span className="text-[10px] text-sky-500 font-bold ml-1">(Active Profile)</span>}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {isPositive
                              ? 'Paid more than their share'
                              : isNegative
                              ? 'Paid less than their share'
                              : 'Evenly balanced'}
                          </p>
                        </div>
                      </div>

                      {/* Explicit "Gets back" or "Owes" badge */}
                      <div>
                        {isPositive && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-mono">
                            gets back {symbol}{b.balance.toFixed(2)}
                          </span>
                        )}
                        {isNegative && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-mono">
                            owes {symbol}{Math.abs(b.balance).toFixed(2)}
                          </span>
                        )}
                        {!isPositive && !isNegative && (
                          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                            settled ({symbol}0.00)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Payment History (Audit Log of Repayments) */}
            {settlementHistory.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
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
