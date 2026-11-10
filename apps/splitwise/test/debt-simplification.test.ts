import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNetBalances,
  simplifyDebtsForCurrency,
  computeAllSettlements
} from '../src/domain/debt-simplification.js';
import type { Expense } from '../src/domain/schema.js';

describe('Debt Simplification & Cash-Flow Minimization', () => {
  test('calculates net balances for equal split', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'Dinner',
        amount: 90,
        currency: 'USD',
        payer: 'Alice',
        participants: ['Alice', 'Bob', 'Charlie'],
        timestamp: 1000,
        category: 'Food & Dining'
      }
    ];

    const balances = calculateNetBalances(expenses).get('USD')!;
    // Alice paid 90, owes 30 => net +60
    assert.equal(balances.get('Alice'), 60);
    // Bob owes 30 => net -30
    assert.equal(balances.get('Bob'), -30);
    // Charlie owes 30 => net -30
    assert.equal(balances.get('Charlie'), -30);
  });

  test('simplifies circular debt into minimal direct transactions', () => {
    // Alice paid 60 for Bob => Bob owes Alice 60
    // Bob paid 60 for Charlie => Charlie owes Bob 60
    // Charlie paid 60 for Alice => Alice owes Charlie 60
    // Net should be all 0!
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'A for B',
        amount: 60,
        currency: 'USD',
        payer: 'Alice',
        participants: ['Bob'],
        timestamp: 1,
        category: 'General'
      },
      {
        id: 'e2',
        description: 'B for C',
        amount: 60,
        currency: 'USD',
        payer: 'Bob',
        participants: ['Charlie'],
        timestamp: 2,
        category: 'General'
      },
      {
        id: 'e3',
        description: 'C for A',
        amount: 60,
        currency: 'USD',
        payer: 'Charlie',
        participants: ['Alice'],
        timestamp: 3,
        category: 'General'
      }
    ];

    const { settlementsByCurrency } = computeAllSettlements(expenses);
    const usdSettlements = settlementsByCurrency.get('USD') || [];
    assert.equal(usdSettlements.length, 0, 'Circular debts must cancel out to 0 transactions');
  });

  test('solves multi-person tangled trip scenario with minimal transfers', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'AirBnB',
        amount: 300,
        currency: 'USD',
        payer: 'Alice',
        participants: ['Alice', 'Bob', 'Charlie'],
        timestamp: 1,
        category: 'Lodging'
      },
      {
        id: 'e2',
        description: 'Rental Car',
        amount: 150,
        currency: 'USD',
        payer: 'Bob',
        participants: ['Alice', 'Bob', 'Charlie'],
        timestamp: 2,
        category: 'Travel & Transit'
      }
    ];

    // Alice: paid 300, share = 100 + 50 = 150. Net: +150
    // Bob: paid 150, share = 100 + 50 = 150. Net: 0
    // Charlie: paid 0, share = 100 + 50 = 150. Net: -150
    const { settlementsByCurrency } = computeAllSettlements(expenses);
    const settlements = settlementsByCurrency.get('USD')!;

    assert.equal(settlements.length, 1);
    assert.equal(settlements[0].from, 'Charlie');
    assert.equal(settlements[0].to, 'Alice');
    assert.equal(settlements[0].amount, 150);
  });
});
