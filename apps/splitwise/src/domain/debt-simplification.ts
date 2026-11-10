import type { Expense, NetBalance, SettlementTransaction, SettlementRecord } from './schema.js';
import { isSettlementItem } from './schema.js';

/**
 * Deterministically compute net balances per currency from the CRDT expense log
 * and offset settlement records. Balances sum to exactly 0 for each currency.
 */
export function calculateNetBalances(
  expenses: Expense[],
  settlements: SettlementRecord[] = []
): Map<string, Map<string, number>> {
  const currencyBalances = new Map<string, Map<string, number>>();

  // 1. Process expenses
  for (const exp of expenses) {
    if (!exp.amount || exp.amount <= 0) continue;

    const currency = exp.currency || 'INR';
    if (!currencyBalances.has(currency)) {
      currencyBalances.set(currency, new Map());
    }
    const balances = currencyBalances.get(currency)!;

    // If an item in expenses is a legacy settlement record:
    if (isSettlementItem(exp)) {
      const fromPerson = (exp.payer || '').trim();
      const toPerson = (exp.participants?.[0] || '').trim();
      if (fromPerson && toPerson) {
        // Debtor paid creditor: debtor's debt is reduced (+), creditor's credit is reduced (-)
        balances.set(fromPerson, (balances.get(fromPerson) || 0) + exp.amount);
        balances.set(toPerson, (balances.get(toPerson) || 0) - exp.amount);
      }
      continue;
    }

    // Genuine bill / expense
    if (!exp.participants || exp.participants.length === 0) continue;

    const payer = exp.payer?.trim();
    if (!payer) continue;

    // Credit payer for the total amount paid
    balances.set(payer, (balances.get(payer) || 0) + exp.amount);

    // Debit each participant for their share (Equal, Exact, or Percentage)
    if (exp.splitType === 'EXACT' && exp.customSplits) {
      for (const p of exp.participants) {
        const participant = p.trim();
        if (!participant) continue;
        const exactShare = Number(exp.customSplits[participant]) || 0;
        balances.set(participant, (balances.get(participant) || 0) - exactShare);
      }
    } else if (exp.splitType === 'PERCENTAGE' && exp.customSplits) {
      for (const p of exp.participants) {
        const participant = p.trim();
        if (!participant) continue;
        const pct = Number(exp.customSplits[participant]) || 0;
        const pctShare = (exp.amount * pct) / 100;
        balances.set(participant, (balances.get(participant) || 0) - pctShare);
      }
    } else {
      // Default: Equal split
      const share = exp.amount / exp.participants.length;
      for (const p of exp.participants) {
        const participant = p.trim();
        if (!participant) continue;
        balances.set(participant, (balances.get(participant) || 0) - share);
      }
    }
  }

  // 2. Process dedicated settlement transfers
  for (const st of settlements) {
    if (!st.amount || st.amount <= 0 || !st.from || !st.to) continue;

    const currency = st.currency || 'INR';
    if (!currencyBalances.has(currency)) {
      currencyBalances.set(currency, new Map());
    }
    const balances = currencyBalances.get(currency)!;

    const fromPerson = st.from.trim();
    const toPerson = st.to.trim();

    // The debtor paid the creditor
    balances.set(fromPerson, (balances.get(fromPerson) || 0) + st.amount);
    balances.set(toPerson, (balances.get(toPerson) || 0) - st.amount);
  }

  // Round balances to 4 decimal places to prevent floating point drift
  for (const [, balances] of currencyBalances) {
    for (const [person, val] of balances) {
      balances.set(person, Math.round(val * 10000) / 10000);
    }
  }

  return currencyBalances;
}

/**
 * Cash-flow minimization algorithm (greedy min-flow).
 * Reduces an arbitrary N-way tangled debt network into the minimal number of direct settlement transfers.
 * Fully deterministic: sorts ties alphabetically by name so all mesh peers compute the exact same payoff graph.
 */
export function simplifyDebtsForCurrency(
  balances: Map<string, number>,
  currency: string
): SettlementTransaction[] {
  interface Account {
    person: string;
    balance: number;
  }

  const creditors: Account[] = [];
  const debtors: Account[] = [];

  for (const [person, balance] of balances.entries()) {
    // Ignore near-zero negligible balance (< 0.01 currency unit)
    if (balance > 0.005) {
      creditors.push({ person, balance });
    } else if (balance < -0.005) {
      debtors.push({ person, balance: -balance });
    }
  }

  // Deterministic sorting: sort by highest balance descending, secondary by name alphabetically
  creditors.sort((a, b) => b.balance - a.balance || a.person.localeCompare(b.person));
  debtors.sort((a, b) => b.balance - a.balance || a.person.localeCompare(b.person));

  const settlements: SettlementTransaction[] = [];
  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];

    const amount = Math.min(creditor.balance, debtor.balance);
    const roundedAmount = Math.round(amount * 100) / 100;

    if (roundedAmount > 0) {
      settlements.push({
        id: `tx_${debtor.person}_${creditor.person}_${roundedAmount}_${currency}`,
        from: debtor.person,
        to: creditor.person,
        amount: roundedAmount,
        currency
      });
    }

    debtor.balance -= amount;
    creditor.balance -= amount;

    if (debtor.balance < 0.005) {
      dIdx++;
    }
    if (creditor.balance < 0.005) {
      cIdx++;
    }
  }

  return settlements;
}

/**
 * Compute all simplified debt settlements across all currencies.
 */
export function computeAllSettlements(
  expenses: Expense[],
  settlements: SettlementRecord[] = []
): {
  balancesByCurrency: Map<string, NetBalance[]>;
  settlementsByCurrency: Map<string, SettlementTransaction[]>;
} {
  const currencyBalances = calculateNetBalances(expenses, settlements);
  const balancesByCurrency = new Map<string, NetBalance[]>();
  const settlementsByCurrency = new Map<string, SettlementTransaction[]>();

  for (const [currency, balances] of currencyBalances.entries()) {
    const list: NetBalance[] = [];
    for (const [person, balance] of balances.entries()) {
      list.push({
        person,
        balance: Math.round(balance * 100) / 100,
        currency
      });
    }
    list.sort((a, b) => b.balance - a.balance || a.person.localeCompare(b.person));
    balancesByCurrency.set(currency, list);

    const settlements = simplifyDebtsForCurrency(balances, currency);
    settlementsByCurrency.set(currency, settlements);
  }

  return { balancesByCurrency, settlementsByCurrency };
}
