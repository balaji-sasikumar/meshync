import React, { useState } from 'react';
import { User, Plus, X, Users, Sparkles, Check, ArrowRight } from 'lucide-react';
import { SUPPORTED_CURRENCIES, SupportedCurrency, GroupMeta } from '../domain/schema.ts';
import { getAvatarColor, getCurrencySymbol } from '../domain/ui-helpers.ts';

interface OnboardingModalProps {
  isOpen: boolean;
  groupMeta: GroupMeta | null;
  currentUserName: string | null;
  onSaveGroup: (group: GroupMeta) => void;
  onSelectUser: (userName: string) => void;
  onClose?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  groupMeta,
  currentUserName,
  onSaveGroup,
  onSelectUser,
  onClose
}) => {
  // If group exists, step is 'who_are_you', otherwise 'create_group'
  const isCreation = !groupMeta || !groupMeta.members || groupMeta.members.length === 0;

  const [groupName, setGroupName] = useState(groupMeta?.name || 'My Trip & Expenses');
  const [currency, setCurrency] = useState<SupportedCurrency>((groupMeta?.currency as SupportedCurrency) || 'USD');
  const [members, setMembers] = useState<string[]>(groupMeta?.members || ['You', 'Alex', 'Sam']);
  const [newMemberInput, setNewMemberInput] = useState('');
  const [showAddNewMember, setShowAddNewMember] = useState(false);
  const [customNameInput, setCustomNameInput] = useState('');

  if (!isOpen) return null;

  const handleAddMember = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newMemberInput.trim();
    if (trimmed && !members.some(m => m.toLowerCase() === trimmed.toLowerCase())) {
      setMembers([...members, trimmed]);
      setNewMemberInput('');
    }
  };

  const handleRemoveMember = (nameToRemove: string) => {
    if (members.length <= 1) return;
    setMembers(members.filter(m => m !== nameToRemove));
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || members.length === 0) return;

    const newGroup: GroupMeta = {
      id: 'current_group',
      name: groupName.trim(),
      currency,
      members,
      createdAt: Date.now()
    };
    onSaveGroup(newGroup);
  };

  const handleAddCustomUser = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customNameInput.trim();
    if (!trimmed) return;

    if (groupMeta) {
      const updatedMembers = groupMeta.members.includes(trimmed)
        ? groupMeta.members
        : [...groupMeta.members, trimmed];
      onSaveGroup({
        ...groupMeta,
        members: updatedMembers
      });
    }
    onSelectUser(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white text-slate-900 w-full max-w-sm rounded-3xl shadow-2xl p-6 relative border border-sky-100 overflow-hidden">
        {/* Soft decorative background bubble */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-sky-200/50 rounded-full blur-2xl pointer-events-none" />

        {isCreation ? (
          /* Group Creation Form */
          <div>
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Users className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">Create New Group</h2>
              <p className="text-xs text-slate-500 mt-1">Set up your shared bill & add your friends</p>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="e.g. Trip to Bali 🌴"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Currency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SUPPORTED_CURRENCIES.map(curr => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setCurrency(curr)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        currency === curr
                          ? 'bg-sky-500 border-sky-500 text-white shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {getCurrencySymbol(curr)} {curr}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Members List ({members.length})
                </label>

                {/* Member chips */}
                <div className="flex flex-wrap gap-1.5 mb-2 max-h-32 overflow-y-auto p-1">
                  {members.map(name => {
                    const color = getAvatarColor(name);
                    return (
                      <span
                        key={name}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${color.lightBg} ${color.lightText}`}
                      >
                        <span>{name}</span>
                        {members.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(name)}
                            className="hover:opacity-75 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>

                {/* Add member input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMemberInput}
                    onChange={e => setNewMemberInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMember();
                      }
                    }}
                    placeholder="Friend's name..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddMember()}
                    disabled={!newMemberInput.trim()}
                    className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 disabled:opacity-40 transition"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={members.length === 0}
                className="w-full mt-2 py-3 bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          /* "Who are you?" User Selection */
          <div>
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 bg-sky-100 text-sky-800 text-xs font-bold rounded-full mb-2">
                {groupMeta.name}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900">Who are you?</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select your name to track your expenses & payoffs
              </p>
            </div>

            {!showAddNewMember ? (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {groupMeta.members.map(name => {
                  const isSelected = currentUserName === name;
                  const color = getAvatarColor(name);
                  return (
                    <button
                      key={name}
                      onClick={() => onSelectUser(name)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left group ${
                        isSelected
                          ? 'bg-sky-50 border-sky-400 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold shadow-sm ${color.bg} ${color.text}`}
                        >
                          {name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{name}</p>
                          <p className="text-[11px] text-slate-400">Group Member</p>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-sm">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all" />
                      )}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setShowAddNewMember(true)}
                  className="w-full py-2.5 px-3 border border-dashed border-slate-300 text-slate-600 rounded-2xl text-xs font-bold hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50/50 transition-all flex items-center justify-center gap-1.5 mt-3"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>I'm not listed (Add my name)</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddCustomUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={customNameInput}
                    onChange={e => setCustomNameInput(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddNewMember(false)}
                    className="w-1/2 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
                  >
                    Back to List
                  </button>
                  <button
                    type="submit"
                    disabled={!customNameInput.trim()}
                    className="w-1/2 py-2.5 bg-sky-500 text-white font-bold rounded-xl text-xs hover:bg-sky-600 shadow-md shadow-sky-500/25 transition disabled:opacity-50"
                  >
                    Save & Continue
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
