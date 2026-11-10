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
  GroupMeta
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
      } else {
        const activeCurrency = (groupMeta?.currency as SupportedCurrency) || 'INR';
        setDescription('');
        setAmount('');
        setCurrency(activeCurrency);
        setParticipants(members);
        setCategory('Food & Dining');
        setNote('');
        if (currentUserName && members.includes(currentUserName)) {
          setPayer(currentUserName);
        } else if (members.length > 0) {
          setPayer(members[0]);
        }
      }
    }
  }, [isOpen, editingExpense, groupMeta?.currency, groupMeta?.members, currentUserName]);

  if (!isOpen) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (!description.trim() || participants.length === 0) return;

    onSubmit(
      {
        description: description.trim(),
        amount: parsedAmount,
        currency,
        payer,
        participants,
        category,
        note: note.trim() || undefined,
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
          {/* Category: 4x2 Grid without horizontal scrolling */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {EXPENSE_CATEGORIES.map(cat => {
                const info = CATEGORY_INFO[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center transition-all border ${
                      isSelected
                        ? 'bg-sky-500 border-sky-500 text-white shadow-sm ring-2 ring-sky-300 dark:ring-sky-700'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-lg leading-none mb-1">{info.emoji}</span>
                    <span className="text-[10px] font-bold truncate max-w-full leading-tight">
                      {cat.split(' ')[0]}
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

          {/* Split Between with Checkboxes */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Split Between ({participants.length} selected)
              </label>
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

            {/* Checkbox List of Members */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {members.map(person => {
                const isChecked = participants.includes(person);
                const color = getAvatarColor(person);
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

                    {isChecked && parseFloat(amount) > 0 && (
                      <span className="text-xs font-bold text-sky-600 dark:text-sky-400 font-mono">
                        {getCurrencySymbol(currency)}{splitAmount}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            {/* Split Summary Footer */}
            {parseFloat(amount) > 0 && participants.length > 0 && (
              <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                Split equally: <span className="font-extrabold text-slate-900 dark:text-white">{getCurrencySymbol(currency)}{splitAmount}</span> / person ({participants.length} people)
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!description.trim() || !amount || participants.length === 0}
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
