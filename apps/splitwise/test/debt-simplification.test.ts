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

  test('settlement payment offsets debt without altering expenses', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'Dinner',
        amount: 100,
        currency: 'INR',
        payer: 'Balaji',
        participants: ['Balaji', 'Bob'],
        timestamp: 1,
        category: 'Food & Dining'
      }
    ];

    // Initially Bob owes Balaji 50 INR
    const initial = computeAllSettlements(expenses);
    assert.equal(initial.settlementsByCurrency.get('INR')![0].amount, 50);

    // Bob settles 50 INR to Balaji
    const settlements = [
      {
        id: 's1',
        from: 'Bob',
        to: 'Balaji',
        amount: 50,
        currency: 'INR',
        timestamp: 2
      }
    ];

    const afterSettlement = computeAllSettlements(expenses, settlements);
    const inrSettlements = afterSettlement.settlementsByCurrency.get('INR') || [];
    // All debts should be cleared!
    assert.equal(inrSettlements.length, 0);

    const balances = afterSettlement.balancesByCurrency.get('INR')!;
    assert.equal(balances.find(b => b.person === 'Balaji')!.balance, 0);
    assert.equal(balances.find(b => b.person === 'Bob')!.balance, 0);
  });

  test('calculates net balances for exact amount split', () => {
    const expenses: Expense[] = [
      {
        id: 'e_exact',
        description: 'Groceries with custom amounts',
        amount: 100,
        currency: 'INR',
        payer: 'Alice',
        participants: ['Alice', 'Bob', 'Charlie'],
        splitType: 'EXACT',
        customSplits: {
          Alice: 20,
          Bob: 30,
          Charlie: 50
        },
        timestamp: 10,
        category: 'Groceries'
      }
    ];

    const balances = calculateNetBalances(expenses).get('INR')!;
    // Alice paid 100, owes 20 => net +80
    assert.equal(balances.get('Alice'), 80);
    // Bob owes 30 => net -30
    assert.equal(balances.get('Bob'), -30);
    // Charlie owes 50 => net -50
    assert.equal(balances.get('Charlie'), -50);

    const { settlementsByCurrency } = computeAllSettlements(expenses);
    const settlements = settlementsByCurrency.get('INR')!;
    assert.equal(settlements.length, 2);
    // Charlie pays Alice 50, Bob pays Alice 30
    assert.ok(settlements.some(s => s.from === 'Charlie' && s.to === 'Alice' && s.amount === 50));
    assert.ok(settlements.some(s => s.from === 'Bob' && s.to === 'Alice' && s.amount === 30));
  });

  test('calculates net balances for percentage split', () => {
    const expenses: Expense[] = [
      {
        id: 'e_pct',
        description: 'Dinner with percentage split',
        amount: 200,
        currency: 'USD',
        payer: 'Bob',
        participants: ['Alice', 'Bob'],
        splitType: 'PERCENTAGE',
        customSplits: {
          Alice: 40,
          Bob: 60
        },
        timestamp: 20,
        category: 'Food & Dining'
      }
    ];

    const balances = calculateNetBalances(expenses).get('USD')!;
    // Bob paid 200, owes 60% of 200 = 120 => net +80
    assert.equal(balances.get('Bob'), 80);
    // Alice owes 40% of 200 = 80 => net -80
    assert.equal(balances.get('Alice'), -80);

    const { settlementsByCurrency } = computeAllSettlements(expenses);
    const settlements = settlementsByCurrency.get('USD')!;
    assert.equal(settlements.length, 1);
    assert.equal(settlements[0].from, 'Alice');
    assert.equal(settlements[0].to, 'Bob');
    assert.equal(settlements[0].amount, 80);
  });
});
