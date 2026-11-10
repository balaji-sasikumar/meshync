import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Users
} from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  SUPPORTED_CURRENCIES,
  SupportedCurrency,
  Expense,
  GroupMeta,
  SplitType
} from '../domain/schema.ts';
import {
  CATEGORY_INFO,
  getAvatarColor,
  getCurrencySymbol
} from '../domain/ui-helpers.ts';

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expense: Omit<Expense, 'id'>, editId?: string) => void;
  editingExpense?: Expense | null;
  groupMeta: GroupMeta | null;
  currentUserName: string;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingExpense = null,
  groupMeta,
  currentUserName
}) => {
  const members = groupMeta?.members && groupMeta.members.length > 0
    ? groupMeta.members.filter(m => m.toLowerCase() !== 'you')
    : [currentUserName || 'Member 1'];

  const groupCurrency = (groupMeta?.currency as SupportedCurrency) || 'INR';

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<SupportedCurrency>(groupCurrency);
  const [payer, setPayer] = useState(currentUserName || members[0]);
  const [participants, setParticipants] = useState<string[]>(members);
  const [category, setCategory] = useState<string>('Food & Dining');
  const [note, setNote] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  // Pre-fill fields if editing an existing expense or reset for new expense
  useEffect(() => {
    if (isOpen) {
      if (editingExpense) {
        setDescription(editingExpense.description);
        setAmount(editingExpense.amount.toString());
        setCurrency((editingExpense.currency as SupportedCurrency) || groupCurrency);
        setPayer(editingExpense.payer);
        setParticipants(editingExpense.participants);
        setCategory(editingExpense.category || 'Food & Dining');
        setNote(editingExpense.note || '');
        setSplitType(editingExpense.splitType || 'EQUAL');
        if (editingExpense.customSplits) {
          const strMap: Record<string, string> = {};
          for (const [k, v] of Object.entries(editingExpense.customSplits)) {
            strMap[k] = v.toString();
          }
          setCustomSplits(strMap);
        } else {
          setCustomSplits({});
        }
      } else {
        const activeCurrency = (groupMeta?.currency as SupportedCurrency) || 'INR';
        setDescription('');
        setAmount('');
        setCurrency(activeCurrency);
        setParticipants(members);
        setCategory('Food & Dining');
        setNote('');
        setSplitType('EQUAL');
        setCustomSplits({});
        if (currentUserName && members.includes(currentUserName)) {
          setPayer(currentUserName);
        } else if (members.length > 0) {
          setPayer(members[0]);
        }
      }
    }
  }, [isOpen, editingExpense, groupMeta?.currency, groupMeta?.members, currentUserName]);

  if (!isOpen) return null;

  const totalAmount = parseFloat(amount) || 0;

  // Exact mode calculations
  const exactAllocated = participants.reduce((sum, p) => sum + (parseFloat(customSplits[p]) || 0), 0);
  const exactRemaining = Math.round((totalAmount - exactAllocated) * 100) / 100;

  // Percentage mode calculations
  const percentAllocated = participants.reduce((sum, p) => sum + (parseFloat(customSplits[p]) || 0), 0);
  const percentRemaining = Math.round((100 - percentAllocated) * 10) / 10;

  const handleSwitchSplitType = (newType: SplitType) => {
    setSplitType(newType);
    // Keep custom split inputs clean and empty so user can freely type without unwanted pre-filled numbers
    if (!editingExpense || editingExpense.splitType !== newType) {
      setCustomSplits({});
    }
  };

  const handleCustomSplitChange = (person: string, val: string) => {
    setCustomSplits(prev => ({
      ...prev,
      [person]: val
    }));
  };

  const handleAutoFillRemaining = () => {
    if (totalAmount <= 0 || participants.length === 0) return;

    if (splitType === 'EXACT') {
      if (exactRemaining <= 0) return;
      const unassigned = participants.filter(p => !parseFloat(customSplits[p]));
      const targets = unassigned.length > 0 ? unassigned : participants;
      const share = Math.floor((exactRemaining / targets.length) * 100) / 100;
      const remainder = Math.round((exactRemaining - (share * targets.length)) * 100) / 100;

      const updated = { ...customSplits };
      targets.forEach((p, idx) => {
        const extra = idx === 0 ? remainder : 0;
        const current = unassigned.length > 0 ? 0 : (parseFloat(customSplits[p]) || 0);
        updated[p] = (current + share + extra).toFixed(2);
      });
      setCustomSplits(updated);
    } else if (splitType === 'PERCENTAGE') {
      if (percentRemaining <= 0) return;
      const unassigned = participants.filter(p => !parseFloat(customSplits[p]));
      const targets = unassigned.length > 0 ? unassigned : participants;
      const share = Math.floor((percentRemaining / targets.length) * 10) / 10;
      const remainder = Math.round((percentRemaining - (share * targets.length)) * 10) / 10;

      const updated = { ...customSplits };
      targets.forEach((p, idx) => {
        const extra = idx === 0 ? remainder : 0;
        const current = unassigned.length > 0 ? 0 : (parseFloat(customSplits[p]) || 0);
        updated[p] = (current + share + extra).toFixed(1);
      });
      setCustomSplits(updated);
    }
  };

  const handleToggleParticipant = (person: string) => {
    if (participants.includes(person)) {
      if (participants.length > 1) {
        setParticipants(participants.filter(p => p !== person));
      }
    } else {
      setParticipants([...participants, person]);
    }
  };

  const handleSelectAll = () => {
    setParticipants(members);
  };

  const handleDeselectAll = () => {
    // Keep at least payer
    setParticipants([payer]);
  };

  const isFormValid = Boolean(
    description.trim() &&
    totalAmount > 0 &&
    participants.length > 0 &&
    (splitType === 'EQUAL' ||
      (splitType === 'EXACT' && Math.abs(exactRemaining) < 0.01) ||
      (splitType === 'PERCENTAGE' && Math.abs(percentRemaining) < 0.1))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    let finalCustomSplits: Record<string, number> | undefined = undefined;
    if (splitType === 'EXACT') {
      finalCustomSplits = {};
      for (const p of participants) {
        finalCustomSplits[p] = parseFloat(customSplits[p]) || 0;
      }
    } else if (splitType === 'PERCENTAGE') {
      finalCustomSplits = {};
      for (const p of participants) {
        finalCustomSplits[p] = parseFloat(customSplits[p]) || 0;
      }
    }

    onSubmit(
      {
        description: description.trim(),
        amount: totalAmount,
        currency,
        payer,
        participants,
        category,
        note: note.trim() || undefined,
        splitType,
        customSplits: finalCustomSplits,
        timestamp: editingExpense ? editingExpense.timestamp : Date.now()
      },
      editingExpense ? editingExpense.id : undefined
    );

    onClose();
  };

  const splitAmount = parseFloat(amount) > 0 && participants.length > 0
    ? (parseFloat(amount) / participants.length).toFixed(2)
    : '0.00';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 relative border border-slate-100 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {editingExpense ? 'Edit Bill' : 'Add New Bill'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {editingExpense ? 'Update amount, payer or participants' : 'Split costs evenly with your group'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Category: Compact Small Cards */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Category
              </label>
              <span className="text-[11px] font-extrabold text-sky-600 dark:text-sky-400">
                {CATEGORY_INFO[category]?.emoji} {category}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {EXPENSE_CATEGORIES.map(cat => {
                const info = CATEGORY_INFO[cat];
                const isSelected = category === cat;
                const shortName = cat === 'Entertainment' ? 'Events' : cat.split(' ')[0];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center transition-all border ${
                      isSelected
                        ? 'bg-sky-500 border-sky-500 text-white shadow-sm ring-2 ring-sky-300 dark:ring-sky-600 font-bold scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-lg leading-none mb-1 flex items-center justify-center">
                      {info.emoji}
                    </span>
                    <span className="text-[10px] font-bold text-center leading-none tracking-tight">
                      {shortName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Bill Title
            </label>
            <input
              type="text"
              required
              autoFocus
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Dinner, Groceries, Uber..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all dark:text-white"
            />
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Total Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 font-bold text-sm">
                  {getCurrencySymbol(currency)}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 text-base font-extrabold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as SupportedCurrency)}
                className="w-full px-2.5 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all h-[38px] dark:text-white"
              >
                {SUPPORTED_CURRENCIES.map(curr => (
                  <option key={curr} value={curr}>
                    {curr} ({getCurrencySymbol(curr)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paid By */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Paid By
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {members.map(member => {
                const isSelected = payer === member;
                const color = getAvatarColor(member);
                return (
                  <button
                    key={member}
                    type="button"
                    onClick={() => setPayer(member)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 ring-1 ring-sky-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${color.bg} ${color.text}`}
                    >
                      {member.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {member}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split Method Segmented Control */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Split Method
              </label>
              <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => handleSwitchSplitType('EQUAL')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    splitType === 'EQUAL'
                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  = Equal
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchSplitType('EXACT')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    splitType === 'EXACT'
                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {getCurrencySymbol(currency)} Exact
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchSplitType('PERCENTAGE')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    splitType === 'PERCENTAGE'
                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  % Percent
                </button>
              </div>
            </div>

            {/* Sub-header: selected count & Select All / Clear */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Members ({participants.length} of {members.length})
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  Select All
                </button>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Member List according to Split Mode */}
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {members.map(person => {
                const isChecked = participants.includes(person);
                const color = getAvatarColor(person);

                if (splitType === 'EQUAL') {
                  const equalShare = totalAmount > 0 && participants.length > 0
                    ? (totalAmount / participants.length).toFixed(2)
                    : '0.00';

                  return (
                    <label
                      key={person}
                      className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 opacity-60 hover:opacity-90'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleParticipant(person)}
                          className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                        />
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${color.bg} ${color.text}`}
                        >
                          {person.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {person}
                        </span>
                      </div>

                      {isChecked && totalAmount > 0 && (
                        <span className="text-xs font-bold text-sky-600 dark:text-sky-400 font-mono">
                          {getCurrencySymbol(currency)}{equalShare}
                        </span>
                      )}
                    </label>
                  );
                }

                if (splitType === 'EXACT') {
                  return (
                    <div
                      key={person}
                      className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                        isChecked
                          ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800'
                          : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleParticipant(person)}
                          className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                        />
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${color.bg} ${color.text}`}
                        >
                          {person.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[90px]">
                          {person}
                        </span>
                      </div>

                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          {getCurrencySymbol(currency)}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={!isChecked}
                          value={customSplits[person] || ''}
                          onChange={e => handleCustomSplitChange(person, e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-6 pr-2 py-1 text-right text-xs font-extrabold font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-40 dark:text-white"
                        />
                      </div>
                    </div>
                  );
                }

                // PERCENTAGE split mode
                const memberPct = parseFloat(customSplits[person]) || 0;
                const calculatedShare = totalAmount > 0
                  ? ((totalAmount * memberPct) / 100).toFixed(2)
                  : '0.00';

                return (
                  <div
                    key={person}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                      isChecked
                        ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800'
                        : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleParticipant(person)}
                        className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                      />
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${color.bg} ${color.text}`}
                      >
                        {person.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[90px]">
                        {person}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {totalAmount > 0 && isChecked && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {getCurrencySymbol(currency)}{calculatedShare}
                        </span>
                      )}
                      <div className="relative w-20">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          disabled={!isChecked}
                          value={customSplits[person] || ''}
                          onChange={e => handleCustomSplitChange(person, e.target.value)}
                          placeholder="0"
                          className="w-full pr-5 pl-2 py-1 text-right text-xs font-extrabold font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-40 dark:text-white"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Split Summary / Remaining Feedback Below */}
            {splitType === 'EQUAL' && totalAmount > 0 && participants.length > 0 && (
              <div className="mt-2.5 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                Split equally: <span className="font-extrabold text-slate-900 dark:text-white">{getCurrencySymbol(currency)}{(totalAmount / participants.length).toFixed(2)}</span> / person ({participants.length} people)
              </div>
            )}

            {splitType === 'EXACT' && totalAmount > 0 && (
              <div className={`mt-2.5 p-2.5 rounded-xl border transition-all text-xs ${
                Math.abs(exactRemaining) < 0.01
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : exactRemaining > 0
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    Allocated: <strong className="font-mono">{getCurrencySymbol(currency)}{exactAllocated.toFixed(2)}</strong> of <strong className="font-mono">{getCurrencySymbol(currency)}{totalAmount.toFixed(2)}</strong>
                  </span>

                  {Math.abs(exactRemaining) < 0.01 ? (
                    <span className="inline-flex items-center gap-1 font-extrabold text-emerald-600 dark:text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>✓ Exact match</span>
                    </span>
                  ) : exactRemaining > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold font-mono text-amber-600 dark:text-amber-400">
                        {getCurrencySymbol(currency)}{exactRemaining.toFixed(2)} left
                      </span>
                      <button
                        type="button"
                        onClick={handleAutoFillRemaining}
                        className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg text-[10px] font-bold shadow-sm transition"
                      >
                        Auto-fill
                      </button>
                    </div>
                  ) : (
                    <span className="font-extrabold font-mono text-rose-600 dark:text-rose-400">
                      +{getCurrencySymbol(currency)}{Math.abs(exactRemaining).toFixed(2)} over
                    </span>
                  )}
                </div>
              </div>
            )}

            {splitType === 'PERCENTAGE' && totalAmount > 0 && (
              <div className={`mt-2.5 p-2.5 rounded-xl border transition-all text-xs ${
                Math.abs(percentRemaining) < 0.1
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : percentRemaining > 0
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    Allocated: <strong className="font-mono">{percentAllocated.toFixed(1)}%</strong> of 100%
                  </span>

                  {Math.abs(percentRemaining) < 0.1 ? (
                    <span className="inline-flex items-center gap-1 font-extrabold text-emerald-600 dark:text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>✓ 100% matched</span>
                    </span>
                  ) : percentRemaining > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold font-mono text-amber-600 dark:text-amber-400">
                        {percentRemaining.toFixed(1)}% left ({getCurrencySymbol(currency)}{((totalAmount * percentRemaining) / 100).toFixed(2)})
                      </span>
                      <button
                        type="button"
                        onClick={handleAutoFillRemaining}
                        className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg text-[10px] font-bold shadow-sm transition"
                      >
                        Auto-fill
                      </button>
                    </div>
                  ) : (
                    <span className="font-extrabold font-mono text-rose-600 dark:text-rose-400">
                      +{Math.abs(percentRemaining).toFixed(1)}% over
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Validation helper alert */}
          {!isFormValid && totalAmount > 0 && description.trim() && (
            <p className="text-[11px] text-center font-bold text-amber-600 dark:text-amber-400 animate-in fade-in">
              {splitType === 'EXACT' && exactRemaining > 0.01 && `Allocate remaining ${getCurrencySymbol(currency)}${exactRemaining.toFixed(2)} to save`}
              {splitType === 'EXACT' && exactRemaining < -0.01 && `Allocated sum exceeds total by ${getCurrencySymbol(currency)}${Math.abs(exactRemaining).toFixed(2)}`}
              {splitType === 'PERCENTAGE' && percentRemaining > 0.1 && `Total percentage must equal 100% (${percentRemaining.toFixed(1)}% remaining)`}
              {splitType === 'PERCENTAGE' && percentRemaining < -0.1 && `Total percentage exceeds 100% by ${Math.abs(percentRemaining).toFixed(1)}%`}
            </p>
          )}

          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white font-extrabold rounded-xl shadow-lg shadow-sky-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
          >
            <Check className="w-4 h-4" />
            <span>{editingExpense ? 'Save Changes' : 'Add Bill'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
