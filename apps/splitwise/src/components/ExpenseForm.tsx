import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  DollarSign,
  Calendar,
  Users,
  CheckSquare,
  Square
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
  onSubmit: (expense: Omit<Expense, 'id'>) => void;
  groupMeta: GroupMeta | null;
  currentUserName: string;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  groupMeta,
  currentUserName
}) => {
  const members = groupMeta?.members && groupMeta.members.length > 0
    ? groupMeta.members
    : [currentUserName || 'You'];

  const defaultCurrency = (groupMeta?.currency as SupportedCurrency) || 'USD';

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<SupportedCurrency>(defaultCurrency);
  const [payer, setPayer] = useState(currentUserName || members[0] || 'You');
  const [participants, setParticipants] = useState<string[]>(members);
  const [category, setCategory] = useState<string>('Food & Dining');
  const [note, setNote] = useState('');

  // Keep members in sync if group changes
  useEffect(() => {
    if (members.length > 0) {
      setParticipants(members);
      if (!payer || !members.includes(payer)) {
        setPayer(currentUserName || members[0]);
      }
    }
  }, [groupMeta?.members, currentUserName]);

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
    // Keep at least payer or current user
    setParticipants([payer]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (!description.trim() || participants.length === 0) return;

    onSubmit({
      description: description.trim(),
      amount: parsedAmount,
      currency,
      payer,
      participants,
      category,
      note: note.trim() || undefined,
      timestamp: Date.now()
    });

    // Reset and close
    setDescription('');
    setAmount('');
    setNote('');
    onClose();
  };

  const splitAmount = parseFloat(amount) > 0 && participants.length > 0
    ? (parseFloat(amount) / participants.length).toFixed(2)
    : '0.00';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white text-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 relative border border-slate-100 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Add New Bill</h2>
            <p className="text-[11px] text-slate-500">Split costs evenly with your group</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Chips */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {EXPENSE_CATEGORIES.map(cat => {
                const info = CATEGORY_INFO[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-sky-500 border-sky-500 text-white shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{info.emoji}</span>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Bill Title
            </label>
            <input
              type="text"
              required
              autoFocus
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Cheese Burger, Taxi, Groceries..."
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Total Amount
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
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
                  className="w-full pl-8 pr-4 py-2.5 text-base font-extrabold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Currency
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as SupportedCurrency)}
                className="w-full px-3 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all h-[42px]"
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
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Paid By
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                        ? 'bg-sky-50 border-sky-500 ring-1 ring-sky-500 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${color.bg} ${color.text}`}
                    >
                      {member.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {member}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split Between with Checkboxes (Requested by User) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Split Between ({participants.length} selected)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-700"
                >
                  Select All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-700"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Checkbox List of Members */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {members.map(person => {
                const isChecked = participants.includes(person);
                const color = getAvatarColor(person);
                return (
                  <label
                    key={person}
                    className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer select-none transition-all ${
                      isChecked
                        ? 'bg-sky-50/70 border-sky-300'
                        : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleParticipant(person)}
                          className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                        />
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${color.bg} ${color.text}`}
                      >
                        {person.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        {person} {person === currentUserName && '(You)'}
                      </span>
                    </div>

                    {isChecked && parseFloat(amount) > 0 && (
                      <span className="text-xs font-bold text-sky-600">
                        {getCurrencySymbol(currency)}{splitAmount}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            {/* Split Summary Footer */}
            {parseFloat(amount) > 0 && participants.length > 0 && (
              <div className="mt-2.5 p-2 bg-slate-100 rounded-xl text-center text-xs font-semibold text-slate-600">
                Split equally: <span className="font-extrabold text-slate-900">{getCurrencySymbol(currency)}{splitAmount}</span> / person ({participants.length} people)
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!description.trim() || !amount || participants.length === 0}
            className="w-full py-3 bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white font-extrabold rounded-2xl shadow-lg shadow-sky-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <Check className="w-4 h-4" />
            <span>Add Bill</span>
          </button>
        </form>
      </div>
    </div>
  );
};
