import React, { useMemo, useState, useEffect } from 'react';
import { useMeshKernel, useCollection } from '@localfirst/mesh-sync';
import type { Expense, SettlementTransaction, SettlementRecord, GroupMeta } from './domain/schema.ts';
import { computeAllSettlements } from './domain/debt-simplification.ts';
import { Header } from './components/Header.tsx';
import { HeroSummaryCard } from './components/HeroSummaryCard.tsx';
import { ExpenseList } from './components/ExpenseList.tsx';
import { ExpenseForm } from './components/ExpenseForm.tsx';
import { DebtSettlementView } from './components/DebtSettlementView.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { MeshInspectorModal } from './components/MeshInspectorModal.tsx';
import { OnboardingModal } from './components/OnboardingModal.tsx';
import { SyncToast } from './components/SyncToast.tsx';
import { ShieldAlert, Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'settlements'>('expenses');
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isMeshModalOpen, setIsMeshModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('peersplit_theme') === 'dark';
    }
    return false;
  });

  // Sync dark mode class to html element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('peersplit_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('peersplit_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // 1. Initialize decoupled Headless Sync Kernel
  const { kernel, status, isReady, error } = useMeshKernel();

  // 2. Strongly-typed CRDT Collections
  const {
    items: groupMetaList,
    add: setGroupMeta
  } = useCollection<GroupMeta>(kernel, 'group_meta');

  const {
    items: expenses,
    add: addExpense,
    remove: removeExpense
  } = useCollection<Expense>(kernel, 'expenses');

  // Dedicated settlements collection (does not inflate group expenditure)
  const {
    items: settlementRecords,
    add: addSettlementRecord,
    remove: removeSettlementRecord
  } = useCollection<SettlementRecord>(kernel, 'settlements');

  const groupMeta: GroupMeta | null = groupMetaList[0] || null;

  // 3. User Identity resolution from localStorage
  const workspaceId = kernel?.credentials.workspaceId || 'default';

  useEffect(() => {
    if (!isReady || !workspaceId) return;

    const storageKey = `peersplit_user_${workspaceId}`;
    const savedWorkspaceUser = localStorage.getItem(storageKey);
    const savedLastUser = localStorage.getItem('peersplit_last_user');

    if (savedWorkspaceUser) {
      setCurrentUserName(savedWorkspaceUser);
      setIsOnboardingOpen(false);
    } else if (savedLastUser && groupMeta?.members?.some(m => m.toLowerCase() === savedLastUser.toLowerCase())) {
      // Auto-assign previous user name if they are in this group's member list
      setCurrentUserName(savedLastUser);
      localStorage.setItem(storageKey, savedLastUser);
      setIsOnboardingOpen(false);
    } else {
      // First time opening: show onboarding only if user not yet resolved
      setIsOnboardingOpen(true);
    }
  }, [isReady, workspaceId, groupMeta?.members]);

  // 4. Compute all unique participants
  const knownParticipants = useMemo(() => {
    const set = new Set<string>();
    if (groupMeta?.members) {
      groupMeta.members.forEach(m => set.add(m));
    }
    for (const exp of expenses) {
      if (exp.payer) set.add(exp.payer);
      for (const p of exp.participants) set.add(p);
    }
    return Array.from(set).sort();
  }, [groupMeta, expenses]);

  // 5. Compute pure client-side deterministic debt settlements (with offset payments)
  const { balancesByCurrency, settlementsByCurrency } = useMemo(() => {
    return computeAllSettlements(expenses, settlementRecords);
  }, [expenses, settlementRecords]);

  // Compute current user's net balance across the group's active currency
  const userNetBalance = useMemo(() => {
    if (!currentUserName) return 0;
    const groupCurrency = groupMeta?.currency || (expenses[0]?.currency) || 'INR';
    const balances = balancesByCurrency.get(groupCurrency) || [];
    const userBalanceObj = balances.find(b => b.person.toLowerCase() === currentUserName.toLowerCase());
    return userBalanceObj ? userBalanceObj.balance : 0;
  }, [balancesByCurrency, groupMeta, expenses, currentUserName]);

  // 6. Action Handlers
  const handleSaveGroup = (newGroup: GroupMeta) => {
    setGroupMeta({
      ...newGroup,
      id: 'current_group'
    });
    if (!currentUserName && newGroup.members.length > 0) {
      // Prompt selection for the newly created members
    } else {
      setIsOnboardingOpen(false);
    }
  };

  const handleSelectUser = (userName: string) => {
    setCurrentUserName(userName);
    localStorage.setItem(`peersplit_user_${workspaceId}`, userName);
    localStorage.setItem('peersplit_last_user', userName);
    setIsOnboardingOpen(false);
  };

  const handleAddExpense = (newExpense: Omit<Expense, 'id'>) => {
    addExpense({
      ...newExpense,
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    });
  };

  // Dedicated settlement handler - saves directly to settlements collection
  const handleSettleUp = (settlement: SettlementTransaction) => {
    addSettlementRecord({
      id: `settle_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      from: settlement.from,
      to: settlement.to,
      amount: settlement.amount,
      currency: settlement.currency,
      timestamp: Date.now()
    });
  };

  const handleExportJson = () => {
    const backup = {
      workspaceId,
      groupMeta,
      expenses,
      settlements: settlementRecords
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `peersplit-${workspaceId}-${Date.now()}.json`;
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

  const handleImportJson = (importedItems: any) => {
    if (Array.isArray(importedItems)) {
      for (const item of importedItems) {
        if (item && item.amount && item.payer) {
          addExpense({
            ...item,
            id: item.id || `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
          });
        }
      }
    } else if (importedItems && typeof importedItems === 'object') {
      if (importedItems.groupMeta) setGroupMeta(importedItems.groupMeta);
      if (Array.isArray(importedItems.expenses)) {
        importedItems.expenses.forEach((e: any) => addExpense(e));
      }
      if (Array.isArray(importedItems.settlements)) {
        importedItems.settlements.forEach((s: any) => addSettlementRecord(s));
      }
    }
  };

  const handleOpenNewGroup = () => {
    if (confirm('Create a brand new P2P expense group with a new encrypted link?')) {
      window.location.hash = '';
      window.location.reload();
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-rose-950/60 border border-rose-800 rounded-3xl p-6 max-w-sm text-center text-white">
          <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-rose-200">Mesh Sync Initialization Error</h2>
          <p className="text-xs text-rose-300/80 mt-1 font-mono">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!isReady || !status) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <Loader2 className="w-10 h-10 text-sky-400 animate-spin mb-3" />
        <h2 className="text-sm font-semibold text-slate-200">Connecting to P2P Mesh...</h2>
        <p className="text-xs text-slate-400 mt-1">Zero-Server Local-First Engine</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex justify-center transition-colors duration-200">
      {/* Mobile-Friendly Native Container (max-w-md on desktop, 100% on mobile) */}
      <div className="w-full max-w-md bg-slate-50 dark:bg-slate-950 min-h-screen flex flex-col relative shadow-2xl pb-20 border-x border-slate-200/60 dark:border-slate-800/60">
        {/* Floating Minimal Sync Toast */}
        <SyncToast status={status} />

        {/* STICKY TOP CONTAINER: Greeting Header + Hero Spend Card remain fixed on scroll */}
        <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md pb-1.5 border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-colors duration-200">
          <Header
            kernel={kernel}
            status={status}
            groupMeta={groupMeta}
            currentUserName={currentUserName}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onOpenMeshModal={() => setIsMeshModalOpen(true)}
            onOpenSwitchUser={() => setIsOnboardingOpen(true)}
            onOpenNewGroup={handleOpenNewGroup}
          />

          <HeroSummaryCard
            expenses={expenses}
            groupMeta={groupMeta}
            currentUserName={currentUserName}
            userNetBalance={userNetBalance}
            onOpenAddExpense={() => setIsExpenseFormOpen(true)}
            onViewPayoffs={() => setActiveTab('settlements')}
          />
        </div>

        {/* SCROLLABLE MAIN CONTENT (Only expenses & settlements scroll) */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'expenses' ? (
            <ExpenseList
              expenses={expenses}
              onDeleteExpense={removeExpense}
              onOpenAddExpense={() => setIsExpenseFormOpen(true)}
              currentUserName={currentUserName}
            />
          ) : (
            <DebtSettlementView
              balancesByCurrency={balancesByCurrency}
              settlementsByCurrency={settlementsByCurrency}
              settlementHistory={settlementRecords}
              onSettleUp={handleSettleUp}
              onDeleteSettlement={removeSettlementRecord}
              groupMeta={groupMeta}
              currentUserName={currentUserName}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onOpenAddExpense={() => setIsExpenseFormOpen(true)}
          expenseCount={expenses.length}
        />

        {/* Onboarding & "Who Are You?" Modal */}
        <OnboardingModal
          isOpen={isOnboardingOpen}
          groupMeta={groupMeta}
          currentUserName={currentUserName}
          onSaveGroup={handleSaveGroup}
          onSelectUser={handleSelectUser}
          onClose={currentUserName ? () => setIsOnboardingOpen(false) : undefined}
        />

        {/* Add Expense Form Modal (No scroll categories, auto-synced INR currency, member checkboxes) */}
        <ExpenseForm
          isOpen={isExpenseFormOpen}
          onClose={() => setIsExpenseFormOpen(false)}
          onSubmit={handleAddExpense}
          groupMeta={groupMeta}
          currentUserName={currentUserName}
        />

        {/* P2P Mesh Details Modal */}
        <MeshInspectorModal
          isOpen={isMeshModalOpen}
          onClose={() => setIsMeshModalOpen(false)}
          kernel={kernel}
          status={status}
          groupMeta={groupMeta}
          onUpdateGroupMeta={setGroupMeta}
          onExportJson={handleExportJson}
          onExportSnapshot={handleExportSnapshot}
          onImportJson={handleImportJson}
        />
      </div>
    </div>
  );
};
