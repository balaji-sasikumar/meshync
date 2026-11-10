import React from 'react';
import { Receipt, Plus, Scale } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'expenses' | 'settlements';
  onChangeTab: (tab: 'expenses' | 'settlements') => void;
  onOpenAddExpense: () => void;
  expenseCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenAddExpense,
  expenseCount
}) => {
  return (
    <div className="fixed bottom-0 inset-x-0 sm:max-w-md sm:mx-auto bg-white/95 backdrop-blur-md border-t border-slate-100 px-6 py-2 z-40 flex items-center justify-around shadow-lg">
      {/* Bills Tab */}
      <button
        onClick={() => onChangeTab('expenses')}
        className={`flex flex-col items-center gap-1 py-1 transition-all ${
          activeTab === 'expenses'
            ? 'text-sky-500 font-bold'
            : 'text-slate-400 font-medium hover:text-slate-600'
        }`}
      >
        <Receipt className="w-5 h-5" />
        <span className="text-[11px]">Bills ({expenseCount})</span>
      </button>

      {/* Center Floating Plus Button */}
      <div className="-mt-6">
        <button
          onClick={onOpenAddExpense}
          className="w-13 h-13 w-12 h-12 rounded-full bg-sky-500 hover:bg-sky-600 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-sky-500/35 transition-all"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Balances Tab */}
      <button
        onClick={() => onChangeTab('settlements')}
        className={`flex flex-col items-center gap-1 py-1 transition-all ${
          activeTab === 'settlements'
            ? 'text-sky-500 font-bold'
            : 'text-slate-400 font-medium hover:text-slate-600'
        }`}
      >
        <Scale className="w-5 h-5" />
        <span className="text-[11px]">Balances</span>
      </button>
    </div>
  );
};
