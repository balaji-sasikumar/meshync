import React, { useMemo, useState, useEffect } from 'react';
import { useMeshKernel, useCollection } from '@localfirst/mesh-sync';
import type { Expense, SettlementTransaction } from './domain/schema.ts';
import { computeAllSettlements } from './domain/debt-simplification.ts';
import { Header } from './components/Header.tsx';
import { PeerMeshInspector } from './components/PeerMeshInspector.tsx';
import { ExpenseForm } from './components/ExpenseForm.tsx';
import { ExpenseList } from './components/ExpenseList.tsx';
import { DebtSettlementView } from './components/DebtSettlementView.tsx';
import { StatsCard } from './components/StatsCard.tsx';
import { Receipt, Scale, ShieldAlert, Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'settlements'>('expenses');
  const [hashKey, setHashKey] = useState(0);

  // Initialize decoupled Headless Sync Kernel
  const { kernel, status, isReady, error } = useMeshKernel();

  // Strongly-typed reactive collection abstraction
  const {
    items: expenses,
    add: addExpense,
    remove: removeExpense
  } = useCollection<Expense>(kernel, 'expenses');

  // Compute all unique participants across expenses
  const knownParticipants = useMemo(() => {
    const set = new Set<string>();
    for (const exp of expenses) {
      if (exp.payer) set.add(exp.payer);
      for (const p of exp.participants) set.add(p);
    }
    return Array.from(set).sort();
  }, [expenses]);

  // Compute pure client-side deterministic debt settlements
  const { balancesByCurrency, settlementsByCurrency } = useMemo(() => {
    return computeAllSettlements(expenses);
  }, [expenses]);

  const handleAddExpense = (newExpense: Omit<Expense, 'id'>) => {
    addExpense({
      ...newExpense,
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    });
  };

  const handleSettleUp = (settlement: SettlementTransaction) => {
    // Record an offsetting settlement expense that pays from debtor to creditor
    addExpense({
      id: `settle_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      description: `Settlement: ${settlement.from} → ${settlement.to}`,
      amount: settlement.amount,
      currency: settlement.currency,
      payer: settlement.from,
      participants: [settlement.to],
      category: 'General',
      note: 'Debt settlement transfer',
      timestamp: Date.now()
    });
  };

  const handleSwitchWorkspace = (newHash: string) => {
    if (typeof window !== 'undefined') {
      window.location.hash = newHash;
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(expenses, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `peersplit-${kernel?.credentials.workspaceId || 'backup'}-${Date.now()}.json`;
    a.click();
  };

  const handleExportSnapshot = async () => {
    if (!kernel) return;
    const meta = await kernel.ipfsRelay.createAndPublishSnapshot();
    if (meta) {
      const blockJson = await kernel.storageAdapter.getMeta<string>(`ipfs_block_${meta.cid}`);
      if (blockJson) {
        const blob = new Blob([blockJson], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${meta.cid}.encrypted-snapshot.bin`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-6 max-w-md text-center">
          <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-rose-200">Mesh Sync Initialization Error</h2>
          <p className="text-xs text-rose-300/80 mt-1 font-mono">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
        <h2 className="text-sm font-semibold text-slate-300">Deriving Keys & Loading Mesh Kernel...</h2>
        <p className="text-xs text-slate-500 mt-1 font-mono">End-to-End Encrypted Offline Store</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header
        kernel={kernel}
        status={status}
        onSwitchWorkspace={handleSwitchWorkspace}
        onExportJson={handleExportJson}
        onExportSnapshot={handleExportSnapshot}
      />

      <main className="max-w-6xl mx-auto px-4 pb-16 flex-1 w-full">
        {/* Peer Mesh & Decentralized Fallback Inspector */}
        <PeerMeshInspector kernel={kernel} status={status} />

        {/* Global Stats */}
        <StatsCard
          expenses={expenses}
          settlementsByCurrency={settlementsByCurrency}
          knownParticipants={knownParticipants}
        />

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs border-b-2 transition-all ${
              activeTab === 'expenses'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Group Expenses ({expenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settlements')}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs border-b-2 transition-all ${
              activeTab === 'settlements'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Optimal Payoff Graph</span>
          </button>
        </div>

        {activeTab === 'expenses' ? (
          <div>
            <ExpenseForm onAddExpense={handleAddExpense} knownParticipants={knownParticipants} />
            <ExpenseList expenses={expenses} onDeleteExpense={removeExpense} />
          </div>
        ) : (
          <DebtSettlementView
            balancesByCurrency={balancesByCurrency}
            settlementsByCurrency={settlementsByCurrency}
            onSettleUp={handleSettleUp}
            rawExpenseCount={expenses.length}
          />
        )}
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600 font-mono">
        PeerSplit • Zero-Server Local-First Mesh Architecture • Web Crypto + CRDT + WebRTC + IPFS
      </footer>
    </div>
  );
};
