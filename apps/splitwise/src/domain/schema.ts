export interface GroupMeta {
  id: string; // 'current_group'
  name: string;
  currency: string;
  members: string[];
  createdAt: number;
}

export interface SettlementRecord {
  id: string;
  from: string;
  to: string;
  amount: number;
  currency: string;
  timestamp: number;
  note?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  payer: string;
  participants: string[];
  timestamp: number;
  category: string;
  note?: string;
}

export interface NetBalance {
  person: string;
  balance: number;
  currency: string;
}

export interface SettlementTransaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  currency: string;
}

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Travel & Transit',
  'Lodging',
  'Entertainment',
  'Utilities',
  'Shopping',
  'General'
] as const;
