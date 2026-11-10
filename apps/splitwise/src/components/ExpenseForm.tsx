import React, { useState } from 'react';
import type { Expense, SupportedCurrency } from '../domain/schema.ts';
import { SUPPORTED_CURRENCIES, EXPENSE_CATEGORIES } from '../domain/schema.ts';
import { Plus, Users, DollarSign, Tag, FileText, Check } from 'lucide-react';

interface Props {
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  knownParticipants: string[];
}

export const ExpenseForm: React.FC<Props> = ({ onAddExpense, knownParticipants }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<SupportedCurrency>('USD');
  const [payer, setPayer] = useState('');
  const [participantInput, setParticipantInput] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [note, setNote] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Toggle participant in active list
  const toggleParticipant = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (participants.includes(trimmed)) {
      setParticipants(participants.filter((p) => p !== trimmed));
    } else {
      setParticipants([...participants, trimmed]);
    }
  };

  const handleAddCustomParticipant = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = participantInput.trim();
    if (trimmed && !participants.includes(trimmed)) {
      setParticipants([...participants, trimmed]);
      setParticipantInput('');
      if (!payer) setPayer(trimmed);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (!payer.trim()) return;

    // Ensure payer is at least in participants if none specified
    const activeParticipants = participants.length > 0 ? participants : [payer.trim()];

    onAddExpense({
      description: description.trim(),
      amount: parsedAmount,
      currency,
      payer: payer.trim(),
      participants: activeParticipants,
      category,
      note: note.trim() || undefined,
      timestamp: Date.now()
    });

    // Reset fields
    setDescription('');
    setAmount('');
    setNote('');
    setIsOpen(false);
  };

  // Union of known members + any newly typed
  const allSuggested = Array.from(new Set([...knownParticipants, ...participants]));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg mb-6">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-slate-300 hover:text-emerald-400 hover:bg-slate-800/40 transition-all font-semibold text-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <span>Add New Expense</span>
          </div>
          <span className="text-xs text-slate-500 font-normal">Splits automatically across group</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              New Group Expense
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Description */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-400">Description</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Dinner at Shinjuku, Train tickets"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Amount & Currency */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Amount & Currency</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
                  className="px-2 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm font-semibold text-emerald-400 focus:outline-none focus:border-emerald-500"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Paid By */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Who Paid?</label>
              <input
                type="text"
                required
                value={payer}
                onChange={(e) => setPayer(e.target.value)}
                placeholder="e.g. Alice"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
              {allSuggested.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 self-center">Quick pick:</span>
                  {allSuggested.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setPayer(name)}
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                        payer === name
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Participants Split */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                Split With Whom? ({participants.length} selected)
              </label>
              {allSuggested.length > 0 && (
                <button
                  type="button"
                  onClick={() => setParticipants([...allSuggested])}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  Select All
                </button>
              )}
            </div>

            {/* Existing Participants Chips */}
            {allSuggested.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-1">
                {allSuggested.map((name) => {
                  const isSelected = participants.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleParticipant(name)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                      <span>{name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Add New Participant Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                onKeyDown={handleAddCustomParticipant}
                placeholder="Type member name & press Enter (e.g. Charlie)"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddCustomParticipant}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
            >
              Record Expense
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
