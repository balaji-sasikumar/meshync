import type { Expense, NetBalance, SettlementTransaction } from './schema.ts';

/**
 * Deterministically compute net balances per currency from the CRDT expense log.
 * Balances sum to exactly 0 for each currency.
 */
export function calculateNetBalances(
  expenses: Expense[]
): Map<string, Map<string, number>> {
  const currencyBalances = new Map<string, Map<string, number>>();

  for (const exp of expenses) {
    if (!exp.amount || exp.amount <= 0 || !exp.participants || exp.participants.length === 0) {
      continue;
    }

    const currency = exp.currency || 'USD';
    if (!currencyBalances.has(currency)) {
      currencyBalances.set(currency, new Map());
    }
    const balances = currencyBalances.get(currency)!;

    const payer = exp.payer.trim();
    if (!payer) continue;

    // Credit payer
    balances.set(payer, (balances.get(payer) || 0) + exp.amount);

    // Debit participants equally
    const share = exp.amount / exp.participants.length;
    for (const p of exp.participants) {
      const participant = p.trim();
      if (!participant) continue;
      balances.set(participant, (balances.get(participant) || 0) - share);
    }
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

  const debtors: Account[] = [];
  const creditors: Account[] = [];

  for (const [person, balance] of balances.entries()) {
    if (balance < -0.005) {
      debtors.push({ person, balance: Math.abs(balance) });
    } else if (balance > 0.005) {
      creditors.push({ person, balance });
    }
  }

  // Deterministic sorting: sort by balance descending; if tied, sort alphabetically
  debtors.sort((a, b) => b.balance - a.balance || a.person.localeCompare(b.person));
  creditors.sort((a, b) => b.balance - a.balance || a.person.localeCompare(b.person));

  const settlements: SettlementTransaction[] = [];
  let dIdx = 0;
  let cIdx = 0;
  let step = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const amount = Math.min(debtor.balance, creditor.balance);
    const roundedAmount = Math.round(amount * 100) / 100;

    if (roundedAmount > 0) {
      settlements.push({
        id: `settle_${debtor.person}_to_${creditor.person}_${step++}`,
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
  expenses: Expense[]
): {
  balancesByCurrency: Map<string, NetBalance[]>;
  settlementsByCurrency: Map<string, SettlementTransaction[]>;
} {
  const currencyBalances = calculateNetBalances(expenses);
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
