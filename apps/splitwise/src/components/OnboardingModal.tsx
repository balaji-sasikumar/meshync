import React, { useState, useEffect } from 'react';
import { Plus, X, Users, Check, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
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
  const isCreation = !groupMeta || !groupMeta.members || groupMeta.members.length === 0;

  const [groupName, setGroupName] = useState(groupMeta?.name || 'Trip & Expenses');
  const [currency, setCurrency] = useState<SupportedCurrency>((groupMeta?.currency as SupportedCurrency) || 'INR');
  const [members, setMembers] = useState<string[]>(groupMeta?.members || []);
  const [newMemberInput, setNewMemberInput] = useState('');
  const [showAddNewMember, setShowAddNewMember] = useState(false);
  const [customNameInput, setCustomNameInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keep state synced when remote peers sync group metadata
  useEffect(() => {
    if (groupMeta) {
      if (groupMeta.name) setGroupName(groupMeta.name);
      if (groupMeta.currency) setCurrency(groupMeta.currency as SupportedCurrency);
      if (groupMeta.members && groupMeta.members.length > 0) setMembers(groupMeta.members);
    }
  }, [groupMeta]);

  if (!isOpen) return null;

  const handleAddMember = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    const raw = newMemberInput.trim();
    if (!raw) return;

    // Support comma-separated entry (e.g. "Alex, Sam, Jordan")
    const namesToAdd = raw.split(',').map(s => s.trim()).filter(Boolean);
    const validNames: string[] = [];

    for (const name of namesToAdd) {
      if (name.toLowerCase() === 'you') {
        setErrorMessage("Please enter actual member names, not 'You'.");
        return;
      }
      if (!members.some(m => m.toLowerCase() === name.toLowerCase()) && !validNames.some(m => m.toLowerCase() === name.toLowerCase())) {
        validNames.push(name);
      }
    }

    if (validNames.length > 0) {
      setMembers([...members, ...validNames]);
      setNewMemberInput('');
    }
  };

  const handleRemoveMember = (nameToRemove: string) => {
    setMembers(members.filter(m => m !== nameToRemove));
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!groupName.trim() || members.length < 2) {
      setErrorMessage('Please add at least 2 members with real names to share bills.');
      return;
    }

    // Ensure no member is named 'you'
    if (members.some(m => m.toLowerCase() === 'you')) {
      setErrorMessage("Please replace 'You' with actual member names.");
      return;
    }

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
    setErrorMessage(null);
    const trimmed = customNameInput.trim();
    if (!trimmed) return;

    if (trimmed.toLowerCase() === 'you') {
      setErrorMessage("Please enter your actual name, not 'You'.");
      return;
    }

    if (groupMeta) {
      // If group currently has a legacy member called 'You', rename 'You' to this real name!
      let updatedMembers: string[];
      if (groupMeta.members.some(m => m.toLowerCase() === 'you')) {
        updatedMembers = groupMeta.members.map(m => m.toLowerCase() === 'you' ? trimmed : m);
      } else {
        updatedMembers = groupMeta.members.includes(trimmed)
          ? groupMeta.members
          : [...groupMeta.members, trimmed];
      }

      onSaveGroup({
        ...groupMeta,
        members: Array.from(new Set(updatedMembers))
      });
    }
    onSelectUser(trimmed);
  };

  const handleSelectExistingUser = (name: string) => {
    // If the legacy member was 'You', prompt them to rename it immediately
    if (name.toLowerCase() === 'you') {
      setShowAddNewMember(true);
      setCustomNameInput('');
      setErrorMessage("Please enter your actual name to replace 'You'.");
      return;
    }
    onSelectUser(name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-sm rounded-3xl shadow-2xl p-6 relative border border-sky-100 dark:border-slate-800 overflow-hidden">
        {/* Soft decorative background bubble */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-sky-200/40 dark:bg-sky-900/20 rounded-full blur-2xl pointer-events-none" />

        {isCreation ? (
          /* Group Creation Form */
          <div>
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-inner">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Create New Group</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Enter member names & select currency</p>
            </div>

            {errorMessage && (
              <div className="mb-3 p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateGroupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="e.g. Goa Trip 🌴, Roommates 🏠"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Default Currency
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {SUPPORTED_CURRENCIES.map(curr => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setCurrency(curr)}
                      className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                        currency === curr
                          ? 'bg-sky-500 border-sky-500 text-white shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      {getCurrencySymbol(curr)} {curr}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Add Members
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {members.length === 0 ? 'Min. 2 members' : `${members.length} added`}
                  </span>
                </div>

                {/* Add member input */}
                <div className="flex gap-1.5">
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
                    placeholder="Enter member name..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddMember()}
                    disabled={!newMemberInput.trim()}
                    className="px-3.5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold disabled:opacity-40 transition active:scale-95 shadow-sm"
                  >
                    + Add
                  </button>
                </div>

                {/* Added Member tags directly below input (only shown when members exist) */}
                {members.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 max-h-28 overflow-y-auto">
                    {members.map(name => {
                      const color = getAvatarColor(name);
                      return (
                        <span
                          key={name}
                          className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-bold ${color.lightBg} ${color.lightText} border border-slate-200/60 dark:border-slate-700`}
                        >
                          <span>{name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(name)}
                            className="p-0.5 rounded-full hover:bg-black/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                            title={`Remove ${name}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={members.length < 2}
                className="w-full mt-2 py-2.5 bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white font-extrabold rounded-xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>Create Group</span>
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
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition absolute top-4 right-4"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="text-center mb-5">
              <span className="inline-block px-3 py-1 bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 text-xs font-bold rounded-full mb-1.5">
                {groupMeta.name}
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Who are you?</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Select your name to track your personal credits and shares
              </p>
            </div>

            {errorMessage && (
              <div className="mb-3 p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {!showAddNewMember ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {groupMeta.members.map(name => {
                  const isLegacyYou = name.toLowerCase() === 'you';
                  const isSelected = !isLegacyYou && currentUserName?.toLowerCase() === name.toLowerCase();
                  const color = getAvatarColor(name);

                  return (
                    <button
                      key={name}
                      onClick={() => handleSelectExistingUser(name)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left group ${
                        isLegacyYou
                          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                          : isSelected
                          ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-700 shadow-sm'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-sky-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${color.bg} ${color.text}`}
                        >
                          {name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {isLegacyYou ? "Rename 'You' to your real name" : name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {isLegacyYou ? 'Tap to enter your actual name' : 'Group Member'}
                          </p>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-sm">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all" />
                      )}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setShowAddNewMember(true);
                    setErrorMessage(null);
                  }}
                  className="w-full py-2.5 px-3 border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 transition-all flex items-center justify-center gap-1.5 mt-2.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>I'm not listed (Add my name)</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddCustomUser} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Your Real Name
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={customNameInput}
                    onChange={e => setCustomNameInput(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-white"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddNewMember(false);
                      setErrorMessage(null);
                    }}
                    className="w-1/2 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Back to List
                  </button>
                  <button
                    type="submit"
                    disabled={!customNameInput.trim()}
                    className="w-1/2 py-2 bg-sky-500 text-white font-bold rounded-xl text-xs hover:bg-sky-600 shadow-md shadow-sky-500/25 transition disabled:opacity-50"
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
