import React from 'react';
import { CheckCircle2, Check } from 'lucide-react';
import type { NetBalance, SettlementTransaction, GroupMeta } from '../domain/schema.ts';
import { getAvatarColor, getCurrencySymbol } from '../domain/ui-helpers.ts';

interface DebtSettlementViewProps {
  balancesByCurrency: Map<string, NetBalance[]>;
  settlementsByCurrency: Map<string, SettlementTransaction[]>;
  onSettleUp: (settlement: SettlementTransaction) => void;
  groupMeta: GroupMeta | null;
  currentUserName: string;
}

export const DebtSettlementView: React.FC<DebtSettlementViewProps> = ({
  balancesByCurrency,
  settlementsByCurrency,
  onSettleUp,
  groupMeta,
  currentUserName
}) => {
  const currencies = Array.from(balancesByCurrency.keys());

  if (currencies.length === 0) {
    return (
      <div className="px-5 py-6 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h4 className="text-base font-bold text-slate-800">All balances are settled!</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">
            No pending debts in this group. Everyone is even.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 space-y-6">
      {currencies.map(currency => {
        const balances = balancesByCurrency.get(currency) || [];
        const settlements = settlementsByCurrency.get(currency) || [];
        const symbol = getCurrencySymbol(currency);

        return (
          <div key={currency} className="space-y-4">
            {/* Visual Balances Slider / Pillar Grid (Inspired by Slide 3 of UX reference) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Member Balances ({currency})
                </h4>
                <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
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
                      className="flex flex-col items-center flex-1 min-w-[58px]"
                    >
                      {/* Avatar */}
                      <div className="relative mb-2">
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-black shadow-sm ring-2 ${
                            isCurrentUser ? 'ring-sky-400' : 'ring-transparent'
                          } ${color.bg} ${color.text}`}
                        >
                          {b.person.substring(0, 2).toUpperCase()}
                        </div>
                        {isCurrentUser && (
                          <span className="absolute -bottom-1 -right-1 bg-sky-500 text-white text-[9px] font-extrabold px-1 rounded-full">
                            YOU
                          </span>
                        )}
                      </div>

                      {/* Person Name */}
                      <p className="text-xs font-bold text-slate-800 truncate max-w-[64px] text-center mb-1">
                        {b.person}
                      </p>

                      {/* Vertical line indicator */}
                      <div className="w-0.5 h-8 bg-slate-100 my-1 relative flex items-center justify-center">
                        <div
                          className={`w-2 h-2 rounded-full absolute ${
                            isPositive
                              ? 'bg-emerald-500'
                              : isNegative
                              ? 'bg-rose-500'
                              : 'bg-slate-300'
                          }`}
                        />
                      </div>

                      {/* Balance Amount Tag */}
                      <span
                        className={`text-xs font-extrabold px-2 py-0.5 rounded-lg mt-1 whitespace-nowrap ${
                          isPositive
                            ? 'bg-emerald-50 text-emerald-700'
                            : isNegative
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-500'
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

            {/* Direct Payoff Transfers (Cash-flow minimization) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Optimal Payoffs ({settlements.length})
                </h4>
                <span className="text-[11px] text-slate-400">Min-flow simplified</span>
              </div>

              {settlements.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">
                  All debts resolved in this currency!
                </p>
              ) : (
                <div className="space-y-2.5">
                  {settlements.map((tx, idx) => {
                    const fromColor = getAvatarColor(tx.from);
                    const toColor = getAvatarColor(tx.to);
                    const involvesUser =
                      tx.from.toLowerCase() === currentUserName.toLowerCase() ||
                      tx.to.toLowerCase() === currentUserName.toLowerCase();

                    return (
                      <div
                        key={tx.id || idx}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                          involvesUser
                            ? 'bg-sky-50/50 border-sky-200'
                            : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        {/* Who pays whom */}
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${fromColor.bg} ${fromColor.text}`}
                          >
                            {tx.from.substring(0, 2).toUpperCase()}
                          </div>

                          <div className="text-xs font-bold text-slate-800">
                            <span>{tx.from}</span>
                            <span className="text-slate-400 mx-1.5 font-normal">pays</span>
                            <span>{tx.to}</span>
                          </div>

                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${toColor.bg} ${toColor.text}`}
                          >
                            {tx.to.substring(0, 2).toUpperCase()}
                          </div>
                        </div>

                        {/* Amount & Settle Button */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">
                            {symbol}{tx.amount.toFixed(2)}
                          </span>

                          <button
                            onClick={() => onSettleUp(tx)}
                            title="Record payment to settle this balance"
                            className="px-2.5 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Settle</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
